import { api } from "./api"
import type { RunBoard, RunQueueItem } from "./run"
import type { EventResults } from "./results"
import type { EventStatus } from "./events"
import type { PlanBoard } from "./plan"
import { normalizeEventTiming } from "./timing"
import type { AthleteDetail, AthleteRow } from "./athlete-runs"

// The spectator board's client layer. Four endpoints rather than one payload,
// because they change at very different rates: the live board is polled hard,
// the athlete index only moves when a result lands, the schedule barely moves
// at all, and one athlete's detail is fetched only when somebody taps them.
// Types mirror `backend/src/services/public.service.ts` — keep them in sync.

/**
 * A public queue item is a `RunQueueItem` with `checkedIn` stripped from both
 * fighters (see the note in public.service.ts). Structurally it is otherwise
 * identical, so it reuses the run board's own types.
 */
export type PublicQueueItem = RunQueueItem
export type PublicRunBoard = RunBoard

export interface PublicBoard {
  event: {
    name: string
    venue: string
    city: string
    country: string
    startDate: string
    status: EventStatus
  }
  board: PublicRunBoard
  results: EventResults
}

// One athlete's run through the event is shared with the hub's athlete search,
// so its types live in `lib/athlete-runs.ts` and are re-exported here for the
// board's own components.
export type {
  AthleteRunStatus,
  AthleteNextBout,
  AthleteRunSummary,
  AthleteBout,
  AthleteRun,
  AthleteRow,
  AthleteDetail,
} from "./athlete-runs"

export interface PublicSchedule {
  event: { name: string; startDate: string }
  plan: PlanBoard
}

// No-auth fetches by share token. The api instance may attach dev headers, but
// the public endpoints ignore them.

export async function getPublicBoard(token: string): Promise<PublicBoard> {
  const res = await api.get(`/public/board/${token}`)
  return res.data
}

export async function getPublicSchedule(token: string): Promise<PublicSchedule> {
  const res = await api.get(`/public/board/${token}/schedule`)
  // Same normalisation getPlanBoard does — buildSchedule needs a complete
  // EventTiming, and the spectator schedule must come out identical to the
  // coordinator's for the same plan.
  return { ...res.data, plan: { ...res.data.plan, timing: normalizeEventTiming(res.data.plan.timing) } }
}

export async function getPublicAthletes(token: string): Promise<AthleteRow[]> {
  const res = await api.get(`/public/board/${token}/athletes`)
  return res.data.athletes
}

export async function getPublicAthlete(token: string, athleteId: string): Promise<AthleteDetail> {
  const res = await api.get(`/public/board/${token}/athletes/${athleteId}`)
  return res.data
}
