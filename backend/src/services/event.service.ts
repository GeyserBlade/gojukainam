import { prisma } from "../server.js";

export class EventService {
  static async getAll() {
    return prisma.event.findMany({ orderBy: { startDate: "desc" } });
  }

  static async getDivisions(eventId: string) {
    return prisma.division.findMany({ where: { eventId } });
  }

  static async getWeightClasses(eventId: string) {
    return prisma.weightClass.findMany({ where: { eventId } });
  }

  static async updateConfig(eventId: string, config: any) {
    return prisma.event.update({
      where: { id: eventId },
      data: { configJson: JSON.stringify(config) }
    });
  }
}
