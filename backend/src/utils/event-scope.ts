import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthUser } from "./auth.js";

/**
 * Per-event authorization.
 *
 * `requireRoles` is a global gate: it knows the caller's role but nothing about
 * *which* event a request concerns, so it cannot express "admin, but only for
 * the tournament they were handed". This module adds that.
 *
 * A tournament coordinator is a row in `EventCoordinator`, not a Role. The
 * host dojo's instructor keeps CLUB_MANAGER (and their club scoping everywhere
 * else) and gains admin-equivalent power over one event.
 */

/** Roles that manage every event without needing a grant. */
const GLOBAL_EVENT_ADMINS: readonly AuthUser["role"][] = ["SUPERADMIN", "ADMIN"];

/**
 * Where the event id lives on a given request. Most routes carry it directly;
 * the rest identify a row whose event we have to look up.
 *
 * This is per-route rather than inferred because guessing is how a guard ends
 * up checking the wrong event's grant and silently passing.
 */
export type EventSource =
  | { in: "params" | "body" | "query"; key: string }
  | { in: "lookup"; key: string; via: LookupModel };

type LookupModel = "division" | "weightClass" | "draw" | "mat" | "entry" | "bout";

/**
 * id -> eventId, one per model reachable from a route param. `bout` is the only
 * one that has to hop (Bout has no eventId of its own — it hangs off a Draw).
 */
const LOOKUPS: Record<LookupModel, (id: string) => Promise<string | null>> = {
  division: async (id) =>
    (await prisma.division.findUnique({ where: { id }, select: { eventId: true } }))?.eventId ?? null,
  weightClass: async (id) =>
    (await prisma.weightClass.findUnique({ where: { id }, select: { eventId: true } }))?.eventId ?? null,
  draw: async (id) =>
    (await prisma.draw.findUnique({ where: { id }, select: { eventId: true } }))?.eventId ?? null,
  mat: async (id) =>
    (await prisma.mat.findUnique({ where: { id }, select: { eventId: true } }))?.eventId ?? null,
  entry: async (id) =>
    (await prisma.entry.findUnique({ where: { id }, select: { eventId: true } }))?.eventId ?? null,
  bout: async (id) =>
    (await prisma.bout.findUnique({ where: { id }, select: { draw: { select: { eventId: true } } } }))?.draw
      ?.eventId ?? null,
};

async function resolveEventId(req: Request, source: EventSource): Promise<string | null> {
  if (source.in === "lookup") {
    const rowId = (req.params as Record<string, unknown>)[source.key];
    if (typeof rowId !== "string" || rowId.length === 0) return null;
    return LOOKUPS[source.via](rowId);
  }

  const bag = req[source.in] as Record<string, unknown> | undefined;
  const value = bag?.[source.key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Does this user hold a coordinator grant on this event? */
export async function isEventCoordinator(userId: string, eventId: string): Promise<boolean> {
  const grant = await prisma.eventCoordinator.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  });
  return grant !== null;
}

/** Every event this user coordinates. Used to tell the client what it may show. */
export async function coordinatedEventIds(userId: string): Promise<string[]> {
  const rows = await prisma.eventCoordinator.findMany({
    where: { userId },
    select: { eventId: true },
  });
  return rows.map((r) => r.eventId);
}

/**
 * Gate a route on "global event admin, OR coordinator of *this* event".
 *
 * Replaces `requireRoles("SUPERADMIN", "ADMIN")` on event-scoped routes and is
 * a strict superset of it: admins short-circuit before any lookup, so the
 * existing admin path keeps its exact behaviour and costs no extra query.
 *
 * The `!req.user` check mirrors `requireRoles`: an agent request authenticates
 * without ever setting `req.user`, so service accounts stay default-denied here
 * too. Do not fall back to `req.agent`.
 */
export function requireEventManager(source: EventSource) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(403).json({ error: "Forbidden" });
      if (GLOBAL_EVENT_ADMINS.includes(user.role)) return next();

      const eventId = await resolveEventId(req, source);
      // Unresolvable means the row does not exist, or the id was absent. Both
      // are a 404 rather than a 403: a non-coordinator must not be able to tell
      // "no such draw" from "someone else's draw".
      if (!eventId) return res.status(404).json({ error: "Not found" });

      if (!(await isEventCoordinator(user.id, eventId))) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return next();
    } catch (err) {
      // A database hiccup must fail closed rather than fall through as though
      // the grant had been evaluated and accepted.
      return next(err);
    }
  };
}
