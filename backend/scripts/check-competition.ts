/**
 * Read-only smoke check for CompetitionService against whatever DATABASE_URL is
 * set. Calls the service directly rather than over HTTP, so it exercises the
 * bracket derivation without needing a running server or a key.
 *
 *   pnpm tsx scripts/check-competition.ts <clubId>
 */
import { CompetitionService } from "../src/services/competition.service.js";

const clubId = process.argv[2];
if (!clubId) {
  console.error("usage: tsx scripts/check-competition.ts <clubId>");
  process.exit(1);
}

const asOf = new Date();

const events = await CompetitionService.listEvents({ clubId, asOf });
console.log("=== EVENTS ===");
for (const e of events.events) {
  console.log(
    `${e.startDate}  ${e.hasTakenPlace ? "PAST    " : "UPCOMING"} d=${String(e.daysAway).padStart(5)}  ` +
      `entries=${e.myClub.entryCount}/${e.myClub.athleteCount}ath  drawn=${e.categoriesDrawn}  ` +
      `results=${e.resultsCaptured}  ${e.name}`,
  );
}

const target = events.events.find((e) => e.categoriesDrawn > 0);
if (!target) {
  console.log("\nNo event with draws — nothing further to check.");
  process.exit(0);
}

console.log(`\n=== RESULTS: ${target.name} ===`);
const results = await CompetitionService.results({ eventId: target.id });
console.log(`anyResults=${results.anyResults} categories=${results.count}`);
for (const c of results.categories) {
  console.log(
    `  [${c.categoryStatus}] n=${c.fieldSize} ${c.category} — ` +
      `gold=${c.gold?.name ?? "-"} silver=${c.silver?.name ?? "-"} bronze=${c.bronze.map((b) => b.name).join(", ") || "-"}`,
  );
}
console.log("clubTally:", results.clubTally);

console.log("\n=== FILTERED (q='girls kumite 10-11') ===");
const filtered = await CompetitionService.results({ eventId: target.id, q: "girls kumite 10-11" });
console.log(filtered.categories.map((c) => c.category));

console.log(`\n=== ENTRIES (this club, ${target.name}) ===`);
const entries = await CompetitionService.listEntries({ clubId, eventId: target.id, limit: 8 });
console.log(`count=${entries.count}`);
for (const e of entries.entries) {
  console.log(
    `  ${e.name} — ${e.entryType} ${e.category} status=${e.status} drawn=${e.drawn} checkedIn=${e.checkedIn}`,
  );
}

const withAthlete = entries.entries.find((e) => e.athleteId);
if (withAthlete?.athleteId) {
  console.log(`\n=== ATHLETE RECORD: ${withAthlete.name} ===`);
  const rec = await CompetitionService.athleteRecord({
    clubId,
    athleteId: withAthlete.athleteId,
    asOf,
  });
  console.log(JSON.stringify(rec, null, 2));
}

process.exit(0);
