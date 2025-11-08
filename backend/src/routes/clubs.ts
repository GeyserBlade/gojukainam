import { Router } from "express";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { CreateClub, UpdateClub } from "../utils/validators";

export const router = Router();

const clubSelect = {
  id: true,
  name: true,
  region: true,
  contactName: true,
  email: true,
  phone: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      athletes: true,
      users: true,
      teams: true,
      entries: true,
    },
  },
};

function normalizeOptional(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// list clubs (admin only)
router.get("/", requireRoles("SUPERADMIN", "ADMIN"), async (_req, res, next) => {
  try {
    const clubs = await prisma.club.findMany({
      select: clubSelect,
      orderBy: { name: "asc" },
    });
    res.json(clubs);
  } catch (err) { next(err); }
});

// get club by id
router.get("/:id", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        region: true,
        contactName: true,
        email: true,
        phone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
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
    const parsed = CreateClub.parse(req.body);
    const created = await prisma.club.create({
      data: {
        name: parsed.name.trim(),
        region: normalizeOptional(parsed.region) ?? null,
        contactName: parsed.contactName.trim(),
        email: parsed.email.trim(),
        phone: normalizeOptional(parsed.phone) ?? null,
        notes: normalizeOptional(parsed.notes) ?? null,
      },
      select: clubSelect,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// update club
router.put("/:id", requireRoles("SUPERADMIN", "ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.club.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const parsed = UpdateClub.parse(req.body);
    const updated = await prisma.club.update({
      where: { id },
      data: {
        name: parsed.name?.trim(),
        region: normalizeOptional(parsed.region),
        contactName: parsed.contactName?.trim(),
        email: parsed.email?.trim(),
        phone: normalizeOptional(parsed.phone),
        notes: normalizeOptional(parsed.notes),
      },
      select: clubSelect,
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// delete club
router.delete("/:id", requireRoles("SUPERADMIN", "ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { athletes: true, users: true, teams: true, entries: true, invoices: true } },
      },
    });
    if (!club) return res.status(404).json({ error: "Not found" });

    const { athletes, users, teams, entries, invoices } = club._count;
    if (athletes || users || teams || entries || invoices) {
      return res.status(409).json({
        error: "Cannot delete club with linked records",
        meta: { athletes, users, teams, entries, invoices },
      });
    }

    await prisma.club.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});
