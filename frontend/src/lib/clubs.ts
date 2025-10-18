import { api } from "./api";

export type Club = {
  id: string;
  name: string;
  region?: string | null;
};

export async function getClub(id: string): Promise<Club> {
  const { data } = await api.get(`/clubs/${id}`);
  return data;
}

export async function listClubs(): Promise<Club[]> {
  const { data } = await api.get(`/clubs`);
  return data;
}
