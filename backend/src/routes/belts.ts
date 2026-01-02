import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { BeltService } from "../services/belt.service.js";

export const router = Router();

// List belts
router.get("/", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), async (_req, res, next) => {
  try {
    const rows = await BeltService.getAll();
    res.json(rows);
  } catch (err) { next(err); }
});

// Get a single belt
router.get("/:id", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await BeltService.getById(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// Create belt
router.post("/", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const row = await BeltService.create(req.body);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// Update belt
router.put("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await BeltService.getById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = await BeltService.update(id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete belt
router.delete("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    await BeltService.delete(id);
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message, meta: err.meta });
    }
    if (err?.code === "P2003") {
      return res.status(409).json({ error: "Cannot delete belt due to foreign key references" });
    }
    next(err);
  }
});
