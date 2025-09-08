import { Router } from "express";
import { prisma } from "../server";

export const router = Router();

router.get("/entries.csv", async (req, res) => {
  const { eventId } = req.query as { eventId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });

  // scope to club for non-admins
  const where: any = { eventId };
  if (req.user?.role !== "SUPERADMIN" && req.user?.role !== "ADMIN") {
    where.clubId = req.user?.clubId;
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
