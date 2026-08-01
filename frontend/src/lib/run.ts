import { api } from "./api"

export interface RunEntry {
  entryId: string
  name: string
  clubName: string
  checkedIn: boolean
}

export interface RunQueueItem {
  drawId: string
  boutId: string | null
  phase: "MAIN" | "REPECHAGE"
  round: number
  position: number
  category: string
  gender: "Male" | "Female"
  isKumite: boolean
  aka: RunEntry
  ao: RunEntry
  matId: string | null
  drawMatOrder: number | null
  queueOrder: number | null
}

export interface RunMat {
  id: string
  name: string
  order: number
  queue: RunQueueItem[]
}

export interface RunBoard {
  mats: RunMat[]
  unassigned: RunQueueItem[]
}

export interface Mat {
  id: string
  eventId: string
  name: string
  order: number
}

export async function getRunBoard(eventId: string): Promise<RunBoard> {
  const res = await api.get("/run/board", { params: { eventId } })
  return res.data
}

export async function listMats(eventId: string): Promise<Mat[]> {
  const res = await api.get("/run/mats", { params: { eventId } })
  return res.data
}

export async function createMat(eventId: string, name: string): Promise<Mat> {
  const res = await api.post("/run/mats", { eventId, name })
  return res.data
}

export async function updateMat(matId: string, data: { name?: string; order?: number }): Promise<Mat> {
  const res = await api.patch(`/run/mats/${matId}`, data)
  return res.data
}

export async function deleteMat(matId: string): Promise<void> {
  await api.delete(`/run/mats/${matId}`)
}

export async function assignDrawMat(
  drawId: string,
  matId: string | null,
  matOrder?: number | null,
): Promise<void> {
  await api.patch(`/run/draws/${drawId}/mat`, { matId, matOrder })
}

export async function setBoutMat(boutId: string, matId: string | null): Promise<void> {
  await api.patch(`/run/bouts/${boutId}/mat`, { matId })
}

// Persist the manual running order for a mat (boutIds in the desired order).
export async function reorderMatQueue(matId: string, boutIds: string[]): Promise<void> {
  await api.put(`/run/mats/${matId}/order`, { boutIds })
}
