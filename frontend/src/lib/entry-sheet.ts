import { api } from "./api";

/**
 * The club entry-confirmation sheet: one club's entries for one event, shaped
 * as a document to send to a club that has no login.
 *
 * Types mirror `backend/src/services/entry-sheet.service.ts` — keep them in
 * sync. Both the printable sheet and the workbook are built from this same
 * payload, so the emailed PDF and the emailed spreadsheet always say the same
 * thing.
 */

export type SheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

export const SHEET_STATUS_LABEL: Record<SheetStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
};

export interface SheetLine {
  entryId: string;
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

export interface SheetClubOption {
  id: string;
  name: string;
  /** Entries excluding RETURNED — what the sheet will actually list. */
  entryCount: number;
}

/** Clubs with entries in this event, scoped to what the caller may export. */
export async function listSheetClubs(eventId: string): Promise<SheetClubOption[]> {
  const { data } = await api.get("/reports/club-entries/clubs", { params: { eventId } });
  return data;
}

export async function getClubEntrySheet(
  eventId: string,
  clubId?: string,
): Promise<ClubEntrySheet> {
  const { data } = await api.get("/reports/club-entries", {
    params: { eventId, clubId: clubId || undefined },
  });
  return data;
}

/**
 * Pull the workbook through axios rather than pointing a link at the API.
 *
 * A plain `<a href>` is a top-level navigation to the *backend* origin, which
 * in production is a different host from the app — the session cookie may not
 * ride along, and the dev-auth headers in `api.ts` certainly do not. Fetching
 * it as a blob keeps the export on exactly the same authenticated path as
 * every other request.
 */
export async function downloadClubEntriesXlsx(
  eventId: string,
  clubId?: string,
): Promise<void> {
  const res = await api.get("/reports/club-entries.xlsx", {
    params: { eventId, clubId: clubId || undefined },
    responseType: "blob",
  });

  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? "club-entries.xlsx";

  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Route of the printable sheet — opened in a new tab, then printed to PDF. */
export function entrySheetPath(eventId: string, clubId: string): string {
  return `/entry-sheet/${eventId}/${clubId}`;
}
