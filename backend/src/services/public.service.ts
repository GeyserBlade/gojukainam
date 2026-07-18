import { prisma } from "../lib/prisma.js";
import { RunService } from "./run.service.js";
import { DrawService } from "./draw.service.js";
import { BoardCache } from "../utils/board-cache.js";

// Read-only public board served by share token (no auth). Exposes only what a
// spectator needs: event summary, the per-mat live queue, and medal results —
// all of which already contain only public-safe fields (names, club names).

export class PublicService {
  static async getBoard(token: string) {
    // The token lookup stays per-request — it is the access check, and a cheap
    // unique-index hit. Only the expensive payload is cached, keyed by event id
    // (not token) so rotating the token still revokes access immediately.
    const event = await prisma.event.findUnique({ where: { publicToken: token } });
    if (!event) throw { status: 404, message: "Board not found" };

    const cached = BoardCache.get(event.id);
    if (cached) return cached;

    const [board, results] = await Promise.all([
      RunService.getBoard(event.id),
      DrawService.eventResults(event.id),
    ]);

    const payload = {
      event: {
        name: event.name,
        venue: event.venue,
        city: event.city,
        country: event.country,
        startDate: event.startDate,
        status: event.status,
      },
      board,
      results,
    };
    BoardCache.set(event.id, payload);
    return payload;
  }
}
