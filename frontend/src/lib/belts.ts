import { api } from "./api";

export type Belt = {
  id: string;
  name?: string | null;
  colour?: string | null;
  notes?: string | null;
  gradingRequirements?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: { Athlete: number };
};

export async function listBelts(): Promise<Belt[]> {
  const { data } = await api.get("/belts");
  return data;
}

export async function getBelt(id: string): Promise<Belt> {
  const { data } = await api.get(`/belts/${id}`);
  return data;
}

export async function createBelt(payload: Omit<Belt, "id"|"createdAt"|"updatedAt"|"_count">): Promise<Belt> {
  const { data } = await api.post("/belts", payload);
  return data;
}

export async function updateBelt(id: string, payload: Partial<Omit<Belt, "id"|"createdAt"|"updatedAt"|"_count">>): Promise<Belt> {
  const { data } = await api.put(`/belts/${id}`, payload);
  return data;
}

export async function deleteBelt(id: string): Promise<void> {
  await api.delete(`/belts/${id}`);
}

