import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { TeamService } from "../services/team.service.js";

export const router = Router();

// list teams (club scoped unless admin)
router.get("/", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { eventId, clubId } = req.query as { eventId?: string; clubId?: string };
    if (!eventId) return res.status(400).json({ error: "eventId required" });
    
    const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";
    let effectiveClubId = clubId;

    if (!isAdmin) {
      if (!req.user?.clubId) {
        return res.status(400).json({ error: "clubId missing for scoped request" });
      }
      effectiveClubId = req.user.clubId;
    }

    const rows = await TeamService.list(eventId, effectiveClubId);
    res.json(rows);
  } catch (err) { next(err); }
});

// create team
router.post("/", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    // Peek at body to check permission before service call
    // Note: Validation happens in service, but we need clubId for authz.
    // Assuming body structure matches CreateTeam validator { clubId: string, ... }
    const clubId = req.body?.clubId;
    const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";
    
    if (!isAdmin) {
      if (!req.user?.clubId) return res.status(400).json({ error: "clubId missing for scoped request" });
      if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
    }
    
    const row = await TeamService.create(req.body);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// add team members (enforces unique member per team)
router.post("/members", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const teamId = req.body?.teamId;
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    // Check ownership
    const team = await TeamService.getById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";
    if (!isAdmin) {
      if (!req.user?.clubId) return res.status(400).json({ error: "clubId missing for scoped request" });
      if (req.user.clubId !== team.clubId) return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await TeamService.addMembers(req.body);
    res.json(updated);
  } catch (err) { next(err); }
});
