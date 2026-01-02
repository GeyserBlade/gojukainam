import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { EventService } from "../services/event.service.js";

export const router = Router();

// list events (any logged user)
router.get("/", async (_req, res, next) => {
  try {
    const rows = await EventService.getAll();
    res.json(rows);
  } catch (err) { next(err); }
});

// get divisions / weights for an event
router.get("/:id/divisions", async (req, res, next) => {
  try {
    const rows = await EventService.getDivisions(req.params.id);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/:id/weights", async (req, res, next) => {
  try {
    const rows = await EventService.getWeightClasses(req.params.id);
    res.json(rows);
  } catch (err) { next(err); }
});

// update config snapshot (admins)
router.put("/:id/config", requireRoles("SUPERADMIN","ADMIN"), async (req, res, next) => {
  try {
    const event = await EventService.updateConfig(req.params.id, req.body);
    res.json(event);
  } catch (err) { next(err); }
});
