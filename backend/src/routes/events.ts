import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
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
  ApplyTemplate,
  SetPublicAccess,
} from "../utils/validators.js";

export const router = Router();

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

// update event (admin only)
router.put("/:id", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: IdParam, body: UpdateEvent }), async (req, res, next) => {
  try {
    const event = await EventService.update(getParam(req.params.id), req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// update event status (admin only)
router.patch("/:id/status", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: IdParam, body: UpdateEventStatus }), async (req, res, next) => {
  try {
    const event = await EventService.updateStatus(getParam(req.params.id), req.body.status);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// enable/disable (rotate) the read-only public board token (admin only)
router.post("/:id/public-token", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: IdParam, body: SetPublicAccess }), async (req, res, next) => {
  try {
    const event = await EventService.setPublicAccess(getParam(req.params.id), req.body.enabled);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// delete event (admin only)
router.delete("/:id", requireRoles("SUPERADMIN", "ADMIN"), validate(IdParam, "params"), async (req, res, next) => {
  try {
    await EventService.delete(getParam(req.params.id));
    res.status(204).send();
  } catch (err: any) {
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

// create division (admin only)
router.post("/:id/divisions", requireRoles("SUPERADMIN", "ADMIN"), validate(CreateDivision), async (req, res, next) => {
  try {
    const division = await EventService.createDivision(req.body);
    res.status(201).json(division);
  } catch (err) {
    next(err);
  }
});

// update division (admin only)
router.put("/divisions/:divisionId", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: DivisionIdParam, body: UpdateDivision }), async (req, res, next) => {
  try {
    const division = await EventService.updateDivision(getParam(req.params.divisionId), req.body);
    res.json(division);
  } catch (err) {
    next(err);
  }
});

// delete division (admin only)
router.delete("/divisions/:divisionId", requireRoles("SUPERADMIN", "ADMIN"), validate(DivisionIdParam, "params"), async (req, res, next) => {
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

// create weight class (admin only)
router.post("/:id/weights", requireRoles("SUPERADMIN", "ADMIN"), validate(CreateWeightClass), async (req, res, next) => {
  try {
    const weightClass = await EventService.createWeightClass(req.body);
    res.status(201).json(weightClass);
  } catch (err) {
    next(err);
  }
});

// update weight class (admin only)
router.put("/weights/:weightClassId", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: WeightClassIdParam, body: UpdateWeightClass }), async (req, res, next) => {
  try {
    const weightClass = await EventService.updateWeightClass(getParam(req.params.weightClassId), req.body);
    res.json(weightClass);
  } catch (err) {
    next(err);
  }
});

// delete weight class (admin only)
router.delete("/weights/:weightClassId", requireRoles("SUPERADMIN", "ADMIN"), validate(WeightClassIdParam, "params"), async (req, res, next) => {
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
router.get("/:id/divisions/:divisionId/eligible-athletes", validate(EligibleAthletesQuery, "query"), async (req, res, next) => {
  try {
    const eventId = getParam(req.params.id);
    const divisionId = getParam(req.params.divisionId);
    const { clubId } = req.query as { clubId?: string };

    const athletes = await EventService.getEligibleAthletes(eventId, divisionId, clubId);
    res.json(athletes);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// ============ Templates ============

// apply a WKF division template to an event (admin only)
router.post("/:id/apply-template", requireRoles("SUPERADMIN", "ADMIN"), validateMultiple({ params: IdParam, body: ApplyTemplate }), async (req, res, next) => {
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

// ============ Config ============

// update config snapshot (admins)
router.put("/:id/config", requireRoles("SUPERADMIN", "ADMIN"), async (req, res, next) => {
  try {
    const event = await EventService.updateConfig(getParam(req.params.id), req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
});
