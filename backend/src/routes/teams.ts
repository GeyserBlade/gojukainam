import { Router } from "express";
import { prisma } from "../server";
import { CreateTeam, AddTeamMembers } from "../utils/validators";

export const router = Router();

// list teams (club scoped unless admin)
router.get("/", async (req, res) => {
  const { eventId, clubId } = req.query as { eventId?: string; clubId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });
  const where: any = { eventId };
  if (req.user?.role !== "SUPERADMIN" && req.user?.role !== "ADMIN") {
    where.clubId = req.user?.clubId;
  } else if (clubId) where.clubId = clubId;

  const rows = await prisma.team.findMany({
    where, include: { members: { include: { athlete: true } }, division: true, club: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(rows);
});

// create team
router.post("/", async (req, res, next) => {
  try {
    const body = CreateTeam.parse(req.body);
    if (req.user?.role !== "SUPERADMIN" && req.user?.role !== "ADMIN") {
      if (req.user?.clubId !== body.clubId) return res.status(403).json({ error: "Forbidden" });
    }
    const row = await prisma.team.create({ data: body });
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// add team members (enforces unique member per team)
router.post("/members", async (req, res, next) => {
  try {
    const { teamId, members } = AddTeamMembers.parse(req.body);
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.role !== "ADMIN") {
      if (req.user?.clubId !== team.clubId) return res.status(403).json({ error: "Forbidden" });
    }
    // optional: check team size limits from event config later
    await prisma.teamMember.createMany({ data: members.map(m => ({ teamId, ...m })) });
    const updated = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    res.json(updated);
  } catch (err) { next(err); }
});
