/**
 * The allowable kata list: reference data seeded with the Goju Kai / Goju-ryu
 * syllabus by migration, edited from the Katas admin screen after that.
 *
 * The flag decision itself lives in `kata-scoring.ts`, which is pure and has no
 * network dependency — same split as `timing.ts` against `events.ts`.
 */
import { api } from "./api"

export interface Kata {
  id: string
  name: string
  style: string | null
  order: number
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { performances: number }
}

export async function listKatas(includeInactive = false): Promise<Kata[]> {
  const { data } = await api.get("/katas", {
    params: includeInactive ? { includeInactive: "1" } : undefined,
  })
  return data
}

export async function createKata(
  payload: Pick<Kata, "name" | "order"> & Partial<Pick<Kata, "style" | "active" | "notes">>,
): Promise<Kata> {
  const { data } = await api.post("/katas", payload)
  return data
}

export async function updateKata(
  id: string,
  payload: Partial<Pick<Kata, "name" | "style" | "order" | "active" | "notes">>,
): Promise<Kata> {
  const { data } = await api.put(`/katas/${id}`, payload)
  return data
}

export async function deleteKata(id: string): Promise<void> {
  await api.delete(`/katas/${id}`)
}
