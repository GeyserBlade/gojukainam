/**
 * The event entry list (`/reports/event-entries[.xlsx]`), exercised over real
 * HTTP against the local database — same style as scripts/test-entry-sheet.ts,
 * which covers the per-club sheet this one is the whole-event counterpart of.
 *
 * What this covers: the document's *shape* (one card per division of the event,
 * in the board's order, with every club's competitors under it), the rules that
 * differ from the club sheet (empty divisions are still cards, RETURNED entries
 * stay in place and are marked), the per-club summary and the totals including
 * fees priced from the event's own config, and the authorization — which is the
 * point of this export: it crosses club boundaries, so it is admins and the
 * event's coordinator only.
 *
 * What it does NOT cover: the printable page's layout, which is a React page
 * with no logic of its own — it renders this same payload.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev              # in one shell
 *      npx tsx scripts/test-event-entry-list.ts     # in another
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
      name: "__ENTRY_LIST_TEST_EVENT__",
      venue: "Test Hall",
      city: "Windhoek",
      country: "NA",
      // Fixed so the age-at-event-start arithmetic below is deterministic.
      startDate: new Date("2026-06-01T00:00:00Z"),
      regOpen: new Date("2026-01-01T00:00:00Z"),
      regClose: new Date("2026-05-01T00:00:00Z"),
      // Deliberately not the default fees — the list must price entries from
      // the event's own config, not from a constant.
      configJson:
        '{"currency":"NAD","fees":{"kataIndividual":100,"kumiteIndividual":120,"teamKata":250,"teamKumite":250}}',
    },
  });

  const home = await prisma.club.create({
    data: {
      name: "__ENTRY_LIST_TEST_CLUB_A__",
      contactName: "Sensei A",
      email: "list-a@localhost",
    },
  });
  const other = await prisma.club.create({
    data: {
      name: "__ENTRY_LIST_TEST_CLUB_B__",
      contactName: "Sensei B",
      email: "list-b@localhost",
    },
  });

  const div = (data: {
    key: string;
    name: string;
    minAge: number;
    maxAge: number;
    category: "KATA" | "KUMITE";
  }) =>
    prisma.division.create({
      data: { eventId: event.id, gender: "Male", ...data },
    });

  const kataDivision = await div({
    key: "LIST_KATA_U12",
    name: "Under 12 Boys Kata",
    minAge: 10,
    maxAge: 11,
    category: "KATA",
  });
  const kumiteDivision = await div({
    key: "LIST_KUMITE_U12",
    name: "Under 12 Boys Kumite",
    minAge: 10,
    maxAge: 11,
    category: "KUMITE",
  });
  const teamDivision = await div({
    key: "LIST_TEAM",
    name: "Under 18 Team Kata Boys",
    minAge: 10,
    maxAge: 17,
    category: "KATA",
  });
  // Nobody enters this one — an empty category is a fact the organizer needs.
  const emptyDivision = await div({
    key: "LIST_KUMITE_U14",
    name: "Under 14 Boys Kumite",
    minAge: 12,
    maxAge: 13,
    category: "KUMITE",
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

  const athlete = (clubId: string, firstName: string, lastName: string, dob: string, weightKg?: number) =>
    prisma.athlete.create({
      data: {
        clubId,
        firstName,
        lastName,
        dob: new Date(dob),
        gender: "Male",
        nationality: "NA",
        beltId: belt.id,
        weightKg,
      },
    });

  // Created out of alphabetical order on purpose — the list is supposed to sort.
  const zulu = await athlete(home.id, "Zane", "Zulu", "2015-09-01T00:00:00Z", 35); // 10 at the event
  const alpha = await athlete(home.id, "Adam", "Alpha", "2015-01-01T00:00:00Z", 36); // 11
  const reserve = await athlete(home.id, "Ruby", "Reserve", "2014-03-01T00:00:00Z");
  const outsider = await athlete(other.id, "Otto", "Other", "2015-05-05T00:00:00Z");

  const team = await prisma.team.create({
    data: {
      eventId: event.id,
      clubId: home.id,
      name: "List Test Team",
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
  await mk({ clubId: other.id, athleteId: outsider.id, entryType: "KATA", divisionId: kataDivision.id, status: "APPROVED" });

  try {
    console.log("\nthe list is the whole event, division by division:");
    const res = await call(`/reports/event-entries?eventId=${event.id}`, asAdmin);
    check("GET event-entries -> 200", res.status === 200, res);
    const doc = res.body;
    check(
      "event identity and currency carried",
      doc?.event?.name === "__ENTRY_LIST_TEST_EVENT__" && doc?.currency === "NAD",
      { event: doc?.event, currency: doc?.currency },
    );
    check(
      "every division is a card, empty ones included",
      doc?.divisions?.length === 4,
      doc?.divisions?.map((d: any) => d.name),
    );
    check(
      "board order: youngest band first, kata before kumite, wider bands after",
      doc?.divisions?.map((d: any) => d.name).join(" | ") ===
        "Under 12 Boys Kata | Under 12 Boys Kumite | Under 18 Team Kata Boys | Under 14 Boys Kumite",
      doc?.divisions?.map((d: any) => d.name),
    );
    check(
      "the empty division reports zero rather than being dropped",
      doc?.divisions?.[3]?.counts?.total === 0 && doc.divisions[3].competitors.length === 0,
      doc?.divisions?.[3],
    );

    console.log("\nage bands are the Entries board's, derived from the division name:");
    check(
      "kata and kumite of the same ages share one band, labelled without the discipline",
      doc?.divisions?.[0]?.ageBand?.key === "10-11" &&
        doc.divisions[0].ageBand.label === "Under 12" &&
        doc.divisions[1].ageBand.key === "10-11" &&
        doc.divisions[1].ageBand.label === "Under 12",
      doc?.divisions?.slice(0, 2).map((d: any) => d.ageBand),
    );
    check(
      "the team division's band strips 'Team Kata' and the gender too",
      doc?.divisions?.[2]?.ageBand?.label === "Under 18",
      doc?.divisions?.[2]?.ageBand,
    );
    // The federation's own template names categories discipline-first
    // ("KATA BOYS 5-6"), which leaves nothing but the discipline behind. A
    // section headed "KATA" over a band that also holds kumite is wrong, so
    // the ages name the band instead.
    const { ageBandLabel } = await import("../src/services/entry-list.service.js");
    check(
      "a discipline-first name falls back to the ages, not to 'KATA'",
      ageBandLabel("KATA BOYS 5-6", 5, 6) === "Ages 5\u20136" &&
        ageBandLabel("KUMITE GIRLS 8-9", 8, 9) === "Ages 8\u20139",
      [ageBandLabel("KATA BOYS 5-6", 5, 6), ageBandLabel("KUMITE GIRLS 8-9", 8, 9)],
    );
    check(
      "a single-year band says so",
      ageBandLabel("KATA BOYS 7", 7, 7) === "Age 7",
      ageBandLabel("KATA BOYS 7", 7, 7),
    );

    const kata = doc?.divisions?.[0];
    console.log("\na card carries every club's competitors, seeded first then by name:");
    check(
      "all three kata entries, across two clubs",
      kata?.competitors?.map((c: any) => c.name).join(" | ") ===
        "Alpha, Adam | Other, Otto | Zulu, Zane",
      kata?.competitors?.map((c: any) => `${c.name} (${c.clubName})`),
    );
    check(
      "each competitor names their club — this list spans clubs",
      kata?.competitors?.find((c: any) => c.name === "Other, Otto")?.clubName ===
        "__ENTRY_LIST_TEST_CLUB_B__",
      kata?.competitors,
    );
    check(
      "the seeded entry sorts first and keeps its seed",
      kata?.competitors?.[0]?.seed === 1,
      kata?.competitors?.[0],
    );
    check(
      "belt, weight and age ride along for the entry chip",
      kata?.competitors?.[0]?.beltName === belt.name &&
        kata?.competitors?.[0]?.weightKg === 36 &&
        kata?.competitors?.[0]?.age === 11,
      kata?.competitors?.[0],
    );
    check(
      "age is the age on the event's start date — a birthday after it does not round up",
      kata?.competitors?.find((c: any) => c.name === "Zulu, Zane")?.age === 10,
      kata?.competitors,
    );

    const kumite = doc?.divisions?.[1];
    console.log("\nRETURNED stays on the board, marked — this is the organizer's view:");
    check(
      "the returned entry is on its own card, not in a separate section",
      kumite?.competitors?.length === 2 &&
        kumite.competitors.some(
          (c: any) => c.name === "Zulu, Zane" && c.status === "RETURNED",
        ),
      kumite?.competitors,
    );
    check(
      "with the organizer's reason attached",
      kumite?.competitors?.find((c: any) => c.status === "RETURNED")?.statusReason ===
        "Weight not recorded",
      kumite?.competitors,
    );
    check(
      "and counted apart, so the card can say what is actually in the draw",
      kumite?.counts?.total === 2 && kumite.counts.returned === 1 && kumite.counts.submitted === 1,
      kumite?.counts,
    );
    check(
      "the weight class rides along on the kumite entries",
      kumite?.competitors?.every((c: any) => c.weightClassName === "U38kg"),
      kumite?.competitors,
    );

    console.log("\nteams appear as one competitor with their roster:");
    const teamCard = doc?.divisions?.[2];
    check(
      "flagged as a team, members and reserves separated",
      teamCard?.competitors?.length === 1 &&
        teamCard.competitors[0].isTeam === true &&
        teamCard.competitors[0].name === "List Test Team" &&
        teamCard.competitors[0].members.length === 2 &&
        teamCard.competitors[0].reserves[0] === "Reserve, Ruby",
      teamCard?.competitors?.[0],
    );

    console.log("\nfees are priced from the event's own config, not a constant:");
    check(
      "individual kata 100, kumite 120, team kata 250",
      kata?.competitors?.[0]?.fee === 100 &&
        kumite?.competitors?.[0]?.fee === 120 &&
        teamCard?.competitors?.[0]?.fee === 250,
      { kata: kata?.competitors?.[0]?.fee, kumite: kumite?.competitors?.[0]?.fee, team: teamCard?.competitors?.[0]?.fee },
    );
    check(
      "a card's total is the sum of its entries",
      kata?.fee === 300 && kumite?.fee === 240,
      { kata: kata?.fee, kumite: kumite?.fee },
    );
    check("the event total adds up", doc?.totals?.fee === 790, doc?.totals);

    console.log("\nthe per-club summary is what the organizer chases people with:");
    check(
      "both clubs, sorted by name",
      doc?.clubs?.length === 2 &&
        doc.clubs[0].name === "__ENTRY_LIST_TEST_CLUB_A__" &&
        doc.clubs[1].name === "__ENTRY_LIST_TEST_CLUB_B__",
      doc?.clubs?.map((c: any) => c.name),
    );
    const clubA = doc?.clubs?.[0];
    check(
      "club A: 5 entries over 2 athletes, one of them a team entry",
      clubA?.entries === 5 && clubA?.athletes === 2 && clubA?.teamEntries === 1,
      clubA,
    );
    check(
      "its status split includes the returned entry",
      clubA?.counts?.approved === 2 &&
        clubA?.counts?.submitted === 1 &&
        clubA?.counts?.draft === 1 &&
        clubA?.counts?.returned === 1,
      clubA?.counts,
    );
    check(
      "the team kata counts as kata, and the club's fees add up",
      clubA?.kata === 3 && clubA?.kumite === 2 && clubA?.fee === 690,
      clubA,
    );
    check(
      "a team member is not counted as an entered athlete by the team entry alone",
      clubA?.athletes === 2,
      clubA,
    );

    console.log("\ntotals count what the document actually shows:");
    check(
      "2 clubs, 3 athletes, 6 entries",
      doc?.totals?.clubs === 2 && doc?.totals?.athletes === 3 && doc?.totals?.entries === 6,
      doc?.totals,
    );
    check(
      "3 of 4 categories have entries",
      doc?.totals?.divisions === 4 && doc?.totals?.divisionsEntered === 3,
      doc?.totals,
    );
    check(
      "the status split adds up to every entry, returned included",
      doc.totals.counts.approved +
        doc.totals.counts.submitted +
        doc.totals.counts.draft +
        doc.totals.counts.returned ===
        doc.totals.entries,
      doc?.totals?.counts,
    );
    check(
      "kata/kumite split counts the team kata as kata",
      doc?.totals?.kata === 4 && doc?.totals?.kumite === 2 && doc?.totals?.teamEntries === 1,
      doc?.totals,
    );

    console.log("\nauthorization — this export crosses club boundaries by design:");
    const ownClub = clubHeaders("CLUB_MANAGER", home.id);
    check(
      "a club manager with entries in the event -> 403",
      (await call(`/reports/event-entries?eventId=${event.id}`, ownClub)).status === 403,
    );
    check(
      "a coach -> 403",
      (await call(`/reports/event-entries?eventId=${event.id}`, clubHeaders("COACH", home.id)))
        .status === 403,
    );
    check(
      "an athlete -> 403",
      (await call(`/reports/event-entries?eventId=${event.id}`, asAthlete)).status === 403,
    );
    check(
      "a tatami operator -> 403",
      (await call(`/reports/event-entries?eventId=${event.id}`, asOperator)).status === 403,
    );
    check(
      "the workbook is gated the same way",
      (await call(`/reports/event-entries.xlsx?eventId=${event.id}`, ownClub)).status === 403,
    );

    await prisma.eventCoordinator.create({ data: { eventId: event.id, userId: devUser.id } });
    const coord = await call(`/reports/event-entries?eventId=${event.id}`, ownClub);
    check(
      "the event's coordinator -> 200, and sees the other club too",
      coord.status === 200 && coord.body?.clubs?.length === 2,
      coord.status,
    );
    check(
      "coordinator, workbook -> 200",
      (await call(`/reports/event-entries.xlsx?eventId=${event.id}`, ownClub)).status === 200,
    );

    // A grant is per event: a coordinator of *another* event must not read this one.
    const otherEvent = await prisma.event.create({
      data: {
        name: "__ENTRY_LIST_TEST_OTHER_EVENT__",
        venue: "Elsewhere",
        city: "Swakopmund",
        country: "NA",
        startDate: new Date("2026-07-01T00:00:00Z"),
        regOpen: new Date("2026-01-01T00:00:00Z"),
        regClose: new Date("2026-06-01T00:00:00Z"),
        configJson: "{}",
      },
    });
    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id, userId: devUser.id } });
    await prisma.eventCoordinator.create({ data: { eventId: otherEvent.id, userId: devUser.id } });
    check(
      "a coordinator of another event -> 403",
      (await call(`/reports/event-entries?eventId=${event.id}`, ownClub)).status === 403,
    );
    await prisma.eventCoordinator.deleteMany({ where: { userId: devUser.id } });
    await prisma.event.delete({ where: { id: otherEvent.id } });

    console.log("\nbad requests fail as requests, not as 500s:");
    check(
      "unknown event -> 404",
      (await call(`/reports/event-entries?eventId=nope`, asAdmin)).status === 404,
    );
    check(
      "admin with no eventId -> 400",
      (await call(`/reports/event-entries`, asAdmin)).status === 400,
    );
    check(
      "a non-admin with no eventId -> 404, not a hint that the event exists",
      (await call(`/reports/event-entries`, ownClub)).status === 404,
    );

    console.log("\nthe workbook is a real xlsx, named after the event:");
    const xlsxRes = await fetch(`${BASE}/reports/event-entries.xlsx?eventId=${event.id}`, {
      headers: asAdmin,
    });
    check("GET event-entries.xlsx -> 200", xlsxRes.status === 200, xlsxRes.status);
    check(
      "spreadsheet content type",
      (xlsxRes.headers.get("content-type") ?? "").includes("spreadsheetml.sheet"),
      xlsxRes.headers.get("content-type"),
    );
    const disposition = xlsxRes.headers.get("content-disposition") ?? "";
    check(
      "filename carries the event",
      disposition.includes("entry_list_test_event") && disposition.endsWith('entry-list.xlsx"'),
      disposition,
    );
    const bytes = Buffer.from(await xlsxRes.arrayBuffer());
    // "PK": a xlsx is a zip. Cheaper and more honest than re-parsing it here.
    check("body is a zip container, not an error page", bytes.subarray(0, 2).toString() === "PK", bytes.length);

    const { EntryListService } = await import("../src/services/entry-list.service.js");
    const wb = EntryListService.toWorkbook(await EntryListService.build(event.id));
    check(
      "three sheets: the summary, the entries, the categories",
      wb.worksheets.map((w) => w.name).join("|") === "Summary|Entries|Divisions",
      wb.worksheets.map((w) => w.name),
    );
    const rowsOf = (name: string) => {
      const out: string[] = [];
      wb.getWorksheet(name)!.eachRow((row) =>
        out.push((row.values as any[]).slice(1).map((v) => String(v ?? "")).join("|")),
      );
      return out;
    };
    const entryRows = rowsOf("Entries");
    check(
      "one row per entry plus the header",
      entryRows.length === 7,
      entryRows.length,
    );
    check(
      "both clubs' competitors are on it",
      entryRows.some((r) => r.includes("Other, Otto")) &&
        entryRows.some((r) => r.includes("Alpha, Adam")),
      entryRows,
    );
    check(
      "the returned entry carries its reason into the workbook",
      entryRows.some((r) => r.includes("Returned") && r.includes("Weight not recorded")),
      entryRows.filter((r) => r.includes("Returned")),
    );
    const summaryRows = rowsOf("Summary");
    check(
      "the summary carries the per-club table and a total row",
      summaryRows.some((r) => r.startsWith("__ENTRY_LIST_TEST_CLUB_A__")) &&
        summaryRows.some((r) => r.startsWith("TOTAL")),
      summaryRows,
    );
    const divisionRows = rowsOf("Divisions");
    check(
      "the divisions sheet has every category, empty ones included",
      divisionRows.length === 5 && divisionRows.some((r) => r.includes("Under 14 Boys Kumite")),
      divisionRows,
    );
  } finally {
    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id } });
    await prisma.entry.deleteMany({ where: { eventId: event.id } });
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
    await prisma.team.deleteMany({ where: { eventId: event.id } });
    await prisma.weightClass.deleteMany({ where: { eventId: event.id } });
    await prisma.division.deleteMany({
      where: {
        id: {
          in: [kataDivision.id, kumiteDivision.id, teamDivision.id, emptyDivision.id],
        },
      },
    });
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
