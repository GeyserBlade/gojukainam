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

// Assign a category's draw to a mat. Omit matOrder to append it to the end of
// that mat's running order (the backend works out the next free slot).
export async function assignDrawMat(
  drawId: string,
  matId: string | null,
  matOrder?: number | null,
): Promise<void> {
  await api.patch(`/run/draws/${drawId}/mat`, { matId, matOrder })
}

// Persist the running order of the categories on a mat (drawIds in order).
export async function reorderMatCategories(matId: string, drawIds: string[]): Promise<void> {
  await api.put(`/run/mats/${matId}/category-order`, { drawIds })
}

export async function setBoutMat(boutId: string, matId: string | null): Promise<void> {
  await api.patch(`/run/bouts/${boutId}/mat`, { matId })
}

// Persist the manual running order for a mat (boutIds in the desired order).
export async function reorderMatQueue(matId: string, boutIds: string[]): Promise<void> {
  await api.put(`/run/mats/${matId}/order`, { boutIds })
}

// ---------------------------------------------------------------------------
// Tatami operator
//
// An operator never names an event or a mat — the server answers from their own
// grants, so there is nothing here to pass and nothing to tamper with.

export interface OperatorMat {
  matId: string
  matName: string
  event: { id: string; name: string; startDate: string; status: string }
  queue: RunQueueItem[]
}

export async function getMyMats(): Promise<{ mats: OperatorMat[] }> {
  const res = await api.get("/run/my-mats")
  return res.data
}

export interface MatOperatorRow {
  id: string
  matId: string
  matName: string
  user: { id: string; name: string | null; email: string; role: string }
  createdAt: string
}

export async function listMatOperators(eventId: string): Promise<MatOperatorRow[]> {
  const res = await api.get("/run/mats/operators", { params: { eventId } })
  return res.data
}

export async function assignMatOperator(matId: string, userId: string): Promise<void> {
  await api.post(`/run/mats/${matId}/operators`, { userId })
}

export async function removeMatOperator(matId: string, userId: string): Promise<void> {
  await api.delete(`/run/mats/${matId}/operators/${userId}`)
}
