/**
 * Per-event coordinator authorization, exercised over real HTTP against the
 * local database.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev      # in one shell
 *      npx tsx scripts/test-event-scope.ts  # in another
 *
 * The interesting cases are not "can a coordinator work" but the three ways a
 * per-event grant can leak:
 *   1. cross-event  — a grant on event A must not open event B
 *   2. body-vs-param — routes whose handler reads body.eventId while the URL
 *      carries a different event must be judged on the one the handler uses
 *   3. scope creep  — a coordinator must not delete the event, appoint further
 *      coordinators, or reach club billing
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

/** dev-auth identity: the header stub always authenticates as DEV_USER_ID. */
const asCoordinator = { "x-role": "CLUB_MANAGER", "content-type": "application/json" };
const asAdmin = { "x-role": "ADMIN", "content-type": "application/json" };

async function call(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<number> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.status;
}

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
      configJson: "{}",
    },
  });

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost");
  }

  // The dev-auth stub authenticates as this fixed user id; make sure the row
  // exists so the coordinator FK has a target.
  const devUser = await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: { id: "dev-user", email: "dev-user@localhost", name: "Dev User", role: "CLUB_MANAGER" },
  });

  const granted = await mkEvent("__SCOPE_TEST_GRANTED__");
  const other = await mkEvent("__SCOPE_TEST_OTHER__");

  try {
    // ── Before any grant: a CLUB_MANAGER is refused everywhere ──────────────
    console.log("\nNo grant held:");
    check("review queue          -> 403", (await call("GET", `/review?eventId=${granted.id}`, asCoordinator)) === 403);
    check("apply template        -> 403", (await call("POST", `/events/${granted.id}/apply-template`, asCoordinator, { template: "GK_SMALL_NO_WEIGHTS" })) === 403);
    check("update event config   -> 403", (await call("PUT", `/events/${granted.id}/config`, asCoordinator, {})) === 403);
    check("create mat            -> 403", (await call("POST", `/run/mats`, asCoordinator, { eventId: granted.id, name: "Mat 1" })) === 403);

    // ── Grant on `granted` only ─────────────────────────────────────────────
    await prisma.eventCoordinator.create({
      data: { eventId: granted.id, userId: devUser.id },
    });

    console.log("\nGranted on event A:");
    check("review queue on A     -> 200", (await call("GET", `/review?eventId=${granted.id}`, asCoordinator)) === 200);
    check("apply template on A   -> 200", (await call("POST", `/events/${granted.id}/apply-template`, asCoordinator, { template: "GK_SMALL_NO_WEIGHTS" })) === 200);
    check("update config on A    -> 200", (await call("PUT", `/events/${granted.id}/config`, asCoordinator, { fees: {} })) === 200);
    check("create mat on A       -> 201", (await call("POST", `/run/mats`, asCoordinator, { eventId: granted.id, name: "Mat 1" })) === 201);

    // ── A coordinator (still just CLUB_MANAGER at the base role) sees and
    // acts on the whole event, not only their own club ─────────────────────
    // Regression coverage for a real bug: a CLUB_MANAGER who is also this
    // event's coordinator saw no Approve control and no Draws control in the
    // UI, and the entries list endpoint independently forced clubId to the
    // caller's own club regardless of the grant. Base role is unchanged here
    // (still CLUB_MANAGER) — only the EventCoordinator row makes the
    // difference, which is the shape this whole file is meant to guard.
    console.log("\nCoordinator (role stays CLUB_MANAGER) can act event-wide:");
    const belt = await prisma.belt.upsert({
      where: { id: "__SCOPE_TEST_BELT__" },
      update: {},
      create: { id: "__SCOPE_TEST_BELT__", name: "White", order: 1 },
    });
    const clubA = await prisma.club.create({
      data: { name: "__SCOPE_TEST_CLUB_A__", contactName: "n/a", email: "a@example.test" },
    });
    const clubB = await prisma.club.create({
      data: { name: "__SCOPE_TEST_CLUB_B__", contactName: "n/a", email: "b@example.test" },
    });
    const division = await prisma.division.create({
      data: {
        eventId: granted.id,
        key: "SCOPE_TEST_DIV",
        name: "Scope Test Division",
        minAge: 18,
        maxAge: 99,
        gender: "Male",
        category: "KATA",
      },
    });
    const athleteA = await prisma.athlete.create({
      data: {
        clubId: clubA.id, firstName: "Athlete", lastName: "A",
        dob: new Date("2000-01-01"), gender: "Male", nationality: "NA", beltId: belt.id,
      },
    });
    const athleteB = await prisma.athlete.create({
      data: {
        clubId: clubB.id, firstName: "Athlete", lastName: "B",
        dob: new Date("2000-01-01"), gender: "Male", nationality: "NA", beltId: belt.id,
      },
    });
    // A third entry, same club as B — purely so that after B is withdrawn,
    // 2 approved entries (A and C) still remain for the draw to regenerate
    // with (DrawService requires >= 2). Not part of the cross-club check.
    const athleteC = await prisma.athlete.create({
      data: {
        clubId: clubB.id, firstName: "Athlete", lastName: "C",
        dob: new Date("2000-01-01"), gender: "Male", nationality: "NA", beltId: belt.id,
      },
    });
    const entryA = await prisma.entry.create({
      data: {
        eventId: granted.id, clubId: clubA.id, athleteId: athleteA.id,
        divisionId: division.id, entryType: "KATA", status: "SUBMITTED",
      },
    });
    const entryB = await prisma.entry.create({
      data: {
        eventId: granted.id, clubId: clubB.id, athleteId: athleteB.id,
        divisionId: division.id, entryType: "KATA", status: "SUBMITTED",
      },
    });
    const entryC = await prisma.entry.create({
      data: {
        eventId: granted.id, clubId: clubB.id, athleteId: athleteC.id,
        divisionId: division.id, entryType: "KATA", status: "SUBMITTED",
      },
    });

    // The coordinator's dev-auth identity carries clubA — the bug this
    // guards against is exactly "still scoped to own club despite the grant".
    const asCoordinatorOfA = { ...asCoordinator, "x-club-id": clubA.id };

    const entriesRes = await fetch(`${BASE}/entries?eventId=${granted.id}`, { headers: asCoordinatorOfA });
    const entriesBody = entriesRes.ok ? ((await entriesRes.json()) as Array<{ id: string }>) : [];
    const seenIds = new Set(entriesBody.map((e) => e.id));
    check(
      "entries list sees both clubs -> both present",
      seenIds.has(entryA.id) && seenIds.has(entryB.id),
      { status: entriesRes.status, seenIds: [...seenIds] },
    );

    const approveStatus = await call("POST", "/review/bulk", asCoordinatorOfA, {
      eventId: granted.id,
      ids: [entryA.id, entryB.id, entryC.id],
      status: "APPROVED",
    });
    check("approve both clubs' entries -> 200", approveStatus === 200, { approveStatus });
    const approvedCount = await prisma.entry.count({
      where: { id: { in: [entryA.id, entryB.id, entryC.id] }, status: "APPROVED" },
    });
    check("all three entries now APPROVED -> 3", approvedCount === 3, { approvedCount });

    const drawRes = await fetch(`${BASE}/draws`, {
      method: "POST",
      headers: asCoordinatorOfA,
      body: JSON.stringify({ eventId: granted.id, divisionId: division.id }),
    });
    const drawBody = drawRes.ok ? ((await drawRes.json()) as { id: string }) : null;
    check("create draw for the division -> 201", drawRes.status === 201, { status: drawRes.status });

    // ── Withdraw (regression coverage for the "coordinator can't pull an
    // approved athlete from the bracket" feature): a coordinator moves an
    // APPROVED entry to RETURNED via /review/bulk-status (not /review/bulk,
    // which only touches SUBMITTED), and regenerating the draw afterward
    // actually drops them from the bracket rather than leaving a ghost slot.
    console.log("\nCoordinator can withdraw an approved entry:");
    const withdrawStatus = await call("POST", "/review/bulk-status", asCoordinatorOfA, {
      eventId: granted.id,
      ids: [entryB.id],
      status: "RETURNED",
      reason: "Withdrew — injured",
    });
    check("withdraw entryB -> 200", withdrawStatus === 200, { withdrawStatus });
    const withdrawn = await prisma.entry.findUnique({
      where: { id: entryB.id },
      select: { status: true, statusReason: true },
    });
    check("entryB is now RETURNED", withdrawn?.status === "RETURNED", withdrawn);
    check("withdraw reason recorded on the entry", withdrawn?.statusReason === "Withdrew — injured", withdrawn);

    if (drawBody) {
      const regenRes = await fetch(`${BASE}/draws/${drawBody.id}/regenerate`, {
        method: "POST",
        headers: asCoordinatorOfA,
        body: JSON.stringify({ force: true }),
      });
      const regenBody = regenRes.ok
        ? ((await regenRes.json()) as { slots: Array<{ entry: { entryId: string } }> })
        : null;
      check("regenerate after withdrawal -> 200", regenRes.status === 200, { status: regenRes.status });
      const slotEntryIds = new Set((regenBody?.slots ?? []).map((s) => s.entry.entryId));
      check("withdrawn athlete dropped from the redrawn bracket", !slotEntryIds.has(entryB.id), {
        slotEntryIds: [...slotEntryIds],
      });
      check("the other, still-approved athlete stays in the bracket", slotEntryIds.has(entryA.id), {
        slotEntryIds: [...slotEntryIds],
      });
    }

    // ── 1. Cross-event: the same grant must not open event B ────────────────
    console.log("\nCross-event (grant is on A, request targets B):");
    check("review queue on B     -> 403", (await call("GET", `/review?eventId=${other.id}`, asCoordinator)) === 403);
    check("apply template on B   -> 403", (await call("POST", `/events/${other.id}/apply-template`, asCoordinator, { template: "GK_SMALL_NO_WEIGHTS" })) === 403);
    check("update config on B    -> 403", (await call("PUT", `/events/${other.id}/config`, asCoordinator, {})) === 403);
    check("create mat on B       -> 403", (await call("POST", `/run/mats`, asCoordinator, { eventId: other.id, name: "Sneaky" })) === 403);

    // ── 2. body-vs-param confusion ──────────────────────────────────────────
    // POST /events/:id/divisions ignores :id and creates from body.eventId.
    // Guarding the path param instead of the body would let A's coordinator
    // create divisions on B by putting A in the URL.
    console.log("\nbody-vs-param (URL says A, body says B):");
    const status = await call("POST", `/events/${granted.id}/divisions`, asCoordinator, {
      eventId: other.id,
      key: "SNEAK",
      name: "Sneaked in",
      minAge: 5,
      maxAge: 6,
      gender: "Male",
      category: "KATA",
    });
    check("create division       -> 403", status === 403, { status });
    const leaked = await prisma.division.count({ where: { eventId: other.id, key: "SNEAK" } });
    check("nothing written to B  -> 0 rows", leaked === 0, { leaked });

    // ── 3. Scope creep: excluded powers stay excluded even on the granted event
    console.log("\nExcluded powers on the granted event:");
    check("delete event A        -> 403", (await call("DELETE", `/events/${granted.id}`, asCoordinator)) === 403);
    check("appoint coordinator   -> 403", (await call("POST", `/events/${granted.id}/coordinators`, asCoordinator, { userId: devUser.id })) === 403);
    check("revoke coordinator    -> 403", (await call("DELETE", `/events/${granted.id}/coordinators/${devUser.id}`, asCoordinator)) === 403);
    check("candidate picker      -> 403", (await call("GET", `/events/${granted.id}/coordinator-candidates`, asCoordinator)) === 403);
    check("create a new event    -> 403", (await call("POST", `/events`, asCoordinator, {})) === 403);
    check("list all users        -> 403", (await call("GET", `/users`, asCoordinator)) === 403);

    // Billing is club-scoped, not event-scoped, and never consults
    // EventCoordinator. A CLUB_MANAGER could always read its OWN club's
    // billing — that is pre-existing and not what this asserts. What matters
    // is that holding a coordinator grant buys no billing reach it did not
    // already have: another club's books stay shut.
    const foreignClub = await prisma.club.findFirst({
      where: { id: { not: devUser.clubId ?? "" } },
      select: { id: true },
    });
    if (foreignClub) {
      const billingStatus = await call("GET", `/billing/invoices?clubId=${foreignClub.id}`, asCoordinator);
      check("another club's books  -> not 200", billingStatus !== 200, { billingStatus });
    }

    // ── Admin path is unchanged by any of this ──────────────────────────────
    console.log("\nAdmin (unchanged behaviour):");
    check("review queue on B     -> 200", (await call("GET", `/review?eventId=${other.id}`, asAdmin)) === 200);
    check("update config on B    -> 200", (await call("PUT", `/events/${other.id}/config`, asAdmin, { fees: {} })) === 200);
    check("delete is allowed     -> 2xx", [200, 204].includes(await call("DELETE", `/events/${other.id}`, asAdmin)));

    // ── Revocation takes effect immediately (no stale JWT claim) ────────────
    await prisma.eventCoordinator.deleteMany({ where: { eventId: granted.id, userId: devUser.id } });
    console.log("\nAfter revocation:");
    check("review queue on A     -> 403", (await call("GET", `/review?eventId=${granted.id}`, asCoordinator)) === 403);
  } finally {
    // Entries have no cascade from Division/Club, so they must go before the
    // division/event cleanup below or those deletes hit a live FK reference.
    await prisma.entry.deleteMany({
      where: { club: { name: { startsWith: "__SCOPE_TEST_CLUB_" } } },
    });
    await prisma.athlete.deleteMany({ where: { club: { name: { startsWith: "__SCOPE_TEST_CLUB_" } } } });
    await prisma.club.deleteMany({ where: { name: { startsWith: "__SCOPE_TEST_CLUB_" } } });

    for (const id of [granted.id, other.id]) {
      await prisma.eventCoordinator.deleteMany({ where: { eventId: id } });
      await prisma.mat.deleteMany({ where: { eventId: id } });
      await prisma.weightClass.deleteMany({ where: { eventId: id } });
      await prisma.division.deleteMany({ where: { eventId: id } });
      await prisma.event.deleteMany({ where: { id } });
    }
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
