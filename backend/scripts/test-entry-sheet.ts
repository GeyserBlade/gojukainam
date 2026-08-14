/**
 * The club entry-confirmation sheet (`/reports/club-entries[.xlsx]`), exercised
 * over real HTTP against the local database — same style as
 * scripts/test-event-timing.ts.
 *
 * What this covers: the document's *shape* (one block per athlete with every
 * category under them, the same entries again grouped by category, teams with
 * their rosters), the rule that RETURNED entries are kept out of the roster and
 * reported separately, the totals, and the authorization — which is the new
 * surface here, because this is the one export that hands one club's data to
 * whoever asks for it. Also the workbook: that it is a real xlsx with both
 * sheets and the club's name in its filename.
 *
 * What it does NOT cover: the printable sheet's layout, which is a React page
 * with no logic of its own — it renders this same payload.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev        # in one shell
 *      npx tsx scripts/test-entry-sheet.ts    # in another
 */
import { prisma } from "../src/lib/prisma.js";

const BASE = process.env.API_BASE ?? "http://localhost:4000/api";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const asAdmin = { "x-role": "ADMIN" };
const asAthlete = { "x-role": "ATHLETE" };
const asOperator = { "x-role": "TATAMI_OPERATOR" };
const clubHeaders = (role: string, clubId: string) => ({ "x-role": role, "x-club-id": clubId });

async function call(
  path: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost");
  }

  const devUser = await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: { id: "dev-user", email: "dev-user@localhost", name: "Dev User", role: "CLUB_MANAGER" },
  });

  const belt = await prisma.belt.findFirst({ orderBy: { order: "asc" } });
  if (!belt) throw new Error("No belts seeded — run npm run prisma:seed first");

  const event = await prisma.event.create({
    data: {
      name: "__ENTRY_SHEET_TEST_EVENT__",
      venue: "Test Hall",
      city: "Windhoek",
      country: "NA",
      // Fixed so the age-at-event-start arithmetic below is deterministic.
      startDate: new Date("2026-06-01T00:00:00Z"),
      regOpen: new Date("2026-01-01T00:00:00Z"),
      regClose: new Date("2026-05-01T00:00:00Z"),
      configJson: '{"currency":"NAD"}',
    },
  });

  const home = await prisma.club.create({
    data: {
      name: "__ENTRY_SHEET_TEST_CLUB_A__",
      contactName: "Sensei A",
      email: "sheet-a@localhost",
      phone: "+264 81 000 0001",
    },
  });
  const other = await prisma.club.create({
    data: {
      name: "__ENTRY_SHEET_TEST_CLUB_B__",
      contactName: "Sensei B",
      email: "sheet-b@localhost",
    },
  });

  const kataDivision = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "SHEET_KATA_U12",
      name: "Sheet Kata U12",
      minAge: 10,
      maxAge: 11,
      gender: "Male",
      category: "KATA",
    },
  });
  const kumiteDivision = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "SHEET_KUMITE_U12",
      name: "Sheet Kumite U12",
      minAge: 10,
      maxAge: 11,
      gender: "Male",
      category: "KUMITE",
    },
  });
  const teamDivision = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "SHEET_TEAM",
      name: "Sheet Team Kata",
      minAge: 10,
      maxAge: 17,
      gender: "Male",
      category: "KATA",
    },
  });
  const weightClass = await prisma.weightClass.create({
    data: {
      eventId: event.id,
      divisionId: kumiteDivision.id,
      gender: "Male",
      name: "U38kg",
      maxKg: 38,
    },
  });

  // Deliberately created out of alphabetical order — the sheet is supposed to
  // sort, and a fixture that is already sorted proves nothing.
  const zulu = await prisma.athlete.create({
    data: {
      clubId: home.id,
      firstName: "Zane",
      lastName: "Zulu",
      dob: new Date("2015-09-01T00:00:00Z"), // turns 11 *after* the event -> 10
      gender: "Male",
      nationality: "NA",
      beltId: belt.id,
      weightKg: 35,
    },
  });
  const alpha = await prisma.athlete.create({
    data: {
      clubId: home.id,
      firstName: "Adam",
      lastName: "Alpha",
      dob: new Date("2015-01-01T00:00:00Z"), // birthday before the event -> 11
      gender: "Male",
      nationality: "NA",
      beltId: belt.id,
      weightKg: 36,
    },
  });
  const reserve = await prisma.athlete.create({
    data: {
      clubId: home.id,
      firstName: "Ruby",
      lastName: "Reserve",
      dob: new Date("2014-03-01T00:00:00Z"),
      gender: "Male",
      nationality: "NA",
      beltId: belt.id,
    },
  });
  const outsider = await prisma.athlete.create({
    data: {
      clubId: other.id,
      firstName: "Otto",
      lastName: "Other",
      dob: new Date("2015-05-05T00:00:00Z"),
      gender: "Male",
      nationality: "NA",
      beltId: belt.id,
    },
  });

  const team = await prisma.team.create({
    data: {
      eventId: event.id,
      clubId: home.id,
      name: "Sheet Test Team",
      teamType: "TEAM_KATA",
      divisionId: teamDivision.id,
      members: {
        create: [
          { athleteId: alpha.id, isReserve: false },
          { athleteId: zulu.id, isReserve: false },
          { athleteId: reserve.id, isReserve: true },
        ],
      },
    },
  });

  const mk = (data: any) => prisma.entry.create({ data: { eventId: event.id, ...data } });
  await mk({ clubId: home.id, athleteId: alpha.id, entryType: "KATA", divisionId: kataDivision.id, status: "APPROVED", seed: 1 });
  await mk({ clubId: home.id, athleteId: alpha.id, entryType: "KUMITE", divisionId: kumiteDivision.id, weightClassId: weightClass.id, status: "SUBMITTED" });
  await mk({ clubId: home.id, athleteId: zulu.id, entryType: "KATA", divisionId: kataDivision.id, status: "DRAFT" });
  await mk({
    clubId: home.id,
    athleteId: zulu.id,
    entryType: "KUMITE",
    divisionId: kumiteDivision.id,
    weightClassId: weightClass.id,
    status: "RETURNED",
    statusReason: "Weight not recorded",
  });
  await mk({ clubId: home.id, teamId: team.id, entryType: "TEAM_KATA", divisionId: teamDivision.id, status: "APPROVED" });
  // Another club's entry, so "scoped to one club" is tested against real noise.
  await mk({ clubId: other.id, athleteId: outsider.id, entryType: "KATA", divisionId: kataDivision.id, status: "APPROVED" });

  try {
    console.log("\nthe sheet is one club's entries, athlete-first:");
    const sheet = await call(`/reports/club-entries?eventId=${event.id}&clubId=${home.id}`, asAdmin);
    check("GET club-entries -> 200", sheet.status === 200, sheet);
    const doc = sheet.body;
    check(
      "event and club identity carried, contact included",
      doc?.event?.name === "__ENTRY_SHEET_TEST_EVENT__" &&
        doc?.club?.name === "__ENTRY_SHEET_TEST_CLUB_A__" &&
        doc?.club?.contactName === "Sensei A" &&
        doc?.club?.phone === "+264 81 000 0001",
      { event: doc?.event, club: doc?.club },
    );
    check("only this club's athletes", doc?.athletes?.length === 2, doc?.athletes?.map((a: any) => a.name));
    check(
      "athletes sorted by name, not creation order",
      doc?.athletes?.[0]?.name === "Alpha, Adam" && doc?.athletes?.[1]?.name === "Zulu, Zane",
      doc?.athletes?.map((a: any) => a.name),
    );
    check(
      "an athlete's categories are collapsed under them, kata before kumite",
      doc?.athletes?.[0]?.lines?.length === 2 &&
        doc.athletes[0].lines[0].category === "KATA" &&
        doc.athletes[0].lines[1].category === "KUMITE",
      doc?.athletes?.[0]?.lines,
    );
    check(
      "weight class and seed ride along on the line",
      doc?.athletes?.[0]?.lines?.[1]?.weightClassName === "U38kg" &&
        doc?.athletes?.[0]?.lines?.[0]?.seed === 1,
      doc?.athletes?.[0]?.lines,
    );

    console.log("\nage is the age on the event's start date, not today:");
    check(
      "birthday before the event -> 11",
      doc?.athletes?.find((a: any) => a.name === "Alpha, Adam")?.age === 11,
      doc?.athletes,
    );
    check(
      "birthday after the event -> 10, not rounded up",
      doc?.athletes?.find((a: any) => a.name === "Zulu, Zane")?.age === 10,
      doc?.athletes,
    );

    console.log("\nRETURNED is reported, but never as part of the roster:");
    const allLines = doc?.athletes?.flatMap((a: any) => a.lines) ?? [];
    check(
      "no RETURNED line anywhere in the roster",
      allLines.every((l: any) => l.status !== "RETURNED"),
      allLines.map((l: any) => l.status),
    );
    check(
      "no RETURNED competitor in the category view either",
      (doc?.categories ?? []).every((c: any) =>
        c.competitors.every((x: any) => x.status !== "RETURNED"),
      ),
      doc?.categories,
    );
    check(
      "listed separately with its reason",
      doc?.returned?.length === 1 &&
        doc.returned[0].name === "Zulu, Zane" &&
        doc.returned[0].reason === "Weight not recorded" &&
        doc.returned[0].weightClassName === "U38kg",
      doc?.returned,
    );

    console.log("\nteams carry their roster, and are counted apart from individuals:");
    check("one team entry", doc?.teams?.length === 1, doc?.teams);
    check(
      "members and reserves separated",
      doc?.teams?.[0]?.members?.length === 2 &&
        doc.teams[0].reserves.length === 1 &&
        doc.teams[0].reserves[0] === "Reserve, Ruby",
      doc?.teams?.[0],
    );
    check(
      "a team member is not promoted into the athlete roster by the team entry",
      doc?.athletes?.every((a: any) => a.name !== "Reserve, Ruby"),
      doc?.athletes?.map((a: any) => a.name),
    );

    console.log("\nthe category view is the same entries, grouped as the draws are:");
    check(
      "one bucket per (division, weight class), kata U12 first",
      doc?.categories?.length === 3 && doc.categories[0].divisionName === "Sheet Kata U12",
      doc?.categories?.map((c: any) => `${c.divisionName}/${c.weightClassName ?? "-"}`),
    );
    const kataBucket = doc?.categories?.find((c: any) => c.divisionName === "Sheet Kata U12");
    check(
      "both kata competitors in it, sorted, with their real statuses",
      kataBucket?.competitors?.length === 2 &&
        kataBucket.competitors[0].name === "Alpha, Adam" &&
        kataBucket.competitors[0].status === "APPROVED" &&
        kataBucket.competitors[1].status === "DRAFT",
      kataBucket,
    );
    check(
      "the team appears as a competitor, flagged as a team",
      doc?.categories
        ?.find((c: any) => c.divisionName === "Sheet Team Kata")
        ?.competitors?.some((x: any) => x.isTeam === true && x.name === "Sheet Test Team"),
      doc?.categories,
    );

    console.log("\ntotals count what the sheet actually shows:");
    check(
      "3 individual + 1 team, 2 athletes, 1 returned excluded from the rest",
      doc?.totals?.athletes === 2 &&
        doc?.totals?.individualEntries === 3 &&
        doc?.totals?.teamEntries === 1 &&
        doc?.totals?.returned === 1,
      doc?.totals,
    );
    check(
      "status split adds up to the non-returned entries",
      doc.totals.approved + doc.totals.submitted + doc.totals.draft ===
        doc.totals.individualEntries + doc.totals.teamEntries,
      doc?.totals,
    );
    check(
      "kata/kumite split counts the team kata as kata",
      doc?.totals?.kata === 3 && doc?.totals?.kumite === 1,
      doc?.totals,
    );

    console.log("\nauthorization — this export hands over one club's roster:");
    const ownClub = clubHeaders("CLUB_MANAGER", home.id);
    const scoped = await call(`/reports/club-entries?eventId=${event.id}&clubId=${home.id}`, ownClub);
    check("club manager, own club -> 200", scoped.status === 200, scoped.status);

    const defaulted = await call(`/reports/club-entries?eventId=${event.id}`, ownClub);
    check(
      "club manager may omit clubId and gets their own",
      defaulted.status === 200 && defaulted.body?.club?.id === home.id,
      defaulted.body?.club,
    );

    const crossClub = await call(`/reports/club-entries?eventId=${event.id}&clubId=${other.id}`, ownClub);
    check("club manager, another club -> 403", crossClub.status === 403, crossClub);

    const coachCross = await call(
      `/reports/club-entries.xlsx?eventId=${event.id}&clubId=${other.id}`,
      clubHeaders("COACH", home.id),
    );
    check("coach, another club, workbook -> 403", coachCross.status === 403, coachCross.status);

    check(
      "athlete -> 403",
      (await call(`/reports/club-entries?eventId=${event.id}&clubId=${home.id}`, asAthlete)).status === 403,
    );
    check(
      "tatami operator -> 403",
      (await call(`/reports/club-entries?eventId=${event.id}&clubId=${home.id}`, asOperator)).status === 403,
    );

    console.log("\na coordinator exports any club of the event they run:");
    await prisma.eventCoordinator.create({ data: { eventId: event.id, userId: devUser.id } });
    const asCoord = await call(`/reports/club-entries?eventId=${event.id}&clubId=${other.id}`, ownClub);
    check("coordinator, another club -> 200", asCoord.status === 200, asCoord.status);
    const coordList = await call(`/reports/club-entries/clubs?eventId=${event.id}`, ownClub);
    check("coordinator sees every entered club", coordList.body?.length === 2, coordList.body);

    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id, userId: devUser.id } });
    const revoked = await call(`/reports/club-entries?eventId=${event.id}&clubId=${other.id}`, ownClub);
    check("grant revoked -> 403 again", revoked.status === 403, revoked.status);

    console.log("\nthe club list is scoped too — it would otherwise name every entered club:");
    const adminList = await call(`/reports/club-entries/clubs?eventId=${event.id}`, asAdmin);
    check("admin sees both clubs with counts", adminList.body?.length === 2, adminList.body);
    check(
      "count excludes RETURNED, matching what the sheet lists",
      adminList.body?.find((c: any) => c.id === home.id)?.entryCount === 4,
      adminList.body,
    );
    const clubList = await call(`/reports/club-entries/clubs?eventId=${event.id}`, ownClub);
    check(
      "a plain club manager is told about their own club only",
      clubList.body?.length === 1 && clubList.body[0].id === home.id,
      clubList.body,
    );

    console.log("\nbad requests fail as requests, not as 500s:");
    check(
      "missing eventId -> 400",
      (await call(`/reports/club-entries?clubId=${home.id}`, asAdmin)).status === 400,
    );
    check(
      "admin with no clubId and no club of their own -> 400",
      (await call(`/reports/club-entries?eventId=${event.id}`, asAdmin)).status === 400,
    );
    check(
      "unknown club -> 404",
      (await call(`/reports/club-entries?eventId=${event.id}&clubId=nope`, asAdmin)).status === 404,
    );
    check(
      "unknown event -> 404",
      (await call(`/reports/club-entries?eventId=nope&clubId=${home.id}`, asAdmin)).status === 404,
    );

    console.log("\nthe workbook is a real xlsx, named after the club:");
    const xlsxRes = await fetch(
      `${BASE}/reports/club-entries.xlsx?eventId=${event.id}&clubId=${home.id}`,
      { headers: asAdmin },
    );
    check("GET club-entries.xlsx -> 200", xlsxRes.status === 200, xlsxRes.status);
    check(
      "spreadsheet content type",
      (xlsxRes.headers.get("content-type") ?? "").includes("spreadsheetml.sheet"),
      xlsxRes.headers.get("content-type"),
    );
    const disposition = xlsxRes.headers.get("content-disposition") ?? "";
    check(
      "filename carries the club and the event",
      disposition.includes("entry_sheet_test_club_a") && disposition.endsWith('.xlsx"'),
      disposition,
    );
    const bytes = Buffer.from(await xlsxRes.arrayBuffer());
    // "PK": a xlsx is a zip. Cheaper and more honest than re-parsing it here.
    check("body is a zip container, not an error page", bytes.subarray(0, 2).toString() === "PK", bytes.length);
    check("body is not empty", bytes.length > 4000, bytes.length);

    const { EntrySheetService } = await import("../src/services/entry-sheet.service.js");
    const wb = EntrySheetService.toWorkbook(await EntrySheetService.build(event.id, home.id));
    check(
      "two sheets: the roster and the category view",
      wb.worksheets.map((w) => w.name).join("|") === "Entry sheet|By category",
      wb.worksheets.map((w) => w.name),
    );
    const rows: string[] = [];
    wb.getWorksheet("Entry sheet")!.eachRow((row) =>
      rows.push((row.values as any[]).slice(1).map((v) => String(v ?? "")).join("|")),
    );
    const flat = rows.join("\n");
    check("the returned entry is on the workbook too, in its own section", flat.includes("RETURNED — NOT ENTERED"), null);
    check("the reason survives into the workbook", flat.includes("Weight not recorded"), null);
    check("the sign-off block is there to be signed", flat.includes("CONFIRMATION"), null);
    check(
      "the other club's athlete is nowhere in it",
      !flat.includes("Other, Otto"),
      rows.filter((r) => r.includes("Otto")),
    );
  } finally {
    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id } });
    await prisma.entry.deleteMany({ where: { eventId: event.id } });
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
    await prisma.team.deleteMany({ where: { eventId: event.id } });
    await prisma.weightClass.deleteMany({ where: { eventId: event.id } });
    await prisma.division.deleteMany({ where: { eventId: event.id } });
    await prisma.event.deleteMany({ where: { id: event.id } });
    await prisma.athlete.deleteMany({
      where: { id: { in: [alpha.id, zulu.id, reserve.id, outsider.id] } },
    });
    await prisma.club.deleteMany({ where: { id: { in: [home.id, other.id] } } });
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
