import { Router } from "express";
import { prisma } from "../server";

export const router = Router();

// get club by id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) return res.status(404).json({ error: "Not found" });

    // Authorization: SUPERADMIN/ADMIN can read any; others only own club
    const role = req.user?.role;
    if (role !== "SUPERADMIN" && role !== "ADMIN") {
      if (req.user?.clubId !== id) return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ id: club.id, name: club.name, region: club.region });
  } catch (err) { next(err); }
});

