import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { requireEventManager } from "../utils/event-scope.js";
import { RunService } from "../services/run.service.js";
import { validate } from "../middleware/validate.js";
import {
  EventIdQuery,
  CreateMat,
  UpdateMat,
  AssignDrawMat,
  SetBoutMat,
  ReorderMatQueue,
  SetCheckIn,
} from "../utils/validators.js";
import { getParam } from "../utils/params.js";

export const router = Router();

const VIEW_ROLES = ["CLUB_MANAGER", "COACH", "ATHLETE", "ADMIN", "SUPERADMIN"] as const;

const handle = (res: any, next: any, err: any) => {
  if (err?.status && err?.message) return res.status(err.status).json({ error: err.message });
  next(err);
};

// Per-mat running order of ready bouts for an event
router.get("/board", requireRoles(...VIEW_ROLES), validate(EventIdQuery, "query"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId: string };
    res.json(await RunService.getBoard(eventId));
  } catch (err) { next(err); }
});

// ---- Mats ----
router.get("/mats", requireRoles(...VIEW_ROLES), validate(EventIdQuery, "query"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId: string };
    res.json(await RunService.listMats(eventId));
  } catch (err) { next(err); }
});

router.post("/mats", requireEventManager({ in: "body", key: "eventId" }), validate(CreateMat), async (req, res, next) => {
  try {
    res.status(201).json(await RunService.createMat(req.body));
  } catch (err: any) { handle(res, next, err); }
});

router.patch("/mats/:matId", requireEventManager({ in: "lookup", key: "matId", via: "mat" }), validate(UpdateMat), async (req, res, next) => {
  try {
    res.json(await RunService.updateMat(getParam(req.params.matId), req.body));
  } catch (err: any) { handle(res, next, err); }
});

router.delete("/mats/:matId", requireEventManager({ in: "lookup", key: "matId", via: "mat" }), async (req, res, next) => {
  try {
    await RunService.deleteMat(getParam(req.params.matId));
    res.status(204).send();
  } catch (err: any) { handle(res, next, err); }
});

// ---- Assignment ----
router.patch("/draws/:drawId/mat", requireEventManager({ in: "lookup", key: "drawId", via: "draw" }), validate(AssignDrawMat), async (req, res, next) => {
  try {
    const row = await RunService.assignDrawMat(getParam(req.params.drawId), req.body, { id: req.user!.id });
    res.json(row);
  } catch (err: any) { handle(res, next, err); }
});

router.patch("/bouts/:boutId/mat", requireEventManager({ in: "lookup", key: "boutId", via: "bout" }), validate(SetBoutMat), async (req, res, next) => {
  try {
    const row = await RunService.setBoutMat(getParam(req.params.boutId), req.body.matId, { id: req.user!.id });
    res.json(row);
  } catch (err: any) { handle(res, next, err); }
});

// Persist the organizer's manual running order for a mat
router.put("/mats/:matId/order", requireEventManager({ in: "lookup", key: "matId", via: "mat" }), validate(ReorderMatQueue), async (req, res, next) => {
  try {
    const row = await RunService.reorderMatQueue(getParam(req.params.matId), req.body.boutIds, { id: req.user!.id });
    res.json(row);
  } catch (err: any) { handle(res, next, err); }
});

// ---- Check-in ----
router.patch("/entries/:entryId/checkin", requireEventManager({ in: "lookup", key: "entryId", via: "entry" }), validate(SetCheckIn), async (req, res, next) => {
  try {
    const row = await RunService.setCheckIn(getParam(req.params.entryId), req.body.checkedIn, { id: req.user!.id });
    res.json(row);
  } catch (err: any) { handle(res, next, err); }
});
