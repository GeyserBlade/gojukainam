/**
 * The kata result path against the local database: a flag decision saved on a
 * bout, the kata each competitor performed recorded alongside it, and every way
 * that detail is supposed to be invalidated again.
 *
 * Talks to the service layer directly — no HTTP, like scripts/test-draws.ts.
 * Authorization for the same routes is covered by scripts/test-tatami-operator.ts.
 *
 * Run: npx tsx scripts/test-kata-results.ts     (from backend/)
 */
import { prisma } from "../src/lib/prisma.js";
import { DrawService } from "../src/services/draw.service.js";
import { KataService } from "../src/services/kata.service.js";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const EVENT_NAME = "Kata Result Test Event";
const CLUB_NAME = "Kata Test Dojo";
const USER_PREFIX = "kata-tester-";

async function removeFixtures() {
  const events = await prisma.event.findMany({ where: { name: EVENT_NAME }, select: { id: true } });
  const eventIds = events.map((e) => e.id);
  const clubs = await prisma.club.findMany({ where: { name: CLUB_NAME }, select: { id: true } });
  const clubIds = clubs.map((c) => c.id);

  // KataPerformance cascades from Bout, but delete it explicitly: the point of
  // this suite is that those rows exist, so leaving cleanup implicit would hide
  // a broken cascade behind a passing run.
  await prisma.kataPerformance.deleteMany({ where: { bout: { draw: { eventId: { in: eventIds } } } } });
  await prisma.drawSlot.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.bout.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.draw.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.entry.deleteMany({ where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] } });
  await prisma.mat.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.division.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.athlete.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { startsWith: USER_PREFIX } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: USER_PREFIX } } });
}

/** The kata recorded against one entry, straight from the table. */
const performedKata = async (boutId: string, entryId: string) =>
  prisma.kataPerformance.findUnique({
    where: { boutId_entryId: { boutId, entryId } },
    include: { kata: true },
  });

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost. This script creates and deletes data.");
  }

  console.log("— the seeded kata list —");
  const katas = await KataService.getAll();
  check("the syllabus is seeded", katas.length >= 20, katas.length);
  check("it comes back beginner-first", katas.every((k, i) => i === 0 || katas[i - 1].order <= k.order));
  check("every kata in the choosable list is active", katas.every((k) => k.active));

  const saifa = katas.find((k) => k.name === "Saifa");
  const seiyunchin = katas.find((k) => k.name === "Seiyunchin");
  const tensho = katas.find((k) => k.name === "Tensho");
  if (!saifa || !seiyunchin || !tensho) throw new Error("Expected the seeded Goju-ryu katas to exist");

  console.log("\n— fixtures —");
  await removeFixtures();
  const belt =
    (await prisma.belt.findFirst({ where: { name: "Test White" } })) ??
    (await prisma.belt.create({ data: { name: "Test White", colour: "#fff", order: 999 } }));
  const club = await prisma.club.create({
    data: { name: CLUB_NAME, contactName: "T", email: "katatest@test.local" },
  });
  const user = await prisma.user.create({
    data: { email: `${USER_PREFIX}${Date.now()}@test.local`, role: "SUPERADMIN", name: "Kata Tester" },
  });
  const event = await prisma.event.create({
    data: {
      name: EVENT_NAME,
      venue: "Test Dojo", city: "Windhoek", country: "Namibia",
      startDate: new Date("2026-08-01"), regOpen: new Date("2026-07-01"), regClose: new Date("2026-07-25"),
      status: "CLOSED", configJson: "{}",
    },
  });
  const division = await prisma.division.create({
    data: {
      eventId: event.id, key: "KATA_TEST", name: "Kata Test", minAge: 10, maxAge: 11,
      gender: "Female", category: "KATA",
    },
  });

  // Four entries -> a clean size-4 bracket: two first-round bouts feeding a
  // final, which is what the "invalidate downstream" checks need.
  const entryIds: string[] = [];
  for (const name of ["Ndeshi Amutenya", "Selma Shikongo", "Maria Beukes", "Hilma Kavari"]) {
    const [firstName, ...rest] = name.split(" ");
    const athlete = await prisma.athlete.create({
      data: {
        clubId: club.id, firstName, lastName: rest.join(" "),
        dob: new Date("2015-03-15"), gender: "Female", nationality: "Namibian", beltId: belt.id,
      },
    });
    const entry = await prisma.entry.create({
      data: {
        eventId: event.id, clubId: club.id, athleteId: athlete.id,
        entryType: "KATA", divisionId: division.id, status: "APPROVED",
      },
    });
    entryIds.push(entry.id);
  }

  let draw = await DrawService.create({ eventId: event.id, divisionId: division.id }, user);
  check("a size-4 kata bracket", draw.size === 4, draw.size);
  const firstRound = draw.bouts.filter((b) => b.phase === "MAIN" && b.round === 1);
  check("two first-round bouts", firstRound.length === 2, firstRound.length);

  const bout = firstRound[0];
  const boutId = bout.id!;
  const akaId = bout.aka!.entryId;
  const aoId = bout.ao!.entryId;

  console.log("\n— saving a flag decision —");
  draw = await DrawService.setBoutScore(
    draw.id,
    boutId,
    {
      winnerEntryId: akaId,
      outcome: "FLAGS",
      akaScore: 3,
      aoScore: 2,
      akaKataId: saifa.id,
      aoKataId: seiyunchin.id,
      scoreJson: JSON.stringify({ kind: "kata", panel: ["aka", "aka", "ao", "ao", "aka"] }),
    },
    { id: user.id, role: "SUPERADMIN" },
  );
  let saved = draw.bouts.find((b) => b.id === boutId)!;
  check("the winner is the majority side", saved.winnerEntryId === akaId);
  check("the flags are stored as the score", saved.akaScore === 3 && saved.aoScore === 2, saved);
  check("the outcome says how it was decided", saved.outcome === "FLAGS", saved.outcome);
  check("AKA's kata is on the bracket payload", saved.akaKata?.name === "Saifa", saved.akaKata);
  check("AO's kata is on the bracket payload", saved.aoKata?.name === "Seiyunchin", saved.aoKata);
  check("AKA's kata is a queryable row", (await performedKata(boutId, akaId))?.kata.name === "Saifa");
  check("AO's kata is a queryable row", (await performedKata(boutId, aoId))?.kata.name === "Seiyunchin");

  console.log("\n— the rules this table exists for can be asked —");
  const performedByAka = await prisma.kataPerformance.findMany({
    where: { entryId: akaId, bout: { draw: { eventId: event.id } } },
    include: { kata: true },
  });
  check(
    "'what has this competitor already performed here' is one query",
    performedByAka.length === 1 && performedByAka[0].kata.name === "Saifa",
    performedByAka.map((p) => p.kata.name),
  );

  console.log("\n— correcting a kata without touching the result —");
  draw = await DrawService.setBoutScore(
    draw.id,
    boutId,
    { winnerEntryId: akaId, outcome: "FLAGS", akaScore: 3, aoScore: 2, akaKataId: tensho.id },
    { id: user.id, role: "SUPERADMIN" },
  );
  saved = draw.bouts.find((b) => b.id === boutId)!;
  check("the corrected kata replaces the old one", saved.akaKata?.name === "Tensho", saved.akaKata);
  check("the other side is left alone when its id is omitted", saved.aoKata?.name === "Seiyunchin", saved.aoKata);
  check(
    "correcting does not leave a second row behind",
    (await prisma.kataPerformance.count({ where: { boutId, entryId: akaId } })) === 1,
  );

  console.log("\n— clearing a kata explicitly —");
  draw = await DrawService.setBoutScore(
    draw.id,
    boutId,
    { winnerEntryId: akaId, outcome: "FLAGS", akaScore: 3, aoScore: 2, aoKataId: null },
    { id: user.id, role: "SUPERADMIN" },
  );
  saved = draw.bouts.find((b) => b.id === boutId)!;
  check("null removes it", saved.aoKata === null, saved.aoKata);
  check("and leaves the other in place", saved.akaKata?.name === "Tensho");

  console.log("\n— an unknown kata is refused, not stored —");
  let rejected: any = null;
  try {
    await DrawService.setBoutScore(
      draw.id,
      boutId,
      { winnerEntryId: akaId, outcome: "FLAGS", akaScore: 3, aoScore: 2, akaKataId: "kata_does_not_exist" },
      { id: user.id, role: "SUPERADMIN" },
    );
  } catch (e) {
    rejected = e;
  }
  check("422, with a message the mat can read", rejected?.status === 422, rejected);
  check(
    "the kata already on the bout survives the refusal",
    (await performedKata(boutId, akaId))?.kata.name === "Tensho",
  );

  console.log("\n— a winner-only capture discards the detail —");
  draw = await DrawService.setBoutWinner(draw.id, boutId, aoId, { id: user.id, role: "SUPERADMIN" });
  saved = draw.bouts.find((b) => b.id === boutId)!;
  check("the flags go", saved.akaScore === null && saved.aoScore === null, saved);
  check("the outcome goes", saved.outcome === null);
  check("the katas go with them", saved.akaKata === null && saved.aoKata === null, saved);
  check(
    "no orphaned performance rows are left",
    (await prisma.kataPerformance.count({ where: { boutId } })) === 0,
  );

  console.log("\n— a bracket correction upstream invalidates what it changed —");
  // Score both first-round bouts with katas, then the final, then change one of
  // the first-round results: the final's competitors change, so the final's
  // recorded katas describe a matchup that no longer exists.
  const [b1, b2] = firstRound;
  for (const b of [b1, b2]) {
    await DrawService.setBoutScore(
      draw.id,
      b.id!,
      {
        winnerEntryId: b.aka!.entryId,
        outcome: "FLAGS",
        akaScore: 3,
        aoScore: 2,
        akaKataId: saifa.id,
        aoKataId: seiyunchin.id,
      },
      { id: user.id, role: "SUPERADMIN" },
    );
  }
  draw = await DrawService.get(draw.id);
  const final = draw.bouts.find((b) => b.phase === "MAIN" && b.round === 2)!;
  draw = await DrawService.setBoutScore(
    draw.id,
    final.id!,
    {
      winnerEntryId: final.aka!.entryId,
      outcome: "FLAGS",
      akaScore: 4,
      aoScore: 1,
      akaKataId: tensho.id,
      aoKataId: saifa.id,
    },
    { id: user.id, role: "SUPERADMIN" },
  );
  check(
    "the final has its katas",
    draw.bouts.find((b) => b.id === final.id)?.akaKata?.name === "Tensho",
  );

  // Flip the first semi-final: a different competitor now reaches the final.
  draw = await DrawService.setBoutWinner(draw.id, b1.id!, b1.ao!.entryId, {
    id: user.id,
    role: "SUPERADMIN",
  });
  const finalAfter = draw.bouts.find((b) => b.phase === "MAIN" && b.round === 2)!;
  check(
    "the final's kata is dropped when its competitors change",
    finalAfter.akaKata === null && finalAfter.aoKata === null,
    { aka: finalAfter.akaKata, ao: finalAfter.aoKata },
  );
  check(
    "the semi-final that did not change keeps its katas",
    draw.bouts.find((b) => b.id === b2.id)?.akaKata?.name === "Saifa",
  );

  console.log("\n— a performed kata cannot be deleted out from under a result —");
  let deleteRefused: any = null;
  try {
    await KataService.delete(saifa.id);
  } catch (e) {
    deleteRefused = e;
  }
  check("409, pointing at retiring it instead", deleteRefused?.status === 409, deleteRefused);
  check("the kata is still there", (await KataService.getById(saifa.id)) !== null);

  console.log("\n— retiring takes it out of the mat's list without losing it —");
  await KataService.update(tensho.id, { active: false });
  const choosable = await KataService.getAll();
  const everything = await KataService.getAll(true);
  check("a retired kata is not choosable", !choosable.some((k) => k.id === tensho.id));
  check("but the admin screen still sees it", everything.some((k) => k.id === tensho.id));
  await KataService.update(tensho.id, { active: true });

  console.log("\n— cleaning up —");
  await removeFixtures();
  check("fixtures removed", (await prisma.event.count({ where: { name: EVENT_NAME } })) === 0);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
