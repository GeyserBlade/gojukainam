import { Router } from "express";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { CreateBelt, UpdateBelt } from "../utils/validators";

export const router = Router();

// List belts
router.get("/", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), async (_req, res, next) => {
  try {
    const rows = await prisma.belt.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, colour: true, notes: true, gradingRequirements: true, order: true,
        createdAt: true, updatedAt: true,
        _count: { select: { Athlete: true } },
      },
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// Get a single belt
router.get("/:id", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await prisma.belt.findUnique({
      where: { id },
      select: {
        id: true, name: true, colour: true, notes: true, gradingRequirements: true, order: true,
        createdAt: true, updatedAt: true,
        _count: { select: { Athlete: true } },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// Create belt
router.post("/", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const data = CreateBelt.parse(req.body);
    const row = await prisma.belt.create({ data });
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// Update belt
router.put("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.belt.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const data = UpdateBelt.parse(req.body);
    const updated = await prisma.belt.update({ where: { id }, data });
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete belt
router.delete("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const count = await prisma.athlete.count({ where: { beltId: id } });
    if (count > 0) return res.status(409).json({ error: "Cannot delete belt: it is referenced by athletes", meta: { athleteCount: count } });
    await prisma.belt.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2003") {
      return res.status(409).json({ error: "Cannot delete belt due to foreign key references" });
    }
    next(err);
  }
});
