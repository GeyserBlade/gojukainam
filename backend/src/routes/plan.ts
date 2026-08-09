import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { requireEventManager } from "../utils/event-scope.js";
import { PlanService } from "../services/plan.service.js";
import { validate } from "../middleware/validate.js";
import { EventIdQuery, CreateScheduleBlock, UpdateScheduleBlock, SetPlanOrder } from "../utils/validators.js";
import { getParam } from "../utils/params.js";

export const router = Router();

// Reading the plan is open to every logged-in user: a coach wants to know which
// floor their athletes are on and roughly when. Writing it is manager-only.
const VIEW_ROLES = ["CLUB_MANAGER", "COACH", "ATHLETE", "ADMIN", "SUPERADMIN"] as const;

const handle = (res: any, next: any, err: any) => {
  if (err?.status && err?.message) return res.status(err.status).json({ error: err.message });
  next(err);
};

// The whole plan board in one call: floors, categories, breaks, timing config.
router.get("/board", requireRoles(...VIEW_ROLES), validate(EventIdQuery, "query"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId: string };
    res.json(await PlanService.getBoard(eventId));
  } catch (err: any) { handle(res, next, err); }
});

// ---- Ceremonies and breaks ----
router.post(
  "/blocks",
  requireEventManager({ in: "body", key: "eventId" }),
  validate(CreateScheduleBlock),
  async (req, res, next) => {
    try {
      res.status(201).json(await PlanService.createBlock(req.body, { id: req.user!.id }));
    } catch (err: any) { handle(res, next, err); }
  },
);

router.patch(
  "/blocks/:blockId",
  requireEventManager({ in: "lookup", key: "blockId", via: "scheduleBlock" }),
  validate(UpdateScheduleBlock),
  async (req, res, next) => {
    try {
      res.json(await PlanService.updateBlock(getParam(req.params.blockId), req.body, { id: req.user!.id }));
    } catch (err: any) { handle(res, next, err); }
  },
);

router.delete(
  "/blocks/:blockId",
  requireEventManager({ in: "lookup", key: "blockId", via: "scheduleBlock" }),
  async (req, res, next) => {
    try {
      await PlanService.deleteBlock(getParam(req.params.blockId), { id: req.user!.id });
      res.status(204).send();
    } catch (err: any) { handle(res, next, err); }
  },
);

// ---- Running order ----
//
// Guarded on `body.eventId` because that is what the handler itself acts on —
// the service scopes every draw, block and mat in the payload to that event. A
// path param here would be a second, unchecked source of truth (see AGENTS.md).
router.put(
  "/order",
  requireEventManager({ in: "body", key: "eventId" }),
  validate(SetPlanOrder),
  async (req, res, next) => {
    try {
      res.json(await PlanService.setOrder(req.body, { id: req.user!.id }));
    } catch (err: any) { handle(res, next, err); }
  },
);
