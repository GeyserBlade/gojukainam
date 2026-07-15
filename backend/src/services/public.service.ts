import { prisma } from "../lib/prisma.js";
import { RunService } from "./run.service.js";
import { DrawService } from "./draw.service.js";

// Read-only public board served by share token (no auth). Exposes only what a
// spectator needs: event summary, the per-mat live queue, and medal results —
// all of which already contain only public-safe fields (names, club names).

export class PublicService {
  static async getBoard(token: string) {
    const event = await prisma.event.findUnique({ where: { publicToken: token } });
    if (!event) throw { status: 404, message: "Board not found" };

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
      board,
      results,
    };
  }
}
