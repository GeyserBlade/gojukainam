/**
 * Remove the debris the test scripts leave in the local database.
 *
 * `test-draws.ts` deliberately keeps its demo event "for UI testing" and
 * `test-*.ts` runs that crash before their `finally` leave their fixtures
 * behind, so after a few weeks the event picker is mostly junk — sixteen "Draw
 * Engine Demo Event" rows and fifty "OTJ Test" clubs.
 *
 * Targets are matched by *exact name* against a fixed list, never by a pattern:
 * a heuristic here would eventually eat a real club. It also refuses to delete
 * a club that has user accounts attached, since those are the seeded logins.
 *
 * The two seeded tournaments own their own data and clean up after themselves
 * (`seed-test-tournament.ts --clean`, `seed-championships-tournament.ts
 * --clean`); this script does not touch them.
 *
 * Run: npx tsx scripts/clean-test-data.ts            (from backend/)
 *      npx tsx scripts/clean-test-data.ts --dry-run  (list, delete nothing)
 */
import { prisma } from "../src/lib/prisma.js";

/** Events created by a test script or a throwaway verification run. */
const TEST_EVENT_NAMES = [
  "Draw Engine Demo Event",
  "Podium Verify Test Event",
  "__PLAN_TEST_EVENT__",
  "__PLAN_TEST_OTHER_EVENT__",
  "__EVENT_TIMING_TEST_EVENT__",
  "__PLAN_UI_DEMO__",
  "__SCOREBOARD_TEST_EVENT__",
];

/** Clubs created by `test-draws.ts` alongside its demo event. */
const TEST_CLUB_NAMES = ["OTJ Test", "KHD Test", "WVB Test"];

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost.");
  }
  const dryRun = process.argv.includes("--dry-run");

  const events = await prisma.event.findMany({
    where: { name: { in: TEST_EVENT_NAMES } },
    select: { id: true, name: true, _count: { select: { entries: true, divisions: true } } },
  });
  const eventIds = events.map((e) => e.id);

  // A club with a user account on it is a seeded login, not test debris.
  const clubs = await prisma.club.findMany({
    where: { name: { in: TEST_CLUB_NAMES } },
    select: { id: true, name: true, _count: { select: { athletes: true, users: true } } },
  });
  const deletableClubs = clubs.filter((c) => c._count.users === 0);
  const keptClubs = clubs.filter((c) => c._count.users > 0);
  const clubIds = deletableClubs.map((c) => c.id);

  const byName = new Map<string, number>();
  for (const e of events) byName.set(e.name, (byName.get(e.name) ?? 0) + 1);

  console.log("\nEvents to remove:");
  if (events.length === 0) console.log("  (none)");
  for (const [name, n] of byName) console.log(`  ${n} x ${name}`);

  const clubsByName = new Map<string, number>();
  for (const c of deletableClubs) clubsByName.set(c.name, (clubsByName.get(c.name) ?? 0) + 1);
  console.log("\nClubs to remove:");
  if (deletableClubs.length === 0) console.log("  (none)");
  for (const [name, n] of clubsByName) console.log(`  ${n} x ${name}`);
  const athletes = deletableClubs.reduce((n, c) => n + c._count.athletes, 0);
  if (athletes) console.log(`  …and their ${athletes} athletes`);
  for (const c of keptClubs) console.log(`  KEPT ${c.name} — has ${c._count.users} user account(s)`);

  // Stray superuser accounts and belts outlive the events that made them, so
  // they are counted here rather than behind the "nothing to do" shortcut —
  // that ordering already hid them once.
  const testerCount = await prisma.user.count({
    where: { email: { startsWith: "draw-tester-" } },
  });
  const beltRows = await prisma.belt.findMany({
    where: { name: "Test White" },
    select: { id: true, _count: { select: { Athlete: true } } },
  });
  const unusedBelts = beltRows.filter((b) => b._count.Athlete === 0);
  if (testerCount) console.log(`\n${testerCount} draw-tester account(s) to remove`);
  if (beltRows.length)
    console.log(
      `${unusedBelts.length} unused "Test White" belt(s) to remove` +
        (beltRows.length - unusedBelts.length
          ? `, ${beltRows.length - unusedBelts.length} still in use and kept`
          : ""),
    );

  if (dryRun) {
    console.log("\nDry run — nothing deleted.");
    return;
  }
  if (
    events.length === 0 &&
    deletableClubs.length === 0 &&
    testerCount === 0 &&
    unusedBelts.length === 0
  ) {
    console.log("\nNothing to do.");
    return;
  }

  // Children first: every foreign key here is a plain restrict.
  await prisma.scheduleBlock.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.drawSlot.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.bout.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.draw.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.teamMember.deleteMany({ where: { team: { eventId: { in: eventIds } } } });

  // Entries and teams reach the events being deleted *and* the clubs being
  // deleted, which are not the same set — a test club can hold entries in an
  // event that is staying, and vice versa.
  await prisma.entry.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.team.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.invoice.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.document.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });

  await prisma.mat.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.weightClass.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.division.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.eventCoordinator.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });

  await prisma.athlete.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });

  // Throwaway superuser accounts from `test-draws.ts`, one per historical run.
  const testerAudits = await prisma.auditLog.deleteMany({
    where: { user: { email: { startsWith: "draw-tester-" } } },
  });
  const testers = await prisma.user.deleteMany({
    where: { email: { startsWith: "draw-tester-" } },
  });

  // "Test White" belts, but only the ones nothing points at. These matter more
  // than they look: the tournament seeds pick a belt at random from every belt
  // that exists, so a pile of junk belts ends up on real-looking athletes.
  const unreferenced = unusedBelts.map((b) => b.id);
  await prisma.belt.deleteMany({ where: { id: { in: unreferenced } } });
  const stillUsed = beltRows.length - unreferenced.length;

  console.log(
    `\nRemoved ${events.length} event(s) and ${deletableClubs.length} club(s).`,
  );
  if (testers.count)
    console.log(`Removed ${testers.count} draw-tester account(s) and ${testerAudits.count} audit row(s).`);
  if (unreferenced.length) console.log(`Removed ${unreferenced.length} unused "Test White" belt(s).`);
  if (stillUsed)
    console.log(
      `KEPT ${stillUsed} "Test White" belt(s) — athletes still point at them. Re-seed those athletes, then run this again.`,
    );
  console.log(`Remaining: ${await prisma.event.count()} events, ${await prisma.club.count()} clubs.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
