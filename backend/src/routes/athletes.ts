import { Router } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { CreateAthlete } from "../utils/validators";

export const router = Router();

function scrubEmptyStrings<T extends Record<string, any>>(obj: T): T {
  const copy: any = Array.isArray(obj) ? [] : { ...obj };
  for (const k in obj) {
    const v = obj[k];
    if (v === "") copy[k] = undefined;
  }
  return copy as T;
}

// list all athletes (Superadmin)
router.get("/all", requireRoles("SUPERADMIN"), async (_req, res) => {
  const rows = await prisma.athlete.findMany({
    include: {
      club: { select: { id: true, name: true } },
      belt: { select: { id: true, name: true, colour: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(rows);
});

// list own club athletes (Club Manager / Coach)
router.get("/", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res) => {
  const { clubId } = req.query as { clubId?: string };
  if (!clubId) return res.status(400).json({ error: "clubId required" });
  // authorization: club scoped
  if (req.user?.role === "CLUB_MANAGER") {
    if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
  }
  const rows = await prisma.athlete.findMany({
    where: { clubId },
    include: {
      club: { select: { id: true, name: true } },
      belt: { select: { id: true, name: true, colour: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(rows);
});

// get single athlete by id (admin/club scoped)
router.get("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await prisma.athlete.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        belt: { select: { id: true, name: true, colour: true } },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== row.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(row);
  } catch (err) { next(err); }
});

// create athlete (club scoped)
router.post("/", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const parsed = CreateAthlete.parse(scrubEmptyStrings(req.body));
    // club scoping
    if (req.user?.role === "CLUB_MANAGER") {
      if (req.user.clubId !== parsed.clubId) return res.status(403).json({ error: "Forbidden" });
    }
    const athleteData = { ...parsed, gender: parsed.gender as "Male" | "Female" };
    const row = await prisma.athlete.create({ data: athleteData });
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// update athlete (club scoped)
router.put("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await prisma.athlete.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = (CreateAthlete.partial()).parse(scrubEmptyStrings(req.body));
    // Remove clubId from update data, as it cannot be updated
    if ("clubId" in data) {
      delete data.clubId;
    }
    const { clubId, ...updateData } = data as any;
    if (updateData.gender && updateData.gender !== "Male" && updateData.gender !== "Female") {
      return res.status(400).json({ error: "Invalid gender value" });
    }
    if (updateData.gender && (updateData.gender === "Male" || updateData.gender === "Female")) {
      // ok
    } else if (updateData.gender) {
      delete updateData.gender;
    }
    const row = await prisma.athlete.update({ where: { id }, data: updateData });
    res.json(row);
  } catch (err) { next(err); }
});

// delete athlete (club scoped)
router.delete("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.athlete.findUnique({
      where: { id },
      select: { id: true, clubId: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    // Only SUPERADMIN or same-club users may delete
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.$transaction(async (tx) => {
      // Remove dependent relations first to satisfy FK constraints
      await tx.teamMember.deleteMany({ where: { athleteId: id } });
      await tx.entry.deleteMany({ where: { athleteId: id } });
      await tx.athlete.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (err) { next(err); }
});
