import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireEventManager } from "../utils/event-scope.js";
import { BulkUpdateEntryStatus } from "../utils/validators.js";

export const router = Router();

// bulk status update (admins, or this event's coordinator)
// Every route here carries eventId in the body/query and every write is scoped
// by it, so the guard and the query agree on which event is being touched.
router.post("/bulk-status", requireEventManager({ in: "body", key: "eventId" }), async (req, res, next) => {
  try {
    const { eventId, ids, status, reason } = BulkUpdateEntryStatus.parse(req.body);
    const userId = req.user?.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. update entries
      const updated = await tx.entry.updateMany({
        where: {
          eventId,
          id: { in: ids },
          status: { not: status }, // skip if already set
        },
        data: { status },
      });

      // 2. create audit logs for each?
      // For bulk, creating N logs is expensive. We might create one summary log or just log simple lines.
      // To keep it simple, we'll create individual logs for correct history tracking.
      // We need to fetch the IDs that were actually updated if we want precise logs,
      // but updateMany doesn't return IDs. 
      // Compromise: Log "Bulk status update" for the list.
      if (updated.count > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            entityType: "Entry (Bulk)",
            entityId: eventId, // associate with event?
            action: `BULK_STATUS_${status}`,
            diffJson: JSON.stringify({ ids, count: updated.count, reason }),
          }
        });
      }

      return updated;
    });

    res.json(result);
  } catch (err) { next(err); }
});


// queue: entries submitted for an event (admins, or this event's coordinator)
router.get("/", requireEventManager({ in: "query", key: "eventId" }), async (req, res) => {
  const { eventId } = req.query as { eventId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });
  const rows = await prisma.entry.findMany({
    where: { eventId, status: "SUBMITTED" },
    include: { athlete: true, team: true, division: true, club: true },
    orderBy: [{ divisionId: "asc" }, { createdAt: "asc" }]
  });
  res.json(rows);
});

// bulk approve/return (admins, or this event's coordinator)
router.post("/bulk", requireEventManager({ in: "body", key: "eventId" }), async (req, res, next) => {
  try {
    const { eventId, ids, status, reason } = BulkUpdateEntryStatus.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.entry.updateMany({
        where: { eventId, id: { in: ids }, status: "SUBMITTED" },
        // Record the reason on RETURNED entries so clubs see it; clear on APPROVE.
        data: { status, statusReason: status === "RETURNED" ? (reason ?? null) : null }
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
