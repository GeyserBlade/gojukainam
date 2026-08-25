import { prisma } from "../lib/prisma.js";
import { RunService } from "./run.service.js";
import { DrawService, type AthleteRun } from "./draw.service.js";
import { PlanService } from "./plan.service.js";
import { BoardCache } from "../utils/board-cache.js";

// Read-only public board served by share token (no auth). Exposes only what a
// spectator needs: event summary, the per-mat live queue, medal results, the
// tatami schedule, and an athlete index so a parent can find their own child.
//
// Everything here is derived from names, clubs and competition results — the
// facts a tournament announces over the PA anyway. Nothing that identifies a
// child beyond that (date of birth, age, grade, weight, contact details,
// whether they have physically checked in) is ever put in a payload here, and
// new fields should be judged against that line rather than against what the
// admin API happens to return.

/** Token -> event, or a 404 that says nothing about whether the event exists. */
async function eventForToken(token: string) {
  // The token lookup stays per-request — it is the access check, and a cheap
  // unique-index hit. Only the expensive payloads are cached, keyed by event id
  // (not token) so rotating the token still revokes access immediately.
  const event = await prisma.event.findUnique({ where: { publicToken: token } });
  if (!event) throw { status: 404, message: "Board not found" };
  return event;
}

/**
 * Build `key`'s payload, or serve the cached one. Keys are namespaced by event
 * id so the live board, the athlete index and the schedule expire separately —
 * they change at wildly different rates, and the live board is the only one
 * polled hard.
 */
async function cached<T>(key: string, ttlMs: number, build: () => Promise<T>): Promise<T> {
  const hit = BoardCache.get(key) as T | undefined;
  if (hit !== undefined) return hit;
  const payload = await build();
  BoardCache.set(key, payload, ttlMs);
  return payload;
}

/**
 * How long each payload may be stale. The live board is polled every 15s by
 * every phone in the hall, so it stays tight; the athlete index only moves
 * when a result lands; the schedule is set the night before and is the one
 * thing a spectator is happy to see a minute old.
 */
const TTL = { board: 10_000, athletes: 20_000, schedule: 120_000 } as const;

export class PublicService {
  static async getBoard(token: string) {
    const event = await eventForToken(token);
    return cached(`${event.id}:board`, TTL.board, async () => {
      const [board, results] = await Promise.all([
        RunService.getBoard(event.id),
        DrawService.eventResults(event.id),
      ]);

      return {
        event: {
          name: event.name,
          venue: event.venue,
          city: event.city,
          country: event.country,
          startDate: event.startDate,
          status: event.status,
        },
        // `checkedIn` is stripped rather than passed through: it is the one
        // field in the run board that says whether a named child is physically
        // at the venue right now, the spectator view has never rendered it,
        // and a public link is the wrong place to publish it.
        board: {
          mats: board.mats.map((m) => ({ ...m, queue: m.queue.map(publicQueueItem) })),
          unassigned: board.unassigned.map(publicQueueItem),
        },
        results,
      };
    });
  }

  /**
   * The tatami schedule, exactly as the coordinator's own plan board and
   * printed running order see it. Deliberately the same `PlanService.getBoard`
   * payload: a spectator schedule that could drift from the one on the wall
   * would be worse than none, and the frontend builds both with the same
   * `lib/schedule.ts` walk.
   *
   * Everything in it is already public: floor names, category names, entry
   * counts, and the ceremony/break blocks.
   */
  static async getSchedule(token: string) {
    const event = await eventForToken(token);
    return cached(`${event.id}:schedule`, TTL.schedule, async () => {
      const plan = await PlanService.getBoard(event.id);
      return { event: { name: event.name, startDate: event.startDate }, plan };
    });
  }

  /**
   * Search index: every competitor, with a one-line status per category.
   *
   * Lean on purpose — this is what the search list filters over, so it holds
   * no bout-by-bout history. `getAthlete` serves that for the one athlete a
   * spectator actually taps, off the same cached computation.
   */
  static async getAthletes(token: string) {
    const event = await eventForToken(token);
    const athletes = await PublicService.athleteIndex(event.id);
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
  static async getAthlete(token: string, athleteId: string) {
    const event = await eventForToken(token);
    const athletes = await PublicService.athleteIndex(event.id);
    const athlete = athletes.find((a) => a.id === athleteId);
    if (!athlete) throw { status: 404, message: "Athlete not found on this board" };
    return athlete;
  }

  /**
   * The full per-athlete index, cached once and projected two ways above. One
   * bracket replay of the whole event is not cheap, and the search list and a
   * tapped athlete want the same computation at different depths.
   */
  private static athleteIndex(eventId: string) {
    return cached(`${eventId}:athletes`, TTL.athletes, () => DrawService.eventAthletes(eventId));
  }
}

type QueueItem = Awaited<ReturnType<typeof RunService.getBoard>>["unassigned"][number];

/** Drop `checkedIn` from a queue item's two fighters. See getBoard above. */
const publicQueueItem = (item: QueueItem) => ({
  ...item,
  aka: { entryId: item.aka.entryId, name: item.aka.name, clubName: item.aka.clubName },
  ao: { entryId: item.ao.entryId, name: item.ao.name, clubName: item.ao.clubName },
});

/** A run without its bout list — enough for a search row and a status chip. */
const summariseRun = (r: AthleteRun) => ({
  drawId: r.drawId,
  category: r.category,
  discipline: r.discipline,
  matName: r.matName,
  place: r.place,
  status: r.status,
  next: r.next,
  size: r.size,
});
