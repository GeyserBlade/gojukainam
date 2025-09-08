import { Router } from "express";
import { prisma } from "../server";
import { CreateEntry, UpdateEntryStatus } from "../utils/validators";
import { assertNoDuplicateEntry, validateWeightClass } from "../utils/eligibility";

export const router = Router();

// list entries by event (club-scoped unless admin)
router.get("/", async (req, res) => {
  const { eventId, clubId } = req.query as { eventId?: string; clubId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });
  const where: any = { eventId };
  if (req.user?.role !== "SUPERADMIN" && req.user?.role !== "ADMIN") {
    where.clubId = req.user?.clubId; // force own club
  } else if (clubId) {
    where.clubId = clubId;
  }
  const rows = await prisma.entry.findMany({
    where,
    include: { athlete: true, team: true, division: true, weightClass: true, club: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows);
});

// create entry (individual or team)
router.post("/", async (req, res, next) => {
  try {
    const body = CreateEntry.parse(req.body);

    // club scoping
    if (req.user?.role !== "SUPERADMIN" && req.user?.role !== "ADMIN") {
      if (req.user?.clubId !== body.clubId) return res.status(403).json({ error: "Forbidden" });
    }

    // individual path
    if (body.entryType === "KATA" || body.entryType === "KUMITE") {
      if (!body.athleteId) throw { status: 400, message: "athleteId required for individual entries" };
      const athlete = await prisma.athlete.findUnique({ where: { id: body.athleteId } });
      if (!athlete) throw { status: 404, message: "Athlete not found" };
      if (athlete.clubId !== body.clubId) throw { status: 403, message: "Athlete does not belong to club" };

      // kumite needs weight class
      if (body.entryType === "KUMITE") {
        if (!body.weightClassId) throw { status: 400, message: "weightClassId required for Kumite" };
        await validateWeightClass(body.weightClassId, body.eventId, body.divisionId, athlete.gender);
      }

      await assertNoDuplicateEntry({
        eventId: body.eventId,
        entryType: body.entryType,
        divisionId: body.divisionId,
        athleteId: body.athleteId
      });
    }

    // team path
    if (body.entryType === "TEAM_KATA" || body.entryType === "TEAM_KUMITE") {
      if (!body.teamId) throw { status: 400, message: "teamId required for team entries" };
      const team = await prisma.team.findUnique({ where: { id: body.teamId } });
      if (!team) throw { status: 404, message: "Team not found" };
      if (team.clubId !== body.clubId) throw { status: 403, message: "Team does not belong to club" };

      await assertNoDuplicateEntry({
        eventId: body.eventId,
        entryType: body.entryType,
        divisionId: body.divisionId,
        teamId: body.teamId
      });
    }

    const row = await prisma.entry.create({ data: body });
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// change status (submit/approve/return)
router.put("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = UpdateEntryStatus.parse({ id, ...req.body });

    const existing = await prisma.entry.findUnique({
      where: { id }, include: { club: true }
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    // permissions:
    // - club can move DRAFT -> SUBMITTED on own entries
    // - admin can APPROVE/RETURN any
    const isClub = req.user?.role === "CLUB_MANAGER" || req.user?.role === "COACH";
    const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";

    if (isClub) {
      if (existing.clubId !== req.user?.clubId) return res.status(403).json({ error: "Forbidden" });
      if (status !== "SUBMITTED") return res.status(403).json({ error: "Club can only submit" });
    }
    if (!isAdmin && !isClub) return res.status(403).json({ error: "Forbidden" });

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.entry.update({ where: { id }, data: { status } });
      await tx.auditLog.create({
        data: {
          userId: req.user?.id, entityType: "Entry", entityId: id,
          action: `STATUS_${status}`, diffJson: JSON.stringify({ reason })
        }
      });
      return u;
    });

    res.json(updated);
  } catch (err) { next(err); }
});
