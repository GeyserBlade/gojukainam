import { prisma } from "../lib/prisma.js";
import { CreateEvent, UpdateEvent, CreateDivision, UpdateDivision, CreateWeightClass, UpdateWeightClass } from "../utils/validators.js";
import { ageOn } from "../utils/eligibility.js";
import { TEMPLATES, TEMPLATE_META, type TemplateName } from "../data/wkf-template.js";
import type { Gender } from "@prisma/client";

export class EventService {
  // ============ Events ============
  static async getAll() {
    return prisma.event.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: {
            divisions: true,
            weightClasses: true,
            entries: true,
          }
        }
      }
    });
  }

  static async getById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        divisions: { orderBy: [{ gender: "asc" }, { minAge: "asc" }] },
        weightClasses: { orderBy: [{ gender: "asc" }, { minKg: "asc" }] },
        _count: {
          select: { entries: true }
        }
      }
    });
  }

  static async create(data: unknown) {
    const body = CreateEvent.parse(data);
    return prisma.event.create({ data: body });
  }

  static async update(id: string, data: unknown) {
    const body = UpdateEvent.parse(data);
    return prisma.event.update({
      where: { id },
      data: body
    });
  }

  static async updateStatus(id: string, status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED") {
    return prisma.event.update({
      where: { id },
      data: { status }
    });
  }

  static async getActiveEvents() {
    return prisma.event.findMany({
      where: { status: { in: ["DRAFT", "ACTIVE"] } },
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: {
            divisions: true,
            weightClasses: true,
            entries: true,
          }
        }
      }
    });
  }

  static async delete(id: string) {
    // Check if event has entries
    const count = await prisma.entry.count({ where: { eventId: id } });
    if (count > 0) {
      throw { status: 400, message: `Cannot delete event with ${count} existing entries` };
    }

    return prisma.event.delete({ where: { id } });
  }

  // ============ Divisions ============
  static async getDivisions(eventId: string) {
    return prisma.division.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { entries: true }
        }
      },
      orderBy: [{ gender: "asc" }, { minAge: "asc" }]
    });
  }

  static async createDivision(data: unknown) {
    const body = CreateDivision.parse(data);
    return prisma.division.create({ data: body });
  }

  static async updateDivision(id: string, data: unknown) {
    const body = UpdateDivision.parse(data);
    return prisma.division.update({
      where: { id },
      data: body
    });
  }

  static async deleteDivision(id: string) {
    const count = await prisma.entry.count({ where: { divisionId: id } });
    if (count > 0) {
      throw { status: 400, message: `Cannot delete division with ${count} existing entries` };
    }

    return prisma.division.delete({ where: { id } });
  }

  // ============ Weight Classes ============
  static async getWeightClasses(eventId: string) {
    return prisma.weightClass.findMany({
      where: { eventId },
      include: {
        division: { select: { name: true } },
        _count: {
          select: { entries: true }
        }
      },
      orderBy: [{ gender: "asc" }, { minKg: "asc" }]
    });
  }

  static async createWeightClass(data: unknown) {
    const body = CreateWeightClass.parse(data);
    return prisma.weightClass.create({ data: body });
  }

  static async updateWeightClass(id: string, data: unknown) {
    const body = UpdateWeightClass.parse(data);
    return prisma.weightClass.update({
      where: { id },
      data: body
    });
  }

  static async deleteWeightClass(id: string) {
    const count = await prisma.entry.count({ where: { weightClassId: id } });
    if (count > 0) {
      throw { status: 400, message: `Cannot delete weight class with ${count} existing entries` };
    }

    return prisma.weightClass.delete({ where: { id } });
  }

  // ============ Eligible Athletes ============
  static async getEligibleAthletes(eventId: string, divisionId: string, clubId?: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw { status: 404, message: "Event not found" };

    const division = await prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw { status: 404, message: "Division not found" };

    if (division.eventId !== eventId) {
      throw { status: 400, message: "Division does not belong to this event" };
    }

    console.log('=== ELIGIBLE ATHLETES DEBUG ===');
    console.log('Event:', { id: event.id, name: event.name, startDate: event.startDate });
    console.log('Division:', {
      id: division.id,
      name: division.name,
      category: division.category,
      gender: division.gender,
      minAge: division.minAge,
      maxAge: division.maxAge
    });
    console.log('Filter clubId:', clubId || 'none');

    // Get all athletes (optionally filtered by club)
    const where: any = {};
    if (clubId) where.clubId = clubId;

    const athletes = await prisma.athlete.findMany({
      where,
      include: {
        club: { select: { name: true } },
        belt: { select: { name: true, colour: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });

    console.log('Total athletes fetched:', athletes.length);

    // Filter by age and gender eligibility
    const eligible = athletes.filter(athlete => {
      const age = ageOn(event.startDate, athlete.dob);

      // Check gender
      if (athlete.gender !== division.gender) {
        console.log(`❌ ${athlete.firstName} ${athlete.lastName}: Gender mismatch (${athlete.gender} vs ${division.gender})`);
        return false;
      }

      // Check age
      if (age < division.minAge || age > division.maxAge) {
        console.log(`❌ ${athlete.firstName} ${athlete.lastName}: Age ${age} not in range ${division.minAge}-${division.maxAge}`);
        return false;
      }

      console.log(`✅ ${athlete.firstName} ${athlete.lastName}: Eligible (age ${age}, gender ${athlete.gender})`);
      return true;
    });

    console.log('Eligible athletes after filtering:', eligible.length);

    // Get existing entries for this division
    const existingEntries = await prisma.entry.findMany({
      where: {
        eventId,
        divisionId,
      },
      select: { athleteId: true }
    });

    console.log('Existing entries in this division:', existingEntries.length);

    const enteredAthleteIds = new Set(existingEntries.map(e => e.athleteId).filter(Boolean));

    // Return athletes with eligibility info and age
    const result = eligible.map(athlete => ({
      ...athlete,
      age: ageOn(event.startDate, athlete.dob),
      isEntered: enteredAthleteIds.has(athlete.id),
    }));

    console.log('Returning', result.length, 'athletes');
    console.log('==============================\n');

    return result;
  }

  static async updateConfig(eventId: string, config: any) {
    return prisma.event.update({
      where: { id: eventId },
      data: { configJson: JSON.stringify(config) }
    });
  }

  // ============ Template ============

  static listTemplates() {
    return TEMPLATE_META;
  }

  static async applyTemplate(eventId: string, templateName: TemplateName) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw { status: 404, message: "Event not found" };

    const template = TEMPLATES[templateName];

    // Build a set of already-existing division keys to skip duplicates
    const existingDivisions = await prisma.division.findMany({
      where: { eventId },
      select: { key: true, gender: true },
    });
    const existingKeys = new Set(existingDivisions.map(d => `${d.key}:${d.gender}`));

    let divisionsCreated = 0;
    let divisionsSkipped = 0;
    let weightClassesCreated = 0;

    for (const def of template) {
      const compositeKey = `${def.key}:${def.gender}`;

      if (existingKeys.has(compositeKey)) {
        divisionsSkipped++;
        continue;
      }

      const division = await prisma.division.create({
        data: {
          eventId,
          key: def.key,
          name: def.name,
          minAge: def.minAge,
          maxAge: def.maxAge,
          gender: def.gender,
          category: def.category,
          notes: def.notes ?? null,
        },
      });
      divisionsCreated++;

      if (def.weightClasses && def.weightClasses.length > 0) {
        await prisma.weightClass.createMany({
          data: def.weightClasses.map(wc => ({
            eventId,
            divisionId: division.id,
            gender: def.gender,
            name: wc.name,
            minKg: wc.minKg,
            maxKg: wc.maxKg,
          })),
        });
        weightClassesCreated += def.weightClasses.length;
      }
    }

    return {
      divisionsCreated,
      divisionsSkipped,
      weightClassesCreated,
      message: `Applied ${templateName}: ${divisionsCreated} divisions and ${weightClassesCreated} weight classes created${divisionsSkipped > 0 ? `, ${divisionsSkipped} already existed and were skipped` : ""}.`,
    };
  }
}
