import { api } from "./api"
import type { DrawStatus } from "./draws"

export interface ResultEntry {
  entryId: string
  name: string
  clubId: string
  clubName: string
}

export interface ResultCategory {
  drawId: string
  divisionName: string
  weightClassName: string | null
  category: "KATA" | "KUMITE"
  gender: "Male" | "Female"
  status: DrawStatus
  first: ResultEntry | null
  second: ResultEntry | null
  thirds: ResultEntry[]
}

export interface ClubTallyRow {
  clubId: string
  clubName: string
  gold: number
  silver: number
  bronze: number
  total: number
}

export interface EventResults {
  categories: ResultCategory[]
  clubTally: ClubTallyRow[]
}

export async function getEventResults(eventId: string): Promise<EventResults> {
  const res = await api.get("/reports/results", { params: { eventId } })
  return res.data
}
