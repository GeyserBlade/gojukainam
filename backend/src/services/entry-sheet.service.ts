import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma.js";

/**
 * The club entry sheet: one club's entries for one event, laid out for a human
 * to read and sign off.
 *
 * This exists for clubs with no login. The organizer exports a club's entries,
 * emails the sheet, and the club confirms it — so the shape here is a
 * *document*, not the entry list the app already renders: athlete-first (one
 * block per person, every category they are in underneath), with a second
 * category-first view because "who did we put in U12 Girls Kata" is the other
 * half of checking.
 *
 * RETURNED entries are kept out of both views and listed separately at the
 * end with their reason: they are out of the draw-eligible pool, so mixing
 * them into the roster would have the club confirming people who are not
 * actually entered.
 */

export type SheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

/** How a status reads on paper. "Pending" matches the Review screen's wording. */
export const SHEET_STATUS_LABEL: Record<SheetStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
};

export interface SheetLine {
  entryId: string;
  /** Mirrors the `EntryType` enum, BUNKAI included — the sheet reports what
   *  is stored rather than narrowing it and dropping an entry silently. */
  entryType: "KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE" | "BUNKAI";
  status: SheetStatus;
  category: "KATA" | "KUMITE";
  divisionId: string;
  divisionName: string;
  gender: string;
  minAge: number;
  maxAge: number;
  weightClassId: string | null;
  weightClassName: string | null;
  seed: number | null;
}

export interface SheetAthlete {
  athleteId: string;
  name: string;
  gender: string;
  dob: string;
  /** Age on the event's start date — the age the divisions are graded on. */
  age: number;
  weightKg: number | null;
  lines: SheetLine[];
}

export interface SheetTeam extends SheetLine {
  teamName: string;
  members: string[];
  reserves: string[];
}

export interface SheetCategory {
  key: string;
  divisionName: string;
  category: "KATA" | "KUMITE";
  gender: string;
  minAge: number;
  maxAge: number;
  weightClassName: string | null;
  competitors: { name: string; status: SheetStatus; seed: number | null; isTeam: boolean }[];
}

export interface SheetReturned {
  name: string;
  divisionName: string;
  weightClassName: string | null;
  reason: string | null;
}

export interface ClubEntrySheet {
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
  club: {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string | null;
  };
  generatedAt: string;
  athletes: SheetAthlete[];
  teams: SheetTeam[];
  categories: SheetCategory[];
  returned: SheetReturned[];
  totals: {
    athletes: number;
    individualEntries: number;
    teamEntries: number;
    kata: number;
    kumite: number;
    draft: number;
    submitted: number;
    approved: number;
    returned: number;
  };
}

/** Age on a given day — whole years, birthday-aware. */
export function ageOn(dob: Date, on: Date): number {
  let age = on.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < dob.getUTCMonth() ||
    (on.getUTCMonth() === dob.getUTCMonth() && on.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const isTeamType = (t: string) => t === "TEAM_KATA" || t === "TEAM_KUMITE";

/** A club or event name, safe to put in a Content-Disposition filename. */
export function fileSlug(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 40) || "export"
  );
}

/**
 * Category ordering, shared by both views so the sheet reads the same way
 * twice: youngest first, kata before kumite of the same age, then gender, then
 * the weight class within a division.
 */
function compareCategories(a: SheetCategory, b: SheetCategory): number {
  return (
    a.minAge - b.minAge ||
    a.maxAge - b.maxAge ||
    (a.category === b.category ? 0 : a.category === "KATA" ? -1 : 1) ||
    a.gender.localeCompare(b.gender) ||
    a.divisionName.localeCompare(b.divisionName) ||
    (a.weightClassName ?? "").localeCompare(b.weightClassName ?? "")
  );
}

export interface SheetClubOption {
  id: string;
  name: string;
  /** Entries excluding RETURNED — what the sheet will actually list. */
  entryCount: number;
}

export class EntrySheetService {
  /**
   * The clubs worth exporting for this event: those that actually have
   * entries, with the count the sheet will show.
   *
   * Deliberately not the full club list — an organizer picking a club to email
   * wants the ones who entered, and `GET /clubs` is admin-only anyway, so a
   * coordinator (usually a CLUB_MANAGER) could not read it.
   */
  static async clubsForEvent(eventId: string): Promise<SheetClubOption[]> {
    const grouped = await prisma.entry.groupBy({
      by: ["clubId"],
      where: { eventId, status: { not: "RETURNED" } },
      _count: { _all: true },
    });
    if (grouped.length === 0) return [];

    const clubs = await prisma.club.findMany({
      where: { id: { in: grouped.map((g) => g.clubId) } },
      select: { id: true, name: true },
    });
    const names = new Map(clubs.map((c) => [c.id, c.name]));

    return grouped
      .map((g) => ({
        id: g.clubId,
        name: names.get(g.clubId) ?? "Unknown club",
        entryCount: g._count._all,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async build(eventId: string, clubId: string): Promise<ClubEntrySheet> {
    const [event, club] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.club.findUnique({ where: { id: clubId } }),
    ]);
    if (!event) throw { status: 404, message: "Event not found" };
    if (!club) throw { status: 404, message: "Club not found" };

    const entries = await prisma.entry.findMany({
      where: { eventId, clubId },
      include: {
        athlete: true,
        team: { include: { members: { include: { athlete: true } } } },
        division: true,
        weightClass: true,
      },
      orderBy: [{ division: { minAge: "asc" } }, { createdAt: "asc" }],
    });

    const athletes = new Map<string, SheetAthlete>();
    const teams: SheetTeam[] = [];
    const categories = new Map<string, SheetCategory>();
    const returned: SheetReturned[] = [];
    const totals = {
      athletes: 0,
      individualEntries: 0,
      teamEntries: 0,
      kata: 0,
      kumite: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      returned: 0,
    };

    for (const entry of entries) {
      const isTeam = isTeamType(entry.entryType);
      const name = isTeam
        ? entry.team?.name ?? "Unnamed team"
        : entry.athlete
        ? `${entry.athlete.lastName}, ${entry.athlete.firstName}`
        : "Unknown";

      if (entry.status === "RETURNED") {
        totals.returned += 1;
        returned.push({
          name,
          divisionName: entry.division.name,
          weightClassName: entry.weightClass?.name ?? null,
          reason: entry.statusReason ?? null,
        });
        continue;
      }

      const status = entry.status as SheetStatus;
      const line: SheetLine = {
        entryId: entry.id,
        entryType: entry.entryType,
        status,
        category: entry.division.category,
        divisionId: entry.divisionId,
        divisionName: entry.division.name,
        gender: entry.division.gender,
        minAge: entry.division.minAge,
        maxAge: entry.division.maxAge,
        weightClassId: entry.weightClassId ?? null,
        weightClassName: entry.weightClass?.name ?? null,
        seed: entry.seed ?? null,
      };

      if (status === "DRAFT") totals.draft += 1;
      if (status === "SUBMITTED") totals.submitted += 1;
      if (status === "APPROVED") totals.approved += 1;
      if (line.category === "KATA") totals.kata += 1;
      else totals.kumite += 1;

      if (isTeam) {
        totals.teamEntries += 1;
        const members = entry.team?.members ?? [];
        teams.push({
          ...line,
          teamName: name,
          members: members
            .filter((m) => !m.isReserve)
            .map((m) => `${m.athlete.lastName}, ${m.athlete.firstName}`),
          reserves: members
            .filter((m) => m.isReserve)
            .map((m) => `${m.athlete.lastName}, ${m.athlete.firstName}`),
        });
      } else if (entry.athlete) {
        totals.individualEntries += 1;
        const a = entry.athlete;
        let row = athletes.get(a.id);
        if (!row) {
          row = {
            athleteId: a.id,
            name,
            gender: a.gender,
            dob: a.dob.toISOString(),
            age: ageOn(a.dob, event.startDate),
            weightKg: a.weightKg ?? null,
            lines: [],
          };
          athletes.set(a.id, row);
        }
        row.lines.push(line);
      }

      // Category view: one bucket per (division, weight class) — the same
      // grouping a draw is made from, so what the club confirms lines up with
      // the brackets that come out of it.
      const key = `${entry.divisionId}:${entry.weightClassId ?? ""}`;
      let cat = categories.get(key);
      if (!cat) {
        cat = {
          key,
          divisionName: entry.division.name,
          category: entry.division.category,
          gender: entry.division.gender,
          minAge: entry.division.minAge,
          maxAge: entry.division.maxAge,
          weightClassName: entry.weightClass?.name ?? null,
          competitors: [],
        };
        categories.set(key, cat);
      }
      cat.competitors.push({ name, status, seed: entry.seed ?? null, isTeam });
    }

    const athleteList = [...athletes.values()].sort((a, b) => a.name.localeCompare(b.name));
    totals.athletes = athleteList.length;

    // Within an athlete, kata before kumite then by age band — the same order
    // as the category view, so a person's block reads like the day will run.
    for (const a of athleteList) {
      a.lines.sort(
        (x, y) =>
          (x.category === y.category ? 0 : x.category === "KATA" ? -1 : 1) ||
          x.minAge - y.minAge ||
          x.divisionName.localeCompare(y.divisionName),
      );
    }

    const categoryList = [...categories.values()].sort(compareCategories);
    for (const c of categoryList) c.competitors.sort((x, y) => x.name.localeCompare(y.name));

    teams.sort(
      (a, b) =>
        (a.category === b.category ? 0 : a.category === "KATA" ? -1 : 1) ||
        a.minAge - b.minAge ||
        a.teamName.localeCompare(b.teamName),
    );

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
      club: {
        id: club.id,
        name: club.name,
        contactName: club.contactName,
        email: club.email,
        phone: club.phone ?? null,
      },
      generatedAt: new Date().toISOString(),
      athletes: athleteList,
      teams,
      categories: categoryList,
      returned,
      totals,
    };
  }

  /**
   * The same sheet as a workbook: "Entry sheet" (one row per entry, athlete
   * details repeated so the column can be filtered and sorted) and "By
   * category". Flat rows rather than merged blocks — a merged cell is prettier
   * on screen and useless to a club that wants to sort or filter the column.
   */
  static toWorkbook(sheet: ClubEntrySheet): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Goju Kai Namibia";
    wb.created = new Date(sheet.generatedAt);

    const dateOnly = (iso: string) => iso.slice(0, 10);
    const ws = wb.addWorksheet("Entry sheet", {
      views: [{ state: "frozen", ySplit: 0 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const title = (text: string, size: number) => {
      const row = ws.addRow([text]);
      row.font = { bold: true, size };
      return row;
    };
    const field = (label: string, value: string) => {
      const row = ws.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      return row;
    };

    title("ENTRY CONFIRMATION SHEET", 16);
    title(sheet.event.name, 12);
    ws.addRow([
      [sheet.event.venue, sheet.event.city, sheet.event.country].filter(Boolean).join(", ") +
        ` — ${dateOnly(sheet.event.startDate)}`,
    ]);
    ws.addRow([]);
    field("Club", sheet.club.name);
    field("Contact", `${sheet.club.contactName} <${sheet.club.email}>`);
    field("Registration closes", dateOnly(sheet.event.regClose));
    field("Generated", sheet.generatedAt.replace("T", " ").slice(0, 16) + " UTC");
    ws.addRow([]);
    field(
      "Totals",
      `${sheet.totals.athletes} athletes · ${sheet.totals.individualEntries} individual entries · ` +
        `${sheet.totals.teamEntries} team entries · ${sheet.totals.kata} kata · ${sheet.totals.kumite} kumite`,
    );
    field(
      "By status",
      `Approved ${sheet.totals.approved} · Pending ${sheet.totals.submitted} · Draft ${sheet.totals.draft}`,
    );
    ws.addRow([]);

    const headerRow = (cells: string[]) => {
      const row = ws.addRow(cells);
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
        cell.border = { bottom: { style: "thin" } };
      });
      return row;
    };

    title("INDIVIDUAL ENTRIES", 12);
    const indivHeader = headerRow([
      "#",
      "Athlete",
      "Gender",
      "Date of birth",
      "Age",
      "Weight (kg)",
      "Discipline",
      "Category",
      "Weight class",
      "Status",
    ]);

    let n = 0;
    for (const athlete of sheet.athletes) {
      for (const line of athlete.lines) {
        n += 1;
        ws.addRow([
          n,
          athlete.name,
          athlete.gender,
          dateOnly(athlete.dob),
          athlete.age,
          athlete.weightKg ?? "",
          line.category === "KATA" ? "Kata" : "Kumite",
          line.divisionName,
          line.weightClassName ?? "",
          SHEET_STATUS_LABEL[line.status],
        ]);
      }
    }
    if (n === 0) ws.addRow(["", "No individual entries."]);

    // Autofilter over the table only — the header block above it is not data.
    ws.autoFilter = {
      from: { row: indivHeader.number, column: 1 },
      to: { row: indivHeader.number + Math.max(n, 1), column: 10 },
    };

    if (sheet.teams.length > 0) {
      ws.addRow([]);
      title("TEAM ENTRIES", 12);
      headerRow(["#", "Team", "Discipline", "Category", "Members", "Reserves", "Status"]);
      sheet.teams.forEach((team, i) => {
        ws.addRow([
          i + 1,
          team.teamName,
          team.category === "KATA" ? "Kata" : "Kumite",
          team.divisionName,
          team.members.join("; "),
          team.reserves.join("; "),
          SHEET_STATUS_LABEL[team.status],
        ]);
      });
    }

    if (sheet.returned.length > 0) {
      ws.addRow([]);
      title("RETURNED — NOT ENTERED", 12);
      ws.addRow([
        "",
        "These entries were returned and are not part of the roster above. Resubmit them if they should be.",
      ]);
      headerRow(["#", "Name", "Category", "Weight class", "Reason"]);
      sheet.returned.forEach((r, i) => {
        ws.addRow([i + 1, r.name, r.divisionName, r.weightClassName ?? "", r.reason ?? ""]);
      });
    }

    ws.addRow([]);
    ws.addRow([]);
    title("CONFIRMATION", 12);
    ws.addRow(["Confirmed by", "", "Position", "", "Date", ""]);
    ws.addRow(["Signature", "", "", "", "", ""]);
    ws.addRow([
      "",
      "By confirming, the club agrees the entries above are correct and complete.",
    ]);

    ws.columns.forEach((col, i) => {
      col.width = i === 0 ? 5 : i === 1 ? 28 : i === 4 ? 6 : 16;
    });
    // Column 8 (Category) carries the longest text on the sheet.
    if (ws.getColumn(8)) ws.getColumn(8).width = 32;

    // --- Sheet 2: the same entries, category first ---
    const cats = wb.addWorksheet("By category", {
      pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    const catHeader = cats.addRow([
      "Category",
      "Weight class",
      "Discipline",
      "Gender",
      "Ages",
      "Competitor",
      "Seed",
      "Status",
    ]);
    catHeader.font = { bold: true };
    catHeader.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
      cell.border = { bottom: { style: "thin" } };
    });
    for (const cat of sheet.categories) {
      for (const c of cat.competitors) {
        cats.addRow([
          cat.divisionName,
          cat.weightClassName ?? "",
          cat.category === "KATA" ? "Kata" : "Kumite",
          cat.gender,
          `${cat.minAge}-${cat.maxAge}`,
          c.name,
          c.seed ?? "",
          SHEET_STATUS_LABEL[c.status],
        ]);
      }
    }
    cats.views = [{ state: "frozen", ySplit: 1 }];
    cats.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };
    cats.columns.forEach((col, i) => {
      col.width = i === 0 || i === 5 ? 32 : 14;
    });

    return wb;
  }

  /** Filename stem shared by both formats: `<club>-entries-<event>`. */
  static fileStem(sheet: ClubEntrySheet): string {
    return `${fileSlug(sheet.club.name)}-entries-${fileSlug(sheet.event.name)}`;
  }
}
