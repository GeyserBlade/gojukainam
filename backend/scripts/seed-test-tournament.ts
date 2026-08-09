/**
 * Build a full test tournament in the local database, for exercising the event
 * hub end to end — the Plan tab in particular.
 *
 * Deliberately built through the real service layer rather than by writing rows
 * directly: divisions come from the `NKF_FULL_2026` template via
 * `EventService.applyTemplate`, brackets from `DrawService.create`, and results
 * from `DrawService.setBoutWinner`. That means the draws are genuine (correct
 * bye placement, real repechage) and a category's DRAWN/IN_PROGRESS/COMPLETED
 * status is *derived* the way the app derives it, not stamped on. Seeded data
 * that lies about its own shape is worse than no seed data.
 *
 * Re-runnable: it deletes any previous run of itself first, matched on the
 * event name and a marker on the clubs it creates, and it touches nothing else
 * in the database.
 *
 * Run: npx tsx scripts/seed-test-tournament.ts          (from backend/)
 *      npx tsx scripts/seed-test-tournament.ts --clean  (remove it again)
 */
import { prisma } from "../src/lib/prisma.js";
import { EventService } from "../src/services/event.service.js";
import { DrawService } from "../src/services/draw.service.js";
import { ageOn } from "../src/utils/eligibility.js";

const EVENT_NAME = "Goju Kai Namibia Test Championships 2026";
/** Stamped on every club this script creates, so cleanup can find its own work. */
const SEED_TAG = "__SEED_TEST_TOURNAMENT__";
/** A Saturday. Every athlete's age is computed against this date. */
const EVENT_DATE = new Date("2026-10-17T00:00:00.000Z");

// ---------------------------------------------------------------------------
// Deterministic randomness
//
// A fixed seed means re-running gives byte-identical brackets and results, so a
// bug you saw once is still there when you look again. `Math.random()` would
// make every run a different tournament.
// ---------------------------------------------------------------------------

let rngState = 0x2f6e2b1;
const rand = () => {
  rngState ^= rngState << 13;
  rngState ^= rngState >>> 17;
  rngState ^= rngState << 5;
  return ((rngState >>> 0) % 100000) / 100000;
};
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const CLUBS = [
  { name: "Windhoek Goju Kai", region: "Khomas", contactName: "Sensei Amutenya" },
  { name: "Swakopmund Karate Academy", region: "Erongo", contactName: "Sensei Beukes" },
  { name: "Walvis Bay Dojo", region: "Erongo", contactName: "Sensei Haufiku" },
  { name: "Oshakati Martial Arts", region: "Oshana", contactName: "Sensei Nghidinwa" },
  { name: "Otjiwarongo Goju Kai", region: "Otjozondjupa", contactName: "Sensei Kavari" },
  { name: "Rundu Karate Club", region: "Kavango East", contactName: "Sensei Shipanga" },
  { name: "Keetmanshoop Dojo", region: "ǁKaras", contactName: "Sensei Cloete" },
  { name: "Katima Mulilo Karate", region: "Zambezi", contactName: "Sensei Sikopo" },
];

const FIRST_M = [
  "Tangeni", "Johannes", "Petrus", "Simon", "Elias", "Gerhard", "Mervin", "Ruan",
  "Shaun", "Lukas", "Immanuel", "Festus", "Dawid", "Ndapewa", "Junias", "Riaan",
  "Tobias", "Aldrin", "Kaleb", "Nangolo", "Werner", "Kondjeni", "Pieter", "Ismael",
];
const FIRST_F = [
  "Ndeshi", "Selma", "Maria", "Anneline", "Hilma", "Chantelle", "Rauna", "Loide",
  "Jolanda", "Frieda", "Talita", "Ester", "Magdalena", "Kaino", "Rosalia", "Nangula",
  "Zenobia", "Aina", "Charmaine", "Tuyeni", "Elizabeth", "Naemi",
];
const LAST = [
  "Amutenya", "Shikongo", "Nghidinwa", "Beukes", "Haufiku", "Kavari", "Shipanga",
  "Cloete", "Sikopo", "van Wyk", "Nakale", "Iipinge", "Hamutenya", "Uushona",
  "Gaseb", "Mbako", "Tjiveze", "Naobeb", "Shilongo", "Kandjeke", "Basson", "Awases",
  "Nekwaya", "Katjivena", "Swartbooi", "Mungunda",
];

/**
 * The age bands to populate, and how many athletes to put in each. Each athlete
 * enters exactly one kata and one kumite category — the config's
 * `maxIndividualEventsPerAthlete: 2`, respected rather than bypassed just
 * because this script writes rows directly.
 *
 * Ages are chosen inside each band and away from the overlaps in the template
 * (Senior Kata is 16+, so a 16-year-old is eligible for Junior *and* Senior).
 * Picking one band per athlete keeps the entry list unambiguous.
 */
const BANDS = [
  { band: "CADET", gender: "Male" as const, count: 26, ageFrom: 14, ageTo: 15 },
  { band: "CADET", gender: "Female" as const, count: 19, ageFrom: 14, ageTo: 15 },
  { band: "JUNIOR", gender: "Male" as const, count: 22, ageFrom: 16, ageTo: 17 },
  { band: "JUNIOR", gender: "Female" as const, count: 17, ageFrom: 16, ageTo: 17 },
  { band: "U21", gender: "Male" as const, count: 17, ageFrom: 18, ageTo: 20 },
  { band: "U21", gender: "Female" as const, count: 13, ageFrom: 18, ageTo: 20 },
  { band: "SENIOR", gender: "Male" as const, count: 31, ageFrom: 21, ageTo: 33 },
  { band: "SENIOR", gender: "Female" as const, count: 23, ageFrom: 21, ageTo: 33 },
  { band: "VETERAN", gender: "Male" as const, count: 13, ageFrom: 36, ageTo: 52 },
  { band: "VETERAN", gender: "Female" as const, count: 9, ageFrom: 36, ageTo: 48 },
];

/**
 * Which template division serves each band, per gender and category, matched on
 * `key`. Spelled out rather than derived: the NKF template's keys are only
 * mostly systematic (`SENIOR_M_KUMITE` but `NKF_SENIOR_M_KATA`), and a clever
 * rule that silently misses one would enter a whole age band in nothing.
 */
const BAND_DIVISION_KEYS: Record<
  string,
  Record<"Male" | "Female", { KATA: string; KUMITE: string }>
> = {
  CADET: {
    Male: { KATA: "CADET_M_KATA", KUMITE: "CADET_M_KUMITE" },
    Female: { KATA: "CADET_F_KATA", KUMITE: "NKF_CADET_F_KUMITE" },
  },
  JUNIOR: {
    Male: { KATA: "JUNIOR_M_KATA", KUMITE: "JUNIOR_M_KUMITE" },
    Female: { KATA: "JUNIOR_F_KATA", KUMITE: "NKF_JUNIOR_F_KUMITE" },
  },
  U21: {
    Male: { KATA: "U21_M_KATA", KUMITE: "U21_M_KUMITE" },
    Female: { KATA: "U21_F_KATA", KUMITE: "NKF_U21_F_KUMITE" },
  },
  SENIOR: {
    Male: { KATA: "NKF_SENIOR_M_KATA", KUMITE: "SENIOR_M_KUMITE" },
    Female: { KATA: "NKF_SENIOR_F_KATA", KUMITE: "SENIOR_F_KUMITE" },
  },
  VETERAN: {
    Male: { KATA: "VETERAN_M_KATA", KUMITE: "VETERAN_M_KUMITE" },
    Female: { KATA: "VETERAN_F_KATA", KUMITE: "VETERAN_F_KUMITE" },
  },
};

// ---------------------------------------------------------------------------

async function clean() {
  const events = await prisma.event.findMany({
    where: { name: EVENT_NAME },
    select: { id: true },
  });
  const eventIds = events.map((e) => e.id);
  const clubs = await prisma.club.findMany({ where: { notes: SEED_TAG }, select: { id: true } });
  const clubIds = clubs.map((c) => c.id);

  if (eventIds.length === 0 && clubIds.length === 0) return false;

  // Order matters: every FK here is a plain restrict, so children go first.
  await prisma.scheduleBlock.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.drawSlot.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.bout.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.draw.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.entry.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.teamMember.deleteMany({ where: { team: { eventId: { in: eventIds } } } });
  await prisma.team.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.mat.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.weightClass.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.division.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.invoice.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.document.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.eventCoordinator.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });

  await prisma.athlete.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  return true;
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error(
      "Refusing to run: DATABASE_URL is not localhost. This script creates and deletes data.",
    );
  }

  const cleanOnly = process.argv.includes("--clean");
  const removed = await clean();
  if (removed) console.log(cleanOnly ? "Removed the test tournament." : "Removed the previous run.");
  else if (cleanOnly) console.log("Nothing to remove.");
  if (cleanOnly) return;

  const belts = await prisma.belt.findMany({ orderBy: { order: "asc" } });
  if (belts.length === 0)
    throw new Error("No belts in the database — run `npm run prisma:seed` first.");

  // Audit rows need a real author; every write below is attributed to whoever
  // this database calls its administrator.
  const author =
    (await prisma.user.findFirst({ where: { role: { in: ["SUPERADMIN", "ADMIN"] } } })) ??
    (await prisma.user.findFirst());
  if (!author)
    throw new Error("No users in the database — run `npm run create-superuser` first.");

  // ---- Event + divisions -------------------------------------------------
  console.log("\nCreating the event…");
  const configJson = JSON.stringify({
    currency: "NAD",
    fees: { kataIndividual: 150, kumiteIndividual: 150, teamKata: 300, teamKumite: 300 },
    limits: { maxIndividualEventsPerAthlete: 2, maxEntriesPerClubPerCategory: 10 },
    teams: { teamKata: { size: 3, reserves: 1 }, teamKumite: { size: 3, reserves: 1 } },
  });

  const event = await prisma.event.create({
    data: {
      name: EVENT_NAME,
      venue: "Windhoek Showgrounds — Hall B",
      city: "Windhoek",
      country: "Namibia",
      startDate: EVENT_DATE,
      regOpen: new Date("2026-08-01T00:00:00.000Z"),
      regClose: new Date("2026-10-03T00:00:00.000Z"),
      status: "ACTIVE",
      configJson,
    },
  });

  const applied = await EventService.applyTemplate(event.id, "NKF_FULL_2026");
  console.log(
    `  ${applied.divisionsCreated} divisions, ${applied.weightClassesCreated} weight classes (NKF_FULL_2026)`,
  );

  // Timing defaults, so the Plan tab's schedule and its ceremony/break
  // suggestions are meaningful the moment it opens.
  await EventService.updateTiming(event.id, {
    mats: 3,
    dayStartTime: "08:00",
    defaultBoutDurationSec: 120,
    // Kata is timed on its own terms, and SEQUENTIAL (AKA then AO, the WKF
    // format) means every kata bout costs the mat two performances.
    kataBoutDurationSec: 90,
    kataMode: "SEQUENTIAL",
    transitionSecondsPerBout: 45,
    defaultBufferPct: 12,
    changeoverMinutes: 6,
    opening: { enabled: true, minutes: 20 },
    closing: { enabled: true, minutes: 20 },
    lunch: { enabled: true, minutes: 45, mode: "ALL_MATS" },
    checkin: { enabled: true, minutes: 30 },
  });

  const divisions = await prisma.division.findMany({ where: { eventId: event.id } });
  const weightClasses = await prisma.weightClass.findMany({ where: { eventId: event.id } });
  const divisionByKey = new Map(divisions.map((d) => [`${d.key}:${d.gender}`, d]));
  const wcByDivision = new Map<string, typeof weightClasses>();
  for (const wc of weightClasses) {
    if (!wc.divisionId) continue;
    const list = wcByDivision.get(wc.divisionId);
    if (list) list.push(wc);
    else wcByDivision.set(wc.divisionId, [wc]);
  }

  // ---- Clubs -------------------------------------------------------------
  console.log("Creating clubs…");
  const clubs = await Promise.all(
    CLUBS.map((c, i) =>
      prisma.club.create({
        data: {
          name: c.name,
          region: c.region,
          contactName: c.contactName,
          email: `dojo${i + 1}@example.test`,
          phone: `+264 81 000 ${String(1000 + i)}`,
          notes: SEED_TAG,
        },
      }),
    ),
  );
  console.log(`  ${clubs.length} clubs`);

  // ---- Athletes + individual entries -------------------------------------
  console.log("Creating athletes and entries…");

  type SeededAthlete = {
    id: string;
    clubId: string;
    gender: "Male" | "Female";
    age: number;
    band: string;
  };
  const athletes: SeededAthlete[] = [];
  let individualEntries = 0;
  let usedNames = new Set<string>();

  for (const spec of BANDS) {
    const keys = BAND_DIVISION_KEYS[spec.band][spec.gender];
    const kataDivision = divisionByKey.get(`${keys.KATA}:${spec.gender}`);
    const kumiteDivision = divisionByKey.get(`${keys.KUMITE}:${spec.gender}`);
    if (!kataDivision || !kumiteDivision)
      throw new Error(`Template division missing for ${spec.band} ${spec.gender}`);

    const kumiteWeights = wcByDivision.get(kumiteDivision.id) ?? [];

    for (let i = 0; i < spec.count; i++) {
      const club = clubs[i % clubs.length];
      const age = randInt(spec.ageFrom, spec.ageTo);

      // A dob that yields exactly `age` on the event date, with a birthday
      // that has already passed — no off-by-one against `ageOn`.
      const dob = new Date(
        Date.UTC(EVENT_DATE.getUTCFullYear() - age, randInt(0, 8), randInt(1, 28)),
      );

      let name = "";
      do {
        const first = spec.gender === "Male" ? pick(FIRST_M) : pick(FIRST_F);
        name = `${first} ${pick(LAST)}`;
      } while (usedNames.has(name));
      usedNames.add(name);
      const [firstName, ...rest] = name.split(" ");

      // Pick the weight class first, then a weight inside it, so the entry
      // would survive `validateAthleteWeight` if it ever went through the API.
      //
      // Averaging two draws bunches athletes into the middle classes and leaves
      // the extremes thin, the way a real entry list looks. Round-robin would
      // give every category the same healthy count and quietly hide the cases
      // worth testing — a weight class with one entry that cannot be drawn, and
      // one with none at all.
      const weightClass =
        kumiteWeights.length > 0
          ? kumiteWeights[
              Math.min(
                kumiteWeights.length - 1,
                Math.floor(((rand() + rand()) / 2) * kumiteWeights.length),
              )
            ]
          : null;
      const weightKg = weightClass
        ? Math.round(
            ((weightClass.minKg ?? (weightClass.maxKg ?? 70) - 6) +
              (weightClass.maxKg ?? (weightClass.minKg ?? 70) + 8)) /
              2,
          )
        : randInt(45, 95);

      const athlete = await prisma.athlete.create({
        data: {
          clubId: club.id,
          firstName,
          lastName: rest.join(" "),
          dob,
          gender: spec.gender,
          nationality: "Namibia",
          beltId: belts[Math.min(belts.length - 1, randInt(2, belts.length - 1))].id,
          weightKg,
          isActive: true,
        },
      });
      athletes.push({
        id: athlete.id,
        clubId: club.id,
        gender: spec.gender,
        age: ageOn(EVENT_DATE, dob),
        band: spec.band,
      });

      await prisma.entry.create({
        data: {
          eventId: event.id,
          clubId: club.id,
          athleteId: athlete.id,
          divisionId: kataDivision.id,
          entryType: "KATA",
          status: "APPROVED",
          feeCents: 15000,
        },
      });
      await prisma.entry.create({
        data: {
          eventId: event.id,
          clubId: club.id,
          athleteId: athlete.id,
          divisionId: kumiteDivision.id,
          weightClassId: weightClass?.id ?? null,
          entryType: "KUMITE",
          status: "APPROVED",
          feeCents: 15000,
        },
      });
      individualEntries += 2;
    }
  }
  console.log(`  ${athletes.length} athletes, ${individualEntries} individual entries`);

  // ---- Teams -------------------------------------------------------------
  console.log("Creating teams…");
  const TEAM_SPECS = [
    { key: "NKF_JUNIOR_M_TEAM_KATA", gender: "Male" as const, type: "TEAM_KATA" as const, bands: ["CADET", "JUNIOR"] },
    { key: "NKF_JUNIOR_F_TEAM_KATA", gender: "Female" as const, type: "TEAM_KATA" as const, bands: ["CADET", "JUNIOR"] },
    { key: "NKF_SENIOR_M_TEAM_KATA", gender: "Male" as const, type: "TEAM_KATA" as const, bands: ["JUNIOR", "U21", "SENIOR"] },
    { key: "NKF_SENIOR_F_TEAM_KATA", gender: "Female" as const, type: "TEAM_KATA" as const, bands: ["JUNIOR", "U21", "SENIOR"] },
    { key: "NKF_SENIOR_M_TEAM_KUMITE", gender: "Male" as const, type: "TEAM_KUMITE" as const, bands: ["U21", "SENIOR"] },
    { key: "NKF_SENIOR_F_TEAM_KUMITE", gender: "Female" as const, type: "TEAM_KUMITE" as const, bands: ["U21", "SENIOR"] },
  ];

  let teamCount = 0;
  for (const spec of TEAM_SPECS) {
    const division = divisionByKey.get(`${spec.key}:${spec.gender}`);
    if (!division) continue;

    for (const club of clubs) {
      // Not every club fields a team in every event — the smaller dojos enter
      // one or two. Skipping some keeps team brackets a realistic 4-6 rather
      // than a suspiciously perfect one-per-club.
      if (rand() > 0.62) continue;

      // Three members plus a reserve, all from one club and inside the
      // division's age range — a team that couldn't legally take the mat is
      // not useful test data.
      const pool = athletes.filter(
        (a) =>
          a.clubId === club.id &&
          a.gender === spec.gender &&
          spec.bands.includes(a.band) &&
          a.age >= division.minAge &&
          a.age <= division.maxAge,
      );
      if (pool.length < 3) continue;

      const team = await prisma.team.create({
        data: {
          eventId: event.id,
          clubId: club.id,
          name: `${club.name} ${spec.gender === "Male" ? "A" : "B"}`,
          teamType: spec.type,
          divisionId: division.id,
          status: "APPROVED",
        },
      });
      await prisma.teamMember.createMany({
        data: pool.slice(0, 4).map((a, i) => ({
          teamId: team.id,
          athleteId: a.id,
          isReserve: i === 3,
        })),
      });
      await prisma.entry.create({
        data: {
          eventId: event.id,
          clubId: club.id,
          teamId: team.id,
          divisionId: division.id,
          entryType: spec.type,
          status: "APPROVED",
          feeCents: 30000,
        },
      });
      teamCount++;
    }
  }
  console.log(`  ${teamCount} teams entered`);

  // ---- Draws -------------------------------------------------------------
  console.log("Generating draws…");

  // Every (division, weight class) pairing that actually has entries.
  const grouped = await prisma.entry.groupBy({
    by: ["divisionId", "weightClassId"],
    where: { eventId: event.id, status: "APPROVED" },
    _count: true,
  });

  // Four categories are deliberately left undrawn, so the Plan tab's
  // "has entries but no draw yet" state has something to report.
  const drawable = grouped.filter((g) => g._count >= 2);
  const skipIndexes = new Set([3, 11, 24, 38].filter((i) => i < drawable.length));

  const createdDraws: { drawId: string; count: number }[] = [];
  let skipped = 0;
  for (const [index, group] of drawable.entries()) {
    if (skipIndexes.has(index)) {
      skipped++;
      continue;
    }
    const draw = await DrawService.create(
      {
        eventId: event.id,
        divisionId: group.divisionId,
        weightClassId: group.weightClassId,
      },
      { id: author.id },
    );
    createdDraws.push({ drawId: draw.id, count: group._count });
  }
  const tooSmall = grouped.length - drawable.length;
  console.log(
    `  ${createdDraws.length} draws generated · ${skipped} left undrawn on purpose · ${tooSmall} category(ies) with fewer than 2 entries`,
  );

  // ---- Results -----------------------------------------------------------
  //
  // Status is derived, never stamped: scoring bouts through setBoutWinner is
  // what moves a category to IN_PROGRESS and then COMPLETED, and it fills the
  // Results tab and the podium at the same time.
  console.log("Scoring some categories…");

  /** Score bouts until the bracket is finished, or only the first round. */
  async function scoreDraw(drawId: string, mode: "full" | "first-round") {
    for (let pass = 0; pass < 40; pass++) {
      const detail = await DrawService.get(drawId);
      const ready = detail.bouts.filter(
        (b: any) => b.id && b.aka && b.ao && !b.winnerEntryId && (mode === "full" || b.round === 1),
      );
      if (ready.length === 0) return;
      for (const bout of ready) {
        const winner = rand() < 0.5 ? bout.aka.entryId : bout.ao.entryId;
        await DrawService.setBoutWinner(drawId, bout.id, winner, { id: author.id });
      }
      if (mode === "first-round") return;
    }
  }

  // Biggest brackets first, so the finished ones are the interesting ones.
  const bySize = [...createdDraws].sort((a, b) => b.count - a.count);
  const completed = bySize.slice(0, 4);
  const inProgress = bySize.slice(4, 7);

  for (const d of completed) await scoreDraw(d.drawId, "full");
  for (const d of inProgress) await scoreDraw(d.drawId, "first-round");

  const statusCounts = await prisma.draw.groupBy({
    by: ["status"],
    where: { eventId: event.id },
    _count: true,
  });
  console.log(
    "  " + statusCounts.map((s) => `${s._count} ${s.status}`).join(" · "),
  );

  // ---- Floors ------------------------------------------------------------
  //
  // The categories that have been fought are put on floors, because they could
  // not have been fought anywhere else — and that is what makes the Plan tab's
  // "a completed category keeps its floor" rule visible. Everything else is
  // left in the unassigned pool, which is the work the Plan tab is for.
  console.log("Creating floors…");
  const matNames = ["Tatami A", "Tatami B", "The Blue Hall"];
  const mats = [];
  for (const [i, name] of matNames.entries()) {
    mats.push(
      await prisma.mat.create({ data: { eventId: event.id, name, order: i } }),
    );
  }

  const played = [...completed, ...inProgress];
  for (const [i, d] of played.entries()) {
    const mat = mats[i % mats.length];
    await prisma.draw.update({
      where: { id: d.drawId },
      data: { matId: mat.id, matOrder: Math.floor(i / mats.length) },
    });
  }
  console.log(`  ${mats.length} floors · ${played.length} fought categories placed on them`);

  // Check in everyone who is on a floor — they turned up, they competed.
  const placedDrawIds = played.map((d) => d.drawId);
  const checkedIn = await prisma.entry.updateMany({
    where: { eventId: event.id, drawSlots: { some: { drawId: { in: placedDrawIds } } } },
    data: { checkedIn: true },
  });

  // ---- Summary -----------------------------------------------------------
  const [entryTotal, categoryTotal] = await Promise.all([
    prisma.entry.count({ where: { eventId: event.id } }),
    Promise.resolve(grouped.length),
  ]);

  console.log(`
Done.

  Event      ${EVENT_NAME}
  Date       ${EVENT_DATE.toISOString().slice(0, 10)}  (every age is computed against this)
  Id         ${event.id}

  ${clubs.length} clubs · ${athletes.length} athletes · ${entryTotal} entries (${teamCount} of them teams)
  ${categoryTotal} categories · ${createdDraws.length} with a draw · ${checkedIn.count} entries checked in
  ${mats.length} floors, with the ${played.length} already-fought categories on them

Open the event hub, pick "${EVENT_NAME}", and go to Plan. Most categories are
sitting in the unassigned pool waiting to be dragged onto a floor; the completed
ones are pinned to the floor they were fought on and cannot be moved.

Remove it again with:  npx tsx scripts/seed-test-tournament.ts --clean
`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
