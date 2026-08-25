/**
 * A second test tournament, built from an explicit category list rather than a
 * division template — age-graded from 5 years old, with para events, and no
 * team events. Sits alongside `seed-test-tournament.ts`, which builds the
 * NKF_FULL_2026 template instead; neither touches the other's data.
 *
 * Everything lands entered and drawn but unfought, on empty floors, so the Plan
 * tab and its drafter have a clean slate. Draws are generated through
 * `DrawService.create`, so brackets are genuine (correct bye placement, real
 * repechage) rather than hand-built rows.
 *
 * Re-runnable: it deletes any previous run of itself first, matched on the
 * event name and a marker on the clubs it creates.
 *
 * Run: npx tsx scripts/seed-championships-tournament.ts          (from backend/)
 *      npx tsx scripts/seed-championships-tournament.ts --clean  (remove it)
 *
 * It refuses to run against anything but localhost unless `--remote` is passed.
 * That flag exists because this tournament is also wanted on production as a
 * safe thing for organizers to practise on; it touches only its own event and
 * its own tagged clubs, and `--remote --clean` takes it away again.
 */
import { prisma } from "../src/lib/prisma.js";
import { EventService } from "../src/services/event.service.js";
import { DrawService } from "../src/services/draw.service.js";

const EVENT_NAME = "Goju Kai Namibia Championships 2026 (Test)";
const SEED_TAG = "__SEED_CHAMPIONSHIPS__";
/** A Saturday. Every athlete's age is computed against this date. */
const EVENT_DATE = new Date("2026-11-14T00:00:00.000Z");

/** Cadet / Junior / Senior, which the category list names but does not date. */
const CADET = { minAge: 14, maxAge: 15 };
const JUNIOR = { minAge: 16, maxAge: 17 };
const SENIOR = { minAge: 18, maxAge: 99 };

// ---------------------------------------------------------------------------
// The categories
//
// "U38kg" (under 38kg) and "O38kg" (over 38kg) are weight classes of one
// division, not two unrelated divisions: the kilogram boundary is then a real
// stored field rather than a substring of a name, entries carry which class
// they are in, and the plan board reads "KUMITE BOYS 10-11 · U38kg".
// ---------------------------------------------------------------------------

type Discipline = "KATA" | "KUMITE";

interface WeightClassDef {
  name: string;
  minKg: number | null;
  maxKg: number | null;
}

interface Category {
  name: string;
  category: Discipline;
  gender: "Male" | "Female";
  minAge: number;
  maxAge: number;
  /** Absent for a division fought at all weights. */
  weights?: WeightClassDef[];
  /** Para categories take their own athletes; nobody is in both. */
  para?: boolean;
}

/** "under N" / "over N", the split every weighted category here uses. */
const split = (kg: number): WeightClassDef[] => [
  { name: `U${kg}kg`, minKg: null, maxKg: kg },
  { name: `O${kg}kg`, minKg: kg, maxKg: null },
];

const CATEGORIES: Category[] = [
  // ---- Kumite, boys ----
  { name: "KUMITE BOYS 5-6", category: "KUMITE", gender: "Male", minAge: 5, maxAge: 6 },
  { name: "KUMITE BOYS 7", category: "KUMITE", gender: "Male", minAge: 7, maxAge: 7 },
  { name: "KUMITE BOYS 8", category: "KUMITE", gender: "Male", minAge: 8, maxAge: 8 },
  { name: "KUMITE BOYS 9", category: "KUMITE", gender: "Male", minAge: 9, maxAge: 9 },
  { name: "KUMITE BOYS 10-11", category: "KUMITE", gender: "Male", minAge: 10, maxAge: 11, weights: split(38) },
  { name: "KUMITE BOYS 12-13", category: "KUMITE", gender: "Male", minAge: 12, maxAge: 13, weights: split(48) },
  { name: "KUMITE BOYS 12-13 (PARA)", category: "KUMITE", gender: "Male", minAge: 12, maxAge: 13, para: true },

  // ---- Kumite, girls ----
  { name: "KUMITE GIRLS 5-7", category: "KUMITE", gender: "Female", minAge: 5, maxAge: 7 },
  { name: "KUMITE GIRLS 8-9", category: "KUMITE", gender: "Female", minAge: 8, maxAge: 9, weights: split(31) },
  { name: "KUMITE GIRLS 10-11", category: "KUMITE", gender: "Female", minAge: 10, maxAge: 11, weights: split(38) },
  { name: "KUMITE GIRLS 12-13", category: "KUMITE", gender: "Female", minAge: 12, maxAge: 13, weights: split(50) },

  // ---- Kumite, cadet / junior / senior ----
  { name: "KUMITE MALE CADET", category: "KUMITE", gender: "Male", ...CADET, weights: split(55) },
  { name: "KUMITE MALE JUNIOR", category: "KUMITE", gender: "Male", ...JUNIOR, weights: split(63) },
  { name: "KUMITE MALE SENIOR", category: "KUMITE", gender: "Male", ...SENIOR },
  { name: "KUMITE FEMALE CADET", category: "KUMITE", gender: "Female", ...CADET },
  { name: "KUMITE FEMALE JUNIOR", category: "KUMITE", gender: "Female", ...JUNIOR },
  { name: "KUMITE FEMALE SENIOR", category: "KUMITE", gender: "Female", ...SENIOR },

  // ---- Kata, boys ----
  { name: "KATA BOYS 5-6", category: "KATA", gender: "Male", minAge: 5, maxAge: 6 },
  { name: "KATA BOYS 7", category: "KATA", gender: "Male", minAge: 7, maxAge: 7 },
  { name: "KATA BOYS 8", category: "KATA", gender: "Male", minAge: 8, maxAge: 8 },
  { name: "KATA BOYS 9", category: "KATA", gender: "Male", minAge: 9, maxAge: 9 },
  { name: "KATA BOYS 10", category: "KATA", gender: "Male", minAge: 10, maxAge: 10 },
  { name: "KATA BOYS 11", category: "KATA", gender: "Male", minAge: 11, maxAge: 11 },
  { name: "KATA BOYS 12", category: "KATA", gender: "Male", minAge: 12, maxAge: 12 },
  { name: "KATA BOYS 13", category: "KATA", gender: "Male", minAge: 13, maxAge: 13 },
  { name: "KATA BOYS 13 (PARA)", category: "KATA", gender: "Male", minAge: 13, maxAge: 13, para: true },

  // ---- Kata, girls ----
  { name: "KATA GIRLS 5-7", category: "KATA", gender: "Female", minAge: 5, maxAge: 7 },
  { name: "KATA GIRLS 8-9", category: "KATA", gender: "Female", minAge: 8, maxAge: 9 },
  { name: "KATA GIRLS 10-11", category: "KATA", gender: "Female", minAge: 10, maxAge: 11 },
  { name: "KATA GIRLS 12-13", category: "KATA", gender: "Female", minAge: 12, maxAge: 13 },

  // ---- Kata, cadet / junior / senior ----
  { name: "KATA MALE CADET", category: "KATA", gender: "Male", ...CADET },
  { name: "KATA MALE JUNIOR", category: "KATA", gender: "Male", ...JUNIOR },
  { name: "KATA MALE SENIOR", category: "KATA", gender: "Male", ...SENIOR },
  { name: "KATA FEMALE CADET", category: "KATA", gender: "Female", ...CADET },
  { name: "KATA FEMALE JUNIOR", category: "KATA", gender: "Female", ...JUNIOR },
  { name: "KATA FEMALE SENIOR", category: "KATA", gender: "Female", ...SENIOR },
];

/** Divisions x their weight classes — what the tournament actually runs. */
const CATEGORY_COUNT = CATEGORIES.reduce((n, c) => n + Math.max(1, c.weights?.length ?? 0), 0);

/**
 * Who turns up. Ages are spread evenly through each band so the single-year
 * categories (KATA BOYS 10, 11, 12, 13) all get entries — a random draw leaves
 * some of them empty, which is a worse fixture, not a more realistic one.
 */
const POPULATION: {
  gender: "Male" | "Female";
  ageFrom: number;
  ageTo: number;
  count: number;
  para?: boolean;
}[] = [
  { gender: "Male", ageFrom: 5, ageTo: 6, count: 9 },
  { gender: "Male", ageFrom: 7, ageTo: 7, count: 6 },
  { gender: "Male", ageFrom: 8, ageTo: 8, count: 7 },
  { gender: "Male", ageFrom: 9, ageTo: 9, count: 7 },
  { gender: "Male", ageFrom: 10, ageTo: 10, count: 6 },
  { gender: "Male", ageFrom: 11, ageTo: 11, count: 6 },
  { gender: "Male", ageFrom: 12, ageTo: 12, count: 6 },
  { gender: "Male", ageFrom: 13, ageTo: 13, count: 6 },
  { gender: "Male", ageFrom: 14, ageTo: 15, count: 11 },
  { gender: "Male", ageFrom: 16, ageTo: 17, count: 8 },
  { gender: "Male", ageFrom: 18, ageTo: 34, count: 12 },
  // Para athletes compete only in the para categories. Split 12/13 so the
  // kata para category (13 only) still fields a bracket.
  { gender: "Male", ageFrom: 12, ageTo: 13, count: 6, para: true },
  { gender: "Female", ageFrom: 5, ageTo: 7, count: 9 },
  { gender: "Female", ageFrom: 8, ageTo: 9, count: 9 },
  { gender: "Female", ageFrom: 10, ageTo: 11, count: 9 },
  { gender: "Female", ageFrom: 12, ageTo: 13, count: 9 },
  { gender: "Female", ageFrom: 14, ageTo: 15, count: 8 },
  { gender: "Female", ageFrom: 16, ageTo: 17, count: 7 },
  { gender: "Female", ageFrom: 18, ageTo: 34, count: 9 },
];

/** Most competitors do both; a minority enter one discipline only. */
const KATA_ONLY_RATE = 0.09;
const KUMITE_ONLY_RATE = 0.09;

// ---------------------------------------------------------------------------
// Deterministic randomness — a fixed seed means re-running gives identical
// brackets, so a bug you saw once is still there when you look again.
// ---------------------------------------------------------------------------

let rngState = 0x5f3a91c;
const rand = () => {
  rngState ^= rngState << 13;
  rngState ^= rngState >>> 17;
  rngState ^= rngState << 5;
  return ((rngState >>> 0) % 100000) / 100000;
};
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

const CLUBS = [
  { name: "Windhoek Goju Kai", region: "Khomas", contactName: "Sensei Amutenya" },
  { name: "Swakopmund Karate Academy", region: "Erongo", contactName: "Sensei Beukes" },
  { name: "Walvis Bay Dojo", region: "Erongo", contactName: "Sensei Haufiku" },
  { name: "Oshakati Martial Arts", region: "Oshana", contactName: "Sensei Nghidinwa" },
  { name: "Otjiwarongo Goju Kai", region: "Otjozondjupa", contactName: "Sensei Kavari" },
  { name: "Rundu Karate Club", region: "Kavango East", contactName: "Sensei Shipanga" },
  { name: "Gobabis Dojo", region: "Omaheke", contactName: "Sensei Tjiveze" },
];

const FIRST_M = [
  "Tangeni", "Johannes", "Petrus", "Simon", "Elias", "Gerhard", "Mervin", "Ruan",
  "Shaun", "Lukas", "Immanuel", "Festus", "Dawid", "Junias", "Riaan", "Tobias",
  "Aldrin", "Kaleb", "Nangolo", "Werner", "Kondjeni", "Pieter", "Ismael", "Andreas",
  "Helao", "Vetumbuavi", "Jandre", "Matheus",
];
const FIRST_F = [
  "Ndeshi", "Selma", "Maria", "Anneline", "Hilma", "Chantelle", "Rauna", "Loide",
  "Jolanda", "Frieda", "Talita", "Ester", "Magdalena", "Kaino", "Rosalia", "Nangula",
  "Zenobia", "Aina", "Charmaine", "Tuyeni", "Elizabeth", "Naemi", "Wilka", "Panduleni",
];
const LAST = [
  "Amutenya", "Shikongo", "Nghidinwa", "Beukes", "Haufiku", "Kavari", "Shipanga",
  "Cloete", "Sikopo", "van Wyk", "Nakale", "Iipinge", "Hamutenya", "Uushona",
  "Gaseb", "Mbako", "Tjiveze", "Naobeb", "Shilongo", "Kandjeke", "Basson", "Awases",
  "Nekwaya", "Katjivena", "Swartbooi", "Mungunda", "Angula", "Erastus",
];

/** Rough weight-for-age, so an athlete's kg is not nonsense on their record. */
const typicalWeight = (age: number) =>
  age <= 6 ? 21 : age <= 9 ? 26 + (age - 7) * 4 : age <= 13 ? 38 + (age - 10) * 5 : age <= 15 ? 57 : age <= 17 ? 66 : 74;

const divisionKey = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/_+$/, "");

// ---------------------------------------------------------------------------

async function clean() {
  const events = await prisma.event.findMany({ where: { name: EVENT_NAME }, select: { id: true } });
  const eventIds = events.map((e) => e.id);
  const clubs = await prisma.club.findMany({ where: { notes: SEED_TAG }, select: { id: true } });
  const clubIds = clubs.map((c) => c.id);
  if (eventIds.length === 0 && clubIds.length === 0) return false;

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
  // ApiKey.clubId is Restrict on purpose (a nullable one would silently promote
  // a club-scoped key to federation-wide), so a key minted against a seeded
  // club blocks the whole clean with a P2003 that names a constraint and not a
  // cause. Seeded clubs are throwaway; so is any key pointed at one.
  await prisma.apiKey.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  return true;
}

/**
 * Where this run is pointed, as a host/database pair — enough to recognise a
 * database, never enough to leak a credential into a log.
 */
function target(): string {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function main() {
  const local = /@localhost[:/]/.test(process.env.DATABASE_URL ?? "");
  // `--remote` is the whole confirmation: this script creates a tournament and
  // deletes any previous copy of *itself*, so pointing it at a live database is
  // a deliberate act and has to look like one at the call site. The guard stays
  // default-deny — an unflagged run against anything but localhost still
  // refuses, which is what protects a mistyped DATABASE_URL.
  const allowRemote = process.argv.includes("--remote");
  if (!local && !allowRemote) {
    throw new Error(
      `Refusing to run: DATABASE_URL is not localhost (${target()}). ` +
        "This script creates and deletes data. Pass --remote if that is genuinely what you want.",
    );
  }
  if (!local) console.log(`⚠  Running against a remote database: ${target()}\n`);

  const cleanOnly = process.argv.includes("--clean");
  const removed = await clean();
  if (removed) console.log(cleanOnly ? "Removed the test tournament." : "Removed the previous run.");
  else if (cleanOnly) console.log("Nothing to remove.");
  if (cleanOnly) return;

  const belts = await prisma.belt.findMany({ orderBy: { order: "asc" } });
  if (belts.length === 0)
    throw new Error("No belts in the database — run `npm run prisma:seed` first.");
  const author =
    (await prisma.user.findFirst({ where: { role: { in: ["SUPERADMIN", "ADMIN"] } } })) ??
    (await prisma.user.findFirst());
  if (!author) throw new Error("No users in the database — run `npm run create-superuser` first.");

  // ---- Event + categories ------------------------------------------------
  console.log("\nCreating the event…");
  const event = await prisma.event.create({
    data: {
      name: EVENT_NAME,
      venue: "Windhoek Showgrounds — Hall A",
      city: "Windhoek",
      country: "Namibia",
      startDate: EVENT_DATE,
      regOpen: new Date("2026-09-01T00:00:00.000Z"),
      regClose: new Date("2026-10-31T00:00:00.000Z"),
      status: "ACTIVE",
      configJson: JSON.stringify({
        currency: "NAD",
        fees: { kataIndividual: 150, kumiteIndividual: 150, teamKata: 300, teamKumite: 300 },
        limits: { maxIndividualEventsPerAthlete: 2, maxEntriesPerClubPerCategory: 10 },
      }),
    },
  });

  const divisionByName = new Map<string, { id: string }>();
  /** Division name -> its weight classes, in the order they were declared. */
  const weightsByDivision = new Map<string, { id: string; name: string; maxKg: number | null }[]>();
  let weightClassCount = 0;

  for (const cat of CATEGORIES) {
    const division = await prisma.division.create({
      data: {
        eventId: event.id,
        key: divisionKey(cat.name),
        name: cat.name,
        minAge: cat.minAge,
        maxAge: cat.maxAge,
        gender: cat.gender,
        category: cat.category,
        notes: cat.para ? "Para category" : null,
      },
    });
    divisionByName.set(cat.name, division);

    if (cat.weights) {
      const created = [];
      for (const w of cat.weights) {
        const wc = await prisma.weightClass.create({
          data: {
            eventId: event.id,
            divisionId: division.id,
            gender: cat.gender,
            name: w.name,
            minKg: w.minKg,
            maxKg: w.maxKg,
          },
        });
        created.push({ id: wc.id, name: wc.name, maxKg: wc.maxKg });
        weightClassCount++;
      }
      weightsByDivision.set(cat.name, created);
    }
  }
  console.log(
    `  ${CATEGORIES.length} divisions · ${weightClassCount} weight classes · ${CATEGORY_COUNT} categories`,
  );

  await EventService.updateTiming(event.id, {
    mats: 3,
    dayStartTime: "08:00",
    defaultBoutDurationSec: 90,
    kataBoutDurationSec: 75,
    kataMode: "SEQUENTIAL",
    transitionSecondsPerBout: 45,
    defaultBufferPct: 12,
    changeoverMinutes: 5,
    opening: { enabled: true, minutes: 20 },
    closing: { enabled: true, minutes: 20 },
    lunch: { enabled: true, minutes: 45, mode: "ALL_MATS" },
    checkin: { enabled: true, minutes: 30 },
  });

  // ---- Clubs -------------------------------------------------------------
  const clubs = await Promise.all(
    CLUBS.map((c, i) =>
      prisma.club.create({
        data: {
          name: c.name,
          region: c.region,
          contactName: c.contactName,
          email: `champs-dojo${i + 1}@example.test`,
          phone: `+264 81 200 ${String(1000 + i)}`,
          notes: SEED_TAG,
        },
      }),
    ),
  );
  console.log(`  ${clubs.length} clubs`);

  // ---- Athletes and entries ----------------------------------------------
  console.log("Creating athletes and entries…");

  /** Every category of this discipline an athlete of this age/gender could be in. */
  const candidates = (
    discipline: Discipline,
    gender: "Male" | "Female",
    age: number,
    para: boolean,
  ): Category[] =>
    CATEGORIES.filter(
      (c) =>
        c.category === discipline &&
        c.gender === gender &&
        !!c.para === para &&
        age >= c.minAge &&
        age <= c.maxAge,
    );

  const usedNames = new Set<string>();
  let athleteCount = 0;
  let kataEntries = 0;
  let kumiteEntries = 0;
  let bothCount = 0;

  for (const spec of POPULATION) {
    const span = spec.ageTo - spec.ageFrom + 1;
    for (let i = 0; i < spec.count; i++) {
      const club = clubs[i % clubs.length];
      // Even spread through the band, so every single-year category fills.
      const age = spec.ageFrom + (i % span);
      const dob = new Date(
        Date.UTC(EVENT_DATE.getUTCFullYear() - age, randInt(0, 9), randInt(1, 28)),
      );

      let name = "";
      do {
        const first = spec.gender === "Male" ? pick(FIRST_M) : pick(FIRST_F);
        name = `${first} ${pick(LAST)}`;
      } while (usedNames.has(name));
      usedNames.add(name);
      const [firstName, ...rest] = name.split(" ");

      // Which side of the kg split this athlete falls is decided first, then
      // turned into a body weight consistent with it. Doing it the other way
      // round — a weight-for-age, then routing on it — put nearly everyone on
      // one side, because the thresholds sit right at the typical weight for
      // the band: the first run gave 10 entries against 2. Organizers set
      // thresholds near the median, so a roughly even split is the realistic
      // shape as well as the more useful fixture.
      const para = !!spec.para;
      const kumiteCat = candidates("KUMITE", spec.gender, age, para)[0] ?? null;
      const weightOptions = kumiteCat ? (weightsByDivision.get(kumiteCat.name) ?? []) : [];
      // Alternated rather than rolled. A coin flip on a nine-athlete band came
      // up 8-1 and left that category undrawable; alternating guarantees both
      // sides field a bracket, and an even split is what a threshold set near
      // the median produces anyway.
      const weightClass = weightOptions.length > 0 ? weightOptions[i % weightOptions.length] : null;
      // The body weight follows the class, so it would satisfy the kilogram
      // bounds the class now actually stores.
      const weightKg = weightClass
        ? weightClass.maxKg !== null
          ? Math.max(16, weightClass.maxKg - randInt(2, 9))
          : Math.max(16, (weightOptions[0]?.maxKg ?? 40) + randInt(1, 10))
        : Math.max(16, Math.round(typicalWeight(age) + randInt(-5, 6)));

      const athlete = await prisma.athlete.create({
        data: {
          clubId: club.id,
          firstName,
          lastName: rest.join(" "),
          dob,
          gender: spec.gender,
          nationality: "Namibia",
          beltId: pick(belts).id,
          weightKg,
          isActive: true,
        },
      });
      athleteCount++;

      const roll = rand();
      const doesKata = roll >= KUMITE_ONLY_RATE;
      const doesKumite = roll < KUMITE_ONLY_RATE || roll >= KUMITE_ONLY_RATE + KATA_ONLY_RATE;
      if (doesKata && doesKumite) bothCount++;

      for (const discipline of ["KATA", "KUMITE"] as const) {
        if (discipline === "KATA" && !doesKata) continue;
        if (discipline === "KUMITE" && !doesKumite) continue;
        const cat = candidates(discipline, spec.gender, age, para)[0];
        // A para 12-year-old has a kumite category but no kata one — the list
        // only has KATA BOYS 13 (PARA). Nothing to enter, so skip quietly.
        if (!cat) continue;
        await prisma.entry.create({
          data: {
            eventId: event.id,
            clubId: club.id,
            athleteId: athlete.id,
            divisionId: divisionByName.get(cat.name)!.id,
            weightClassId: discipline === "KUMITE" ? (weightClass?.id ?? null) : null,
            entryType: discipline,
            status: "APPROVED",
            feeCents: 15000,
          },
        });
        if (discipline === "KATA") kataEntries++;
        else kumiteEntries++;
      }
    }
  }
  console.log(
    `  ${athleteCount} athletes · ${kataEntries + kumiteEntries} entries (${kataEntries} kata, ${kumiteEntries} kumite) · ${bothCount} entered in both`,
  );

  // ---- Draws -------------------------------------------------------------
  console.log("Generating draws…");
  // A category is a division *and* its weight class, so the grouping has to be
  // both — one draw per weight class, not one per division.
  const grouped = await prisma.entry.groupBy({
    by: ["divisionId", "weightClassId"],
    where: { eventId: event.id, status: "APPROVED" },
    _count: true,
  });

  const nameById = new Map([...divisionByName].map(([name, d]) => [d.id, name]));
  const weightNameById = new Map(
    [...weightsByDivision.values()].flat().map((w) => [w.id, w.name]),
  );
  const label = (divisionId: string, weightClassId: string | null) =>
    `${nameById.get(divisionId)}${weightClassId ? ` · ${weightNameById.get(weightClassId)}` : ""}`;

  let drawn = 0;
  const tooSmall: string[] = [];
  for (const group of grouped) {
    if (group._count < 2) {
      tooSmall.push(`${label(group.divisionId, group.weightClassId)} (${group._count})`);
      continue;
    }
    await DrawService.create(
      {
        eventId: event.id,
        divisionId: group.divisionId,
        weightClassId: group.weightClassId,
      },
      { id: author.id },
    );
    drawn++;
  }
  console.log(`  ${drawn} draws generated of ${CATEGORY_COUNT} categories`);
  if (tooSmall.length) console.log(`  too small to draw: ${tooSmall.join(", ")}`);

  // ---- Floors ------------------------------------------------------------
  const matNames = ["Tatami 1", "Tatami 2", "Tatami 3"];
  for (const [i, name] of matNames.entries()) {
    await prisma.mat.create({ data: { eventId: event.id, name, order: i } });
  }

  console.log(`
Done.

  Event      ${EVENT_NAME}
  Date       ${EVENT_DATE.toISOString().slice(0, 10)}  (every age is computed against this)
  Id         ${event.id}

  ${CATEGORY_COUNT} categories (${CATEGORIES.length} divisions) · ${athleteCount} athletes · ${kataEntries + kumiteEntries} entries · no team events
  ${drawn} categories drawn and ready · ${matNames.length} empty floors

Nothing has been fought and nothing is on a floor yet: open the event hub, pick
"${EVENT_NAME}", go to Plan and hit
"Draft schedule".

Remove it again with:  npx tsx scripts/seed-championships-tournament.ts --clean
`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
