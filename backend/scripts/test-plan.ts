/**
 * Tournament planning — the plan board, ceremonies/breaks, and the running
 * order — exercised over real HTTP against the local database. Mirrors
 * scripts/test-event-timing.ts's style.
 *
 * What this covers: that the board returns what the plan needs in one call,
 * that the running order writes atomically across floors and shares one index
 * space between categories and breaks, that a completed category cannot be
 * moved to another floor or lost to a mat deletion, that a break is refused in
 * the unassigned pool, that venue-wide vs per-floor scoping is enforced on the
 * server rather than trusted from the client, and that adding or removing a
 * floor keeps the timing config's mat count honest.
 *
 * What it does NOT re-test: requireEventManager's scoping in general — that is
 * scripts/test-event-scope.ts's job. What's new here is the plan itself.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev     # in one shell
 *      npx tsx scripts/test-plan.ts        # in another
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
const asClubManager = { "x-role": "CLUB_MANAGER", "content-type": "application/json" };

async function call(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<{ status: number; body: any }> {
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

  const devUser = await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: { id: "dev-user", email: "dev-user@localhost", name: "Dev User", role: "CLUB_MANAGER" },
  });

  const event = await prisma.event.create({
    data: {
      name: "__PLAN_TEST_EVENT__",
      venue: "n/a",
      city: "n/a",
      country: "NA",
      startDate: new Date(),
      regOpen: new Date(),
      regClose: new Date(),
      configJson: '{"currency":"NAD"}',
    },
  });

  const otherEvent = await prisma.event.create({
    data: {
      name: "__PLAN_TEST_OTHER_EVENT__",
      venue: "n/a",
      city: "n/a",
      country: "NA",
      startDate: new Date(),
      regOpen: new Date(),
      regClose: new Date(),
      configJson: "{}",
    },
  });

  const mkDivision = (key: string, name: string) =>
    prisma.division.create({
      data: {
        eventId: event.id,
        key,
        name,
        minAge: 10,
        maxAge: 11,
        gender: "Male" as const,
        category: "KUMITE" as const,
      },
    });

  const divA = await mkDivision("PLAN_A", "Plan Test A");
  const divB = await mkDivision("PLAN_B", "Plan Test B");
  const divC = await mkDivision("PLAN_C", "Plan Test C");

  // Draws only — no entries needed: the plan is about placement and ordering,
  // and the bout maths it feeds is computed on the frontend from slot counts.
  const mkDraw = (divisionId: string, status: "DRAWN" | "COMPLETED" = "DRAWN") =>
    prisma.draw.create({ data: { eventId: event.id, divisionId, size: 8, status } });

  const drawA = await mkDraw(divA.id);
  const drawB = await mkDraw(divB.id);
  const drawC = await mkDraw(divC.id, "COMPLETED");

  const otherDivision = await prisma.division.create({
    data: {
      eventId: otherEvent.id,
      key: "PLAN_OTHER",
      name: "Other Event Category",
      minAge: 10,
      maxAge: 11,
      gender: "Male",
      category: "KUMITE",
    },
  });
  const otherDraw = await prisma.draw.create({
    data: { eventId: otherEvent.id, divisionId: otherDivision.id, size: 4 },
  });

  try {
    // ------------------------------------------------------------------
    console.log("\nadding floors keeps the timing config's mat count honest:");
    const mat1 = await call("POST", "/run/mats", asAdmin, { eventId: event.id, name: "Tatami A" });
    const mat2 = await call("POST", "/run/mats", asAdmin, { eventId: event.id, name: "Tatami B" });
    check("POST /run/mats -> 201", mat1.status === 201 && mat2.status === 201, [mat1, mat2]);

    const timingAfterMats = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check(
      "the config's mat count followed the floors that exist",
      timingAfterMats.body?.mats === 2,
      timingAfterMats.body,
    );

    const renamed = await call("PATCH", `/run/mats/${mat1.body.id}`, asAdmin, {
      name: "The Blue Hall",
    });
    check("a floor can be given any name -> 200", renamed.status === 200, renamed);
    check("and it keeps it", renamed.body?.name === "The Blue Hall", renamed.body);

    // ------------------------------------------------------------------
    console.log("\nthe board returns the whole plan in one call:");
    const board = await call("GET", `/plan/board?eventId=${event.id}`, asAdmin);
    check("GET /plan/board -> 200", board.status === 200, board);
    check("both floors present, in order", board.body?.mats?.length === 2, board.body?.mats);
    check("a complete timing config rides along", board.body?.timing?.dayStartTime === "08:00", board.body?.timing);
    check(
      "every category with a draw is listed",
      board.body?.categories?.filter((c: any) => c.hasDraw).length === 3,
      board.body?.categories,
    );
    check(
      "a category carries the status the plan has to respect",
      board.body?.categories?.find((c: any) => c.drawId === drawC.id)?.status === "COMPLETED",
      board.body?.categories,
    );
    check(
      "and the bracket's own entry count, for the duration estimate",
      board.body?.categories?.every((c: any) => !c.hasDraw || typeof c.drawEntryCount === "number"),
      board.body?.categories,
    );
    check("no categories are on a floor yet", board.body?.categories?.every((c: any) => c.matId === null));

    // ------------------------------------------------------------------
    console.log("\nthe running order writes both lanes of a move atomically:");
    const place = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        {
          matId: mat1.body.id,
          items: [
            { kind: "CATEGORY", id: drawA.id },
            { kind: "CATEGORY", id: drawB.id },
          ],
        },
      ],
    });
    check("PUT /plan/order -> 200", place.status === 200, place);

    const placed = await prisma.draw.findMany({
      where: { id: { in: [drawA.id, drawB.id] } },
      select: { id: true, matId: true, matOrder: true },
    });
    check(
      "positions are dense from 0, in the order sent",
      placed.find((d) => d.id === drawA.id)?.matOrder === 0 &&
        placed.find((d) => d.id === drawB.id)?.matOrder === 1 &&
        placed.every((d) => d.matId === mat1.body.id),
      placed,
    );

    // Move B to the other floor: both lanes are sent, so the source closes up.
    const move = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        { matId: mat1.body.id, items: [{ kind: "CATEGORY", id: drawA.id }] },
        { matId: mat2.body.id, items: [{ kind: "CATEGORY", id: drawB.id }] },
      ],
    });
    check("a cross-floor move -> 200", move.status === 200, move);
    const moved = await prisma.draw.findUnique({ where: { id: drawB.id } });
    check(
      "the category is on the new floor at position 0",
      moved?.matId === mat2.body.id && moved?.matOrder === 0,
      moved,
    );

    const toPool = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        { matId: mat2.body.id, items: [] },
        { matId: null, items: [{ kind: "CATEGORY", id: drawB.id }] },
      ],
    });
    check("sending a category to the unassigned pool -> 200", toPool.status === 200, toPool);
    const unassigned = await prisma.draw.findUnique({ where: { id: drawB.id } });
    check(
      "unassigned means no position at all, not position 0",
      unassigned?.matId === null && unassigned?.matOrder === null,
      unassigned,
    );

    // ------------------------------------------------------------------
    console.log("\na completed category is not re-plannable:");
    const pinCompleted = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        {
          matId: mat1.body.id,
          items: [
            { kind: "CATEGORY", id: drawA.id },
            { kind: "CATEGORY", id: drawC.id },
          ],
        },
      ],
    });
    check("placing it the first time is fine -> 200", pinCompleted.status === 200, pinCompleted);

    const moveCompleted = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        { matId: mat1.body.id, items: [{ kind: "CATEGORY", id: drawA.id }] },
        { matId: mat2.body.id, items: [{ kind: "CATEGORY", id: drawC.id }] },
      ],
    });
    check("moving it to another floor -> 409", moveCompleted.status === 409, moveCompleted);
    const stillThere = await prisma.draw.findUnique({ where: { id: drawC.id } });
    check(
      "and nothing in that write landed — the whole order was refused",
      stillThere?.matId === mat1.body.id,
      stillThere,
    );

    const reindexAround = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        {
          matId: mat1.body.id,
          items: [
            { kind: "CATEGORY", id: drawC.id },
            { kind: "CATEGORY", id: drawA.id },
          ],
        },
      ],
    });
    check(
      "but reordering around it on the same floor is allowed -> 200",
      reindexAround.status === 200,
      reindexAround,
    );

    const viaRunRoute = await call("PATCH", `/run/draws/${drawC.id}/mat`, asAdmin, {
      matId: mat2.body.id,
    });
    check("the older run-board route refuses the same move -> 409", viaRunRoute.status === 409, viaRunRoute);

    const deleteBusyMat = await call("DELETE", `/run/mats/${mat1.body.id}`, asAdmin);
    check(
      "and the floor it ran on cannot be deleted out from under it -> 409",
      deleteBusyMat.status === 409,
      deleteBusyMat,
    );

    // ------------------------------------------------------------------
    console.log("\nceremonies and breaks:");
    const opening = await call("POST", "/plan/blocks", asAdmin, {
      eventId: event.id,
      kind: "OPENING",
      label: "Opening ceremony",
      minutes: 15,
      matId: null,
    });
    check("a venue-wide ceremony -> 201", opening.status === 201, opening);
    check("with no floor and no clock anchor", opening.body?.matId === null && opening.body?.startTime === null, opening.body);

    const lunch = await call("POST", "/plan/blocks", asAdmin, {
      eventId: event.id,
      kind: "LUNCH",
      label: "Lunch",
      minutes: 30,
      matId: null,
      startTime: "12:30",
    });
    check("a venue-wide lunch with a clock time -> 201", lunch.status === 201, lunch);
    check("the time round-trips", lunch.body?.startTime === "12:30", lunch.body);

    const badTime = await call("POST", "/plan/blocks", asAdmin, {
      eventId: event.id,
      kind: "LUNCH",
      label: "Lunch",
      minutes: 30,
      matId: null,
      startTime: "25:00",
    });
    check("an impossible clock time -> 400", badTime.status === 400, badTime);

    const floorBreak = await call("POST", "/plan/blocks", asAdmin, {
      eventId: event.id,
      kind: "BREAK",
      label: "Floor reset",
      minutes: 10,
      matId: mat1.body.id,
      // A block on a floor is positioned by the running order, so a clock time
      // here would be a value the schedule never honours.
      startTime: "10:00",
    });
    check("a per-floor break -> 201", floorBreak.status === 201, floorBreak);
    check(
      "its clock time is dropped — a floor break is positioned, not pinned",
      floorBreak.body?.startTime === null,
      floorBreak.body,
    );
    check(
      "and it is appended past the categories already on that floor",
      floorBreak.body?.matOrder === 2,
      floorBreak.body,
    );

    const wrongEventMat = await call("POST", "/plan/blocks", asAdmin, {
      eventId: event.id,
      kind: "BREAK",
      label: "Nope",
      minutes: 10,
      matId: "does-not-exist",
    });
    check("a break on an unknown floor -> 404", wrongEventMat.status === 404, wrongEventMat);

    // ------------------------------------------------------------------
    console.log("\nbreaks share one index space with the categories on their floor:");
    const interleaved = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        {
          matId: mat1.body.id,
          items: [
            { kind: "CATEGORY", id: drawC.id },
            { kind: "BLOCK", id: floorBreak.body.id },
            { kind: "CATEGORY", id: drawA.id },
          ],
        },
      ],
    });
    check("a break really can sit between two categories -> 200", interleaved.status === 200, interleaved);
    const afterInterleave = await prisma.scheduleBlock.findUnique({
      where: { id: floorBreak.body.id },
    });
    const drawAfter = await prisma.draw.findUnique({ where: { id: drawA.id } });
    check(
      "the positions are 0/1/2 across both tables",
      afterInterleave?.matOrder === 1 && drawAfter?.matOrder === 2,
      { block: afterInterleave, draw: drawAfter },
    );

    const blockInPool = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [{ matId: null, items: [{ kind: "BLOCK", id: floorBreak.body.id }] }],
    });
    check(
      "a break cannot be dropped in the unassigned pool -> 400",
      blockInPool.status === 400,
      blockInPool,
    );

    const foreignDraw = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [{ matId: mat1.body.id, items: [{ kind: "CATEGORY", id: otherDraw.id }] }],
    });
    check(
      "another event's category cannot be planned into this one -> 400",
      foreignDraw.status === 400,
      foreignDraw,
    );
    const foreignUntouched = await prisma.draw.findUnique({ where: { id: otherDraw.id } });
    check("and it was left alone", foreignUntouched?.matId === null, foreignUntouched);

    const dupe = await call("PUT", "/plan/order", asAdmin, {
      eventId: event.id,
      lanes: [
        {
          matId: mat1.body.id,
          items: [
            { kind: "CATEGORY", id: drawA.id },
            { kind: "CATEGORY", id: drawA.id },
          ],
        },
      ],
    });
    check("the same category twice in one order -> 400", dupe.status === 400, dupe);

    // ------------------------------------------------------------------
    console.log("\nediting and removing a break:");
    const edited = await call("PATCH", `/plan/blocks/${lunch.body.id}`, asAdmin, {
      minutes: 45,
      startTime: "13:00",
    });
    check("PATCH a venue-wide break -> 200", edited.status === 200, edited);
    check("both fields round-trip", edited.body?.minutes === 45 && edited.body?.startTime === "13:00", edited.body);

    const pinFloorBreak = await call("PATCH", `/plan/blocks/${floorBreak.body.id}`, asAdmin, {
      startTime: "11:00",
    });
    check("PATCH a per-floor break -> 200", pinFloorBreak.status === 200, pinFloorBreak);
    check(
      "but it still refuses a clock time it would not honour",
      pinFloorBreak.body?.startTime === null,
      pinFloorBreak.body,
    );

    const removed = await call("DELETE", `/plan/blocks/${opening.body.id}`, asAdmin);
    check("DELETE a break -> 204", removed.status === 204, removed);
    const goneBoard = await call("GET", `/plan/board?eventId=${event.id}`, asAdmin);
    check(
      "and it is off the board",
      !goneBoard.body?.blocks?.some((b: any) => b.id === opening.body.id),
      goneBoard.body?.blocks,
    );

    // ------------------------------------------------------------------
    console.log("\nauthorization: read is open, write is admin-or-coordinator:");
    const readAsClub = await call("GET", `/plan/board?eventId=${event.id}`, asClubManager);
    check("a plain club manager can read the plan -> 200", readAsClub.status === 200, readAsClub.status);

    const writeAsClub = await call("PUT", "/plan/order", asClubManager, {
      eventId: event.id,
      lanes: [{ matId: mat1.body.id, items: [{ kind: "CATEGORY", id: drawA.id }] }],
    });
    check("but not change it -> 403", writeAsClub.status === 403, writeAsClub);

    const blockAsClub = await call("POST", "/plan/blocks", asClubManager, {
      eventId: event.id,
      kind: "BREAK",
      label: "Nope",
      minutes: 5,
      matId: null,
      startTime: "10:00",
    });
    check("nor add a break -> 403", blockAsClub.status === 403, blockAsClub);

    await prisma.eventCoordinator.create({ data: { eventId: event.id, userId: devUser.id } });
    const asCoordinator = await call("PUT", "/plan/order", asClubManager, {
      eventId: event.id,
      lanes: [{ matId: mat1.body.id, items: [{ kind: "CATEGORY", id: drawA.id }] }],
    });
    check("this event's coordinator can -> 200", asCoordinator.status === 200, asCoordinator);

    const otherEventOrder = await call("PUT", "/plan/order", asClubManager, {
      eventId: otherEvent.id,
      lanes: [{ matId: null, items: [{ kind: "CATEGORY", id: otherDraw.id }] }],
    });
    check(
      "and only on the event they coordinate -> 403",
      otherEventOrder.status === 403,
      otherEventOrder,
    );

    // ------------------------------------------------------------------
    console.log("\nremoving a floor:");
    const emptyMatDelete = await call("DELETE", `/run/mats/${mat2.body.id}`, asAdmin);
    check("a floor with nothing completed on it -> 204", emptyMatDelete.status === 204, emptyMatDelete);
    const timingAfterDelete = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check(
      "the config's mat count followed it down",
      timingAfterDelete.body?.mats === 1,
      timingAfterDelete.body,
    );
    check(
      "the rest of the timing config was left alone",
      timingAfterDelete.body?.defaultBoutDurationSec === 120 &&
        timingAfterDelete.body?.lunch?.mode === "ALL_MATS",
      timingAfterDelete.body,
    );

    const configUntouched = await prisma.event.findUnique({
      where: { id: event.id },
      select: { configJson: true },
    });
    check(
      "configJson (the YAML rules snapshot) was never touched by any of this",
      configUntouched?.configJson === '{"currency":"NAD"}',
      configUntouched,
    );
  } finally {
    await prisma.eventCoordinator.deleteMany({ where: { eventId: { in: [event.id, otherEvent.id] } } });
    await prisma.scheduleBlock.deleteMany({ where: { eventId: { in: [event.id, otherEvent.id] } } });
    await prisma.draw.deleteMany({ where: { eventId: { in: [event.id, otherEvent.id] } } });
    await prisma.mat.deleteMany({ where: { eventId: { in: [event.id, otherEvent.id] } } });
    await prisma.division.deleteMany({ where: { eventId: { in: [event.id, otherEvent.id] } } });
    await prisma.event.deleteMany({ where: { id: { in: [event.id, otherEvent.id] } } });
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
