/**
 * Export one event as a self-contained JSON extract — read-only.
 *
 * The point of this is day-of forensics: pull the exact state (and, via the
 * audit trail, the exact *sequence*) of a tournament that has already been
 * run, so it can be reloaded into a local database and replayed. See
 * `import-event.ts` and `replay-run-day.ts` for the other two thirds.
 *
 * It only ever reads. There is no --confirm flag because there is nothing to
 * confirm: the sole write it performs is the JSON file it hands you.
 *
 *   npx tsx scripts/export-event.ts --list
 *   npx tsx scripts/export-event.ts --id <eventId> --out extract.json
 *
 * Against production, set DATABASE_URL for the command only — do not edit
 * .env, or the next local command silently runs against Railway:
 *
 *   DATABASE_URL="$PROD_DATABASE_URL" npx tsx scripts/export-event.ts --list
 *
 * Athlete and user personal data is **redacted by default** — names become
 * stable labels ("Athlete 41"), contact/medical/guardian/ID fields are
 * dropped entirely. None of it affects draw shape, mat assignment or run
 * order, which is what an extract like this is for. Pass `--with-names` if
 * you specifically need to recognise real people in the replay.
 *
 * Billing (invoices, payments, fee schedules) and documents are never
 * exported at all: unrelated to running the event, and the most sensitive
 * data in the database.
 */
import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma.js";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const LIST = args.includes("--list");
const ID = flag("--id");
const NAME = flag("--name");
const OUT = flag("--out");
const WITH_NAMES = args.includes("--with-names");

export const EXPORT_VERSION = 1;

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function main() {
  if (!ID && !NAME && !LIST) {
    fail('Give --list to see the events, then --id <eventId> (or --name "<exact name>").');
  }

  // Credentials are never printed, but *which server* is the whole question,
  // so the host is.
  const host = (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]*@/, "//***@");
  const isLocal = /@localhost[:/]/.test(process.env.DATABASE_URL ?? "");
  console.log(`\nDatabase: ${host || "(DATABASE_URL not set)"}`);
  console.log(isLocal ? "  -> local" : "  -> NOT local. Reading production data (read-only).");

  if (LIST) {
    const all = await prisma.event.findMany({
      select: {
        id: true, name: true, status: true, startDate: true,
        _count: { select: { entries: true, divisions: true, draws: true, mats: true } },
      },
      orderBy: { startDate: "desc" },
    });
    console.log(`\n${all.length} event(s):\n`);
    for (const e of all) {
      console.log(
        `  ${e.id}  ${e.status.padEnd(8)} ` +
          `entries=${String(e._count.entries).padStart(4)} ` +
          `div=${String(e._count.divisions).padStart(3)} ` +
          `draws=${String(e._count.draws).padStart(3)} ` +
          `mats=${String(e._count.mats).padStart(2)}  ` +
          `${e.startDate.toISOString().slice(0, 10)}  ${e.name}`,
      );
    }
    console.log("");
    return;
  }

  const matches = await prisma.event.findMany({
    where: ID ? { id: ID } : { name: NAME! },
  });
  if (matches.length === 0) fail(`No event matched ${ID ? `id ${ID}` : `name "${NAME}"`}. Try --list.`);
  if (matches.length > 1) fail(`${matches.length} events share that name — use --id instead.`);
  const event = matches[0]!;
  const eventId = event.id;
  console.log(`\nEvent: ${event.name}  (${eventId})`);

  // ---- Everything that belongs to the event ----
  const [divisions, weightClasses, mats, scheduleBlocks, coordinators, entries, teams, draws] =
    await Promise.all([
      prisma.division.findMany({ where: { eventId } }),
      prisma.weightClass.findMany({ where: { eventId } }),
      prisma.mat.findMany({ where: { eventId }, orderBy: { order: "asc" } }),
      prisma.scheduleBlock.findMany({ where: { eventId } }),
      prisma.eventCoordinator.findMany({ where: { eventId } }),
      prisma.entry.findMany({ where: { eventId } }),
      prisma.team.findMany({ where: { eventId } }),
      prisma.draw.findMany({ where: { eventId } }),
    ]);

  const drawIds = draws.map((d) => d.id);
  const matIds = mats.map((m) => m.id);
  const teamIds = teams.map((t) => t.id);

  const [drawSlots, bouts, teamMembers, matOperators] = await Promise.all([
    prisma.drawSlot.findMany({ where: { drawId: { in: drawIds } } }),
    prisma.bout.findMany({ where: { drawId: { in: drawIds } } }),
    prisma.teamMember.findMany({ where: { teamId: { in: teamIds } } }),
    prisma.matOperator.findMany({ where: { matId: { in: matIds } } }),
  ]);

  const boutIds = bouts.map((b) => b.id);
  const kataPerformances = await prisma.kataPerformance.findMany({
    where: { boutId: { in: boutIds } },
  });

  // ---- Referenced shared data (athletes, clubs, belts, katas, users) ----
  const athleteIds = [
    ...new Set([
      ...entries.map((e) => e.athleteId).filter((x): x is string => !!x),
      ...teamMembers.map((m) => m.athleteId),
    ]),
  ];
  const athletes = await prisma.athlete.findMany({ where: { id: { in: athleteIds } } });

  const clubIds = [
    ...new Set([...entries.map((e) => e.clubId), ...teams.map((t) => t.clubId), ...athletes.map((a) => a.clubId)]),
  ];
  const [clubs, belts, katas] = await Promise.all([
    prisma.club.findMany({ where: { id: { in: clubIds } }, select: { id: true, name: true, region: true } }),
    prisma.belt.findMany({
      where: { id: { in: [...new Set(athletes.map((a) => a.beltId).filter((x): x is string => !!x))] } },
    }),
    prisma.kata.findMany({ where: { id: { in: [...new Set(kataPerformances.map((k) => k.kataId))] } } }),
  ]);

  // ---- The audit trail: the *sequence* the day actually ran in ----
  // Bout results, mat assignments, queue reorders and check-ins are all here
  // with a timestamp, which is the only record of what happened when —
  // Bout itself has no updatedAt, and startedAt is overwritten in place.
  const entityIds = [eventId, ...drawIds, ...boutIds, ...matIds, ...entries.map((e) => e.id)];
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityId: { in: entityIds } },
    orderBy: { createdAt: "asc" },
  });

  const userIds = [
    ...new Set(
      [
        ...auditLogs.map((a) => a.userId),
        ...coordinators.flatMap((c) => [c.userId, c.grantedById]),
        ...matOperators.flatMap((o) => [o.userId, o.grantedById]),
      ].filter((x): x is string => !!x),
    ),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true, clubId: true },
  });

  // ---- Redaction ----
  // Rebuilding the day needs an athlete's dob, gender, club and weight (they
  // drive age bands, eligibility and weight classes). It needs nothing else
  // about them, so nothing else leaves the database.
  const athleteLabel = new Map(athletes.map((a, i) => [a.id, `Athlete ${i + 1}`]));
  const outAthletes = athletes.map((a) => ({
    id: a.id,
    clubId: a.clubId,
    firstName: WITH_NAMES ? a.firstName : athleteLabel.get(a.id)!,
    lastName: WITH_NAMES ? a.lastName : `(${clubs.find((c) => c.id === a.clubId)?.name ?? "club"})`,
    dob: a.dob,
    gender: a.gender,
    nationality: a.nationality,
    beltId: a.beltId,
    weightKg: a.weightKg,
    isActive: a.isActive,
  }));
  const outUsers = users.map((u, i) => ({
    id: u.id,
    name: WITH_NAMES ? u.name : `User ${i + 1}`,
    email: WITH_NAMES ? u.email : `user-${i + 1}@redacted.invalid`,
    role: u.role,
    clubId: u.clubId,
  }));
  const outTeams = teams.map((t) => ({ ...t, name: WITH_NAMES ? t.name : `Team ${t.id.slice(-4)}` }));

  const extract = {
    meta: {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      sourceHost: host,
      sourceIsLocal: isLocal,
      redacted: !WITH_NAMES,
      eventId,
    },
    event,
    divisions,
    weightClasses,
    mats,
    scheduleBlocks,
    coordinators,
    matOperators,
    clubs,
    belts,
    katas,
    athletes: outAthletes,
    users: outUsers,
    teams: outTeams,
    teamMembers,
    entries,
    draws,
    drawSlots,
    bouts,
    kataPerformances,
    auditLogs,
  };

  const path = OUT ?? `event-extract-${eventId}-${Date.now()}.json`;
  writeFileSync(path, JSON.stringify(extract, null, 2));

  const decided = bouts.filter((b) => b.winnerEntryId).length;
  const results = auditLogs.filter((a) => a.action === "RESULT" || a.action === "SCORE").length;
  console.log(`\nWrote ${path}`);
  console.log(`  mats            ${mats.length}`);
  console.log(`  draws           ${draws.length}`);
  console.log(`  bouts           ${bouts.length}  (${decided} decided, ${bouts.filter((b) => b.startedAt).length} with startedAt)`);
  console.log(`  bouts pinned    ${bouts.filter((b) => b.queueOrder !== null).length} with a manual queueOrder`);
  console.log(`  bouts moved     ${bouts.filter((b) => b.matId !== null).length} with a per-bout matId override`);
  console.log(`  entries         ${entries.length}`);
  console.log(`  athletes        ${athletes.length}${WITH_NAMES ? "" : " (names redacted)"}`);
  console.log(`  audit rows      ${auditLogs.length}  (${results} bout results/scores — the replay timeline)`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
