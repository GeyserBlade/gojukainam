import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { CreateEvent, UpdateEvent, CreateDivision, UpdateDivision, CreateWeightClass, UpdateWeightClass, EventTimingConfig } from "../utils/validators.js";
import { ageOn } from "../utils/eligibility.js";
import { TEMPLATES, TEMPLATE_META, type TemplateName } from "../data/wkf-template.js";
import type { Gender } from "@prisma/client";

export class EventService {
  // ============ Events ============

  /** Aggregate readiness snapshot for the event hub Overview. */
  static async getReadiness(eventId: string) {
    const [statusGroups, generated, completed, locked, approvedTotal, checkedIn, mats, divisions] =
      await Promise.all([
        prisma.entry.groupBy({ by: ["status"], where: { eventId }, _count: true }),
        prisma.draw.count({ where: { eventId } }),
        prisma.draw.count({ where: { eventId, status: "COMPLETED" } }),
        prisma.draw.count({ where: { eventId, locked: true } }),
        prisma.entry.count({ where: { eventId, status: "APPROVED" } }),
        prisma.entry.count({ where: { eventId, status: "APPROVED", checkedIn: true } }),
        prisma.mat.count({ where: { eventId } }),
        prisma.division.count({ where: { eventId } }),
      ]);

    const byStatus = (s: string) => statusGroups.find((g) => g.status === s)?._count ?? 0;
    const entries = {
      draft: byStatus("DRAFT"),
      submitted: byStatus("SUBMITTED"),
      approved: byStatus("APPROVED"),
      returned: byStatus("RETURNED"),
      total: statusGroups.reduce((sum, g) => sum + g._count, 0),
    };

    return {
      entries,
      draws: { generated, completed, locked },
      checkin: { done: checkedIn, total: approvedTotal },
      mats,
      divisions,
    };
  }

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

  /**
   * Enable/disable (and rotate) the read-only public board token. Enabling
   * always mints a fresh token, so re-enabling revokes any previously shared
   * link. Disabling clears it entirely.
   */
  static async setPublicAccess(id: string, enabled: boolean) {
    const publicToken = enabled ? randomBytes(12).toString("hex") : null;
    return prisma.event.update({ where: { id }, data: { publicToken } });
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

  /**
   * RETURNED is an audit-trail state, not an active one — it doesn't block
   * draws elsewhere in the app, so it shouldn't block event deletion either.
   * Only DRAFT/SUBMITTED/APPROVED entries represent something a coordinator
   * could still be mid-workflow on.
   */
  static async delete(id: string) {
    const activeGroups = await prisma.entry.groupBy({
      by: ["status"],
      where: { eventId: id, status: { in: ["DRAFT", "SUBMITTED", "APPROVED"] } },
      _count: true,
    });
    const total = activeGroups.reduce((sum, g) => sum + g._count, 0);
    if (total > 0) {
      const STATUS_LABEL: Record<string, string> = {
        DRAFT: "draft",
        SUBMITTED: "submitted",
        APPROVED: "approved",
      };
      const breakdown = activeGroups
        .map((g) => `${g._count} ${STATUS_LABEL[g.status] ?? g.status.toLowerCase()}`)
        .join(", ");
      throw {
        status: 400,
        message: `Cannot delete event: ${total} ${total === 1 ? "entry is" : "entries are"} still active (${breakdown}). Withdraw or return them first.`,
      };
    }

    // Nothing active remains — any entries left are RETURNED and, along with
    // the event's own setup data, are cleared out here rather than relying on
    // schema cascade: Entry/Team/WeightClass/Division/Invoice all reference
    // Event (or each other) with ON DELETE RESTRICT, not CASCADE — confirmed
    // against every applied migration's FK, not just schema.prisma, since
    // Prisma omits `onDelete` from the generated SQL when it's the default,
    // which for a required relation is RESTRICT — so `event.delete` would
    // otherwise fail with a foreign-key error the moment any of them still
    // exists. (`Invoice` here is the event-scoped per-club billing row, not
    // `MemberInvoice` — nothing in the app currently creates one, but the
    // constraint is real, so it's cleared same as the rest rather than left
    // as a latent gap. `MemberInvoice` is untouched: club membership billing
    // outlives any one event.) Draw/DrawSlot/Bout/KataPerformance are left
    // untouched — they cascade automatically once Division/Event goes.
    //
    // Order matters, each step clears the FK the next step's delete needs
    // gone: TeamMember -> Team (TeamMember.teamId is RESTRICT), then Entry
    // and WeightClass -> Division (Entry.divisionId and Team.divisionId are
    // RESTRICT; WeightClass.divisionId is SET NULL so order vs. Division
    // doesn't matter, but it's grouped here for clarity). Invoice has no
    // RESTRICT-guarded children of its own, so it can go anywhere before the
    // event itself; placed here to mirror scripts/delete-event.ts's order.
    //
    // Explicit timeout: Prisma's interactive-transaction default is 5s, and
    // this is six separate round trips over Railway's DB proxy — the CLI
    // sibling of this cleanup (scripts/delete-event.ts) documents hitting
    // P2028 on exactly that default for a real event. 20s comfortably covers
    // a typical event's handful of rows without leaving an HTTP request that
    // will never succeed hanging indefinitely.
    await prisma.$transaction(
      async (tx) => {
        await tx.teamMember.deleteMany({ where: { team: { eventId: id } } });
        await tx.team.deleteMany({ where: { eventId: id } });
        await tx.invoice.deleteMany({ where: { eventId: id } });
        await tx.entry.deleteMany({ where: { eventId: id } });
        await tx.weightClass.deleteMany({ where: { eventId: id } });
        await tx.division.deleteMany({ where: { eventId: id } });
        await tx.event.delete({ where: { id } });
      },
      { timeout: 20_000, maxWait: 10_000 },
    );
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

    // Coarse DOB window for the DB query; the exact calendar-age check below
    // (ageOn) is authoritative. One day of slack on each side covers
    // month/day and leap-day boundaries.
    const maxDob = new Date(event.startDate);
    maxDob.setFullYear(maxDob.getFullYear() - division.minAge);
    maxDob.setDate(maxDob.getDate() + 1);
    const minDob = new Date(event.startDate);
    minDob.setFullYear(minDob.getFullYear() - division.maxAge - 1);
    minDob.setDate(minDob.getDate() - 1);

    const athletes = await prisma.athlete.findMany({
      where: {
        ...(clubId ? { clubId } : {}),
        gender: division.gender,
        isActive: true,
        dob: { gte: minDob, lte: maxDob },
      },
      select: {
        id: true,
        clubId: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        nationality: true,
        weightKg: true,
        club: { select: { name: true } },
        belt: { select: { name: true, colour: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });

    const eligible = athletes.filter(athlete => {
      const age = ageOn(event.startDate, athlete.dob);
      return age >= division.minAge && age <= division.maxAge;
    });

    const existingEntries = await prisma.entry.findMany({
      where: {
        eventId,
        divisionId,
      },
      select: { athleteId: true }
    });

    const enteredAthleteIds = new Set(existingEntries.map(e => e.athleteId).filter(Boolean));

    return eligible.map(athlete => ({
      ...athlete,
      age: ageOn(event.startDate, athlete.dob),
      isEntered: enteredAthleteIds.has(athlete.id),
    }));
  }

  /**
   * Every athlete in scope for an event, with age resolved against the event
   * date — the whole pool in one request, unfiltered by division.
   *
   * getEligibleAthletes answers "who fits THIS division"; screens that show all
   * divisions at once would otherwise have to call it once per division. The
   * projection is deliberately identical to that endpoint's: entry-form fields
   * only, no idNumber, medicalNotes, contact or guardian data. Callers decide
   * per-division eligibility client-side from age/gender, so this must never be
   * widened into a general athlete dump.
   */
  static async getAthletePool(eventId: string, clubId?: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw { status: 404, message: "Event not found" };

    const athletes = await prisma.athlete.findMany({
      where: {
        ...(clubId ? { clubId } : {}),
        isActive: true,
      },
      select: {
        id: true,
        clubId: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        nationality: true,
        weightKg: true,
        club: { select: { name: true } },
        belt: { select: { name: true, colour: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // "Entered" here means entered in any division of this event, which is what
    // the pool's entered/unentered filter needs.
    const existingEntries = await prisma.entry.findMany({
      where: { eventId, ...(clubId ? { clubId } : {}) },
      select: { athleteId: true },
    });
    const enteredAthleteIds = new Set(
      existingEntries.map(e => e.athleteId).filter(Boolean),
    );

    return athletes.map(athlete => ({
      ...athlete,
      age: ageOn(event.startDate, athlete.dob),
      isEntered: enteredAthleteIds.has(athlete.id),
    }));
  }

  // ============ Timing config ============
  //
  // Tournament-wide timing defaults (Event.timingJson). Read always returns a
  // complete config: an event that has never been configured, or one whose
  // stored JSON predates a field, is filled in from EventTimingConfig's
  // defaults rather than handing the caller a half-empty object to guess at.

  static async getTiming(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { timingJson: true },
    });
    if (!event) throw { status: 404, message: "Event not found" };
    return this.parseTiming(event.timingJson);
  }

  /**
   * Stored JSON -> a complete config. Unparseable or non-object JSON falls back
   * to the defaults instead of throwing: a corrupt blob must not make the event
   * hub's Overview tab unreadable, and the next save overwrites it anyway.
   */
  static parseTiming(timingJson: string | null) {
    if (!timingJson) return EventTimingConfig.parse({});
    let raw: unknown;
    try {
      raw = JSON.parse(timingJson);
    } catch {
      return EventTimingConfig.parse({});
    }
    const parsed = EventTimingConfig.safeParse(raw);
    return parsed.success ? parsed.data : EventTimingConfig.parse({});
  }

  static async updateTiming(eventId: string, data: unknown) {
    const config = EventTimingConfig.parse(data);
    await prisma.event.update({
      where: { id: eventId },
      data: { timingJson: JSON.stringify(config) },
    });
    // The normalized config, not the raw body — the caller's partial input has
    // had every missing field defaulted by now, and that's what was stored.
    return config;
  }

  /**
   * Point the timing config's mat count at the mats that actually exist.
   *
   * `EventTimingConfig.mats` and the `Mat` rows are two statements of the same
   * fact, and before the plan board existed only the estimator read the first
   * one, so drift was invisible. Adding or removing a floor on the plan is the
   * organizer saying how many floors the tournament has — this makes the
   * estimator and every other reader of the config agree with that, instead of
   * quietly running on a number nobody has touched since setup.
   *
   * Read-modify-write of the whole blob rather than a partial patch: the config
   * is one JSON column, and `parseTiming` has already filled in every default,
   * so what gets written back is complete either way.
   */
  static async syncMatCount(eventId: string) {
    const [event, matCount] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId }, select: { timingJson: true } }),
      prisma.mat.count({ where: { eventId } }),
    ]);
    if (!event) return;
    // The config's floor <-> mat mapping has no meaning at zero, and the Zod
    // schema's floor is 1, so an event with every mat deleted keeps the last
    // count rather than failing the write.
    if (matCount < 1) return;

    const timing = this.parseTiming(event.timingJson);
    if (timing.mats === matCount) return;
    await prisma.event.update({
      where: { id: eventId },
      data: { timingJson: JSON.stringify({ ...timing, mats: matCount }) },
    });
  }

  static async updateConfig(eventId: string, config: any) {
    return prisma.event.update({
      where: { id: eventId },
      data: { configJson: JSON.stringify(config) }
    });
  }

  // ============ Coordinators ============
  //
  // A coordinator is delegated management of ONE event (see EventCoordinator in
  // schema.prisma and requireEventManager in utils/event-scope.ts). Appointing
  // and revoking is deliberately admin-only: a coordinator cannot widen their
  // own circle.

  /** Everyone currently coordinating this event. */
  static async listCoordinators(eventId: string) {
    return prisma.eventCoordinator.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            club: { select: { id: true, name: true } },
          },
        },
        grantedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async addCoordinator(eventId: string, userId: string, grantedById?: string) {
    const [event, user] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
    ]);
    if (!event) throw { status: 404, message: "Event not found" };
    if (!user) throw { status: 404, message: "User not found" };

    // ATHLETE is the one role for which a coordinator grant makes no sense —
    // it would hand event-wide management to a competitor.
    if (user.role === "ATHLETE") {
      throw { status: 400, message: "Athletes cannot be appointed as coordinators" };
    }

    // Admins already manage every event; a grant would be dead data implying
    // a revocable permission that revoking would not actually remove.
    if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
      throw { status: 400, message: "Admins already manage every event" };
    }

    const existing = await prisma.eventCoordinator.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true },
    });
    if (existing) throw { status: 409, message: "Already a coordinator for this event" };

    await prisma.eventCoordinator.create({
      data: { eventId, userId, grantedById: grantedById ?? null },
    });

    await prisma.auditLog.create({
      data: {
        userId: grantedById ?? null,
        entityType: "EventCoordinator",
        entityId: eventId,
        action: "GRANT",
        diffJson: JSON.stringify({ eventId, userId }),
      },
    });

    return this.listCoordinators(eventId);
  }

  static async removeCoordinator(eventId: string, userId: string, actorId?: string) {
    const existing = await prisma.eventCoordinator.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true },
    });
    if (!existing) throw { status: 404, message: "Not a coordinator for this event" };

    await prisma.eventCoordinator.delete({ where: { id: existing.id } });

    await prisma.auditLog.create({
      data: {
        userId: actorId ?? null,
        entityType: "EventCoordinator",
        entityId: eventId,
        action: "REVOKE",
        diffJson: JSON.stringify({ eventId, userId }),
      },
    });

    return this.listCoordinators(eventId);
  }

  /**
   * Users who could be appointed: everyone who is not already a coordinator
   * here, not an athlete, and not an admin (admins manage every event anyway).
   */
  static async listCoordinatorCandidates(eventId: string, search?: string) {
    const term = search?.trim();
    return prisma.user.findMany({
      where: {
        role: { in: ["CLUB_MANAGER", "COACH"] },
        coordinatorFor: { none: { eventId } },
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: "insensitive" as const } },
                { email: { contains: term, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        club: { select: { id: true, name: true } },
      },
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
