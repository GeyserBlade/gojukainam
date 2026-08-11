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

type LookupModel =
  | "division"
  | "weightClass"
  | "draw"
  | "mat"
  | "entry"
  | "bout"
  | "scheduleBlock";

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
  scheduleBlock: async (id) =>
    (await prisma.scheduleBlock.findUnique({ where: { id }, select: { eventId: true } }))?.eventId ??
    null,
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

/** Every mat this user is assigned to run. */
export async function operatedMatIds(userId: string): Promise<string[]> {
  const rows = await prisma.matOperator.findMany({ where: { userId }, select: { matId: true } });
  return rows.map((r) => r.matId);
}

/**
 * Which mat is this bout being fought on?
 *
 * A bout row may carry its own `matId` (a coordinator moved this one bout), and
 * otherwise inherits its category's. Same precedence the run board renders by,
 * so what an operator is allowed to score is exactly what they were shown.
 */
async function matForBout(boutId: string): Promise<string | null> {
  const bout = await prisma.bout.findUnique({
    where: { id: boutId },
    select: { matId: true, draw: { select: { matId: true } } },
  });
  if (!bout) return null;
  return bout.matId ?? bout.draw.matId ?? null;
}

/**
 * Gate a result-writing route on "event manager, OR the operator running the
 * mat this bout is on".
 *
 * Deliberately keyed on the *bout*, not the draw: a category can be split
 * across mats bout by bout, and an operator's authority follows the tatami they
 * are standing at, not the category. An operator with no assignment, or one
 * assigned to a different mat, is refused exactly like any other user.
 *
 * The manager path short-circuits first, so the existing admin/coordinator
 * behaviour is unchanged and costs no extra query.
 */
export function requireBoutScorer(boutIdParam: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(403).json({ error: "Forbidden" });
      if (GLOBAL_EVENT_ADMINS.includes(user.role)) return next();

      const boutId = (req.params as Record<string, unknown>)[boutIdParam];
      if (typeof boutId !== "string" || boutId.length === 0)
        return res.status(404).json({ error: "Not found" });

      const bout = await prisma.bout.findUnique({
        where: { id: boutId },
        select: { draw: { select: { eventId: true } } },
      });
      if (!bout) return res.status(404).json({ error: "Not found" });

      if (await isEventCoordinator(user.id, bout.draw.eventId)) return next();

      const matId = await matForBout(boutId);
      if (matId) {
        const assigned = await prisma.matOperator.findUnique({
          where: { matId_userId: { matId, userId: user.id } },
          select: { id: true },
        });
        if (assigned) return next();
      }

      return res.status(403).json({ error: "Forbidden" });
    } catch (err) {
      // A database hiccup must fail closed rather than fall through as though
      // the grant had been evaluated and accepted.
      return next(err);
    }
  };
}

/**
 * Read access to one draw for the people who may already see every draw, plus a
 * tatami operator whose mat is running some part of *this* category.
 *
 * The operator needs the bracket to score from — the scoreboard reads the whole
 * draw for its bronze/podium logic — but "only the bouts allocated to them"
 * means they must not be able to page through the rest of the tournament by
 * guessing ids. Hence a scoped check rather than adding the role to VIEW_ROLES.
 */
export function requireDrawViewer(viewRoles: readonly AuthUser["role"][], drawIdParam: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(403).json({ error: "Forbidden" });
      if (viewRoles.includes(user.role)) return next();

      const drawId = (req.params as Record<string, unknown>)[drawIdParam];
      if (typeof drawId !== "string" || drawId.length === 0)
        return res.status(404).json({ error: "Not found" });

      const mats = await operatedMatIds(user.id);
      if (mats.length === 0) return res.status(403).json({ error: "Forbidden" });

      // Either the whole category sits on one of their mats, or an individual
      // bout of it has been moved there.
      const reachable = await prisma.draw.count({
        where: {
          id: drawId,
          OR: [{ matId: { in: mats } }, { bouts: { some: { matId: { in: mats } } } }],
        },
      });
      if (reachable === 0) return res.status(403).json({ error: "Forbidden" });

      return next();
    } catch (err) {
      return next(err);
    }
  };
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
