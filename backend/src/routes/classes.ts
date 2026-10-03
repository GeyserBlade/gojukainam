import { Router } from "express";
import type { Request } from "express";
import { validate, validateMultiple } from "../middleware/validate.js";
import { requireRoles } from "../utils/auth.js";
import { requireAgentOrRoles, assertAgentClubRead } from "../utils/agent-auth.js";
import { getParam } from "../utils/params.js";
import { startOfUtcDay } from "../utils/dates.js";
import {
  AllocateMembers, ClassClubQuery, CreateClass, CreateInstructor, EnrolAthlete, SetClassInstructors,
  UpdateClass, UpdateInstructor,
} from "../utils/validators.js";
import { ClassService } from "../services/class.service.js";

export const router = Router();

/**
 * Classes, instructors and enrolment.
 *
 * Reads: a club's own staff, admins, and the sensai agent key (`members:read`)
 * — the agent reads classes to split instructor income, and never writes them.
 *
 * WRITES ARE HUMAN-ONLY. requireRoles rejects any caller without `req.user`,
 * which an agent key never sets (utils/agent-auth.ts), so a leaked key can read
 * who is in which class and cannot move anyone. Who taught what decides who is
 * paid what; that is a decision for a person at the dojo.
 *
 * Every handler checks the club twice in the shape billing.ts uses: the kind of
 * caller (role or scope), then whether this club is theirs.
 */

const READ_ROLES = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH"] as const;
const WRITE_ROLES = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER"] as const;

const readGate = requireAgentOrRoles(["members:read"], ...READ_ROLES);
const writeGate = requireRoles(...WRITE_ROLES);

function assertHumanClub(req: Request, clubId: string) {
  const role = req.user?.role;
  if (role && role !== "SUPERADMIN" && role !== "ADMIN" && req.user?.clubId !== clubId) {
    throw { status: 403, message: "Forbidden" };
  }
}

function gateRead(req: Request, clubId: string) {
  assertAgentClubRead(req, clubId);
  assertHumanClub(req, clubId);
}

function clubFromQuery(req: Request): string {
  const clubId = typeof req.query.clubId === "string" ? req.query.clubId : "";
  if (!clubId) throw { status: 400, message: "clubId is required" };
  return clubId;
}

// ---------------------------------------------------------------------------
// Reads. Literal paths before /:id.
// ---------------------------------------------------------------------------

router.get("/", readGate, validate(ClassClubQuery, "query"), async (req, res, next) => {
  try {
    const clubId = clubFromQuery(req);
    gateRead(req, clubId);
    const today = startOfUtcDay(new Date());
    res.json(await ClassService.listClasses(clubId, today, req.query.includeInactive === "true"));
  } catch (err) { next(err); }
});

router.get("/instructors", readGate, validate(ClassClubQuery, "query"), async (req, res, next) => {
  try {
    const clubId = clubFromQuery(req);
    gateRead(req, clubId);
    res.json(await ClassService.listInstructors(clubId, req.query.includeInactive === "true"));
  } catch (err) { next(err); }
});

/** Every member's current class, for the athlete list and for sensai. */
router.get("/enrolments", readGate, validate(ClassClubQuery, "query"), async (req, res, next) => {
  try {
    const clubId = clubFromQuery(req);
    gateRead(req, clubId);
    res.json(await ClassService.currentClassByAthlete(clubId));
  } catch (err) { next(err); }
});

router.get("/athletes/:athleteId", readGate, validate(ClassClubQuery, "query"), async (req, res, next) => {
  try {
    const clubId = clubFromQuery(req);
    gateRead(req, clubId);
    res.json(await ClassService.enrolmentHistory(clubId, getParam(req.params.athleteId)));
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Writes — people only.
// ---------------------------------------------------------------------------

router.post("/instructors", writeGate, validate(CreateInstructor), async (req, res, next) => {
  try {
    assertHumanClub(req, req.body.clubId);
    res.status(201).json(await ClassService.createInstructor(req.body));
  } catch (err) { next(err); }
});

router.patch(
  "/instructors/:id",
  writeGate,
  validateMultiple({ body: UpdateInstructor, query: ClassClubQuery }),
  async (req, res, next) => {
    try {
      const clubId = clubFromQuery(req);
      assertHumanClub(req, clubId);
      res.json(await ClassService.updateInstructor(clubId, getParam(req.params.id), req.body));
    } catch (err) { next(err); }
  },
);

router.put(
  "/athletes/:athleteId",
  writeGate,
  validateMultiple({ body: EnrolAthlete, query: ClassClubQuery }),
  async (req, res, next) => {
    try {
      const clubId = clubFromQuery(req);
      assertHumanClub(req, clubId);
      res.json(await ClassService.enrol(clubId, getParam(req.params.athleteId), req.body));
    } catch (err) { next(err); }
  },
);

/** Many members' classes from one date, all or nothing. */
router.put(
  "/enrolments",
  writeGate,
  validateMultiple({ body: AllocateMembers, query: ClassClubQuery }),
  async (req, res, next) => {
    try {
      const clubId = clubFromQuery(req);
      assertHumanClub(req, clubId);
      res.json(await ClassService.allocate(clubId, req.body));
    } catch (err) { next(err); }
  },
);

router.post("/", writeGate, validate(CreateClass), async (req, res, next) => {
  try {
    assertHumanClub(req, req.body.clubId);
    res.status(201).json(await ClassService.createClass(req.body));
  } catch (err) { next(err); }
});

router.patch(
  "/:id",
  writeGate,
  validateMultiple({ body: UpdateClass, query: ClassClubQuery }),
  async (req, res, next) => {
    try {
      const clubId = clubFromQuery(req);
      assertHumanClub(req, clubId);
      res.json(await ClassService.updateClass(clubId, getParam(req.params.id), req.body));
    } catch (err) { next(err); }
  },
);

router.put(
  "/:id/instructors",
  writeGate,
  validateMultiple({ body: SetClassInstructors, query: ClassClubQuery }),
  async (req, res, next) => {
    try {
      const clubId = clubFromQuery(req);
      assertHumanClub(req, clubId);
      res.json(await ClassService.setInstructors(clubId, getParam(req.params.id), req.body));
    } catch (err) { next(err); }
  },
);
