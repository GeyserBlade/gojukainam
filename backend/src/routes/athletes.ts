import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../utils/auth.js";
import { AthleteService } from "../services/athlete.service.js";
import { validate, validateMultiple } from "../middleware/validate.js";
import { CreateAthlete, UpdateAthlete, ClubAthletesQuery, IdParam } from "../utils/validators.js";
import multer from "multer";

export const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// list all athletes (Superadmin)
router.get("/all", requireRoles("SUPERADMIN"), async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const rows = await AthleteService.getAll(includeInactive);
  res.json(rows);
});

// list own club athletes (Club Manager / Coach)
router.get("/", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), validate(ClubAthletesQuery, 'query'), async (req, res) => {
  const { clubId } = req.query as { clubId: string };
  const includeInactive = req.query.includeInactive === "true";
  // authorization: club scoped
  if (req.user?.role === "CLUB_MANAGER") {
    if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
  }
  const rows = await AthleteService.getByClubId(clubId, includeInactive);
  res.json(rows);
});

// get single athlete by id (admin/club scoped)
router.get("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), validate(IdParam, 'params'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await AthleteService.getById(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== row.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(row);
  } catch (err) { next(err); }
});

// create athlete (club scoped)
router.post("/", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), validate(CreateAthlete), async (req, res, next) => {
  try {
    // We need to peek at the body to check clubId for authz before passing to service
    const clubId = req.body.clubId;
    if (req.user?.role === "CLUB_MANAGER") {
      if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
    }
    const row = await AthleteService.create(req.body);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// update athlete (club scoped)
router.put("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), validateMultiple({ params: IdParam, body: UpdateAthlete }), async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await AthleteService.getById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const row = await AthleteService.update(id, req.body);
    res.json(row);
  } catch (err) { next(err); }
});

// delete athlete (club scoped)
router.delete("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), validate(IdParam, 'params'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await AthleteService.getById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    // Only SUPERADMIN or same-club users may delete
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await AthleteService.delete(id);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post("/import", requireRoles("SUPERADMIN"), upload.single("file"), async (req, res, next) => {
  try {
    const clubId = (req.body?.clubId as string | undefined)?.trim();
    if (!clubId) return res.status(400).json({ error: "clubId required" });
    
    // Check if club exists - keeping this check here as it's a pre-condition for the service
    const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
    if (!club) return res.status(404).json({ error: "Club not found" });
    
    if (!req.file) return res.status(400).json({ error: "file required" });

    const result = await AthleteService.importAthletes(clubId, req.file.buffer, req.file.originalname);

    res.json(result);
  } catch (err: any) { 
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err); 
  }
});
