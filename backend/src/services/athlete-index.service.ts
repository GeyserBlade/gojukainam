import { DrawService, type AthleteRun } from "./draw.service.js";
import { BoardCache } from "../utils/board-cache.js";

/**
 * "What happened to this athlete today?" — the per-athlete view of an event,
 * shared by the spectator board (by share token, `public.service.ts`) and the
 * event hub's athlete search (authenticated, `routes/draws.ts`).
 *
 * It lives here rather than in either caller because the underlying compute —
 * `DrawService.eventAthletes`, one replay of every bracket in the event — is
 * expensive enough that the two surfaces must share a cache entry, and because
 * neither surface should own a payload the other also serves.
 *
 * The payload is deliberately identical for both. Everything in it (names,
 * clubs, categories, bout outcomes) is announced over the PA at the venue and
 * is already on the public board; there is nothing here to widen for staff and
 * nothing to trim for spectators. Anything about a child *beyond* the
 * competition — date of birth, grade, weight, contact details, check-in state —
 * stays out, which is the same line `public.service.ts` draws.
 */

/**
 * Matches the spectator board's athlete-index TTL — this is the same cache
 * entry, so the two surfaces cannot disagree about how stale the answer is.
 */
const TTL_MS = 20_000;

export class AthleteIndexService {
  /**
   * The full index, cached per event. Keyed `${eventId}:athletes` (not by
   * share token) so rotating a token revokes access without dropping the
   * cache, and so a hub read warms the board and vice versa.
   */
  static async index(eventId: string) {
    const key = `${eventId}:athletes`;
    const hit = BoardCache.get(key) as Awaited<ReturnType<typeof DrawService.eventAthletes>> | undefined;
    if (hit !== undefined) return hit;
    const payload = await DrawService.eventAthletes(eventId);
    BoardCache.set(key, payload, TTL_MS);
    return payload;
  }

  /**
   * Search index: every competitor, with a one-line status per category and no
   * bout history. Lean on purpose — this is the list a search filters over.
   */
  static async list(eventId: string) {
    const athletes = await AthleteIndexService.index(eventId);
    return {
      athletes: athletes.map((a) => ({
        id: a.id,
        name: a.name,
        clubId: a.clubId,
        clubName: a.clubName,
        runs: a.runs.map(summariseRun),
      })),
    };
  }

  /** One athlete's full story: every category, every bout, in bracket order. */
  static async get(eventId: string, athleteId: string) {
    const athletes = await AthleteIndexService.index(eventId);
    const athlete = athletes.find((a) => a.id === athleteId);
    if (!athlete) throw { status: 404, message: "Athlete not found in this event" };
    return athlete;
  }
}

/** A run without its bout list — enough for a search row and a status chip. */
export const summariseRun = (r: AthleteRun) => ({
  drawId: r.drawId,
  category: r.category,
  discipline: r.discipline,
  matName: r.matName,
  place: r.place,
  status: r.status,
  next: r.next,
  size: r.size,
});
