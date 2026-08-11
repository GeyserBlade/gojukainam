import { prisma } from "../lib/prisma.js";
import { CreateKata, UpdateKata } from "../utils/validators.js";

const KATA_SELECT = {
  id: true,
  name: true,
  style: true,
  order: true,
  active: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { performances: true } },
} as const;

/**
 * The allowable kata list. Reference data in the same shape as belts: seeded
 * with the Goju Kai / Goju-ryu syllabus by migration, edited in the app after
 * that.
 */
export class KataService {
  /**
   * `includeInactive` is for the admin screen only. Everywhere a kata is being
   * *chosen* — the mat-side scoring screen — the list must be the active one,
   * or a retired kata comes back the moment someone scrolls far enough.
   */
  static async getAll(includeInactive = false) {
    return prisma.kata.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: KATA_SELECT,
    });
  }

  static async getById(id: string) {
    return prisma.kata.findUnique({ where: { id }, select: KATA_SELECT });
  }

  static async create(data: unknown) {
    return prisma.kata.create({ data: CreateKata.parse(data) });
  }

  static async update(id: string, data: unknown) {
    return prisma.kata.update({ where: { id }, data: UpdateKata.parse(data) });
  }

  /**
   * Refuses once a kata has been performed. A recorded result names the kata
   * that was actually done, and that must keep resolving — deactivating is the
   * way to take a kata out of circulation, which is why `active` exists.
   */
  static async delete(id: string) {
    const count = await prisma.kataPerformance.count({ where: { kataId: id } });
    if (count > 0)
      throw {
        status: 409,
        message:
          "This kata has already been performed in a recorded bout — untick “In use” to retire it instead",
        meta: { performanceCount: count },
      };
    return prisma.kata.delete({ where: { id } });
  }
}
