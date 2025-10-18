import { api } from "./api";

export type Role = "SUPERADMIN" | "ADMIN" | "CLUB_MANAGER" | "COACH" | "ATHLETE";

export type User = {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  clubId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listUsers(): Promise<User[]> {
  const r = await api.get("/users");
  return r.data;
}

export async function createUser(data: { name?: string; email: string; role: Role; clubId?: string | null; }): Promise<User> {
  const r = await api.post("/users", data);
  return r.data;
}

export async function updateUser(id: string, data: Partial<{ name: string; email: string; role: Role; clubId: string | null; }>): Promise<User> {
  const r = await api.put(`/users/${id}`, data);
  return r.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

