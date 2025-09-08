import { Router } from "express";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { BulkUpdateEntryStatus } from "../utils/validators";

export const router = Router();

// queue: entries submitted for an event
router.get("/", requireRoles("SUPERADMIN","ADMIN"), async (req, res) => {
  const { eventId } = req.query as { eventId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });
  const rows = await prisma.entry.findMany({
    where: { eventId, status: "SUBMITTED" },
    include: { athlete: true, team: true, division: true, club: true },
    orderBy: [{ divisionId: "asc" }, { createdAt: "asc" }]
  });
  res.json(rows);
});

// bulk approve/return
router.post("/bulk", requireRoles("SUPERADMIN","ADMIN"), async (req, res, next) => {
  try {
    const { eventId, ids, status, reason } = BulkUpdateEntryStatus.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.entry.updateMany({
        where: { eventId, id: { in: ids }, status: "SUBMITTED" },
        data: { status }
      });
      await tx.auditLog.create({
        data: {
          userId: req.user?.id, entityType: "Entry", entityId: `bulk:${Date.now()}`,
          action: `BULK_${status}`, diffJson: JSON.stringify({ ids, reason })
        }
      });
      return updated;
    });
    res.json({ updatedCount: result.count });
  } catch (err) { next(err); }
});
