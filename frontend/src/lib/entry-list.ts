import { api } from "./api";

/**
 * The event entry list: every club's entries for one event, division by
 * division — the printable counterpart of the hub's **Entries** board.
 *
 * Types mirror `backend/src/services/entry-list.service.ts` — keep them in
 * sync. The printable page and the workbook are built from this one payload, so
 * the printout and the spreadsheet cannot disagree.
 *
 * Note the difference from `entry-sheet.ts` next door: that document is one
 * club's roster to sign off and excludes RETURNED entries; this one is the
 * organizer's whole-event view and shows them in place, marked, exactly as the
 * Entries board does.
 */

export type ListStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";

export const LIST_STATUS_LABEL: Record<ListStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
  RETURNED: "Returned",
};

export interface ListCounts {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  returned: number;
}

export interface ListCompetitor {
  entryId: string;
  name: string;
  clubId: string;
  clubName: string;
  status: ListStatus;
  statusReason: string | null;
  isTeam: boolean;
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
  fee: number;
}

export interface ListClub {
  id: string;
  name: string;
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
    divisionsEntered: number;
    kata: number;
    kumite: number;
    teamEntries: number;
    counts: ListCounts;
    fee: number;
  };
}

export async function getEventEntryList(eventId: string): Promise<EventEntryList> {
  const { data } = await api.get("/reports/event-entries", { params: { eventId } });
  return data;
}

/**
 * Pull the workbook through axios rather than pointing a link at the API — the
 * same reason as the club sheet: in production the API is a different origin,
 * and a top-level navigation there carries neither the session cookie reliably
 * nor the dev-auth headers.
 */
export async function downloadEventEntriesXlsx(eventId: string): Promise<void> {
  const res = await api.get("/reports/event-entries.xlsx", {
    params: { eventId },
    responseType: "blob",
  });

  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? "entry-list.xlsx";

  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Group the divisions into the age bands the Entries board groups them into. */
export function groupByAgeBand(divisions: ListDivision[]) {
  const bands = new Map<string, { band: ListAgeBand; divisions: ListDivision[] }>();
  for (const d of divisions) {
    const bucket = bands.get(d.ageBand.key);
    if (bucket) bucket.divisions.push(d);
    else bands.set(d.ageBand.key, { band: d.ageBand, divisions: [d] });
  }
  // The payload is already in board order, so insertion order is band order.
  return [...bands.values()];
}

/** Route of the printable list — opened in a new tab, then printed to PDF. */
export function entryListPath(eventId: string): string {
  return `/entry-list/${eventId}`;
}
