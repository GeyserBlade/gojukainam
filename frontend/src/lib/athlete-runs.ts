import { api } from "./api"

/**
 * One athlete's journey through an event — the categories they entered, where
 * each one stands, and every bout they have fought.
 *
 * Two surfaces serve the same payload from the same backend computation
 * (`AthleteIndexService`, over `DrawService.eventAthletes`): the spectator
 * board by share token (`lib/public.ts`) and the event hub's athlete search by
 * event id (below). The types therefore live here rather than under either
 * one. Keep them in sync with `backend/src/services/athlete-index.service.ts`.
 */

/** See `AthleteRunStatus` in the draw service for what each value means. */
export type AthleteRunStatus =
  | "NOT_DRAWN"
  | "READY"
  | "WAITING"
  | "REPECHAGE_HOPE"
  | "OUT"
  | "MEDAL"

export interface AthleteNextBout {
  phase: "MAIN" | "REPECHAGE"
  round: number
  opponentName: string | null
}

/** A category run as the search list shows it — no bout history. */
export interface AthleteRunSummary {
  /** null before the category has been drawn. */
  drawId: string | null
  category: string
  discipline: "KATA" | "KUMITE"
  matName: string | null
  place: number | null
  status: AthleteRunStatus
  next: AthleteNextBout | null
  size: number
}

export interface AthleteBout {
  phase: "MAIN" | "REPECHAGE"
  round: number
  bye: boolean
  opponentName: string | null
  opponentClubName: string | null
  won: boolean | null
  scoreFor: number | null
  scoreAgainst: number | null
  outcome: string | null
  startedAt: string | null
}

export interface AthleteRun extends AthleteRunSummary {
  entryId: string
  drawStatus: "DRAWN" | "IN_PROGRESS" | "COMPLETED"
  matId: string | null
  bouts: AthleteBout[]
}

/** A row in the search index: one person, one line per category. */
export interface AthleteRow {
  id: string
  name: string
  clubId: string
  clubName: string
  runs: AthleteRunSummary[]
}

/** The same person with every bout filled in. */
export interface AthleteDetail {
  id: string
  name: string
  clubId: string
  clubName: string
  runs: AthleteRun[]
}

/**
 * Fold accents and case so "Müller" is found by typing "muller" — the search
 * is for someone thumbing a name in, not for exact matching.
 */
export const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

/** Split a raw query into folded search terms. */
export const searchTerms = (query: string) => fold(query).split(/\s+/).filter(Boolean)

/**
 * Match every typed word somewhere in the athlete's name or club, in any
 * order, so "sarah windhoek" and "windhoek sarah" both work.
 */
export function matchesAthlete(row: AthleteRow, terms: string[]): boolean {
  const haystack = `${fold(row.name)} ${fold(row.clubName)}`
  return terms.every((term) => haystack.includes(term))
}

// The hub's authenticated reads. The spectator board's token-scoped
// equivalents are `getPublicAthletes` / `getPublicAthlete` in `lib/public.ts`;
// both hit the same service and return the same shapes.

export async function getEventAthletes(eventId: string): Promise<AthleteRow[]> {
  const res = await api.get("/draws/athletes", { params: { eventId } })
  return res.data.athletes
}

export async function getEventAthlete(eventId: string, athleteId: string): Promise<AthleteDetail> {
  const res = await api.get(`/draws/athletes/${athleteId}`, { params: { eventId } })
  return res.data
}
