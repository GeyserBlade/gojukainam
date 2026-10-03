import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toIsoDate, utcDate } from "../utils/dates.js";
import {
  AllocateMembers, CreateClass, CreateInstructor, EnrolAthlete, SetClassInstructors, UpdateClass,
  UpdateInstructor,
} from "../utils/validators.js";

/**
 * Classes, their instructors, and who is enrolled — all dated.
 *
 * NOTHING HERE OVERWRITES THE PAST. Changing a class's instructors, or moving a
 * member to another class, closes the open row the day before the change and
 * opens a new one. That is what lets instructor income for January still split
 * the way January was taught after the class becomes shared in March. The one
 * thing refused outright is a change dated before the current row began: that
 * would rewrite a period someone may already have been paid for, and it should
 * be a deliberate correction, not a side effect of a form.
 *
 * Callers have already checked that the club is theirs (routes/classes.ts);
 * this layer checks that the rows they name belong to that club, because a
 * class id from another club in an otherwise valid request is exactly how a
 * cross-tenant write happens.
 */

/** "2026-03-01" → midnight-UTC Date, the canonical shape for a DATE column. */
function day(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = utcDate(y, m, d);
  if (toIsoDate(date) !== iso) throw { status: 400, message: `${iso} is not a real date.` };
  return date;
}

/** The day before, as the inclusive end of the row being closed. */
function dayBefore(date: Date): Date {
  return new Date(date.getTime() - 86_400_000);
}

const instructorSelect = {
  id: true, name: true, active: true, athleteId: true, userId: true,
} as const;

export class ClassService {
  // -------------------------------------------------------------------------
  // Instructors
  // -------------------------------------------------------------------------

  static async listInstructors(clubId: string, includeInactive = false) {
    return prisma.instructor.findMany({
      where: { clubId, ...(includeInactive ? {} : { active: true }) },
      select: instructorSelect,
      orderBy: { name: "asc" },
    });
  }

  static async createInstructor(input: unknown) {
    const data = CreateInstructor.parse(input);
    await ClassService.assertLinksInClub(data.clubId, data.athleteId, data.userId);
    try {
      return await prisma.instructor.create({
        data: {
          clubId: data.clubId, name: data.name,
          athleteId: data.athleteId ?? null, userId: data.userId ?? null,
        },
        select: instructorSelect,
      });
    } catch (err) {
      throw duplicate(err, `An instructor called "${data.name}" already exists in this club.`);
    }
  }

  static async updateInstructor(clubId: string, id: string, input: unknown) {
    const data = UpdateInstructor.parse(input);
    await ClassService.instructorInClub(clubId, id);
    await ClassService.assertLinksInClub(clubId, data.athleteId, data.userId);
    try {
      return await prisma.instructor.update({ where: { id }, data, select: instructorSelect });
    } catch (err) {
      throw duplicate(err, `An instructor called "${data.name ?? ""}" already exists in this club.`);
    }
  }

  // -------------------------------------------------------------------------
  // Classes
  // -------------------------------------------------------------------------

  /** Each class with the instructors and member count current on `asOf`. */
  static async listClasses(clubId: string, asOf: Date, includeInactive = false) {
    const classes = await prisma.class.findMany({
      where: { clubId, ...(includeInactive ? {} : { active: true }) },
      select: {
        id: true, name: true, schedule: true, active: true,
        instructors: {
          where: { startDate: { lte: asOf }, OR: [{ endDate: null }, { endDate: { gte: asOf } }] },
          select: { startDate: true, instructor: { select: { id: true, name: true } } },
          orderBy: { instructor: { name: "asc" } },
        },
        _count: {
          select: {
            enrolments: { where: { startDate: { lte: asOf }, OR: [{ endDate: null }, { endDate: { gte: asOf } }] } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      active: c.active,
      instructors: c.instructors.map((i) => ({ ...i.instructor, since: toIsoDate(i.startDate) })),
      // Said in words so no reader has to infer it from a count.
      shared: c.instructors.length > 1,
      memberCount: c._count.enrolments,
    }));
  }

  static async createClass(input: unknown) {
    const data = CreateClass.parse(input);
    try {
      return await prisma.class.create({
        data: { clubId: data.clubId, name: data.name, schedule: data.schedule ?? null },
        select: { id: true, name: true, schedule: true, active: true },
      });
    } catch (err) {
      throw duplicate(err, `A class called "${data.name}" already exists in this club.`);
    }
  }

  /**
   * Deactivating a class with members in it is refused: they would be enrolled
   * in a class nobody can pick, and their fees would still be split by it.
   */
  static async updateClass(clubId: string, id: string, input: unknown) {
    const data = UpdateClass.parse(input);
    await ClassService.classInClub(clubId, id);
    if (data.active === false) {
      const open = await prisma.classEnrolment.count({ where: { classId: id, endDate: null } });
      if (open > 0) {
        throw { status: 409, message: `${open} member(s) are still in this class. Move them to another class first.` };
      }
    }
    try {
      return await prisma.class.update({
        where: { id }, data, select: { id: true, name: true, schedule: true, active: true },
      });
    } catch (err) {
      throw duplicate(err, `A class called "${data.name ?? ""}" already exists in this club.`);
    }
  }

  /**
   * Who teaches the class from `from` onwards. The whole set is given, not a
   * delta: instructors no longer listed are closed the day before, new ones
   * opened, and ones listed again are left as they are — so their start date,
   * and every split before it, is untouched.
   */
  static async setInstructors(clubId: string, classId: string, input: unknown) {
    const data = SetClassInstructors.parse(input);
    const from = day(data.from);
    await ClassService.classInClub(clubId, classId);
    if (data.instructorIds.length > 0) {
      const found = await prisma.instructor.count({
        where: { id: { in: data.instructorIds }, clubId, active: true },
      });
      if (found !== data.instructorIds.length) {
        throw { status: 400, message: "Every instructor must be an active instructor of this club." };
      }
    }

    return prisma.$transaction(async (tx) => {
      const open = await tx.classInstructor.findMany({
        where: { classId, endDate: null },
        select: { id: true, instructorId: true, startDate: true },
      });
      const wanted = new Set(data.instructorIds);
      for (const row of open) {
        if (wanted.has(row.instructorId)) continue;
        if (row.startDate > from) {
          throw { status: 409, message: `That change is dated before an instructor's current start (${toIsoDate(row.startDate)}). Correct history deliberately rather than by moving the date back.` };
        }
        if (row.startDate.getTime() === from.getTime()) {
          // Started and stopped the same day: the row never covered a day.
          await tx.classInstructor.delete({ where: { id: row.id } });
        } else {
          await tx.classInstructor.update({ where: { id: row.id }, data: { endDate: dayBefore(from) } });
        }
      }
      const already = new Set(open.map((r) => r.instructorId));
      for (const instructorId of data.instructorIds) {
        if (already.has(instructorId)) continue;
        await tx.classInstructor.create({ data: { classId, instructorId, startDate: from } });
      }
      return { classId, from: data.from, instructorIds: data.instructorIds };
    });
  }

  // -------------------------------------------------------------------------
  // Enrolment
  // -------------------------------------------------------------------------

  /** The member's class from `from` onwards, or none (`classId: null`). */
  static async enrol(clubId: string, athleteId: string, input: unknown) {
    const data = EnrolAthlete.parse(input);
    const from = day(data.from);
    const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { clubId: true } });
    if (!athlete || athlete.clubId !== clubId) throw { status: 404, message: "Athlete not found" };
    if (data.classId !== null) {
      const cls = await ClassService.classInClub(clubId, data.classId);
      if (!cls.active) throw { status: 400, message: "That class is no longer active." };
    }

    return prisma.$transaction((tx) => moveMember(tx, athleteId, data.classId, from));
  }

  /**
   * Many members' classes from one date, in one transaction: either every
   * move lands or none does. Half a reorganisation would leave a split that
   * matches neither the old classes nor the new ones.
   *
   * Every member and class is checked against the club up front, so a foreign
   * id is a 404 before anything is written, and a backdated move names the
   * member it concerns.
   */
  static async allocate(clubId: string, input: unknown) {
    const data = AllocateMembers.parse(input);
    const from = day(data.from);

    const athleteIds = data.assignments.map((a) => a.athleteId);
    const athletes = await prisma.athlete.findMany({
      where: { id: { in: athleteIds }, clubId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (athletes.length !== athleteIds.length) throw { status: 404, message: "Athlete not found" };
    const names = new Map(athletes.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));

    const classIds = [...new Set(data.assignments.flatMap((a) => (a.classId ? [a.classId] : [])))];
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds }, clubId },
      select: { id: true, name: true, active: true },
    });
    if (classes.length !== classIds.length) throw { status: 404, message: "Class not found" };
    const inactive = classes.find((c) => !c.active);
    if (inactive) throw { status: 400, message: `${inactive.name} is no longer active.` };

    return prisma.$transaction(async (tx) => {
      let changed = 0;
      for (const a of data.assignments) {
        try {
          if ((await moveMember(tx, a.athleteId, a.classId, from)).changed) changed++;
        } catch (err) {
          const e = err as { status?: number; message?: string };
          if (e.status) throw { status: e.status, message: `${names.get(a.athleteId)}: ${e.message}` };
          throw err;
        }
      }
      return { from: data.from, changed, unchanged: data.assignments.length - changed };
    }, { timeout: 30_000 });
  }

  /** Each member's current class, for the athlete list. */
  static async currentClassByAthlete(clubId: string) {
    const rows = await prisma.classEnrolment.findMany({
      where: { endDate: null, athlete: { clubId } },
      select: { athleteId: true, startDate: true, class: { select: { id: true, name: true } } },
    });
    return rows.map((r) => ({ athleteId: r.athleteId, classId: r.class.id, className: r.class.name, since: toIsoDate(r.startDate) }));
  }

  /** One member's enrolment history, newest first. */
  static async enrolmentHistory(clubId: string, athleteId: string) {
    const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { clubId: true } });
    if (!athlete || athlete.clubId !== clubId) throw { status: 404, message: "Athlete not found" };
    const rows = await prisma.classEnrolment.findMany({
      where: { athleteId },
      select: { startDate: true, endDate: true, class: { select: { id: true, name: true } } },
      orderBy: { startDate: "desc" },
    });
    return rows.map((r) => ({
      classId: r.class.id, className: r.class.name,
      from: toIsoDate(r.startDate), to: r.endDate ? toIsoDate(r.endDate) : null,
    }));
  }

  // -------------------------------------------------------------------------

  private static async classInClub(clubId: string, id: string) {
    const cls = await prisma.class.findUnique({ where: { id }, select: { clubId: true, active: true } });
    if (!cls || cls.clubId !== clubId) throw { status: 404, message: "Class not found" };
    return cls;
  }

  private static async instructorInClub(clubId: string, id: string) {
    const row = await prisma.instructor.findUnique({ where: { id }, select: { clubId: true } });
    if (!row || row.clubId !== clubId) throw { status: 404, message: "Instructor not found" };
  }

  /** A link to a roster row or a login must be to this club's. */
  private static async assertLinksInClub(clubId: string, athleteId?: string | null, userId?: string | null) {
    if (athleteId) {
      const a = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { clubId: true } });
      if (!a || a.clubId !== clubId) throw { status: 400, message: "That athlete is not in this club." };
    }
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { clubId: true } });
      if (!u || u.clubId !== clubId) throw { status: 400, message: "That user is not in this club." };
    }
  }
}

/**
 * Put one member in `classId` (or none) from `from`, inside the caller's
 * transaction: close the open row the day before, or replace it if it began
 * that same day, then open the new one. Club checks are the caller's job.
 */
async function moveMember(tx: Prisma.TransactionClient, athleteId: string, classId: string | null, from: Date) {
  const open = await tx.classEnrolment.findFirst({
    where: { athleteId, endDate: null },
    select: { id: true, classId: true, startDate: true },
  });
  if (open && open.classId === classId) {
    return { athleteId, classId, from: toIsoDate(open.startDate), changed: false };
  }
  if (!open && classId === null) {
    return { athleteId, classId, from: toIsoDate(from), changed: false };
  }
  if (open) {
    if (open.startDate > from) {
      throw { status: 409, message: `That change is dated before this member's current class began (${toIsoDate(open.startDate)}). Correct history deliberately rather than by moving the date back.` };
    }
    if (open.startDate.getTime() === from.getTime()) {
      // Started and stopped the same day: the row never covered a day.
      await tx.classEnrolment.delete({ where: { id: open.id } });
    } else {
      await tx.classEnrolment.update({ where: { id: open.id }, data: { endDate: dayBefore(from) } });
    }
  }
  if (classId !== null) {
    await tx.classEnrolment.create({ data: { athleteId, classId, startDate: from } });
  }
  return { athleteId, classId, from: toIsoDate(from), changed: true };
}

/** Prisma's unique-violation, as the message a person can act on. */
function duplicate(err: unknown, message: string): unknown {
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
    return { status: 409, message };
  }
  return err;
}
