import { Router } from "express";
import type { Request } from "express";
import { validate, validateMultiple } from "../middleware/validate.js";
import { requireAgentOrRoles, assertAgentClub } from "../utils/agent-auth.js";
import { getParam } from "../utils/params.js";
import { startOfUtcDay } from "../utils/dates.js";
import {
  CompetitionAthleteRecordQuery, CompetitionEntriesQuery, CompetitionEventQuery,
  CompetitionEventsQuery, CompetitionResultsQuery, IdParam,
} from "../utils/validators.js";
import { CompetitionService } from "../services/competition.service.js";

export const router = Router();

/**
 * Competition reads (M8) — the tournament half of what the agent can answer.
 *
 * Two gates, and the difference between them is the whole security model of
 * this file:
 *
 *   entryGate  — anything that names a club. `clubScope()` runs on every one of
 *                them, so an agent key sees its own club and a CLUB_MANAGER
 *                sees theirs.
 *
 *   resultGate — podiums. No clubId anywhere, and deliberately no club check:
 *                these are already served federation-wide by
 *                /api/reports/results to every authenticated user, and by the
 *                public board to anyone with the link. ATHLETE is included for
 *                exactly that consistency.
 *
 * Nothing here writes. There is no competition write path for machines at all,
 * which is why none of these handlers carry an idempotency or audit concern.
 */

const entryGate = requireAgentOrRoles(
  ["competition:read"],
  "SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH",
);

const resultGate = requireAgentOrRoles(
  ["competition:read"],
  "SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE",
);

/**
 * A caller may only name its own club.
 *
 * Both caller kinds are checked, for the reason billing.ts spells out:
 * requireAgentOrRoles only says *this kind of caller may call this*, and a
 * CLUB_MANAGER passing someone else's clubId is exactly as much a cross-tenant
 * read as a service key doing it.
 */
function clubScope(req: Request, clubId: string): void {
  assertAgentClub(req, clubId);
  const role = req.user?.role;
  if (role && role !== "SUPERADMIN" && role !== "ADMIN" && req.user?.clubId !== clubId) {
    throw { status: 403, message: "Forbidden" };
  }
}

/** `asOf` defaults to today, as a UTC calendar day — never a local one. */
function asOfFrom(value: unknown): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfUtcDay(new Date(`${value}T00:00:00Z`));
  }
  return startOfUtcDay(new Date());
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
router.get("/events", entryGate, validate(CompetitionEventsQuery, "query"), async (req, res, next) => {
  try {
    const q = CompetitionEventsQuery.parse(req.query);
    clubScope(req, q.clubId);
    res.json(
      await CompetitionService.listEvents({
        clubId: q.clubId,
        ...(q.when !== undefined ? { when: q.when } : {}),
        ...(q.limit !== undefined ? { limit: q.limit } : {}),
        asOf: asOfFrom(q.asOf),
      }),
    );
  } catch (err) { next(err); }
});

router.get(
  "/events/:id",
  entryGate,
  validateMultiple({ params: IdParam, query: CompetitionEventQuery }),
  async (req, res, next) => {
    try {
      const q = CompetitionEventQuery.parse(req.query);
      clubScope(req, q.clubId);
      res.json(
        await CompetitionService.getEvent(getParam(req.params.id), q.clubId, asOfFrom(q.asOf)),
      );
    } catch (err) { next(err); }
  },
);

// ---------------------------------------------------------------------------
// Entries — who this club has entered, and whether they are in a bracket
// ---------------------------------------------------------------------------
router.get("/entries", entryGate, validate(CompetitionEntriesQuery, "query"), async (req, res, next) => {
  try {
    const q = CompetitionEntriesQuery.parse(req.query);
    clubScope(req, q.clubId);
    res.json(
      await CompetitionService.listEntries({
        clubId: q.clubId,
        ...(q.eventId !== undefined ? { eventId: q.eventId } : {}),
        ...(q.athleteId !== undefined ? { athleteId: q.athleteId } : {}),
        ...(q.status !== undefined ? { status: q.status } : {}),
        ...(q.limit !== undefined ? { limit: q.limit } : {}),
      }),
    );
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// One athlete's record: entered, drawn, fought, placed
// ---------------------------------------------------------------------------
router.get(
  "/athlete-record",
  entryGate,
  validate(CompetitionAthleteRecordQuery, "query"),
  async (req, res, next) => {
    try {
      const q = CompetitionAthleteRecordQuery.parse(req.query);
      clubScope(req, q.clubId);
      res.json(
        await CompetitionService.athleteRecord({
          clubId: q.clubId,
          athleteId: q.athleteId,
          ...(q.eventId !== undefined ? { eventId: q.eventId } : {}),
          asOf: asOfFrom(q.asOf),
        }),
      );
    } catch (err) { next(err); }
  },
);

// ---------------------------------------------------------------------------
// Results — federation-wide, see the gate note above
// ---------------------------------------------------------------------------
router.get("/results", resultGate, validate(CompetitionResultsQuery, "query"), async (req, res, next) => {
  try {
    const q = CompetitionResultsQuery.parse(req.query);
    res.json(
      await CompetitionService.results({
        eventId: q.eventId,
        ...(q.q !== undefined ? { q: q.q } : {}),
        ...(q.type !== undefined ? { type: q.type } : {}),
        ...(q.gender !== undefined ? { gender: q.gender } : {}),
        ...(q.limit !== undefined ? { limit: q.limit } : {}),
      }),
    );
  } catch (err) { next(err); }
});
