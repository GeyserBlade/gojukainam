import { api } from "./api"
import type { RunBoard } from "./run"
import type { EventResults } from "./results"
import type { EventStatus } from "./events"

export interface PublicBoard {
  event: {
    name: string
    venue: string
    city: string
    country: string
    startDate: string
    status: EventStatus
  }
  board: RunBoard
  results: EventResults
}

// No-auth fetch by share token. The api instance may attach dev headers, but
// the public endpoint ignores them.
export async function getPublicBoard(token: string): Promise<PublicBoard> {
  const res = await api.get(`/public/board/${token}`)
  return res.data
}
