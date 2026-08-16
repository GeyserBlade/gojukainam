/**
 * Delete one event and everything that hangs off it.
 *
 * The app's own `DELETE /events/:id` deliberately refuses any event that has
 * entries, and even an empty one trips the foreign keys from divisions, weight
 * classes, teams and invoices — none of which cascade. That guard is right for
 * a button on a web page and useless when an organizer genuinely wants a
 * tournament gone so they can rebuild it. This is the deliberate, out-of-band
 * version.
 *
 * It is a **dry run unless `--confirm` is passed**, it writes a full JSON
 * backup of every row before deleting anything, and it deletes in one
 * transaction, so a failure part-way leaves the tournament intact rather than
 * half-shredded.
 *
 * Shared reference data is never touched: athletes, clubs, users, belts and
 * katas outlive any one tournament. What goes is the event and only what
 * belongs to it.
 *
 *   npx tsx scripts/delete-event.ts --list
 *   npx tsx scripts/delete-event.ts --id <eventId>
 *   npx tsx scripts/delete-event.ts --id <eventId> --confirm
 *
 * `--timeout-ms N` raises the transaction budget (default 600000, ten minutes)
 * if a very large tournament over a slow link still runs out.
 *
 * Against production, set DATABASE_URL for the command only — do not edit
 * .env, or the next local command silently runs against Railway:
 *
 *   DATABASE_URL="$PROD_URL" npx tsx scripts/delete-event.ts --name "..."
 */
import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma.js";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const CONFIRM = args.includes("--confirm");
const LIST = args.includes("--list");
const ID = flag("--id");
const NAME = flag("--name");
const OUT = flag("--backup");

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function main() {
  if (!ID && !NAME && !LIST) {
    fail("Give --list to see the events, then --id <eventId> (or --name \"<exact name>\").");
  }

  // Credentials are never printed, but *which server* is the whole question, so
  // the host is.
  const host = (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]*@/, "//***@");
  const isLocal = /@localhost[:/]/.test(process.env.DATABASE_URL ?? "");
  console.log(`\nDatabase: ${host || "(DATABASE_URL not set)"}`);
  console.log(isLocal ? "  -> local" : "  -> NOT local. This is production data.");

  if (LIST) {
    const all = await prisma.event.findMany({
      select: {
        id: true, name: true, status: true, startDate: true,
        _count: { select: { entries: true, divisions: true, draws: true } },
      },
      orderBy: { startDate: "desc" },
    });
    console.log(`\n${all.length} event(s):\n`);
    for (const e of all) {
      console.log(
        `  ${e.id}  ${e.status.padEnd(8)} ` +
          `entries=${String(e._count.entries).padStart(4)} ` +
          `div=${String(e._count.divisions).padStart(3)} ` +
          `draws=${String(e._count.draws).padStart(3)}  ` +
          `${e.startDate.toISOString().slice(0, 10)}  ${e.name}`,
      );
    }
    console.log("");
    await prisma.$disconnect();
    return;
  }

  // Match on the id when given; otherwise on the exact name. Never a
  // pattern — "delete everything like Championships" is how the wrong
  // tournament goes.
  const matches = await prisma.event.findMany({
    where: ID ? { id: ID } : { name: NAME },
    select: { id: true, name: true, status: true, startDate: true, createdAt: true },
  });

  if (matches.length === 0) {
    const all = await prisma.event.findMany({ select: { name: true }, orderBy: { createdAt: "desc" } });
    fail(
      `No event matched ${ID ? `id ${ID}` : `name "${NAME}"`}.\n` +
        `Events on this database:\n` +
        all.map((e) => `  - ${e.name}`).join("\n"),
    );
  }
  if (matches.length > 1) {
    fail(
      `${matches.length} events share that name. Re-run with --id to say which:\n` +
        matches.map((e) => `  ${e.id}  ${e.name} (${e.startDate.toISOString().slice(0, 10)})`).join("\n"),
    );
  }

  const event = matches[0];
  const eventId = event.id;
  console.log(`\nEvent: ${event.name}`);
  console.log(`  id ${eventId} · ${event.status} · starts ${event.startDate.toISOString().slice(0, 10)}`);

  // Everything that would go, counted before anything is touched.
  const drawIds = (await prisma.draw.findMany({ where: { eventId }, select: { id: true } })).map((d) => d.id);
  const teamIds = (await prisma.team.findMany({ where: { eventId }, select: { id: true } })).map((t) => t.id);
  const matIds = (await prisma.mat.findMany({ where: { eventId }, select: { id: true } })).map((m) => m.id);

  const counts = {
    entries: await prisma.entry.count({ where: { eventId } }),
    divisions: await prisma.division.count({ where: { eventId } }),
    weightClasses: await prisma.weightClass.count({ where: { eventId } }),
    teams: teamIds.length,
    teamMembers: await prisma.teamMember.count({ where: { teamId: { in: teamIds } } }),
    draws: drawIds.length,
    drawSlots: await prisma.drawSlot.count({ where: { drawId: { in: drawIds } } }),
    bouts: await prisma.bout.count({ where: { drawId: { in: drawIds } } }),
    kataPerformances: await prisma.kataPerformance.count({ where: { bout: { drawId: { in: drawIds } } } }),
    mats: matIds.length,
    matOperators: await prisma.matOperator.count({ where: { matId: { in: matIds } } }),
    scheduleBlocks: await prisma.scheduleBlock.count({ where: { eventId } }),
    coordinators: await prisma.eventCoordinator.count({ where: { eventId } }),
    invoices: await prisma.invoice.count({ where: { eventId } }),
    documents: await prisma.document.count({ where: { eventId } }),
  };

  console.log("\nWould delete:");
  for (const [k, v] of Object.entries(counts)) {
    if (v > 0) console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
  if (Object.values(counts).every((v) => v === 0)) console.log("  (nothing — the event is empty)");

  // Results are history. Deleting a fought tournament is a different decision
  // from deleting one that never ran, so it is said out loud either way.
  const decided = await prisma.bout.count({
    where: { drawId: { in: drawIds }, winnerEntryId: { not: null } },
  });
  if (decided > 0) {
    console.log(`\n  !! ${decided} bout(s) already have a recorded winner. Those results go too.`);
  }
  if (counts.documents > 0) {
    console.log(
      `\n  !! ${counts.documents} document row(s) will be removed. The files themselves stay in\n` +
        `     Supabase Storage and become orphaned — clean those up separately if it matters.`,
    );
  }
  console.log("\nNot touched: athletes, clubs, users, belts, katas.");

  // The backup is written on a dry run too — it costs nothing and it is the
  // thing you want to have taken *before* deciding.
  const backup = {
    takenAt: new Date().toISOString(),
    event: await prisma.event.findUnique({ where: { id: eventId } }),
    divisions: await prisma.division.findMany({ where: { eventId } }),
    weightClasses: await prisma.weightClass.findMany({ where: { eventId } }),
    entries: await prisma.entry.findMany({ where: { eventId } }),
    teams: await prisma.team.findMany({ where: { eventId } }),
    teamMembers: await prisma.teamMember.findMany({ where: { teamId: { in: teamIds } } }),
    draws: await prisma.draw.findMany({ where: { eventId } }),
    drawSlots: await prisma.drawSlot.findMany({ where: { drawId: { in: drawIds } } }),
    bouts: await prisma.bout.findMany({ where: { drawId: { in: drawIds } } }),
    kataPerformances: await prisma.kataPerformance.findMany({ where: { bout: { drawId: { in: drawIds } } } }),
    mats: await prisma.mat.findMany({ where: { eventId } }),
    matOperators: await prisma.matOperator.findMany({ where: { matId: { in: matIds } } }),
    scheduleBlocks: await prisma.scheduleBlock.findMany({ where: { eventId } }),
    coordinators: await prisma.eventCoordinator.findMany({ where: { eventId } }),
    invoices: await prisma.invoice.findMany({ where: { eventId } }),
    documents: await prisma.document.findMany({ where: { eventId } }),
  };
  const path = OUT ?? `event-backup-${eventId}-${Date.now()}.json`;
  writeFileSync(path, JSON.stringify(backup, null, 2));
  console.log(`\nBackup written: ${path}`);

  if (!CONFIRM) {
    console.log("\nDry run — nothing was deleted. Re-run with --confirm to go ahead.\n");
    await prisma.$disconnect();
    return;
  }

  // One transaction: a tournament half-deleted is worse than one not deleted.
  // Order matters only for the relations that do not cascade; the rest
  // (bouts, slots, mats, blocks, coordinators, documents) go with their parent.
  //
  // The timeouts are the whole reason this is worth commenting. Prisma closes
  // an interactive transaction after **5 seconds** by default and the next
  // statement inside it then fails with P2028 — which is what a real
  // tournament deleted over Railway's public proxy does every time: a few
  // hundred entries, each cascading to slots, bouts and kata performances,
  // across an internet round trip per statement. The transaction rolls back
  // cleanly, so nothing is lost, but the delete never happens either.
  const TIMEOUT_MS = Number(flag("--timeout-ms") ?? 600_000); // 10 minutes
  console.log(`\nDeleting… (transaction timeout ${Math.round(TIMEOUT_MS / 1000)}s)`);
  const started = Date.now();
  const step = (label: string, n: number) =>
    console.log(`  ${String(n).padStart(5)} ${label}  (${((Date.now() - started) / 1000).toFixed(1)}s)`);

  await prisma.$transaction(
    async (tx) => {
      step("draws (with their bouts and slots)", (await tx.draw.deleteMany({ where: { eventId } })).count);
      step("entries", (await tx.entry.deleteMany({ where: { eventId } })).count);
      step("team members", (await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } })).count);
      step("teams", (await tx.team.deleteMany({ where: { eventId } })).count);
      step("invoices", (await tx.invoice.deleteMany({ where: { eventId } })).count);
      step("weight classes", (await tx.weightClass.deleteMany({ where: { eventId } })).count);
      step("divisions", (await tx.division.deleteMany({ where: { eventId } })).count);
      await tx.event.delete({ where: { id: eventId } });
      step("event (with mats, blocks, coordinators, documents)", 1);
    },
    // maxWait is how long to queue for a connection before starting; timeout is
    // how long the transaction may then run.
    { maxWait: 30_000, timeout: TIMEOUT_MS },
  );

  const left = await prisma.event.count({ where: { id: eventId } });
  const strays = await prisma.entry.count({ where: { eventId } });
  console.log(
    left === 0 && strays === 0
      ? `\nDone. "${event.name}" and everything under it are gone.\n`
      : `\nSomething survived: event rows ${left}, entry rows ${strays}. Investigate before retrying.\n`,
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
