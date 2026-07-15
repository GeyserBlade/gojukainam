import { prisma } from "../lib/prisma.js";
import { CreateEntry, UpdateEntryStatus } from "../utils/validators.js";
import { assertNoDuplicateEntry, validateWeightClass, validateAthleteEligibility, validateAthleteWeight } from "../utils/eligibility.js";
import { assertRegistrationOpen } from "../utils/regWindow.js";

export class EntryService {
  static async list(eventId: string, filters?: {
    clubId?: string;
    divisionId?: string;
    status?: string;
    entryType?: string;
    searchQuery?: string;
  }) {
    const where: any = { eventId };

    if (filters?.clubId) where.clubId = filters.clubId;
    if (filters?.divisionId) where.divisionId = filters.divisionId;
    if (filters?.status) where.status = filters.status;
    if (filters?.entryType) where.entryType = filters.entryType;

    // Search across athlete name, team name, club name
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      where.OR = [
        {
          athlete: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } }
            ]
          }
        },
        {
          team: {
            name: { contains: query, mode: 'insensitive' }
          }
        },
        {
          club: {
            name: { contains: query, mode: 'insensitive' }
          }
        }
      ];
    }

    return prisma.entry.findMany({
      where,
      include: {
        athlete: {
          include: {
            belt: true,
            club: true
          }
        },
        team: {
          include: {
            members: {
              include: {
                athlete: true
              }
            }
          }
        },
        division: true,
        weightClass: true,
        club: true
      },
      orderBy: [
        { division: { category: 'asc' } },
        { division: { minAge: 'asc' } },
        { division: { gender: 'asc' } },
        { entryType: 'asc' },
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
    });
  }

  static async create(data: unknown, user: { role: string }) {
    const body = CreateEntry.parse(data);

    // Registration window: clubs can only add entries while registration is
    // open; admins bypass so organizers can add/correct entries late.
    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) throw { status: 404, message: "Event not found" };
    assertRegistrationOpen(event, user);

    // individual path
    if (body.entryType === "KATA" || body.entryType === "KUMITE") {
      if (!body.athleteId) throw { status: 400, message: "athleteId required for individual entries" };
      const athlete = await prisma.athlete.findUnique({ where: { id: body.athleteId } });
      if (!athlete) throw { status: 404, message: "Athlete not found" };
      if (athlete.clubId !== body.clubId) throw { status: 403, message: "Athlete does not belong to club" };

      // Validate age and gender eligibility for division
      await validateAthleteEligibility(body.athleteId, body.divisionId, body.eventId);

      // kumite needs weight class
      if (body.entryType === "KUMITE") {
        if (!body.weightClassId) throw { status: 400, message: "weightClassId required for Kumite" };
        await validateWeightClass(body.weightClassId, body.eventId, body.divisionId, athlete.gender);
        // Validate athlete's weight is within weight class range
        await validateAthleteWeight(body.athleteId, body.weightClassId);
      }

      await assertNoDuplicateEntry({
        eventId: body.eventId,
        entryType: body.entryType,
        divisionId: body.divisionId,
        athleteId: body.athleteId
      });
    }

    // team path
    if (body.entryType === "TEAM_KATA" || body.entryType === "TEAM_KUMITE") {
      if (!body.teamId) throw { status: 400, message: "teamId required for team entries" };
      const team = await prisma.team.findUnique({ where: { id: body.teamId } });
      if (!team) throw { status: 404, message: "Team not found" };
      if (team.clubId !== body.clubId) throw { status: 403, message: "Team does not belong to club" };

      await assertNoDuplicateEntry({
        eventId: body.eventId,
        entryType: body.entryType,
        divisionId: body.divisionId,
        teamId: body.teamId
      });
    }

    return prisma.entry.create({ data: body });
  }

  static async delete(id: string, user: { id: string; role: string; clubId?: string | null }) {
    const existing = await prisma.entry.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: "Entry not found" };

    // Only DRAFT entries can be removed. Once submitted/approved/returned,
    // the entry is part of the audit trail and must go through status changes.
    if (existing.status !== "DRAFT") {
      throw { status: 409, message: "Only DRAFT entries can be deleted" };
    }

    const isAdmin = user.role === "SUPERADMIN" || user.role === "ADMIN";
    if (!isAdmin && existing.clubId !== user.clubId) {
      throw { status: 403, message: "Forbidden" };
    }

    return prisma.$transaction(async (tx) => {
      await tx.entry.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Entry",
          entityId: id,
          action: "DELETE",
          diffJson: JSON.stringify({
            entryType: existing.entryType,
            divisionId: existing.divisionId,
            athleteId: existing.athleteId,
            teamId: existing.teamId,
          }),
        },
      });
    });
  }

  static async updateStatus(id: string, data: unknown, user: { id: string; role: string; clubId?: string | null }) {
    const { status, reason } = UpdateEntryStatus.parse({ id, ...(data as any) });

    const existing = await prisma.entry.findUnique({
      where: { id }, include: { club: true }
    });
    if (!existing) throw { status: 404, message: "Not found" };

    // permissions:
    // - club can move DRAFT -> SUBMITTED on own entries
    // - admin can APPROVE/RETURN any
    const isClub = user.role === "CLUB_MANAGER" || user.role === "COACH";
    const isAdmin = user.role === "SUPERADMIN" || user.role === "ADMIN";

    if (isClub) {
      if (existing.clubId !== user.clubId) throw { status: 403, message: "Forbidden" };
      if (status !== "SUBMITTED") throw { status: 403, message: "Club can only submit" };
      if (existing.status !== "DRAFT" && existing.status !== "RETURNED") {
        throw { status: 409, message: "Only DRAFT or RETURNED entries can be submitted" };
      }
      // Registration must be open for a club to submit.
      const event = await prisma.event.findUnique({ where: { id: existing.eventId } });
      if (!event) throw { status: 404, message: "Event not found" };
      assertRegistrationOpen(event, user);
    }
    if (!isAdmin && !isClub) throw { status: 403, message: "Forbidden" };

    // Track the return reason on the entry so the club can see it; clear it
    // once the entry moves forward (submit) or is accepted (approve).
    const statusReason = status === "RETURNED" ? (reason ?? null) : null;

    return prisma.$transaction(async (tx) => {
      const u = await tx.entry.update({ where: { id }, data: { status, statusReason } });
      await tx.auditLog.create({
        data: {
          userId: user.id, entityType: "Entry", entityId: id,
          action: `STATUS_${status}`, diffJson: JSON.stringify({ reason })
        }
      });
      return u;
    });
  }

  // Club-side bulk submit: DRAFT/RETURNED -> SUBMITTED for the given ids.
  // Non-admins are constrained to their own club. Clears any prior return reason.
  static async bulkSubmit(
    eventId: string,
    ids: string[],
    user: { id: string; role: string; clubId?: string | null },
  ) {
    const isAdmin = user.role === "SUPERADMIN" || user.role === "ADMIN";
    const where: any = {
      eventId,
      id: { in: ids },
      status: { in: ["DRAFT", "RETURNED"] },
    };
    if (!isAdmin) {
      if (!user.clubId) throw { status: 400, message: "clubId missing for scoped request" };
      where.clubId = user.clubId;
      // Registration must be open for a club to submit.
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw { status: 404, message: "Event not found" };
      assertRegistrationOpen(event, user);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.entry.updateMany({
        where,
        data: { status: "SUBMITTED", statusReason: null },
      });
      if (updated.count > 0) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            entityType: "Entry",
            entityId: `bulk:${Date.now()}`,
            action: "BULK_SUBMITTED",
            diffJson: JSON.stringify({ eventId, ids, count: updated.count }),
          },
        });
      }
      return { updatedCount: updated.count };
    });
  }
}
