import { Router } from "express";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";

export const router = Router();

// list events (any logged user)
router.get("/", async (_req, res) => {
  const rows = await prisma.event.findMany({ orderBy: { startDate: "desc" } });
  res.json(rows);
});

// get divisions / weights for an event
router.get("/:id/divisions", async (req, res) => {
  const rows = await prisma.division.findMany({ where: { eventId: req.params.id } });
  res.json(rows);
});

router.get("/:id/weights", async (req, res) => {
  const rows = await prisma.weightClass.findMany({ where: { eventId: req.params.id } });
  res.json(rows);
});

// update config snapshot (admins)
router.put("/:id/config", requireRoles("SUPERADMIN","ADMIN"), async (req, res) => {
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: { configJson: JSON.stringify(req.body) }
  });
  res.json(event);
});
