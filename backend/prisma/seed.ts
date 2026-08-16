import { PrismaClient, Gender, EntryType, EntryStatus, CategoryType, Role } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import yaml from "js-yaml";

const prisma = new PrismaClient();

// Resolve the event config relative to this file, not the working directory —
// `npm run prisma:seed` runs with cwd=backend/ while the config lives at the
// repo root, so a bare relative path only works when invoked from the root.
const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "../../config/event-config.yaml");

function yearsBetween(a: Date, b: Date) {
  let age = a.getFullYear() - b.getFullYear();
  const m = a.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < b.getDate())) age--;
  return age;
}

// Goju Kai progression, ordered white → black. Athlete.beltId is optional, but
// the seeded athletes below all carry a grade, so these must exist first.
const BELTS = [
  { name: "10th Kyu — White", colour: "#f8fafc", order: 10 },
  { name: "9th Kyu — Yellow", colour: "#f5c518", order: 20 },
  { name: "8th Kyu — Orange", colour: "#f97316", order: 30 },
  { name: "7th Kyu — Green", colour: "#16a34a", order: 40 },
  { name: "6th Kyu — Blue", colour: "#1d4ed8", order: 50 },
  { name: "5th Kyu — Purple", colour: "#7c3aed", order: 60 },
  { name: "4th Kyu — Brown", colour: "#78350f", order: 70 },
  { name: "1st Dan — Black", colour: "#0a0a0a", order: 80 },
];

async function main() {
  // Guard: this seed creates rather than upserts, so re-running it against a
  // populated database would duplicate everything.
  const existingEvents = await prisma.event.count();
  if (existingEvents > 0) {
    console.log(
      `⏭  Database already has ${existingEvents} event(s) — skipping seed.\n` +
        `   To reseed from scratch: npx prisma migrate reset (LOCAL DATABASES ONLY).`,
    );
    return;
  }

  const config = yaml.load(readFileSync(CONFIG_PATH, "utf-8")) as any;

  // Belts
  const belts = await Promise.all(
    BELTS.map((b) => prisma.belt.create({ data: b })),
  );
  const beltByName = (needle: string) =>
    belts.find((b) => b.name?.toLowerCase().includes(needle.toLowerCase())) ?? belts[0];

  // Event
  const event = await prisma.event.create({
    data: {
      name: "Namibia Goju Kai Nationals 2025",
      venue: "Jan Wilkens Sports Centre",
      city: "Walvis Bay",
      country: "Namibia",
      startDate: new Date("2025-09-20"),
      regOpen: new Date("2025-09-05"),
      regClose: new Date("2025-09-12"),
      configJson: JSON.stringify(config),
    },
  });

  // Divisions + WeightClasses from YAML.
  // Division carries a category since the structure was simplified, so each
  // YAML band fans out to (gender × allowed category) rows.
  for (const d of config.divisions) {
    for (const g of d.genders as Gender[]) {
      const categories: CategoryType[] = []
      if (d.kata?.allowed) categories.push(CategoryType.KATA);
      if (d.kumite?.allowed) categories.push(CategoryType.KUMITE);

      for (const category of categories) {
        const div = await prisma.division.create({
          data: {
            eventId: event.id,
            key: `${d.key}_${g.toUpperCase()}_${category}`,
            name: `${d.name} ${g} ${category === CategoryType.KATA ? "Kata" : "Kumite"}`,
            minAge: d.minAge,
            maxAge: d.maxAge,
            gender: g,
            category,
          },
        });

        // Weight classes only apply to kumite, and only when the config
        // actually declares them (the current config does not).
        if (category === CategoryType.KUMITE && d.kumite?.weightClasses?.[g]) {
          for (const wc of d.kumite.weightClasses[g]) {
            await prisma.weightClass.create({
              data: {
                eventId: event.id,
                divisionId: div.id,
                gender: g,
                name: wc.name,
                minKg: wc.minKg ?? null,
                maxKg: wc.maxKg ?? null,
              },
            });
          }
        }
      }
    }
  }

  // Clubs
  const [windhoek, walvis, swakop] = await Promise.all([
    prisma.club.create({ data: { name: "Windhoek Dojo", contactName: "Ryan Shihan", email: "geyserrb@gmail.com" } }),
    prisma.club.create({ data: { name: "Walvis Bay Dojo", contactName: "Jay Dean Sempai", email: "jaydean@jphydraulics.com" } }),
    prisma.club.create({ data: { name: "Swakop Dojo", contactName: "Sammy Shihan", email: "sammy@iway.na" } }),
  ]);
  const [khomasdal, otjiwarongo, kuisebmund] = await Promise.all([
    prisma.club.create({ data: { name: "Khomasdal Dojo", contactName: "Shaun Sensei", email: "khomasdal@example.com" } }),
    prisma.club.create({ data: { name: "Otjiwarongo Dojo", contactName: "Burtie Sensei", email: "otjiwarongo@example.com" } }),
    prisma.club.create({ data: { name: "Kuisebmund Dojo", contactName: "Diego Sensei", email: "kuisebmund@example.com" } }),
  ]);

  // Users. The SUPERADMIN is deliberately not seeded — it needs a password
  // hash, so create it with `npm run create-superuser <email> <password>`.
  await prisma.user.createMany({
    data: [
      { name: "Walvis Manager", email: "jaydean@jphydraulics.com", role: Role.CLUB_MANAGER, clubId: walvis.id },
      { name: "Swakop Manager", email: "sammy@iway.na", role: Role.CLUB_MANAGER, clubId: swakop.id },
      { name: "Windhoek Manager", email: "neitocs@outlook.com", role: Role.CLUB_MANAGER, clubId: windhoek.id },
    ],
  });

  // Athletes — spread across clubs and age bands so the entry screens have
  // something realistic to filter, group and drag.
  const athleteSpecs = [
    { clubId: windhoek.id, firstName: "Daniel", lastName: "Shihepo", dob: "2011-05-12", gender: Gender.Male, weightKg: 40, belt: "Blue" },
    { clubId: windhoek.id, firstName: "Lara", lastName: "Amutenya", dob: "2010-11-03", gender: Gender.Female, weightKg: 47, belt: "Brown" },
    { clubId: windhoek.id, firstName: "Tobias", lastName: "Nakale", dob: "2016-03-08", gender: Gender.Male, weightKg: 26, belt: "Yellow" },
    { clubId: swakop.id, firstName: "Pieter", lastName: "Van Wyk", dob: "2009-02-20", gender: Gender.Male, weightKg: 55, belt: "Brown" },
    { clubId: swakop.id, firstName: "Anna", lastName: "Hausiku", dob: "2014-07-19", gender: Gender.Female, weightKg: 33, belt: "Orange" },
    { clubId: walvis.id, firstName: "Johannes", lastName: "Kambala", dob: "2006-01-30", gender: Gender.Male, weightKg: 68, belt: "Black" },
    { clubId: walvis.id, firstName: "Maria", lastName: "Iipinge", dob: "2012-09-14", gender: Gender.Female, weightKg: 38, belt: "Green" },
    { clubId: khomasdal.id, firstName: "Elias", lastName: "Gowaseb", dob: "2018-04-02", gender: Gender.Male, weightKg: 21, belt: "White" },
    { clubId: otjiwarongo.id, firstName: "Selma", lastName: "Nghidinwa", dob: "2004-12-11", gender: Gender.Female, weightKg: 58, belt: "Black" },
    { clubId: kuisebmund.id, firstName: "Petrus", lastName: "Haufiku", dob: "1980-06-25", gender: Gender.Male, weightKg: 82, belt: "Black" },
  ];

  const athletes = [];
  for (const spec of athleteSpecs) {
    athletes.push(
      await prisma.athlete.create({
        data: {
          clubId: spec.clubId,
          firstName: spec.firstName,
          lastName: spec.lastName,
          dob: new Date(spec.dob),
          gender: spec.gender,
          nationality: "Namibian",
          beltId: beltByName(spec.belt).id,
          weightKg: spec.weightKg,
          guardianName1: "Parent / Guardian",
          guardianPhone1: "0811234567",
        },
      }),
    );
  }

  // Entries — a kata and a kumite entry per athlete where a division exists.
  const divisions = await prisma.division.findMany({ where: { eventId: event.id } });
  const findDivision = (gender: Gender, dob: Date, category: CategoryType) => {
    const age = yearsBetween(event.startDate, dob);
    return divisions.find(
      (d) => d.gender === gender && d.category === category && age >= d.minAge && age <= d.maxAge,
    );
  };

  const fees = config.fees ?? {};
  let entryCount = 0;
  for (const ath of athletes) {
    const kata = findDivision(ath.gender, ath.dob, CategoryType.KATA);
    if (kata) {
      await prisma.entry.create({
        data: {
          eventId: event.id, clubId: ath.clubId, athleteId: ath.id,
          entryType: EntryType.KATA, divisionId: kata.id,
          status: EntryStatus.SUBMITTED,
          feeCents: (fees.kataIndividual ?? 150) * 100,
        },
      });
      entryCount++;
    }

    const kumite = findDivision(ath.gender, ath.dob, CategoryType.KUMITE);
    if (kumite) {
      const wc = await prisma.weightClass.findFirst({
        where: { eventId: event.id, divisionId: kumite.id, gender: ath.gender },
      });
      await prisma.entry.create({
        data: {
          eventId: event.id, clubId: ath.clubId, athleteId: ath.id,
          entryType: EntryType.KUMITE, divisionId: kumite.id, weightClassId: wc?.id ?? null,
          status: EntryStatus.DRAFT,
          feeCents: (fees.kumiteIndividual ?? 150) * 100,
        },
      });
      entryCount++;
    }
  }

  console.log(
    `✅ Seed complete — ${belts.length} belts, 1 event, ${divisions.length} divisions, ` +
      `6 clubs, ${athletes.length} athletes, ${entryCount} entries.\n` +
      `   Create a login with: npm run create-superuser <email> <password>`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
