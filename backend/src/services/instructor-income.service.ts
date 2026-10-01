import { prisma } from "../lib/prisma.js";
import { toIsoDate } from "../utils/dates.js";
import { periodStart, splitEvenly } from "../utils/instructor-split.js";

/**
 * Monthly fee income, split between the instructors who taught it.
 *
 * THE BASIS, said once and returned with every answer so nobody has to guess
 * it: money RECEIVED in [from, to] (a payment's receivedDate — the same cash
 * basis as the bank books in sensai), allocated to SUBSCRIPTION invoices
 * (monthly class fees; gradings, camps and other one-offs are dojo income and
 * are not split). Each allocation follows the member's class on the 1st of
 * the month the invoice is FOR, so an April fee paid in June splits the way
 * April was taught.
 *
 * NOTHING IS DROPPED. An allocation whose member had no class that month, or
 * whose class had no instructor, is counted under `unassigned` with the
 * reason, and the parts are asserted to add back to the total. A report that
 * silently loses the members nobody has put in a class reads as "Bruno earned
 * less", which is a conversation with Bruno, not a data-entry fix.
 */

interface Period { startDate: Date; endDate: Date | null }
function covers(row: Period, day: Date): boolean {
  return row.startDate <= day && (row.endDate === null || row.endDate >= day);
}

export class InstructorIncomeService {
  static async income(clubId: string, from: Date, to: Date) {
    if (to < from) throw { status: 400, message: "`to` is before `from`." };

    const allocations = await prisma.paymentAllocation.findMany({
      where: {
        payment: { clubId, receivedDate: { gte: from, lte: endOfDay(to) } },
        invoice: { kind: "SUBSCRIPTION" },
      },
      select: {
        amountCents: true,
        invoice: { select: { athleteId: true, periodKey: true, issueDate: true } },
      },
    });

    const athleteIds = [...new Set(allocations.map((a) => a.invoice.athleteId))];
    const enrolments = await prisma.classEnrolment.findMany({
      where: { athleteId: { in: athleteIds } },
      select: { athleteId: true, classId: true, startDate: true, endDate: true },
    });
    const classIds = [...new Set(enrolments.map((e) => e.classId))];
    const [classes, teaching] = await Promise.all([
      prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } }),
      prisma.classInstructor.findMany({
        where: { classId: { in: classIds } },
        select: { classId: true, instructorId: true, startDate: true, endDate: true },
      }),
    ]);
    const instructors = await prisma.instructor.findMany({
      where: { clubId }, select: { id: true, name: true },
    });
    const className = new Map(classes.map((c) => [c.id, c.name]));
    const instructorName = new Map(instructors.map((i) => [i.id, i.name]));

    const perInstructor = new Map<string, { cents: number; allocations: number }>();
    const byClass = new Map<string, { cents: number; allocations: number; shared: boolean }>();
    const unassigned = { cents: 0, allocations: 0, noClass: 0, noInstructor: 0 };
    let totalCents = 0;

    for (const a of allocations) {
      totalCents += a.amountCents;
      const day = periodStart(a.invoice.periodKey) ?? a.invoice.issueDate;
      const enrolment = enrolments.find((e) => e.athleteId === a.invoice.athleteId && covers(e, day));
      if (!enrolment) {
        unassigned.cents += a.amountCents;
        unassigned.allocations++;
        unassigned.noClass++;
        continue;
      }
      const ids = teaching.filter((t) => t.classId === enrolment.classId && covers(t, day)).map((t) => t.instructorId);
      if (ids.length === 0) {
        unassigned.cents += a.amountCents;
        unassigned.allocations++;
        unassigned.noInstructor++;
        continue;
      }
      const cls = byClass.get(enrolment.classId) ?? { cents: 0, allocations: 0, shared: false };
      cls.cents += a.amountCents;
      cls.allocations++;
      cls.shared ||= ids.length > 1;
      byClass.set(enrolment.classId, cls);
      for (const share of splitEvenly(a.amountCents, ids)) {
        const row = perInstructor.get(share.instructorId) ?? { cents: 0, allocations: 0 };
        row.cents += share.cents;
        row.allocations++;
        perInstructor.set(share.instructorId, row);
      }
    }

    const assigned = [...perInstructor.values()].reduce((s, r) => s + r.cents, 0);
    if (assigned + unassigned.cents !== totalCents) {
      // Should be impossible given splitEvenly; asserted because the failure
      // is a payout figure that does not add up to the money received.
      throw new Error(`Instructor split does not add up: ${assigned} + ${unassigned.cents} != ${totalCents}`);
    }

    return {
      clubId,
      from: toIsoDate(from),
      to: toIsoDate(to),
      basis:
        "Payments received in the window, allocated to monthly (subscription) invoices. Each follows " +
        "the member's class on the 1st of the invoiced month; a shared class splits evenly.",
      totalCents,
      perInstructor: [...perInstructor].map(([instructorId, r]) => ({
        instructorId, name: instructorName.get(instructorId) ?? "(removed instructor)", ...r,
      })).sort((x, y) => y.cents - x.cents || x.name.localeCompare(y.name)),
      byClass: [...byClass].map(([classId, r]) => ({
        classId, name: className.get(classId) ?? "(removed class)", ...r,
      })).sort((x, y) => x.name.localeCompare(y.name)),
      unassigned,
    };
  }
}

/** Inclusive upper bound for a calendar day, since receivedDate is a timestamp. */
function endOfDay(d: Date): Date {
  return new Date(d.getTime() + 86_400_000 - 1);
}
