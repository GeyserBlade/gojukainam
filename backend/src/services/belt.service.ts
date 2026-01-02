import { prisma } from "../server.js";
import { CreateBelt, UpdateBelt } from "../utils/validators.js";

export class BeltService {
  static async getAll() {
    return prisma.belt.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, colour: true, notes: true, gradingRequirements: true, order: true,
        createdAt: true, updatedAt: true,
        _count: { select: { Athlete: true } },
      },
    });
  }

  static async getById(id: string) {
    return prisma.belt.findUnique({
      where: { id },
      select: {
        id: true, name: true, colour: true, notes: true, gradingRequirements: true, order: true,
        createdAt: true, updatedAt: true,
        _count: { select: { Athlete: true } },
      },
    });
  }

  static async create(data: unknown) {
    const parsedData = CreateBelt.parse(data);
    return prisma.belt.create({ data: parsedData });
  }

  static async update(id: string, data: unknown) {
    const parsedData = UpdateBelt.parse(data);
    return prisma.belt.update({ where: { id }, data: parsedData });
  }

  static async delete(id: string) {
    const count = await prisma.athlete.count({ where: { beltId: id } });
    if (count > 0) {
      throw { status: 409, message: "Cannot delete belt: it is referenced by athletes", meta: { athleteCount: count } };
    }
    return prisma.belt.delete({ where: { id } });
  }
}
