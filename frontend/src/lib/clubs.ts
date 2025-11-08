import { api } from "./api";

export type Club = {
  id: string;
  name: string;
  region?: string | null;
  contactName: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { athletes: number; users: number; teams: number; entries: number };
};

type ClubPayload = {
  name: string;
  region?: string | null;
  contactName: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
};

export async function getClub(id: string): Promise<Club> {
  const { data } = await api.get(`/clubs/${id}`);
  return data;
}

export async function listClubs(): Promise<Club[]> {
  const { data } = await api.get(`/clubs`);
  return data;
}

export async function createClub(payload: ClubPayload): Promise<Club> {
  const { data } = await api.post(`/clubs`, payload);
  return data;
}

export async function updateClub(id: string, payload: Partial<ClubPayload>): Promise<Club> {
  const { data } = await api.put(`/clubs/${id}`, payload);
  return data;
}

export async function deleteClub(id: string): Promise<void> {
  await api.delete(`/clubs/${id}`);
}
