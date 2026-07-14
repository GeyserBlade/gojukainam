import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../utils/auth.js";
import { DrawService } from "../services/draw.service.js";

export const router = Router();

// Event-wide results: per-category podiums + club medal tally
router.get("/results", requireRoles("CLUB_MANAGER", "COACH", "ATHLETE", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId?: string };
    if (!eventId) return res.status(400).json({ error: "eventId required" });
    res.json(await DrawService.eventResults(eventId));
  } catch (err) { next(err); }
});

// ... existing code ...

router.get("/entries.csv", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), async (req, res) => {
  const { eventId } = req.query as { eventId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });

  // scope to club for non-admins
  const where: any = { eventId };
  const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";
  if (!isAdmin) {
    if (!req.user?.clubId) return res.status(400).json({ error: "clubId missing for scoped request" });
    where.clubId = req.user.clubId;
  }

  const rows = await prisma.entry.findMany({
    where,
    include: { athlete: true, team: true, division: true, club: true, weightClass: true },
    orderBy: { createdAt: "asc" }
  });

  const header = [
    "entryId","status","type","club","athlete","team","division","weightClass","feeCents","createdAt"
  ];
  const lines = rows.map(r => [
    r.id, r.status, r.entryType,
    r.club?.name ?? "",
    r.athlete ? `${r.athlete.firstName} ${r.athlete.lastName}` : "",
    r.team?.name ?? "",
    r.division?.name ?? "",
    r.weightClass?.name ?? "",
    r.feeCents,
    r.createdAt.toISOString(),
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="entries-${eventId}.csv"`);
  res.send([header.join(","), ...lines].join("\n"));
});
