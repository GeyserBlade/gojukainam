/**
 * Grade (belt) is optional on an athlete — create, update and import.
 *
 * The three doors are genuinely different code paths: create parses with
 * CreateAthlete, update parses with CreateAthlete.partial() and hands the result
 * to Prisma (where `undefined` means "leave alone" and `null` means "clear"),
 * and import maps spreadsheet cells before parsing and separately checks the
 * belt id resolves. Each is covered here, including the case that motivated the
 * form sending an explicit null.
 *
 * Talks to the service layer directly — no HTTP, like scripts/test-draws.ts.
 *
 * Run: npx tsx scripts/test-athlete-belt.ts     (from backend/)
 */
import { prisma } from "../src/lib/prisma.js";
import { AthleteService } from "../src/services/athlete.service.js";
import { BeltService } from "../src/services/belt.service.js";
import ExcelJS from "exceljs";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const CLUB_NAME = "Belt Optional Test Dojo";
const BELT_NAME = "Belt Optional Test Belt";

async function removeFixtures() {
  const clubs = await prisma.club.findMany({ where: { name: CLUB_NAME }, select: { id: true } });
  const clubIds = clubs.map((c) => c.id);
  await prisma.entry.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.athlete.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  // Belts only after the athletes holding them are gone — the FK is RESTRICT.
  await prisma.belt.deleteMany({ where: { name: BELT_NAME } });
}

const beltIdOf = async (id: string) =>
  (await prisma.athlete.findUnique({ where: { id }, select: { beltId: true } }))?.beltId;

/** A CSV import file with the given headers and rows. */
function csv(headers: string[], rows: string[][]): Buffer {
  return Buffer.from([headers.join(","), ...rows.map((r) => r.join(","))].join("\n"), "utf8");
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost. This script creates and deletes data.");
  }

  console.log("— fixtures —");
  await removeFixtures();
  const belt = await prisma.belt.create({ data: { name: BELT_NAME, colour: "#ffffff", order: 998 } });
  const club = await prisma.club.create({
    data: { name: CLUB_NAME, contactName: "T", email: "beltoptional@test.local" },
  });
  const base = {
    clubId: club.id,
    dob: "2015-04-02",
    gender: "Male",
    nationality: "Namibian",
  };

  console.log("\n— create —");
  const graded = await AthleteService.create({ ...base, firstName: "Graded", lastName: "Athlete", beltId: belt.id });
  check("a belt supplied on create is stored", (await beltIdOf(graded.id)) === belt.id);

  const ungraded = await AthleteService.create({ ...base, firstName: "Ungraded", lastName: "Athlete" });
  check("an athlete can be created with no belt at all", (await beltIdOf(ungraded.id)) === null);

  const nulled = await AthleteService.create({ ...base, firstName: "Null", lastName: "Athlete", beltId: null });
  check("an explicit null belt on create is accepted", (await beltIdOf(nulled.id)) === null);

  const blank = await AthleteService.create({ ...base, firstName: "Blank", lastName: "Athlete", beltId: "" });
  check("an empty-string belt on create is scrubbed to no belt", (await beltIdOf(blank.id)) === null);

  let rejected = false;
  try {
    await AthleteService.create({ ...base, firstName: "Bad", lastName: "Athlete", beltId: "not-a-belt-id" });
  } catch {
    rejected = true;
  }
  check("a belt id that does not exist is still refused", rejected);

  console.log("\n— read —");
  const read = await AthleteService.getById(ungraded.id);
  check("getById returns the ungraded athlete", read?.id === ungraded.id);
  check("…with belt null rather than throwing", read?.belt === null, read?.belt);
  const listed = await AthleteService.getByClubId(club.id);
  check("the ungraded athlete is in the club list", listed.some((a) => a.id === ungraded.id));
  check(
    "…and its belt is null there too",
    listed.find((a) => a.id === ungraded.id)?.belt === null,
  );

  console.log("\n— update —");
  await AthleteService.update(graded.id, { beltId: null });
  check("an explicit null clears an existing belt", (await beltIdOf(graded.id)) === null);

  await AthleteService.update(ungraded.id, { beltId: belt.id });
  check("a belt can be set on an athlete who had none", (await beltIdOf(ungraded.id)) === belt.id);

  await AthleteService.update(ungraded.id, { firstName: "Ungraded2" });
  check("an update that omits beltId leaves the belt alone", (await beltIdOf(ungraded.id)) === belt.id);

  // The reason AthleteForm sends null and not "": scrubEmptyStrings turns ""
  // into undefined, which Prisma reads as "no change". Asserted so the form's
  // sentinel mapping cannot be simplified back into a bug.
  await AthleteService.update(ungraded.id, { beltId: "" });
  check("an empty-string beltId on update does NOT clear the belt", (await beltIdOf(ungraded.id)) === belt.id);

  console.log("\n— import —");
  const headers = ["firstName", "lastName", "dob", "gender", "nationality", "beltId"];
  const row = (first: string, beltCol: string) =>
    [first, "Imported", "2014-06-11", "Male", "Namibian", beltCol];

  const withBelt = await AthleteService.importAthletes(
    club.id,
    csv(headers, [row("HasBelt", belt.id)]),
    "athletes.csv",
  );
  check("a row carrying a belt imports", withBelt.insertedCount === 1 && withBelt.failedCount === 0, withBelt);
  const importedGraded = await prisma.athlete.findFirst({ where: { clubId: club.id, firstName: "HasBelt" } });
  check("…with the belt attached", importedGraded?.beltId === belt.id);

  const blankCell = await AthleteService.importAthletes(
    club.id,
    csv(headers, [row("BlankBelt", "")]),
    "athletes.csv",
  );
  check("a blank beltId cell imports rather than failing", blankCell.insertedCount === 1 && blankCell.failedCount === 0, blankCell);
  const importedBlank = await prisma.athlete.findFirst({ where: { clubId: club.id, firstName: "BlankBelt" } });
  check("…with no grade recorded", importedBlank?.beltId === null);

  const noColumn = await AthleteService.importAthletes(
    club.id,
    csv(headers.slice(0, 5), [row("NoBeltColumn", "").slice(0, 5)]),
    "athletes.csv",
  );
  check("a file with no beltId column at all imports", noColumn.insertedCount === 1 && noColumn.failedCount === 0, noColumn);
  const importedNoCol = await prisma.athlete.findFirst({ where: { clubId: club.id, firstName: "NoBeltColumn" } });
  check("…with no grade recorded", importedNoCol?.beltId === null);

  const unknown = await AthleteService.importAthletes(
    club.id,
    csv(headers, [row("UnknownBelt", "belt-that-does-not-exist")]),
    "athletes.csv",
  );
  check("a beltId that does not resolve still fails the row", unknown.insertedCount === 0 && unknown.failedCount === 1, unknown);
  check("…and says which id", /not found/.test(unknown.failures[0]?.reason ?? ""), unknown.failures[0]);
  check(
    "…and inserts nothing",
    (await prisma.athlete.count({ where: { clubId: club.id, firstName: "UnknownBelt" } })) === 0,
  );

  // An empty xlsx cell is a different value from an empty CSV field (undefined
  // vs ""), so it gets its own pass through the same door.
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Athletes");
  sheet.addRow(headers);
  sheet.addRow(["XlsxBlank", "Imported", "2014-06-11", "Male", "Namibian", ""]);
  const xlsxBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const xlsx = await AthleteService.importAthletes(club.id, xlsxBuffer, "athletes.xlsx");
  check("an empty xlsx belt cell imports", xlsx.insertedCount === 1 && xlsx.failedCount === 0, xlsx);
  const importedXlsx = await prisma.athlete.findFirst({ where: { clubId: club.id, firstName: "XlsxBlank" } });
  check("…with no grade recorded", importedXlsx?.beltId === null);

  console.log("\n— the belt is still protected —");
  let serviceRefused = false;
  try {
    await BeltService.delete(belt.id);
  } catch (err: any) {
    serviceRefused = err?.status === 409;
  }
  check("BeltService refuses to delete a belt an athlete holds", serviceRefused);

  // The relation is optional now, and Prisma's default for that is SetNull —
  // which would silently regrade every athlete holding a deleted belt. The
  // schema pins onDelete: Restrict; this is that promise, at the database.
  let dbRefused = false;
  try {
    await prisma.belt.delete({ where: { id: belt.id } });
  } catch {
    dbRefused = true;
  }
  check("the foreign key refuses it too, rather than nulling the athlete", dbRefused);
  check("…and the athlete kept their grade", (await beltIdOf(ungraded.id)) === belt.id);

  console.log("\n— cleanup —");
  await removeFixtures();
  check("fixtures removed", (await prisma.athlete.count({ where: { clubId: club.id } })) === 0);

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
