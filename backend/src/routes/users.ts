import { Router } from "express";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { CreateUser, UpdateUser } from "../utils/validators";

export const router = Router();

// Helper to enforce special role constraints
function assertCreateRoleAllowed(requestorRole: "SUPERADMIN"|"ADMIN", newRole: string) {
  if (newRole === "SUPERADMIN") {
    throw Object.assign(new Error("Cannot create SUPERADMIN via API"), { status: 403 });
  }
  if (newRole === "ADMIN" && requestorRole !== "SUPERADMIN") {
    throw Object.assign(new Error("Only SUPERADMIN can create ADMIN users"), { status: 403 });
  }
}

function assertUpdateRoleAllowed(requestorRole: "SUPERADMIN"|"ADMIN", targetRole: string, newRole?: string) {
  if (targetRole === "SUPERADMIN") {
    throw Object.assign(new Error("Cannot modify SUPERADMIN"), { status: 403 });
  }
  if (newRole) {
    if (newRole === "SUPERADMIN") {
      throw Object.assign(new Error("Cannot assign SUPERADMIN role"), { status: 403 });
    }
    if (newRole === "ADMIN" && requestorRole !== "SUPERADMIN") {
      throw Object.assign(new Error("Only SUPERADMIN can assign ADMIN role"), { status: 403 });
    }
  }
}

// List users (restricted to ADMIN/SUPERADMIN)
router.get("/", requireRoles("ADMIN", "SUPERADMIN"), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, clubId: true, createdAt: true, updatedAt: true },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });
    res.json(users);
  } catch (err) { next(err); }
});

// Get single user
router.get("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, clubId: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) { next(err); }
});

// Create user
router.post("/", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const parsed = CreateUser.parse(req.body);
    const requester = req.user!; // ensured by requireRoles
    assertCreateRoleAllowed(requester.role, parsed.role);

    const created = await prisma.user.create({
      data: {
        name: parsed.name ?? null,
        email: parsed.email,
        role: parsed.role as any,
        clubId: parsed.clubId ?? null,
      },
      select: { id: true, name: true, email: true, role: true, clubId: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// Update user
router.put("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const data = UpdateUser.parse(req.body);
    assertUpdateRoleAllowed(req.user!.role, existing.role, data.role);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        email: data.email ?? undefined,
        role: (data.role as any) ?? undefined,
        clubId: data.clubId === undefined ? undefined : (data.clubId ?? null),
      },
      select: { id: true, name: true, email: true, role: true, clubId: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete user
router.delete("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.role === "SUPERADMIN") return res.status(403).json({ error: "Cannot delete SUPERADMIN" });

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

