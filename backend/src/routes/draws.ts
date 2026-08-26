import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { requireBoutScorer, requireDrawViewer, requireEventManager } from "../utils/event-scope.js";
import { DrawService } from "../services/draw.service.js";
import { AthleteIndexService } from "../services/athlete-index.service.js";
import { validate, validateMultiple } from "../middleware/validate.js";
import {
  CreateDraw,
  RegenerateDraw,
  SetBoutWinner,
  SetBoutScore,
  SetDrawLock,
  EventIdQuery,
  IdParam,
  BoutParams,
  CategorySeedsQuery,
  SetCategorySeeds,
} from "../utils/validators.js";
import { getParam } from "../utils/params.js";

export const router = Router();

const VIEW_ROLES = ["CLUB_MANAGER", "COACH", "ATHLETE", "ADMIN", "SUPERADMIN"] as const;

// Category overview for an event (entry counts + draw state per category)
router.get("/", requireRoles(...VIEW_ROLES), validate(EventIdQuery, "query"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId: string };
    res.json(await DrawService.list(eventId));
  } catch (err) { next(err); }
});

// Seeding for one category. Must be declared before "/:id" or the param route
// swallows it. validate(..., "query") only checks and never writes back
// (req.query is read-only in Express), so the raw values are read here.
router.get("/seeds", requireEventManager({ in: "query", key: "eventId" }), validate(CategorySeedsQuery, "query"), async (req, res, next) => {
  try {
    const { eventId, divisionId } = req.query as { eventId: string; divisionId: string };
    res.json(await DrawService.listCategorySeeds({
      eventId,
      divisionId,
      weightClassId: (req.query.weightClassId as string) || null,
    }));
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Replace a category's seeding wholesale
router.put("/seeds", requireEventManager({ in: "body", key: "eventId" }), validate(SetCategorySeeds), async (req, res, next) => {
  try {
    const { eventId, divisionId, weightClassId, seeds } = req.body;
    res.json(await DrawService.setCategorySeeds(
      { eventId, divisionId, weightClassId: weightClassId ?? null },
      seeds,
      { id: req.user!.id }
    ));
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Athlete search index for an event: one row per competitor with a one-line
// status per category. Declared before "/:id" or the param route swallows
// "/athletes". Same gate as the category overview above — a bracket, a podium
// and an athlete's run through them are the same facts at three altitudes, and
// the spectator board already publishes all three by share token.
router.get("/athletes", requireRoles(...VIEW_ROLES), validate(EventIdQuery, "query"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId: string };
    res.json(await AthleteIndexService.list(eventId));
  } catch (err) { next(err); }
});

// One athlete's full run: every category they entered and every bout in each
router.get("/athletes/:athleteId", requireRoles(...VIEW_ROLES), validate(EventIdQuery, "query"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId: string };
    res.json(await AthleteIndexService.get(eventId, getParam(req.params.athleteId)));
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Full bracket for one draw
router.get("/:id", requireDrawViewer(VIEW_ROLES, "id"), validate(IdParam, "params"), async (req, res, next) => {
  try {
    res.json(await DrawService.get(getParam(req.params.id)));
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Generate a draw for a category
router.post("/", requireEventManager({ in: "body", key: "eventId" }), validate(CreateDraw), async (req, res, next) => {
  try {
    const row = await DrawService.create(req.body, { id: req.user!.id });
    res.status(201).json(row);
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Lock (publish) or unlock a draw
router.put("/:id/lock", requireEventManager({ in: "lookup", key: "id", via: "draw" }), validateMultiple({ params: IdParam, body: SetDrawLock }), async (req, res, next) => {
  try {
    const row = await DrawService.setLock(getParam(req.params.id), req.body.locked, { id: req.user!.id });
    res.json(row);
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Redraw with current entries (force: true discards captured results)
router.post("/:id/regenerate", requireEventManager({ in: "lookup", key: "id", via: "draw" }), validateMultiple({ params: IdParam, body: RegenerateDraw }), async (req, res, next) => {
  try {
    const row = await DrawService.regenerate(getParam(req.params.id), !!req.body.force, { id: req.user!.id });
    res.json(row);
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Capture or clear a bout result
router.put("/:id/bouts/:boutId", requireBoutScorer("boutId"), validateMultiple({ params: BoutParams, body: SetBoutWinner }), async (req, res, next) => {
  try {
    const row = await DrawService.setBoutWinner(
      getParam(req.params.id),
      getParam(req.params.boutId),
      req.body.winnerEntryId,
      { id: req.user!.id, role: req.user!.role }
    );
    res.json(row);
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Best-effort "this bout is being scored now" ping from the mat-side
// scoreboard — no body, idempotent, unaudited (see DrawService.startBout).
router.post("/:id/bouts/:boutId/start", requireBoutScorer("boutId"), validate(BoutParams, "params"), async (req, res, next) => {
  try {
    const row = await DrawService.startBout(getParam(req.params.id), getParam(req.params.boutId));
    res.json(row);
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Capture a fully scored result: WKF kumite points, or a kata flag decision
// (outcome FLAGS, plus the kata each competitor performed)
router.put("/:id/bouts/:boutId/score", requireBoutScorer("boutId"), validateMultiple({ params: BoutParams, body: SetBoutScore }), async (req, res, next) => {
  try {
    const row = await DrawService.setBoutScore(
      getParam(req.params.id),
      getParam(req.params.boutId),
      req.body,
      { id: req.user!.id, role: req.user!.role }
    );
    res.json(row);
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.delete("/:id", requireEventManager({ in: "lookup", key: "id", via: "draw" }), validate(IdParam, "params"), async (req, res, next) => {
  try {
    await DrawService.delete(getParam(req.params.id), { id: req.user!.id });
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});
