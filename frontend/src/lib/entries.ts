import { api } from "./api";

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female";
  dob: string;
  weightKg?: number | null;
  club: {
    id: string;
    name: string;
  };
  // Null when no grade has been recorded for this athlete.
  belt?: {
    id: string;
    name: string;
    colour?: string | null;
  } | null;
}

export interface Team {
  id: string;
  name: string;
  teamType: "TEAM_KATA" | "TEAM_KUMITE";
  members: {
    id: string;
    athleteId: string;
    isReserve: boolean;
    athlete: Athlete;
  }[];
}

// The entries API returns the full division/weight-class rows, so reuse the
// canonical types from ./events rather than keeping a narrower duplicate here —
// two `Division` types that differ only by `eventId` are not assignable to each
// other and silently split consumers.
export type { Division, WeightClass } from "./events";
import type { Division, WeightClass } from "./events";

export interface Club {
  id: string;
  name: string;
}

export interface Entry {
  id: string;
  eventId: string;
  clubId: string;
  entryType: "KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE";
  divisionId: string;
  athleteId?: string | null;
  weightClassId?: string | null;
  teamId?: string | null;
  feeCents: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";
  statusReason?: string | null;
  checkedIn?: boolean;
  /** Seeding rank within this entry's category; null/undefined = unseeded. */
  seed?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  athlete?: Athlete | null;
  team?: Team | null;
  division: Division;
  weightClass?: WeightClass | null;
  club: Club;
}

export interface CreateEntryDto {
  eventId: string;
  clubId: string;
  entryType: "KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE";
  divisionId: string;
  athleteId?: string;
  weightClassId?: string;
  teamId?: string;
  feeCents?: number;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";
  notes?: string;
}

export interface EntryFilters {
  eventId: string;
  clubId?: string;
  divisionId?: string;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";
  entryType?: "KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE";
  searchQuery?: string;
}

export class EntryService {
  static async list(filters: EntryFilters): Promise<Entry[]> {
    const params: any = { eventId: filters.eventId };
    if (filters.clubId) params.clubId = filters.clubId;
    if (filters.divisionId) params.divisionId = filters.divisionId;
    if (filters.status) params.status = filters.status;
    if (filters.entryType) params.entryType = filters.entryType;
    if (filters.searchQuery) params.searchQuery = filters.searchQuery;

    const res = await api.get("/entries", { params });
    return res.data;
  }

  static async create(data: CreateEntryDto): Promise<Entry> {
    const res = await api.post("/entries", data);
    return res.data;
  }

  static async updateStatus(id: string, status: string, reason?: string): Promise<Entry> {
    const res = await api.put(`/entries/${id}/status`, { status, reason });
    return res.data;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`/entries/${id}`);
  }

  // Club-side bulk submit: DRAFT/RETURNED -> SUBMITTED.
  static async bulkSubmit(eventId: string, ids: string[]): Promise<{ updatedCount: number }> {
    const res = await api.post("/entries/bulk-submit", { eventId, ids });
    return res.data;
  }

  // Admin-side bulk review: SUBMITTED -> APPROVED/RETURNED (reason shown on return).
  static async bulkReview(
    eventId: string,
    ids: string[],
    status: "APPROVED" | "RETURNED",
    reason?: string,
  ): Promise<{ updatedCount: number }> {
    const res = await api.post("/review/bulk", { eventId, ids, status, reason });
    return res.data;
  }

  // Withdraw a single entry regardless of its current status (APPROVED
  // included) — /review/bulk only touches SUBMITTED entries, so this goes
  // through /review/bulk-status instead. A single-element `ids` array is the
  // same pattern bulkReview already uses for one-row actions.
  static async withdraw(
    eventId: string,
    id: string,
    reason?: string,
  ): Promise<{ updatedCount: number }> {
    const res = await api.post("/review/bulk-status", {
      eventId,
      ids: [id],
      status: "RETURNED",
      reason,
    });
    return res.data;
  }

  // Seed one entry. 409s when another entry in the same category holds it,
  // with the holder named in the error message.
  static async setSeed(id: string, seed: number | null): Promise<{ entryId: string; seed: number | null }> {
    const res = await api.put(`/entries/${id}/seed`, { seed });
    return res.data;
  }

  // Day-of presence: tick an entry present/absent for the run board.
  static async setCheckIn(id: string, checkedIn: boolean): Promise<Entry> {
    const res = await api.patch(`/run/entries/${id}/checkin`, { checkedIn });
    return res.data;
  }
}
