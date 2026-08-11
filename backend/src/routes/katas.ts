import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { KataService } from "../services/kata.service.js";
import { validate } from "../middleware/validate.js";
import { CreateKata, KataListQuery, UpdateKata } from "../utils/validators.js";
import { getParam } from "../utils/params.js";

export const router = Router();

/**
 * Reading the list is deliberately open to every authenticated role, tatami
 * operators included: a kata bout cannot be scored without it, and the list is
 * a syllabus — public knowledge, not event data. Editing stays with admins,
 * like belts.
 */
const READ_ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "CLUB_MANAGER",
  "COACH",
  "ATHLETE",
  "TATAMI_OPERATOR",
] as const;

// List katas. Active only unless ?includeInactive=1.
router.get("/", requireRoles(...READ_ROLES), validate(KataListQuery, "query"), async (req, res, next) => {
  try {
    res.json(await KataService.getAll(req.query.includeInactive === "1"));
  } catch (err) { next(err); }
});

router.get("/:id", requireRoles(...READ_ROLES), async (req, res, next) => {
  try {
    const row = await KataService.getById(getParam(req.params.id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

router.post("/", requireRoles("ADMIN", "SUPERADMIN"), validate(CreateKata), async (req, res, next) => {
  try {
    res.status(201).json(await KataService.create(req.body));
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(409).json({ error: "A kata with that name already exists" });
    next(err);
  }
});

router.put("/:id", requireRoles("ADMIN", "SUPERADMIN"), validate(UpdateKata), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    if (!(await KataService.getById(id))) return res.status(404).json({ error: "Not found" });
    res.json(await KataService.update(id, req.body));
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(409).json({ error: "A kata with that name already exists" });
    next(err);
  }
});

router.delete("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    await KataService.delete(getParam(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) return res.status(err.status).json({ error: err.message, meta: err.meta });
    next(err);
  }
});
