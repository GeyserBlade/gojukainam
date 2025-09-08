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
