/**
 * Seed a throwaway database with ONE finished tournament, so the competition
 * read path can be exercised end to end against a real HTTP server with real
 * medals — something production cannot provide, because no event there has
 * been run yet.
 *
 * NEVER point this at production. It refuses to run against a database whose
 * name is not obviously a scratch one.
 *
 *   DATABASE_URL=postgresql://…/gjk_scratch tsx scripts/seed-scratch-tournament.ts <agentKeyPlaintext>
 */
import crypto from "crypto";
import { prisma } from "../src/lib/prisma.js";

const url = process.env.DATABASE_URL ?? "";
if (!/scratch|test|tmp/i.test(url)) {
  console.error("Refusing to run: DATABASE_URL does not look like a scratch database.");
  process.exit(1);
}

const agentKey = process.argv[2];
if (!agentKey) {
  console.error("usage: tsx scripts/seed-scratch-tournament.ts <agentKeyPlaintext>");
  process.exit(1);
}
const prefix = agentKey.split("_")[1]!;
const hashedKey = crypto.createHash("sha256").update(agentKey, "utf8").digest("hex");

const clubA = await prisma.club.create({
  data: { id: "club-whk", name: "Goju Kai Windhoek", contactName: "Ryan", email: "whk@invalid" },
});
const clubB = await prisma.club.create({
  data: { id: "club-swk", name: "Goju Kai Swakopmund", contactName: "Coast", email: "swk@invalid" },
});

await prisma.apiKey.create({
  data: {
    name: "scratch-agent",
    prefix,
    hashedKey,
    clubId: clubA.id,
    scopes: ["members:read", "billing:read", "billing:write", "payments:write", "competition:read"],
  },
});

const belt = await prisma.belt.create({
  data: { name: "White", colour: "#ffffff", order: 1 },
});

const event = await prisma.event.create({
  data: {
    name: "Coastal Open 2026",
    venue: "Swakopmund Dojo",
    city: "Swakopmund",
    country: "Namibia",
    startDate: new Date("2026-07-04T00:00:00Z"),
    regOpen: new Date("2026-06-01T00:00:00Z"),
    regClose: new Date("2026-06-28T00:00:00Z"),
    status: "CLOSED",
    configJson: "{}",
  },
});

const division = await prisma.division.create({
  data: {
    eventId: event.id,
    key: "GIRLS_KUMITE_10_11",
    name: "Girls Kumite (age 10-11)",
    minAge: 10,
    maxAge: 11,
    gender: "Female",
    category: "KUMITE",
  },
});

// Four girls, two clubs, so the tally has something to say.
const people = [
  { first: "Sofia-Marie", last: "Van Heerden", club: clubA.id },
  { first: "Amara", last: "Nghidinwa", club: clubB.id },
  { first: "Leah", last: "Bekker", club: clubA.id },
  { first: "Tuli", last: "Shipanga", club: clubB.id },
];

const entryIds: string[] = [];
for (const p of people) {
  const athlete = await prisma.athlete.create({
    data: {
      clubId: p.club,
      firstName: p.first,
      lastName: p.last,
      dob: new Date("2015-03-01T00:00:00Z"),
      gender: "Female",
      nationality: "Namibian",
      beltId: belt.id,
    },
  });
  const entry = await prisma.entry.create({
    data: {
      eventId: event.id,
      clubId: p.club,
      athleteId: athlete.id,
      entryType: "KUMITE",
      divisionId: division.id,
      status: "APPROVED",
      checkedIn: true,
    },
  });
  entryIds.push(entry.id);
}

const [a, b, c, d] = entryIds as [string, string, string, string];

const draw = await prisma.draw.create({
  data: { eventId: event.id, divisionId: division.id, size: 4, status: "COMPLETED" },
});
await prisma.drawSlot.createMany({
  data: [
    { drawId: draw.id, position: 1, entryId: a },
    { drawId: draw.id, position: 2, entryId: b },
    { drawId: draw.id, position: 3, entryId: c },
    { drawId: draw.id, position: 4, entryId: d },
  ],
});

// Sofia-Marie beats Amara 5-2, Leah beats Tuli 3-1, Sofia-Marie beats Leah 4-3.
// Expected podium: gold Sofia-Marie (Windhoek), silver Leah (Windhoek),
// bronze Amara (Swakopmund) and Tuli (Swakopmund) — one beaten opponent per
// finalist, so both take bronze without a repechage bout.
await prisma.bout.createMany({
  data: [
    { drawId: draw.id, phase: "MAIN", round: 1, position: 0, akaEntryId: a, aoEntryId: b, winnerEntryId: a, akaScore: 5, aoScore: 2, outcome: "POINTS" },
    { drawId: draw.id, phase: "MAIN", round: 1, position: 1, akaEntryId: c, aoEntryId: d, winnerEntryId: c, akaScore: 3, aoScore: 1, outcome: "POINTS" },
    { drawId: draw.id, phase: "MAIN", round: 2, position: 0, akaEntryId: a, aoEntryId: c, winnerEntryId: a, akaScore: 4, aoScore: 3, outcome: "POINTS" },
  ],
});

console.log(`Seeded "${event.name}" (${event.id}) — club ${clubA.id}`);
process.exit(0);
