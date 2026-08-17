import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { requireEventManager } from "../utils/event-scope.js";
import { EventService } from "../services/event.service.js";
import { validate, validateMultiple } from "../middleware/validate.js";
import { getParam } from "../utils/params.js";
import {
  CreateEvent,
  UpdateEvent,
  UpdateEventStatus,
  CreateDivision,
  UpdateDivision,
  CreateWeightClass,
  UpdateWeightClass,
  IdParam,
  DivisionIdParam,
  WeightClassIdParam,
  EligibleAthletesQuery,
  AthletePoolQuery,
  ApplyTemplate,
  EventTimingConfig,
  SetPublicAccess,
  AddCoordinator,
  CoordinatorParams,
  CoordinatorCandidatesQuery,
} from "../utils/validators.js";

export const router = Router();

// Mirrors routes/entries.ts's logExpectedError: handlers below that catch an
// expected {status, message} error respond directly rather than calling
// next(err), so the global errorHandler's console.error never sees them and
// Railway logs stay empty. Delete is the one route on this file where that
// silence has actually cost investigation time (see docs/state.md), so it
// gets its own logging for both the expected block and any raw failure that
// still reaches the generic 500 path — full Prisma error code + stack, so a
// missed FK cascade shows up immediately instead of as a bare 500.
function logEventDeleteFailure(eventId: string, userId: string | undefined, err: any) {
  if (err?.status && err?.message) {
    console.warn(`[events:delete] ${err.status} ${err.message} — eventId=${eventId} user=${userId ?? "?"}`);
    return;
  }
  console.error(
    `[events:delete] unexpected failure — eventId=${eventId} user=${userId ?? "?"} ` +
      `code=${err?.code ?? "?"} message=${err?.message ?? String(err)}` +
      (err?.meta ? ` meta=${JSON.stringify(err.meta)}` : ""),
  );
  console.error(err?.stack ?? err);
}

// ============ Events CRUD ============

// list events (any logged user)
router.get("/", async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const rows = activeOnly === "true"
      ? await EventService.getActiveEvents()
      : await EventService.getAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// list available division/weight-class templates (any logged user can read)
router.get("/templates", (_req, res) => {
  res.json(EventService.listTemplates());
});

// readiness snapshot for the event hub (any logged user)
router.get("/:id/readiness", validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await EventService.getReadiness(getParam(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// get single event by id
router.get("/:id", validate(IdParam, "params"), async (req, res, next) => {
  try {
    const event = await EventService.getById(getParam(req.params.id));
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// create event (admin only)
router.post("/", requireRoles("SUPERADMIN", "ADMIN"), validate(CreateEvent), async (req, res, next) => {
  try {
    const event = await EventService.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// update event (admins, or this event's coordinator)
router.put("/:id", requireEventManager({ in: "params", key: "id" }), validateMultiple({ params: IdParam, body: UpdateEvent }), async (req, res, next) => {
  try {
    const event = await EventService.update(getParam(req.params.id), req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// update event status (admins, or this event's coordinator — they close
// registration and archive on the day)
router.patch("/:id/status", requireEventManager({ in: "params", key: "id" }), validateMultiple({ params: IdParam, body: UpdateEventStatus }), async (req, res, next) => {
  try {
    const event = await EventService.updateStatus(getParam(req.params.id), req.body.status);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// enable/disable (rotate) the read-only public board token (admins, or this
// event's coordinator — the spectator board is a run-day concern)
router.post("/:id/public-token", requireEventManager({ in: "params", key: "id" }), validateMultiple({ params: IdParam, body: SetPublicAccess }), async (req, res, next) => {
  try {
    const event = await EventService.setPublicAccess(getParam(req.params.id), req.body.enabled);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// delete event (admin only)
router.delete("/:id", requireRoles("SUPERADMIN", "ADMIN"), validate(IdParam, "params"), async (req, res, next) => {
  const eventId = getParam(req.params.id);
  try {
    await EventService.delete(eventId);
    res.status(204).send();
  } catch (err: any) {
    logEventDeleteFailure(eventId, req.user?.id, err);
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Divisions ============

// get divisions for an event
router.get("/:id/divisions", validate(IdParam, "params"), async (req, res, next) => {
  try {
    const rows = await EventService.getDivisions(getParam(req.params.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// create division (admins, or this event's coordinator)
// Guarded on body.eventId, NOT params.id: the handler passes req.body straight
// to the service and ignores the path param, so guarding the path would let a
// coordinator put their own event in the URL and someone else's in the body.
router.post("/:id/divisions", requireEventManager({ in: "body", key: "eventId" }), validate(CreateDivision), async (req, res, next) => {
  try {
    const division = await EventService.createDivision(req.body);
    res.status(201).json(division);
  } catch (err) {
    next(err);
  }
});

// update division (admins, or the coordinator of the division's event)
router.put("/divisions/:divisionId", requireEventManager({ in: "lookup", key: "divisionId", via: "division" }), validateMultiple({ params: DivisionIdParam, body: UpdateDivision }), async (req, res, next) => {
  try {
    const division = await EventService.updateDivision(getParam(req.params.divisionId), req.body);
    res.json(division);
  } catch (err) {
    next(err);
  }
});

// delete division (admins, or the coordinator of the division's event)
router.delete("/divisions/:divisionId", requireEventManager({ in: "lookup", key: "divisionId", via: "division" }), validate(DivisionIdParam, "params"), async (req, res, next) => {
  try {
    await EventService.deleteDivision(getParam(req.params.divisionId));
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Weight Classes ============

// get weight classes for an event
router.get("/:id/weights", validate(IdParam, "params"), async (req, res, next) => {
  try {
    const rows = await EventService.getWeightClasses(getParam(req.params.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// create weight class (admins, or this event's coordinator)
// Guarded on body.eventId for the same reason as create-division above.
router.post("/:id/weights", requireEventManager({ in: "body", key: "eventId" }), validate(CreateWeightClass), async (req, res, next) => {
  try {
    const weightClass = await EventService.createWeightClass(req.body);
    res.status(201).json(weightClass);
  } catch (err) {
    next(err);
  }
});

// update weight class (admins, or the coordinator of the class's event)
router.put("/weights/:weightClassId", requireEventManager({ in: "lookup", key: "weightClassId", via: "weightClass" }), validateMultiple({ params: WeightClassIdParam, body: UpdateWeightClass }), async (req, res, next) => {
  try {
    const weightClass = await EventService.updateWeightClass(getParam(req.params.weightClassId), req.body);
    res.json(weightClass);
  } catch (err) {
    next(err);
  }
});

// delete weight class (admins, or the coordinator of the class's event)
router.delete("/weights/:weightClassId", requireEventManager({ in: "lookup", key: "weightClassId", via: "weightClass" }), validate(WeightClassIdParam, "params"), async (req, res, next) => {
  try {
    await EventService.deleteWeightClass(getParam(req.params.weightClassId));
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Eligible Athletes ============

// get eligible athletes for a division
router.get("/:id/divisions/:divisionId/eligible-athletes", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH"), validate(EligibleAthletesQuery, "query"), async (req, res, next) => {
  try {
    const eventId = getParam(req.params.id);
    const divisionId = getParam(req.params.divisionId);

    // Non-admin roles are always scoped to their own club, ignoring the query param.
    const isAdmin = req.user!.role === "SUPERADMIN" || req.user!.role === "ADMIN";
    let clubId: string | undefined;
    if (isAdmin) {
      clubId = (req.query as { clubId?: string }).clubId;
    } else {
      if (!req.user!.clubId) return res.status(400).json({ error: "User has no club assigned" });
      clubId = req.user!.clubId;
    }

    const athletes = await EventService.getEligibleAthletes(eventId, divisionId, clubId);
    res.json(athletes);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// get the whole athlete pool for an event (all divisions), for screens that
// show every division at once and resolve eligibility client-side
router.get("/:id/athlete-pool", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH"), validate(AthletePoolQuery, "query"), async (req, res, next) => {
  try {
    const eventId = getParam(req.params.id);

    // Non-admin roles are always scoped to their own club, ignoring the query param.
    const isAdmin = req.user!.role === "SUPERADMIN" || req.user!.role === "ADMIN";
    let clubId: string | undefined;
    if (isAdmin) {
      clubId = (req.query as { clubId?: string }).clubId;
    } else {
      if (!req.user!.clubId) return res.status(400).json({ error: "User has no club assigned" });
      clubId = req.user!.clubId;
    }

    const athletes = await EventService.getAthletePool(eventId, clubId);
    res.json(athletes);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Coordinators ============
//
// Appointing and revoking stays requireRoles("SUPERADMIN", "ADMIN") — NOT
// requireEventManager. A coordinator must not be able to appoint further
// coordinators or revoke the admin who appointed them.

// who coordinates this event (admins, or this event's coordinator — a
// coordinator may see who else is running the day with them)
router.get("/:id/coordinators", requireEventManager({ in: "params", key: "id" }), validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await EventService.listCoordinators(getParam(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// users who could be appointed (admin only — it is the appointment picker)
router.get("/:id/coordinator-candidates", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: IdParam, query: CoordinatorCandidatesQuery }), async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    res.json(await EventService.listCoordinatorCandidates(getParam(req.params.id), search));
  } catch (err) {
    next(err);
  }
});

// appoint a coordinator (admin only)
router.post("/:id/coordinators", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: IdParam, body: AddCoordinator }), async (req, res, next) => {
  try {
    const rows = await EventService.addCoordinator(getParam(req.params.id), req.body.userId, req.user?.id);
    res.status(201).json(rows);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// revoke a coordinator (admin only)
router.delete("/:id/coordinators/:userId", requireRoles("SUPERADMIN", "ADMIN"), validate(CoordinatorParams, "params"), async (req, res, next) => {
  try {
    const rows = await EventService.removeCoordinator(getParam(req.params.id), getParam(req.params.userId), req.user?.id);
    res.json(rows);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Templates ============

// apply a division template to an event (admins, or this event's coordinator)
router.post("/:id/apply-template", requireEventManager({ in: "params", key: "id" }), validateMultiple({ params: IdParam, body: ApplyTemplate }), async (req, res, next) => {
  try {
    const result = await EventService.applyTemplate(getParam(req.params.id), req.body.template);
    res.json(result);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Timing ============

// tournament timing defaults (any logged user — coaches and clubs need to know
// when the ceremonies and lunch break fall; only managers may change them)
router.get("/:id/timing", validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await EventService.getTiming(getParam(req.params.id)));
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// set tournament timing defaults (admins, or this event's coordinator — the
// same people who already edit divisions and event config)
router.put("/:id/timing", requireEventManager({ in: "params", key: "id" }), validateMultiple({ params: IdParam, body: EventTimingConfig }), async (req, res, next) => {
  try {
    res.json(await EventService.updateTiming(getParam(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

// ============ Config ============

// update config snapshot (admins, or this event's coordinator)
router.put("/:id/config", requireEventManager({ in: "params", key: "id" }), async (req, res, next) => {
  try {
    const event = await EventService.updateConfig(getParam(req.params.id), req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
});
