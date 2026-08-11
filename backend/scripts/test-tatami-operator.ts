/**
 * The TATAMI_OPERATOR role and its per-mat grant, over real HTTP against the
 * local database.
 *
 * The whole point of this role is what it *cannot* do, so most of these checks
 * are refusals: an operator must not reach another mat's bouts, another
 * tournament, the entry list, the draw list, or anyone's athletes. The
 * permissive checks (they can score their own mat) are the smaller half.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev            # in one shell
 *      npx tsx scripts/test-tatami-operator.ts    # in another
 */
import { prisma } from "../src/lib/prisma.js";

const BASE = process.env.API_BASE ?? "http://localhost:4000/api";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const asAdmin = { "x-role": "ADMIN", "content-type": "application/json" };
/** The dev-auth stub always authenticates as DEV_USER_ID, whatever role we ask for. */
const asOperator = { "x-role": "TATAMI_OPERATOR", "content-type": "application/json" };

async function call(method: string, path: string, headers: Record<string, string>, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost");
  }

  // A run that dies mid-way leaves its event behind, and the next run then sees
  // two "Op Mat"s and fails for the wrong reason. Clear first.
  await removeFixtures();

  const devUser = await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: { id: "dev-user", email: "dev-user@localhost", name: "Dev User", role: "CLUB_MANAGER" },
  });
  const otherUser = await prisma.user.upsert({
    where: { email: "other-operator@localhost" },
    update: {},
    create: { email: "other-operator@localhost", name: "Other Operator", role: "TATAMI_OPERATOR" },
  });

  const club = await prisma.club.create({
    data: { name: "__OP_TEST_CLUB__", contactName: "T", email: "op-test@localhost" },
  });
  const belt = await prisma.belt.create({ data: { name: "__OP_TEST_BELT__", order: 998 } });

  const mkEvent = (name: string) =>
    prisma.event.create({
      data: {
        name,
        venue: "n/a",
        city: "n/a",
        country: "NA",
        startDate: new Date(),
        regOpen: new Date(),
        regClose: new Date(),
        status: "ACTIVE",
        configJson: "{}",
      },
    });

  const event = await mkEvent("__OP_TEST_EVENT__");
  const otherEvent = await mkEvent("__OP_TEST_OTHER_EVENT__");

  const division = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "OP_TEST",
      name: "Operator Test Kumite",
      minAge: 10,
      maxAge: 11,
      gender: "Male",
      category: "KUMITE",
    },
  });

  // Four entries -> a 4-draw with two round-1 bouts and a final.
  const entries = [];
  for (let i = 0; i < 4; i++) {
    const athlete = await prisma.athlete.create({
      data: {
        clubId: club.id,
        firstName: `Op${i}`,
        lastName: "Tester",
        dob: new Date("2015-01-01"),
        gender: "Male",
        nationality: "NA",
        beltId: belt.id,
      },
    });
    entries.push(
      await prisma.entry.create({
        data: {
          eventId: event.id,
          clubId: club.id,
          athleteId: athlete.id,
          divisionId: division.id,
          entryType: "KUMITE",
          status: "APPROVED",
        },
      }),
    );
  }

  const myMat = await prisma.mat.create({ data: { eventId: event.id, name: "Op Mat", order: 0 } });
  const otherMat = await prisma.mat.create({
    data: { eventId: event.id, name: "Other Mat", order: 1 },
  });

  try {
    // ------------------------------------------------------------------
    console.log("\nan operator with no assignment sees and can do nothing:");
    const emptyBoard = await call("GET", "/run/my-mats", asOperator);
    check("GET /run/my-mats -> 200", emptyBoard.status === 200, emptyBoard);
    check("with no mats, not an error", emptyBoard.body?.mats?.length === 0, emptyBoard.body);

    // ------------------------------------------------------------------
    console.log("\nthe role is default-denied on everything else:");
    for (const [label, path] of [
      ["the entry list", `/entries?eventId=${event.id}`],
      ["the draw list", `/draws?eventId=${event.id}`],
      ["the run board", `/run/board?eventId=${event.id}`],
      ["the plan board", `/plan/board?eventId=${event.id}`],
      ["athletes", "/athletes"],
      ["clubs", "/clubs"],
      ["users", "/users"],
    ] as const) {
      const res = await call("GET", path, asOperator);
      check(`${label} -> 403`, res.status === 403, { path, status: res.status });
    }

    // ------------------------------------------------------------------
    console.log("\nassigning an operator to a mat:");
    const draw = await call("POST", "/draws", asAdmin, {
      eventId: event.id,
      divisionId: division.id,
    });
    check("draw generated -> 201", draw.status === 201, draw.status);
    const drawId = draw.body.id;
    await prisma.draw.update({ where: { id: drawId }, data: { matId: myMat.id, matOrder: 0 } });

    const assign = await call("POST", `/run/mats/${myMat.id}/operators`, asAdmin, {
      userId: devUser.id,
    });
    check("POST assign -> 201", assign.status === 201, assign);
    const dupe = await call("POST", `/run/mats/${myMat.id}/operators`, asAdmin, {
      userId: devUser.id,
    });
    check("assigning twice -> 409", dupe.status === 409, dupe);

    const roster = await call("GET", `/run/mats/operators?eventId=${event.id}`, asAdmin);
    check("the coordinator can read the roster", roster.status === 200, roster.status);
    check(
      "and it names the mat and the person",
      roster.body?.[0]?.matName === "Op Mat" && roster.body?.[0]?.user?.id === devUser.id,
      roster.body,
    );

    // Two people on one mat is the normal case, not an error.
    const second = await call("POST", `/run/mats/${myMat.id}/operators`, asAdmin, {
      userId: otherUser.id,
    });
    check("a second operator on the same mat -> 201", second.status === 201, second);

    // ------------------------------------------------------------------
    console.log("\nthe operator now sees their mat, and only their mat:");
    const board = await call("GET", "/run/my-mats", asOperator);
    check("their mat appears", board.body?.mats?.length === 1, board.body);
    check("named", board.body?.mats?.[0]?.matName === "Op Mat", board.body?.mats?.[0]);
    check(
      "with the ready bouts on it",
      board.body?.mats?.[0]?.queue?.length === 2,
      board.body?.mats?.[0]?.queue?.length,
    );
    check(
      "and the event it belongs to, so they never pick one",
      board.body?.mats?.[0]?.event?.id === event.id,
      board.body?.mats?.[0]?.event,
    );

    const boutId = board.body.mats[0].queue[0].boutId;

    check(
      "they can read the bracket their mat is running",
      (await call("GET", `/draws/${drawId}`, asOperator)).status === 200,
    );

    // ------------------------------------------------------------------
    console.log("\nthey can score a bout on their mat:");
    const bout = await prisma.bout.findUnique({ where: { id: boutId } });
    const scored = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asOperator, {
      winnerEntryId: bout!.akaEntryId,
    });
    check("PUT result -> 200", scored.status === 200, scored);
    const saved = await prisma.bout.findUnique({ where: { id: boutId } });
    check("the winner is stored", saved?.winnerEntryId === bout!.akaEntryId, saved?.winnerEntryId);

    check(
      "and the clock-start ping is allowed too",
      (await call("POST", `/draws/${drawId}/bouts/${boutId}/start`, asOperator)).status === 200,
    );

    console.log("\nthey can correct the result they just recorded:");
    const corrected = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asOperator, {
      winnerEntryId: bout!.aoEntryId,
    });
    check("correcting their own last result -> 200", corrected.status === 200, corrected);
    check(
      "the correction stuck",
      (await prisma.bout.findUnique({ where: { id: boutId } }))?.winnerEntryId === bout!.aoEntryId,
    );

    console.log("\nbut not one somebody else recorded:");
    const otherBoutId = board.body.mats[0].queue[1].boutId;
    const otherBout = await prisma.bout.findUnique({ where: { id: otherBoutId } });
    await call("PUT", `/draws/${drawId}/bouts/${otherBoutId}`, asAdmin, {
      winnerEntryId: otherBout!.akaEntryId,
    });
    // Dev-header auth authenticates *every* request as DEV_USER_ID whatever
    // role it claims, so the "admin" call above is attributed to the same user
    // as the operator's. Reattribute the audit row to model what the policy
    // actually keys on: the last person to write this result was someone else.
    const lastWrite = await prisma.auditLog.findFirst({
      where: { entityType: "Bout", entityId: otherBoutId, action: { in: ["RESULT", "SCORE"] } },
      orderBy: { createdAt: "desc" },
    });
    await prisma.auditLog.update({
      where: { id: lastWrite!.id },
      data: { userId: otherUser.id },
    });
    const notMine = await call("PUT", `/draws/${drawId}/bouts/${otherBoutId}`, asOperator, {
      winnerEntryId: otherBout!.aoEntryId,
    });
    check("overwriting someone else's result -> 409", notMine.status === 409, notMine);
    check(
      "and it says who to ask",
      /coordinator/i.test(notMine.body?.error ?? ""),
      notMine.body,
    );

    console.log("\nnor one that later bouts have been built on:");
    // Both round-1 bouts are decided, so the final is now live. Score it as the
    // operator, then try to go back and change a round-1 result.
    const refreshed = await call("GET", "/run/my-mats", asOperator);
    const finalBout = refreshed.body.mats[0].queue.find((q: any) => q.round === 2);
    check("the final is now on the operator's queue", !!finalBout, refreshed.body.mats[0].queue);
    if (finalBout) {
      const fb = await prisma.bout.findUnique({ where: { id: finalBout.boutId } });
      await call("PUT", `/draws/${drawId}/bouts/${finalBout.boutId}`, asOperator, {
        winnerEntryId: fb!.akaEntryId,
      });
      const tooLate = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asOperator, {
        winnerEntryId: bout!.akaEntryId,
      });
      check("changing a round-1 result after the final -> 409", tooLate.status === 409, tooLate);
      check(
        "and explains why",
        /later bouts/i.test(tooLate.body?.error ?? ""),
        tooLate.body,
      );
      check(
        "the coordinator can still fix it — that is their job",
        (await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asAdmin, {
          winnerEntryId: bout!.akaEntryId,
        })).status === 200,
      );
    }

    // ------------------------------------------------------------------
    console.log("\nthey cannot reach another mat's bouts:");
    // Move the whole category to the other mat; the operator loses it entirely.
    await prisma.draw.update({ where: { id: drawId }, data: { matId: otherMat.id } });
    const movedAway = await call("GET", "/run/my-mats", asOperator);
    check(
      "their queue empties when the category moves",
      movedAway.body?.mats?.[0]?.queue?.length === 0,
      movedAway.body?.mats?.[0],
    );
    const foreign = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asOperator, {
      winnerEntryId: bout!.aoEntryId,
    });
    check("scoring a bout on another mat -> 403", foreign.status === 403, foreign);
    check(
      "and reading that bracket is refused too",
      (await call("GET", `/draws/${drawId}`, asOperator)).status === 403,
    );

    // A single bout moved to their mat is enough to reach it again — authority
    // follows the tatami, not the category.
    await prisma.bout.update({ where: { id: boutId }, data: { matId: myMat.id } });
    check(
      "one bout moved onto their mat is reachable again",
      (await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asOperator, {
        winnerEntryId: bout!.aoEntryId,
      })).status === 200,
    );
    await prisma.bout.update({ where: { id: boutId }, data: { matId: null } });
    await prisma.draw.update({ where: { id: drawId }, data: { matId: myMat.id } });

    // ------------------------------------------------------------------
    console.log("\nthey cannot change the plan, the order, or anyone's entries:");
    const forbidden: [string, string, string, unknown][] = [
      ["move a category to another mat", "PATCH", `/run/draws/${drawId}/mat`, { matId: otherMat.id }],
      ["reorder a mat's queue", "PUT", `/run/mats/${myMat.id}/order`, { boutIds: [boutId] }],
      ["reorder the categories", "PUT", `/run/mats/${myMat.id}/category-order`, { drawIds: [drawId] }],
      ["rename their mat", "PATCH", `/run/mats/${myMat.id}`, { name: "Renamed" }],
      ["delete their mat", "DELETE", `/run/mats/${myMat.id}`, undefined],
      ["add a mat", "POST", "/run/mats", { eventId: event.id, name: "Sneaky" }],
      ["check an athlete in", "PATCH", `/run/entries/${entries[0].id}/checkin`, { checkedIn: true }],
      ["change the plan order", "PUT", "/plan/order", { eventId: event.id, lanes: [] }],
      ["appoint another operator", "POST", `/run/mats/${myMat.id}/operators`, { userId: otherUser.id }],
      ["regenerate the draw", "POST", `/draws/${drawId}/regenerate`, {}],
      // The kata list is theirs to read, never to edit — see below.
      ["add a kata to the syllabus", "POST", "/katas", { name: "Made Up", order: 999 }],
      ["retire a kata", "PUT", "/katas/kata_saifa", { active: false }],
      ["delete a kata", "DELETE", "/katas/kata_saifa", undefined],
    ];
    for (const [label, method, path, body] of forbidden) {
      const res = await call(method, path, asOperator, body);
      check(`${label} -> 403`, res.status === 403, { path, status: res.status, body: res.body });
    }

    // ------------------------------------------------------------------
    console.log("\nbut they can read the kata list, because kata cannot be scored without it:");
    const katas = await call("GET", "/katas", asOperator);
    check("reading the allowable katas -> 200", katas.status === 200, katas.status);
    check("and it is the real syllabus", Array.isArray(katas.body) && katas.body.length >= 20, katas.body?.length);
    check(
      "retired katas are not offered to the mat",
      Array.isArray(katas.body) && katas.body.every((k: any) => k.active),
    );

    // ------------------------------------------------------------------
    console.log("\na grant on another tournament is not a way into this one:");
    const otherEventMat = await prisma.mat.create({
      data: { eventId: otherEvent.id, name: "Elsewhere", order: 0 },
    });
    await prisma.matOperator.create({ data: { matId: otherEventMat.id, userId: devUser.id } });
    const twoEvents = await call("GET", "/run/my-mats", asOperator);
    check(
      "both live events' mats are listed, each scoped to itself",
      twoEvents.body?.mats?.length === 2,
      twoEvents.body?.mats?.map((m: any) => m.matName),
    );

    // Closing the other event should drop it from their view entirely.
    await prisma.event.update({ where: { id: otherEvent.id }, data: { status: "CLOSED" } });
    const closed = await call("GET", "/run/my-mats", asOperator);
    check(
      "a closed tournament disappears from their board",
      closed.body?.mats?.length === 1 && closed.body.mats[0].matName === "Op Mat",
      closed.body?.mats?.map((m: any) => m.matName),
    );

    // ------------------------------------------------------------------
    console.log("\nrevoking the assignment removes the access:");
    const revoke = await call("DELETE", `/run/mats/${myMat.id}/operators/${devUser.id}`, asAdmin);
    check("DELETE -> 204", revoke.status === 204, revoke);
    const after = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asOperator, {
      winnerEntryId: bout!.akaEntryId,
    });
    check("scoring is refused once revoked -> 403", after.status === 403, after);
  } finally {
    await removeFixtures();
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

/** Everything this script creates, matched by the names it uses. */
async function removeFixtures() {
  const events = await prisma.event.findMany({
    where: { name: { in: ["__OP_TEST_EVENT__", "__OP_TEST_OTHER_EVENT__"] } },
    select: { id: true },
  });
  const eventIds = events.map((e) => e.id);
  const clubs = await prisma.club.findMany({
    where: { name: "__OP_TEST_CLUB__" },
    select: { id: true },
  });
  const clubIds = clubs.map((c) => c.id);

  await prisma.matOperator.deleteMany({ where: { mat: { eventId: { in: eventIds } } } });
  await prisma.drawSlot.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.bout.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.draw.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.entry.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.mat.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.division.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.athlete.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  await prisma.belt.deleteMany({ where: { name: "__OP_TEST_BELT__" } });
  await prisma.user.deleteMany({ where: { email: "other-operator@localhost" } });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
