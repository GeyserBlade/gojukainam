// Shared types for the event-management screen.

export interface ClubLike {
  id: string
  name: string
}

/** Fallback when the API hasn't returned clubs yet (or non-admin viewer). */
export const CLUBS_FALLBACK: ClubLike[] = []
