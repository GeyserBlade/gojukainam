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
