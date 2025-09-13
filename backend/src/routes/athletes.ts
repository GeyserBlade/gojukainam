import { Router } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { CreateAthlete } from "../utils/validators";

export const router = Router();

// list all athletes (Superadmin)
router.get("/all", requireRoles("SUPERADMIN"), async (req, res) => {
  const rows = await prisma.athlete.findMany({
    include: { club: { select: { id: true, name: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(rows);
});

// list own club athletes (Club Manager / Coach)
router.get("/", async (req, res) => {
  const { clubId } = req.query as { clubId?: string };
  if (!clubId) return res.status(400).json({ error: "clubId required" });
  // authorization: club scoped
  if (req.user?.role === "CLUB_MANAGER" || req.user?.role === "COACH") {
    if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
  }
  const rows = await prisma.athlete.findMany({
    where: { clubId },
    include: { club: { select: { id: true, name: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(rows);
});

// create athlete (club scoped)
router.post("/", async (req, res, next) => {
  try {
    const parsed = CreateAthlete.parse(req.body);
    // club scoping
    if (req.user?.role === "CLUB_MANAGER" || req.user?.role === "COACH") {
      if (req.user.clubId !== parsed.clubId) return res.status(403).json({ error: "Forbidden" });
    }
    // Ensure gender is only "Male" or "Female" for Prisma
    const athleteData = { ...parsed, gender: parsed.gender as "Male" | "Female" };
    const row = await prisma.athlete.create({ data: athleteData });
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// update athlete (club scoped)
router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await prisma.athlete.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = (CreateAthlete.partial()).parse(req.body);
    // Remove clubId from update data, as it cannot be updated
    if ("clubId" in data) {
      delete data.clubId;
    }
    // Remove 'clubId' from the type as well
    const { clubId, ...updateData } = data;
   if (updateData.gender && updateData.gender !== "Male" && updateData.gender !== "Female") {
      return res.status(400).json({ error: "Invalid gender value" });
    }
    // Remove gender if it's undefined or not "Male"/"Female"
    if (updateData.gender !== "Male" && updateData.gender !== "Female") {
      delete updateData.gender;
    }
    const row = await prisma.athlete.update({ where: { id }, data: updateData as Omit<typeof updateData, "gender"> & { gender?: "Male" | "Female" } });
    res.json(row);
  } catch (err) { next(err); }
});

// delete athlete (club scoped)
router.delete("/:id", async (req, res, next) => {
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
