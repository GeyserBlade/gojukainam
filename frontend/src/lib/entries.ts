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
  belt: {
    id: string;
    name: string;
    colour?: string | null;
  };
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

export interface Division {
  id: string;
  name: string;
  key: string;
  category: "KATA" | "KUMITE";
  gender: "Male" | "Female";
  minAge: number;
  maxAge: number;
}

export interface WeightClass {
  id: string;
  name: string;
  gender: "Male" | "Female";
  minKg?: number | null;
  maxKg?: number | null;
}

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
}
