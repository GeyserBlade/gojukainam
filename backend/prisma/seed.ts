import { PrismaClient, Gender, EntryType, EntryStatus, TeamStatus, Role } from "@prisma/client";
import { readFileSync } from "fs";
import yaml from "js-yaml";

const prisma = new PrismaClient();

function yearsBetween(a: Date, b: Date) {
  let age = a.getFullYear() - b.getFullYear();
  const m = a.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < b.getDate())) age--;
  return age;
}

async function main() {
  // Event
  const config = yaml.load(readFileSync("config/event-config.yaml", "utf-8")) as any;
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

  // Divisions + WeightClasses from YAML
  for (const d of config.divisions) {
    for (const g of d.genders) {
      const div = await prisma.division.create({
        data: {
          eventId: event.id,
          key: d.key,
          name: d.name,
          minAge: d.minAge,
          maxAge: d.maxAge,
          gender: g,
        },
      });
      if (d.kumite?.allowed && d.kumite?.weightClasses?.[g]) {
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

  // Clubs
  const [windhoek, walvis, swakop, khomasdal, otjiwarongo, kuisebmund] = await Promise.all([
    prisma.club.create({ data: { name: "Windhoek Dojo", contactName: "Ryan Shihan", email: "geyserrb@gmail.com" } }),
    prisma.club.create({ data: { name: "Walvis Bay Dojo", contactName: "Jay Dean Sempai", email: "jaydean@jphydraulics.com" } }),
    prisma.club.create({ data: { name: "Swakop Dojo", contactName: "Sammy Shihan", email: "sammy@iway.na" } }),
    prisma.club.create({ data: { name: "Khomasdal Dojo", contactName: "Shaun Sensei", email: "khomasdal@example.com" } }),
    prisma.club.create({ data: { name: "Otjiwarongo Dojo", contactName: "Burtie Sensei", email: "Otjoiwarongo@example.com" } }),
    prisma.club.create({ data: { name: "Kuisebmund DOjo", contactName: "Diego Sensei",  email: "kuisebmund@example.com" } }),
  ]);

  // Users
  // await prisma.user.create({
  //   data: { name: "Super Admin", email: "geyserrb@gmail.com", role: Role.SUPERADMIN },
  // });
  await prisma.user.createMany({
    data: [
      { name: "Walvis Manager", email: "jaydean@jphydraulics.com", role: Role.CLUB_MANAGER, clubId: walvis.id },
      { name: "Swakop Manager", email: "sammy@iway.na", role: Role.CLUB_MANAGER, clubId: swakop.id },
      { name: "Windhoek Manager", email: "neitocs@outlook.com", role: Role.CLUB_MANAGER, clubId: windhoek.id },
    ],
  });

  // Athletes (a few)
  const a1 = await prisma.athlete.create({
    data: {
      clubId: windhoek.id, firstName: "Daniel", lastName: "Shihepo",
      dob: new Date("2011-05-12"), gender: Gender.Male, nationality: "Namibian",
      weightKg: 40, beltRank: "6th Kyu", emergencyName: "Parent A", emergencyPhone: "0811234567",
    },
  });
  const a2 = await prisma.athlete.create({
    data: {
      clubId: windhoek.id, firstName: "Lara", lastName: "Amutenya",
      dob: new Date("2010-11-03"), gender: Gender.Female, nationality: "Namibian",
      weightKg: 47, beltRank: "4th Kyu", emergencyName: "Parent B", emergencyPhone: "0819876543",
    },
  });
  const a3 = await prisma.athlete.create({
    data: {
      clubId: swakop.id, firstName: "Pieter", lastName: "Van Wyk",
      dob: new Date("2009-02-20"), gender: Gender.Male, nationality: "Namibian",
      weightKg: 55, beltRank: "3rd Kyu", emergencyName: "Parent C", emergencyPhone: "0811112233",
    },
  });

  // Helper: find suggested division for athlete on event date
  const divisions = await prisma.division.findMany({ where: { eventId: event.id } });
  const findDivision = (gender: Gender, dob: Date) => {
    const age = yearsBetween(event.startDate, dob);
    // Prefer gender division, fallback to Open if present
    return divisions.find(d => d.gender === gender && age >= d.minAge && age <= d.maxAge)
        ?? divisions.find(d => d.gender === Gender.Open && age >= d.minAge && age <= d.maxAge);
  };

  // Entries (individual)
  for (const ath of [a1, a2, a3]) {
    const div = findDivision(ath.gender, ath.dob)!;
    // Kata
    await prisma.entry.create({
      data: {
        eventId: event.id, clubId: ath.clubId, athleteId: ath.id,
        entryType: EntryType.KATA, divisionId: div.id, status: EntryStatus.SUBMITTED, feeCents: 15000,
      },
    });
    // Kumite (attach a plausible weight class)
    const wc = await prisma.weightClass.findFirst({ where: { eventId: event.id, divisionId: div.id, gender: ath.gender } });
    await prisma.entry.create({
      data: {
        eventId: event.id, clubId: ath.clubId, athleteId: ath.id,
        entryType: EntryType.KUMITE, divisionId: div.id, weightClassId: wc?.id ?? null,
        status: EntryStatus.DRAFT, feeCents: 15000,
      },
    });
  }

  console.log("✅ Seed complete");
}

main().finally(() => prisma.$disconnect());
