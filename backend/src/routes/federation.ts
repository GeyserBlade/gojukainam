import { Router } from "express";
import { validate, validateMultiple } from "../middleware/validate.js";
import { requireAgentOrRoles } from "../utils/agent-auth.js";
import { getParam } from "../utils/params.js";
import { startOfUtcDay } from "../utils/dates.js";
import {
  FederationAthleteQuery, FederationAthletesQuery, FederationClubQuery,
  FederationClubsQuery, FederationSummaryQuery, IdParam,
} from "../utils/validators.js";
import { FederationService } from "../services/federation.service.js";

export const router = Router();

/**
 * Federation-wide reads (M9) — the club directory, cross-club member lookup,
 * the belt ramp, and the one-call size of the association.
 *
 * ONE GATE FOR THE WHOLE FILE, and no per-handler club check anywhere in it.
 * That is not an oversight: every endpoint here is cross-club by definition,
 * so there is no clubId to own. `federation:read` is what buys the door, and
 * the human equivalent is the admin roles that already see cross-club data on
 * every screen (docs/conventions.md, "Roles in the UI"). A CLUB_MANAGER is
 * refused the whole router rather than served a filtered version of it —
 * a filtered federation directory is a different feature, and pretending this
 * one can be it is how tenancy bugs are written.
 *
 * NOTHING HERE WRITES. There is no POST in this file and there should never
 * be one: `federation:read` grants cross-club reach, and the moment a write
 * lived behind it that reach would become cross-club write reach. New writes
 * go where the existing ones are, behind gateWrite and the key's home club.
 */
const gate = requireAgentOrRoles(["federation:read"], "SUPERADMIN", "ADMIN");

/** `asOf` defaults to today, as a UTC calendar day — never a local one. */
function asOfFrom(value: unknown): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfUtcDay(new Date(`${value}T00:00:00Z`));
  }
  return startOfUtcDay(new Date());
}

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------
router.get("/clubs", gate, validate(FederationClubsQuery, "query"), async (req, res, next) => {
  try {
    const q = FederationClubsQuery.parse(req.query);
    res.json(await FederationService.listClubs(q.q !== undefined ? { q: q.q } : {}));
  } catch (err) { next(err); }
});

router.get(
  "/clubs/:id",
  gate,
  validateMultiple({ params: IdParam, query: FederationClubQuery }),
  async (req, res, next) => {
    try {
      const q = FederationClubQuery.parse(req.query);
      res.json(await FederationService.getClub(getParam(req.params.id), asOfFrom(q.asOf)));
    } catch (err) { next(err); }
  },
);

// ---------------------------------------------------------------------------
// Members, federation-wide
// ---------------------------------------------------------------------------
router.get("/athletes", gate, validate(FederationAthletesQuery, "query"), async (req, res, next) => {
  try {
    const q = FederationAthletesQuery.parse(req.query);
    res.json(
      await FederationService.listAthletes(
        {
          ...(q.q !== undefined ? { q: q.q } : {}),
          ...(q.clubId !== undefined ? { clubId: q.clubId } : {}),
          ...(q.beltId !== undefined ? { beltId: q.beltId } : {}),
          ...(q.gender !== undefined ? { gender: q.gender } : {}),
          ...(q.includeInactive !== undefined ? { includeInactive: q.includeInactive } : {}),
          ...(q.instructorsOnly !== undefined ? { instructorsOnly: q.instructorsOnly } : {}),
          ...(q.minAge !== undefined ? { minAge: q.minAge } : {}),
          ...(q.maxAge !== undefined ? { maxAge: q.maxAge } : {}),
          ...(q.limit !== undefined ? { limit: q.limit } : {}),
        },
        asOfFrom(q.asOf),
      ),
    );
  } catch (err) { next(err); }
});

router.get(
  "/athletes/:id",
  gate,
  validateMultiple({ params: IdParam, query: FederationAthleteQuery }),
  async (req, res, next) => {
    try {
      const q = FederationAthleteQuery.parse(req.query);
      res.json(await FederationService.getAthlete(getParam(req.params.id), asOfFrom(q.asOf)));
    } catch (err) { next(err); }
  },
);

// ---------------------------------------------------------------------------
// Reference data and totals
// ---------------------------------------------------------------------------
router.get("/belts", gate, async (_req, res, next) => {
  try {
    res.json(await FederationService.listBelts());
  } catch (err) { next(err); }
});

router.get("/summary", gate, validate(FederationSummaryQuery, "query"), async (req, res, next) => {
  try {
    const q = FederationSummaryQuery.parse(req.query);
    res.json(await FederationService.summary(asOfFrom(q.asOf)));
  } catch (err) { next(err); }
});
