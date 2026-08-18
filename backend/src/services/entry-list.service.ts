import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma.js";
import { ageOn, fileSlug } from "./entry-sheet.service.js";

/**
 * The event entry list: **every** entry in one event, division by division.
 *
 * The club sheet next door (`entry-sheet.service.ts`) is one club's roster,
 * shaped for that club to sign off. This is the organizer's counterpart — the
 * whole tournament on paper, laid out the way the hub's **Entries** screen
 * lays it out on the glass: one card per division, the entered competitors
 * under it, grouped into age bands. Same information, same order, so an
 * organizer reading the printout and an organizer reading the screen are
 * looking at the same thing.
 *
 * Two rules differ from the club sheet on purpose:
 *
 * - **RETURNED entries are shown in place**, marked, exactly as the Entries
 *   board shows them. A club must not confirm a roster that includes withdrawn
 *   people; an organizer must be able to see them, because chasing them is the
 *   job.
 * - **Fees are included.** The board shows a per-division total and the stats
 *   strip shows the event total; leaving them out of a printout the organizer
 *   uses for planning would be dropping a column they already have.
 */

export type ListStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";

/** Status wording, matching the Entries board and the Review screen. */
export const LIST_STATUS_LABEL: Record<ListStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
  RETURNED: "Returned",
};

/**
 * Fee and currency rules, read off the event's config snapshot.
 *
 * Mirrors the frontend's `parseEventConfig` (pages/event-management/
 * eligibility.ts) including its defaults, because the Entries screen prices
 * entries from `configJson` rather than from `Entry.feeCents` — that column is
 * still 0 on every row the entry screens create. The printout has to agree with
 * the screen it is a printout of.
 */
interface FeeRules {
  currency: string;
  fees: {
    kataIndividual: number;
    kumiteIndividual: number;
    teamKata: number;
    teamKumite: number;
  };
}

const DEFAULT_FEES: FeeRules = {
  currency: "NAD",
  fees: { kataIndividual: 150, kumiteIndividual: 150, teamKata: 300, teamKumite: 300 },
};

function parseFeeRules(configJson: string | null): FeeRules {
  if (!configJson) return DEFAULT_FEES;
  try {
    const parsed = JSON.parse(configJson) as Partial<FeeRules>;
    return {
      currency: parsed.currency ?? DEFAULT_FEES.currency,
      fees: { ...DEFAULT_FEES.fees, ...(parsed.fees ?? {}) },
    };
  } catch {
    // A corrupt blob must not make the export fail — the next save rewrites it.
    return DEFAULT_FEES;
  }
}

function feeFor(entryType: string, rules: FeeRules): number {
  switch (entryType) {
    case "KATA":
      return rules.fees.kataIndividual;
    case "KUMITE":
      return rules.fees.kumiteIndividual;
    case "TEAM_KATA":
      return rules.fees.teamKata;
    case "TEAM_KUMITE":
      return rules.fees.teamKumite;
    default:
      return 0;
  }
}

const isTeamType = (t: string) => t === "TEAM_KATA" || t === "TEAM_KUMITE";

export interface ListCounts {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  returned: number;
}

const emptyCounts = (): ListCounts => ({
  total: 0,
  draft: 0,
  submitted: 0,
  approved: 0,
  returned: 0,
});

function countStatus(counts: ListCounts, status: ListStatus) {
  counts.total += 1;
  if (status === "DRAFT") counts.draft += 1;
  else if (status === "SUBMITTED") counts.submitted += 1;
  else if (status === "APPROVED") counts.approved += 1;
  else counts.returned += 1;
}

export interface ListCompetitor {
  entryId: string;
  /** "Lastname, Firstname" for a person; the team's name for a team entry. */
  name: string;
  clubId: string;
  clubName: string;
  status: ListStatus;
  /** The organizer's reason on a RETURNED entry — printed under the name. */
  statusReason: string | null;
  isTeam: boolean;
  /** Team entries only; empty for individuals. */
  members: string[];
  reserves: string[];
  /** Age on the event's start date. Null for a team entry. */
  age: number | null;
  weightKg: number | null;
  beltName: string | null;
  beltColour: string | null;
  weightClassName: string | null;
  seed: number | null;
  fee: number;
}

/** The age band a division sits in — the Entries screen's default grouping. */
export interface ListAgeBand {
  key: string;
  label: string;
  minAge: number;
  maxAge: number;
}

export interface ListDivision {
  id: string;
  key: string;
  name: string;
  category: "KATA" | "KUMITE";
  gender: string;
  minAge: number;
  maxAge: number;
  ageBand: ListAgeBand;
  competitors: ListCompetitor[];
  counts: ListCounts;
  /** Sum of the entry fees on this division's card, in currency units. */
  fee: number;
}

export interface ListClub {
  id: string;
  name: string;
  /** Distinct athletes with at least one individual entry. */
  athletes: number;
  entries: number;
  kata: number;
  kumite: number;
  teamEntries: number;
  counts: ListCounts;
  fee: number;
}

export interface EventEntryList {
  event: {
    id: string;
    name: string;
    venue: string;
    city: string;
    country: string;
    startDate: string;
    regClose: string;
    status: string;
  };
  currency: string;
  generatedAt: string;
  divisions: ListDivision[];
  clubs: ListClub[];
  totals: {
    clubs: number;
    athletes: number;
    entries: number;
    divisions: number;
    /** Divisions that actually have someone in them. */
    divisionsEntered: number;
    kata: number;
    kumite: number;
    teamEntries: number;
    counts: ListCounts;
    fee: number;
  };
}

/**
 * The age-band label for a division name.
 *
 * Follows the frontend's `groupDivisionsByAge` (pages/event-management/
 * eligibility.ts): strip a trailing parenthetical, then the gender and
 * discipline words, leaving "Under 12" out of "Under 12 Boys Kata". Divisions
 * sharing a min/max age share a band, so the printout's section headings read
 * the same as the screen's.
 *
 * With one repair the screen does not make. The federation's own template names
 * categories the other way round — "KATA BOYS 5-6" — and stripping from the
 * gender word leaves "KATA", so a printed section would be headed by a
 * discipline that half the divisions under it are not. When nothing but the
 * discipline survives (or nothing at all), the ages name the band instead,
 * which is what the band actually is.
 */
export function ageBandLabel(name: string, minAge: number, maxAge: number): string {
  const stripped = name
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+(Boys|Girls|Men|Women|Boy|Girl|Male|Female)\b.*/i, "")
    .replace(/\s+(Team\s+)?(Kata|Kumite)\b.*/i, "")
    .trim();
  if (!stripped || /^(team\s+)?(kata|kumite)$/i.test(stripped)) {
    return minAge === maxAge ? `Age ${minAge}` : `Ages ${minAge}\u2013${maxAge}`;
  }
  return stripped;
}

/**
 * Board order: youngest band first, kata before kumite inside a band, then
 * gender, then name. The same comparison the club sheet's category view uses,
 * so every export in the app sorts categories the one way.
 */
function compareDivisions(a: ListDivision, b: ListDivision): number {
  return (
    a.minAge - b.minAge ||
    a.maxAge - b.maxAge ||
    (a.category === b.category ? 0 : a.category === "KATA" ? -1 : 1) ||
    a.gender.localeCompare(b.gender) ||
    a.name.localeCompare(b.name)
  );
}

export class EntryListService {
  static async build(eventId: string): Promise<EventEntryList> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw { status: 404, message: "Event not found" };

    const [divisions, entries] = await Promise.all([
      prisma.division.findMany({ where: { eventId } }),
      prisma.entry.findMany({
        where: { eventId },
        include: {
          athlete: { include: { belt: true } },
          team: { include: { members: { include: { athlete: true } } } },
          division: true,
          weightClass: true,
          club: true,
        },
        orderBy: [{ division: { minAge: "asc" } }, { createdAt: "asc" }],
      }),
    ]);

    const rules = parseFeeRules(event.configJson);

    // Every division of the event gets a card, entered or not — an empty
    // category is a fact the organizer needs (nobody entered U8 Girls Kumite),
    // and the printable page can hide them with one click.
    const byDivision = new Map<string, ListDivision>();
    for (const d of divisions) {
      byDivision.set(d.id, {
        id: d.id,
        key: d.key,
        name: d.name,
        category: d.category,
        gender: d.gender,
        minAge: d.minAge,
        maxAge: d.maxAge,
        ageBand: {
          key: `${d.minAge}-${d.maxAge}`,
          label: ageBandLabel(d.name, d.minAge, d.maxAge),
          minAge: d.minAge,
          maxAge: d.maxAge,
        },
        competitors: [],
        counts: emptyCounts(),
        fee: 0,
      });
    }

    const clubs = new Map<string, ListClub>();
    const clubAthletes = new Map<string, Set<string>>();
    const allAthletes = new Set<string>();
    const totals = {
      clubs: 0,
      athletes: 0,
      entries: 0,
      divisions: divisions.length,
      divisionsEntered: 0,
      kata: 0,
      kumite: 0,
      teamEntries: 0,
      counts: emptyCounts(),
      fee: 0,
    };

    for (const entry of entries) {
      const isTeam = isTeamType(entry.entryType);
      const status = entry.status as ListStatus;
      const fee = feeFor(entry.entryType, rules);
      const members = entry.team?.members ?? [];
      const name = isTeam
        ? entry.team?.name ?? "Unnamed team"
        : entry.athlete
        ? `${entry.athlete.lastName}, ${entry.athlete.firstName}`
        : "Unknown";

      const competitor: ListCompetitor = {
        entryId: entry.id,
        name,
        clubId: entry.clubId,
        clubName: entry.club?.name ?? "Unknown club",
        status,
        statusReason: entry.statusReason ?? null,
        isTeam,
        members: isTeam
          ? members
              .filter((m) => !m.isReserve)
              .map((m) => `${m.athlete.lastName}, ${m.athlete.firstName}`)
          : [],
        reserves: isTeam
          ? members
              .filter((m) => m.isReserve)
              .map((m) => `${m.athlete.lastName}, ${m.athlete.firstName}`)
          : [],
        age: entry.athlete ? ageOn(entry.athlete.dob, event.startDate) : null,
        weightKg: entry.athlete?.weightKg ?? null,
        beltName: entry.athlete?.belt?.name ?? null,
        beltColour: entry.athlete?.belt?.colour ?? null,
        weightClassName: entry.weightClass?.name ?? null,
        seed: entry.seed ?? null,
        fee,
      };

      // An entry whose division was deleted out from under it cannot be placed
      // on a card; dropping it silently would make the totals disagree with the
      // cards, so it gets a card of its own from the entry's own division row.
      let board = byDivision.get(entry.divisionId);
      if (!board) {
        const d = entry.division;
        board = {
          id: d.id,
          key: d.key,
          name: d.name,
          category: d.category,
          gender: d.gender,
          minAge: d.minAge,
          maxAge: d.maxAge,
          ageBand: {
            key: `${d.minAge}-${d.maxAge}`,
            label: ageBandLabel(d.name, d.minAge, d.maxAge),
            minAge: d.minAge,
            maxAge: d.maxAge,
          },
          competitors: [],
          counts: emptyCounts(),
          fee: 0,
        };
        byDivision.set(d.id, board);
        totals.divisions += 1;
      }
      board.competitors.push(competitor);
      countStatus(board.counts, status);
      board.fee += fee;

      let club = clubs.get(entry.clubId);
      if (!club) {
        club = {
          id: entry.clubId,
          name: competitor.clubName,
          athletes: 0,
          entries: 0,
          kata: 0,
          kumite: 0,
          teamEntries: 0,
          counts: emptyCounts(),
          fee: 0,
        };
        clubs.set(entry.clubId, club);
        clubAthletes.set(entry.clubId, new Set());
      }
      club.entries += 1;
      club.fee += fee;
      countStatus(club.counts, status);
      if (isTeam) club.teamEntries += 1;
      if (entry.division.category === "KATA") club.kata += 1;
      else club.kumite += 1;
      if (entry.athleteId) {
        clubAthletes.get(entry.clubId)!.add(entry.athleteId);
        allAthletes.add(entry.athleteId);
      }

      totals.entries += 1;
      totals.fee += fee;
      countStatus(totals.counts, status);
      if (isTeam) totals.teamEntries += 1;
      if (entry.division.category === "KATA") totals.kata += 1;
      else totals.kumite += 1;
    }

    const divisionList = [...byDivision.values()].sort(compareDivisions);
    for (const d of divisionList) {
      // Seeded competitors first, in seed order — that is the order the draw
      // will place them, and a seeded card should read as the bracket does.
      d.competitors.sort(
        (a, b) =>
          (a.seed ?? 99) - (b.seed ?? 99) ||
          a.name.localeCompare(b.name) ||
          a.clubName.localeCompare(b.clubName),
      );
    }
    totals.divisionsEntered = divisionList.filter((d) => d.counts.total > 0).length;

    for (const [clubId, set] of clubAthletes) clubs.get(clubId)!.athletes = set.size;
    const clubList = [...clubs.values()].sort((a, b) => a.name.localeCompare(b.name));
    totals.clubs = clubList.length;
    totals.athletes = allAthletes.size;

    return {
      event: {
        id: event.id,
        name: event.name,
        venue: event.venue,
        city: event.city,
        country: event.country,
        startDate: event.startDate.toISOString(),
        regClose: event.regClose.toISOString(),
        status: event.status,
      },
      currency: rules.currency,
      generatedAt: new Date().toISOString(),
      divisions: divisionList,
      clubs: clubList,
      totals,
    };
  }

  /**
   * The same list as a workbook: "Summary" (the stats strip and the per-club
   * table), "Entries" (one flat, filterable row per entry — the cards
   * unrolled), and "Divisions" (one row per category with its counts, which is
   * what draw and timetable planning actually reads).
   */
  static toWorkbook(list: EventEntryList): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Goju Kai Namibia";
    wb.created = new Date(list.generatedAt);

    const dateOnly = (iso: string) => iso.slice(0, 10);
    const money = (n: number) => `${list.currency} ${n.toLocaleString()}`;

    const headerRow = (ws: ExcelJS.Worksheet, cells: string[]) => {
      const row = ws.addRow(cells);
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
        cell.border = { bottom: { style: "thin" } };
      });
      return row;
    };

    // ── Summary ──────────────────────────────────────────────────────────────
    const sum = wb.addWorksheet("Summary", {
      pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    const title = (text: string, size: number) => {
      const row = sum.addRow([text]);
      row.font = { bold: true, size };
      return row;
    };
    const field = (label: string, value: string) => {
      const row = sum.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      return row;
    };

    title("EVENT ENTRY LIST", 16);
    title(list.event.name, 12);
    sum.addRow([
      [list.event.venue, list.event.city, list.event.country].filter(Boolean).join(", ") +
        ` — ${dateOnly(list.event.startDate)}`,
    ]);
    sum.addRow([]);
    field("Registration closes", dateOnly(list.event.regClose));
    field("Generated", list.generatedAt.replace("T", " ").slice(0, 16) + " UTC");
    sum.addRow([]);
    field("Clubs", String(list.totals.clubs));
    field("Athletes entered", String(list.totals.athletes));
    field("Entries", String(list.totals.entries));
    field(
      "Categories",
      `${list.totals.divisionsEntered} of ${list.totals.divisions} with entries`,
    );
    field(
      "By status",
      `Approved ${list.totals.counts.approved} · Pending ${list.totals.counts.submitted} · ` +
        `Draft ${list.totals.counts.draft} · Returned ${list.totals.counts.returned}`,
    );
    field("Discipline split", `${list.totals.kata} kata · ${list.totals.kumite} kumite`);
    field("Fees", money(list.totals.fee));
    sum.addRow([]);

    title("BY CLUB", 12);
    headerRow(sum, [
      "Club",
      "Athletes",
      "Entries",
      "Kata",
      "Kumite",
      "Teams",
      "Approved",
      "Pending",
      "Draft",
      "Returned",
      `Fees (${list.currency})`,
    ]);
    for (const c of list.clubs) {
      sum.addRow([
        c.name,
        c.athletes,
        c.entries,
        c.kata,
        c.kumite,
        c.teamEntries,
        c.counts.approved,
        c.counts.submitted,
        c.counts.draft,
        c.counts.returned,
        c.fee,
      ]);
    }
    const totalRow = sum.addRow([
      "TOTAL",
      list.totals.athletes,
      list.totals.entries,
      list.totals.kata,
      list.totals.kumite,
      list.totals.teamEntries,
      list.totals.counts.approved,
      list.totals.counts.submitted,
      list.totals.counts.draft,
      list.totals.counts.returned,
      list.totals.fee,
    ]);
    totalRow.font = { bold: true };
    sum.columns.forEach((col, i) => {
      col.width = i === 0 ? 32 : 11;
    });

    // ── Entries: the cards unrolled, one row per entry ───────────────────────
    const ws = wb.addWorksheet("Entries", {
      views: [{ state: "frozen", ySplit: 1 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    headerRow(ws, [
      "#",
      "Age band",
      "Category",
      "Discipline",
      "Gender",
      "Ages",
      "Weight class",
      "Competitor",
      "Club",
      "Age",
      "Weight (kg)",
      "Grade",
      "Status",
      "Seed",
      "Members",
      "Returned reason",
      `Fee (${list.currency})`,
    ]);
    let n = 0;
    for (const d of list.divisions) {
      for (const c of d.competitors) {
        n += 1;
        ws.addRow([
          n,
          d.ageBand.label,
          d.name,
          d.category === "KATA" ? "Kata" : "Kumite",
          d.gender,
          `${d.minAge}-${d.maxAge}`,
          c.weightClassName ?? "",
          c.name,
          c.clubName,
          c.age ?? "",
          c.weightKg ?? "",
          c.beltName ?? "",
          LIST_STATUS_LABEL[c.status],
          c.seed ?? "",
          c.members.join("; ") + (c.reserves.length ? ` (reserve: ${c.reserves.join("; ")})` : ""),
          c.statusReason ?? "",
          c.fee,
        ]);
      }
    }
    if (n === 0) ws.addRow(["", "", "", "", "", "", "", "No entries yet."]);
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 17 } };
    ws.columns.forEach((col, i) => {
      col.width = i === 0 ? 5 : i === 2 || i === 7 || i === 8 ? 28 : i === 14 ? 34 : 13;
    });

    // ── Divisions: one row per card ──────────────────────────────────────────
    const divs = wb.addWorksheet("Divisions", {
      views: [{ state: "frozen", ySplit: 1 }],
      pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    headerRow(divs, [
      "Age band",
      "Category",
      "Discipline",
      "Gender",
      "Ages",
      "Entered",
      "Approved",
      "Pending",
      "Draft",
      "Returned",
      `Fees (${list.currency})`,
    ]);
    for (const d of list.divisions) {
      divs.addRow([
        d.ageBand.label,
        d.name,
        d.category === "KATA" ? "Kata" : "Kumite",
        d.gender,
        `${d.minAge}-${d.maxAge}`,
        d.counts.total,
        d.counts.approved,
        d.counts.submitted,
        d.counts.draft,
        d.counts.returned,
        d.fee,
      ]);
    }
    divs.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 11 } };
    divs.columns.forEach((col, i) => {
      col.width = i === 1 ? 32 : i === 0 ? 18 : 11;
    });

    return wb;
  }

  /** Filename stem: `<event>-entry-list`. */
  static fileStem(list: EventEntryList): string {
    return `${fileSlug(list.event.name)}-entry-list`;
  }
}
