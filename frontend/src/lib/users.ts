import { api } from "./api";

export type Role = "SUPERADMIN" | "ADMIN" | "CLUB_MANAGER" | "COACH" | "ATHLETE" | "TATAMI_OPERATOR";

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

export async function setUserPassword(id: string, password: string): Promise<{ success: boolean; message: string }> {
  const r = await api.post(`/users/${id}/set-password`, { password });
  return r.data;
}

export async function requestPasswordReset(id: string): Promise<{ success: boolean; message: string; devToken?: string }> {
  const r = await api.post(`/users/${id}/reset-password`);
  return r.data;
}
