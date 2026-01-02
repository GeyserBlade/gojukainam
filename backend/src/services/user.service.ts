import { prisma } from "../server.js";
import { CreateUser, UpdateUser } from "../utils/validators.js";
import { Role } from "@prisma/client";

// Helper to enforce special role constraints
function assertCreateRoleAllowed(requestorRole: string, newRole: string) {
  if (newRole === "SUPERADMIN") {
    throw { status: 403, message: "Cannot create SUPERADMIN via API" };
  }
  if (newRole === "ADMIN" && requestorRole !== "SUPERADMIN") {
    throw { status: 403, message: "Only SUPERADMIN can create ADMIN users" };
  }
}

function assertUpdateRoleAllowed(requestorRole: string, targetRole: string, newRole?: string) {
  if (targetRole === "SUPERADMIN") {
    throw { status: 403, message: "Cannot modify SUPERADMIN" };
  }
  if (newRole) {
    if (newRole === "SUPERADMIN") {
      throw { status: 403, message: "Cannot assign SUPERADMIN role" };
    }
    if (newRole === "ADMIN" && requestorRole !== "SUPERADMIN") {
      throw { status: 403, message: "Only SUPERADMIN can assign ADMIN role" };
    }
  }
}

const userSelect = { 
  id: true, 
  name: true, 
  email: true, 
  role: true, 
  clubId: true, 
  createdAt: true, 
  updatedAt: true 
};

export class UserService {
  static async getAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });
  }

  static async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  static async create(data: unknown, requesterRole: string) {
    const parsed = CreateUser.parse(data);
    assertCreateRoleAllowed(requesterRole, parsed.role);

    return prisma.user.create({
      data: {
        name: parsed.name ?? null,
        email: parsed.email,
        role: parsed.role as Role,
        clubId: parsed.clubId ?? null,
      },
      select: userSelect,
    });
  }

  static async update(id: string, data: unknown, requesterRole: string) {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!existing) throw { status: 404, message: "Not found" };

    const parsed = UpdateUser.parse(data);
    assertUpdateRoleAllowed(requesterRole, existing.role, parsed.role);

    return prisma.user.update({
      where: { id },
      data: {
        name: parsed.name ?? undefined,
        email: parsed.email ?? undefined,
        role: (parsed.role as Role) ?? undefined,
        clubId: parsed.clubId === undefined ? undefined : (parsed.clubId ?? null),
      },
      select: userSelect,
    });
  }

  static async delete(id: string) {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!existing) throw { status: 404, message: "Not found" };
    if (existing.role === "SUPERADMIN") throw { status: 403, message: "Cannot delete SUPERADMIN" };

    return prisma.user.delete({ where: { id } });
  }
}
