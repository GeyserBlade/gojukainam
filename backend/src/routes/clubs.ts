import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { ClubService } from "../services/club.service.js";

export const router = Router();

// list clubs (admin only)
router.get("/", requireRoles("SUPERADMIN", "ADMIN"), async (_req, res, next) => {
  try {
    const clubs = await ClubService.getAll();
    res.json(clubs);
  } catch (err) { next(err); }
});

// get club by id
router.get("/:id", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await ClubService.getById(id);
    if (!club) return res.status(404).json({ error: "Not found" });

    // Authorization: SUPERADMIN/ADMIN can read any; others only own club
    const role = req.user?.role;
    if (role !== "SUPERADMIN" && role !== "ADMIN") {
      if (req.user?.clubId !== id) return res.status(403).json({ error: "Forbidden" });
    }

    res.json(club);
  } catch (err) { next(err); }
});

// create club
router.post("/", requireRoles("SUPERADMIN", "ADMIN"), async (req, res, next) => {
  try {
    const created = await ClubService.create(req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// update club
router.put("/:id", requireRoles("SUPERADMIN", "ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await ClubService.getById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updated = await ClubService.update(id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

// delete club
router.delete("/:id", requireRoles("SUPERADMIN", "ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    await ClubService.delete(id);
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message, meta: err.meta });
    }
    next(err);
  }
});
