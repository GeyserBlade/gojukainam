import { prisma } from "../server.js";
import { CreateClub, UpdateClub } from "../utils/validators.js";

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

export class ClubService {
  static async getAll() {
    return prisma.club.findMany({
      select: clubSelect,
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.club.findUnique({
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
  }

  static async create(data: unknown) {
    const parsed = CreateClub.parse(data);
    return prisma.club.create({
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
  }

  static async update(id: string, data: unknown) {
    const parsed = UpdateClub.parse(data);
    return prisma.club.update({
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
  }

  static async delete(id: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { athletes: true, users: true, teams: true, entries: true, invoices: true } },
      },
    });
    if (!club) throw { status: 404, message: "Not found" };

    const { athletes, users, teams, entries, invoices } = club._count;
    if (athletes || users || teams || entries || invoices) {
      throw {
        status: 409,
        message: "Cannot delete club with linked records",
        meta: { athletes, users, teams, entries, invoices },
      };
    }

    return prisma.club.delete({ where: { id } });
  }
}
