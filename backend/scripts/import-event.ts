/**
 * Load an `export-event.ts` extract into the **local** database.
 *
 * Row ids are preserved exactly as exported, so anything you already have
 * from production — a bout id in a screenshot, a draw id from a
 * `/api/run/board` response pasted out of DevTools — lines up with what
 * lands here, and the audit trail's entityIds still point at real rows.
 * That is what makes `replay-run-day.ts` possible.
 *
 *   npx tsx scripts/import-event.ts --file extract.json
 *   npx tsx scripts/import-event.ts --file extract.json --replace
 *
 * It refuses to run against anything but localhost. Importing production
 * rows *into* production would duplicate a live tournament.
 *
 * Shared reference data (clubs, athletes, belts, katas, users) is upserted
 * by id and never deleted — an athlete who already exists locally keeps the
 * row they have. Only the event and what hangs off it is replaced.
 */
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma.js";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const FILE = flag("--file");
const REPLACE = args.includes("--replace");

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

/** Deletes an event and everything hanging off it. Local only, by construction. */
export async function purgeEvent(eventId: string) {
  const drawIds = (await prisma.draw.findMany({ where: { eventId }, select: { id: true } })).map((d) => d.id);
  const boutIds = (await prisma.bout.findMany({ where: { drawId: { in: drawIds } }, select: { id: true } })).map((b) => b.id);
  const matIds = (await prisma.mat.findMany({ where: { eventId }, select: { id: true } })).map((m) => m.id);
  const teamIds = (await prisma.team.findMany({ where: { eventId }, select: { id: true } })).map((t) => t.id);
  const entryIds = (await prisma.entry.findMany({ where: { eventId }, select: { id: true } })).map((e) => e.id);

  await prisma.$transaction([
    prisma.kataPerformance.deleteMany({ where: { boutId: { in: boutIds } } }),
    prisma.bout.deleteMany({ where: { drawId: { in: drawIds } } }),
    prisma.drawSlot.deleteMany({ where: { drawId: { in: drawIds } } }),
    prisma.draw.deleteMany({ where: { eventId } }),
    prisma.matOperator.deleteMany({ where: { matId: { in: matIds } } }),
    prisma.scheduleBlock.deleteMany({ where: { eventId } }),
    prisma.eventCoordinator.deleteMany({ where: { eventId } }),
    prisma.entry.deleteMany({ where: { eventId } }),
    prisma.teamMember.deleteMany({ where: { teamId: { in: teamIds } } }),
    prisma.team.deleteMany({ where: { eventId } }),
    prisma.weightClass.deleteMany({ where: { eventId } }),
    prisma.division.deleteMany({ where: { eventId } }),
    prisma.mat.deleteMany({ where: { eventId } }),
    prisma.auditLog.deleteMany({ where: { entityId: { in: [eventId, ...drawIds, ...boutIds, ...matIds, ...entryIds] } } }),
    prisma.event.delete({ where: { id: eventId } }),
  ]);
}

async function main() {
  if (!FILE) fail("Give --file <extract.json> (produced by scripts/export-event.ts).");

  const host = (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]*@/, "//***@");
  const isLocal = /@localhost[:/]/.test(process.env.DATABASE_URL ?? "");
  console.log(`\nDatabase: ${host || "(DATABASE_URL not set)"}`);
  if (!isLocal) fail("Refusing to import into a non-local database. Point DATABASE_URL at localhost.");
  console.log("  -> local");

  const x = JSON.parse(readFileSync(FILE, "utf8"));
  if (x?.meta?.version !== 1) fail(`Unsupported extract version ${x?.meta?.version}. Expected 1.`);
  const eventId: string = x.event.id;
  console.log(`\nExtract: ${x.event.name}  (${eventId})`);
  console.log(`  exported ${x.meta.exportedAt} from ${x.meta.sourceHost}${x.meta.redacted ? " (redacted)" : ""}`);

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (existing && !REPLACE) fail(`Event ${eventId} already exists locally. Re-run with --replace to overwrite it.`);
  if (existing) {
    console.log("  replacing the existing local copy…");
    await purgeEvent(eventId);
  }
  // purgeEvent finds audit rows through the rows that currently exist, which
  // misses any whose entity has since been rebuilt under a new id (the
  // bracket recompute does exactly that to bout rows). Clearing this
  // extract's own audit ids as well keeps a re-import idempotent.
  await prisma.auditLog.deleteMany({ where: { id: { in: x.auditLogs.map((a: { id: string }) => a.id) } } });

  // ---- Shared reference data: upsert by id, never delete ----
  for (const b of x.belts) {
    await prisma.belt.upsert({ where: { id: b.id }, create: b, update: {} });
  }
  // Kata.name is unique, so a locally-seeded kata of the same name owns that
  // name already; the performance rows are remapped onto it rather than
  // fighting the constraint.
  const kataIdMap = new Map<string, string>();
  for (const k of x.katas) {
    const byName = await prisma.kata.findUnique({ where: { name: k.name } });
    if (byName) {
      kataIdMap.set(k.id, byName.id);
      continue;
    }
    const created = await prisma.kata.upsert({ where: { id: k.id }, create: k, update: {} });
    kataIdMap.set(k.id, created.id);
  }
  for (const c of x.clubs) {
    await prisma.club.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, region: c.region, contactName: "", email: "" },
      update: {},
    });
  }
  for (const u of x.users) {
    const emailTaken = await prisma.user.findUnique({ where: { email: u.email } });
    const email = emailTaken && emailTaken.id !== u.id ? `${u.id}@import.invalid` : u.email;
    await prisma.user.upsert({ where: { id: u.id }, create: { ...u, email }, update: {} });
  }
  for (const a of x.athletes) {
    await prisma.athlete.upsert({ where: { id: a.id }, create: a, update: {} });
  }

  // ---- The event itself, in dependency order ----
  await prisma.event.create({ data: x.event });
  await prisma.division.createMany({ data: x.divisions });
  await prisma.weightClass.createMany({ data: x.weightClasses });
  await prisma.mat.createMany({ data: x.mats });
  await prisma.scheduleBlock.createMany({ data: x.scheduleBlocks });
  await prisma.team.createMany({ data: x.teams });
  await prisma.teamMember.createMany({ data: x.teamMembers });
  await prisma.entry.createMany({ data: x.entries });
  await prisma.draw.createMany({ data: x.draws });
  await prisma.drawSlot.createMany({ data: x.drawSlots });
  await prisma.bout.createMany({ data: x.bouts });
  await prisma.kataPerformance.createMany({
    data: x.kataPerformances.map((k: { kataId: string }) => ({ ...k, kataId: kataIdMap.get(k.kataId) ?? k.kataId })),
  });
  await prisma.eventCoordinator.createMany({ data: x.coordinators });
  await prisma.matOperator.createMany({ data: x.matOperators });
  // Audit rows carry the day's sequence; a userId pointing at a user that
  // was not exported (deleted since) is nulled rather than dropping the row.
  const knownUsers = new Set(x.users.map((u: { id: string }) => u.id));
  await prisma.auditLog.createMany({
    data: x.auditLogs.map((a: { userId: string | null }) => ({
      ...a,
      userId: a.userId && knownUsers.has(a.userId) ? a.userId : null,
    })),
  });

  console.log(`\nImported. ${x.mats.length} mats, ${x.draws.length} draws, ${x.bouts.length} bouts, ${x.auditLogs.length} audit rows.`);
  console.log(`\nNext: npx tsx scripts/replay-run-day.ts --event ${eventId}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
