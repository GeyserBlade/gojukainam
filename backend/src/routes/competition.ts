import { Router } from "express";
import type { Request } from "express";
import { validate, validateMultiple } from "../middleware/validate.js";
import { requireAgentOrRoles, assertAgentClubRead } from "../utils/agent-auth.js";
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
 *                them, so a plain agent key sees its own club and a
 *                CLUB_MANAGER sees theirs. A key holding `federation:read`,
 *                like an admin, may name any club.
 *
 *   resultGate — podiums. No clubId anywhere, and deliberately no club check:
 *                these are already served federation-wide by
 *                /api/reports/results to every authenticated user, and by the
 *                public board to anyone with the link. ATHLETE is included for
 *                exactly that consistency.
 *
 *   eventGate  — brackets, mats and the running order. Event-level rather than
 *                club-level, and for the same reason as resultGate: the public
 *                board already serves every one of these to anyone holding the
 *                event link. Gating them on `federation:read` would protect
 *                nothing while making the agent worse at the one job it has on
 *                tournament day.
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
 * Brackets, mats and the running order. Same roles as resultGate and for the
 * same reason: /api/public serves all three to anyone holding the event link,
 * so there is nothing here to withhold from an authenticated athlete.
 */
const eventGate = resultGate;

/**
 * Who a caller may name.
 *
 * Both caller kinds are checked, for the reason billing.ts spells out:
 * requireAgentOrRoles only says *this kind of caller may call this*, and a
 * CLUB_MANAGER passing someone else's clubId is exactly as much a cross-tenant
 * read as a service key doing it.
 *
 * Entries used to be own-club-only for everyone, on the grounds that who a
 * club has entered is competitive information before the event runs. That
 * still holds between clubs — a CLUB_MANAGER is refused here exactly as
 * before. It never held for the federation itself, which approves those
 * entries, and `federation:read` is how a key says it is asking on the
 * federation's behalf rather than a club's.
 */
function clubScope(req: Request, clubId: string): void {
  assertAgentClubRead(req, clubId);
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

// ---------------------------------------------------------------------------
// Tournament day — brackets, mats, running order.
//
// Event-scoped: no clubId anywhere, deliberately. A bracket contains every
// club by construction, and asking "which of these bouts are mine" is what
// list_event_entries and get_athlete_competition_record are for.
// ---------------------------------------------------------------------------
router.get("/events/:id/draws", eventGate, validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await CompetitionService.listDraws(getParam(req.params.id)));
  } catch (err) { next(err); }
});

router.get("/events/:id/schedule", eventGate, validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await CompetitionService.schedule(getParam(req.params.id)));
  } catch (err) { next(err); }
});

router.get("/draws/:id", eventGate, validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await CompetitionService.getDraw(getParam(req.params.id)));
  } catch (err) { next(err); }
});
