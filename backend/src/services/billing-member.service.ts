import { prisma } from "../lib/prisma.js";
import {
  ageInYears, ageMonthsRemainder, birthdaysBetween, daysBetween,
  nextBirthday, startOfUtcDay, toIsoDate, windowFromDays,
} from "../utils/dates.js";
import { OPEN_INVOICE_STATUSES, OVERDUE_ELIGIBLE_STATUSES } from "../utils/billing-guard.js";

/**
 * Member reads for billing and for the agent's questions.
 *
 * Every age, duration and birthday in here is computed server-side and returned
 * as data. Nothing downstream — least of all a language model — is expected to
 * do date arithmetic. See utils/dates.ts for why.
 */

const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  invoiceRef: true,
  dob: true,
  gender: true,
  isActive: true,
  isInstructor: true,
  // Competition weight class. Included because it is roster admin a club runs
  // on; medicalNotes and idNumber are deliberately NOT — minors' medical
  // details and identity numbers are not something billing or an assistant
  // needs, and output redaction protects the audit log, not the conversation.
  weightKg: true,
  joinDate: true,
  lastGraded: true,
  contactEmail: true,
  contactPhone: true,
  guardianName1: true,
  guardianPhone1: true,
  guardianName2: true,
  guardianPhone2: true,
  belt: { select: { id: true, name: true, colour: true, order: true } },
};

type MemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date;
};

function fullName(m: { firstName: string; lastName: string }): string {
  return `${m.firstName} ${m.lastName}`;
}

/** The computed date fields every member payload carries. */
function withAge<T extends MemberRow>(m: T, asOf: Date) {
  const nb = nextBirthday(m.dob, asOf);
  return {
    ...m,
    name: fullName(m),
    dob: toIsoDate(m.dob),
    ageYears: ageInYears(m.dob, asOf),
    ageMonths: ageMonthsRemainder(m.dob, asOf),
    nextBirthday: toIsoDate(nb.date),
    turningAge: nb.turningAge,
    daysToBirthday: nb.daysAway,
  };
}

/**
 * Normalised similarity used only to rank name search results for a human or
 * an agent to choose between. Deliberately NOT the reconciliation matcher —
 * that one lives in the recon engine, is Jaro-Winkler, and is held to a
 * threshold because money depends on it. This one just orders a dropdown.
 */
function nameScore(candidate: string, query: string): number {
  const c = candidate.toLowerCase();
  const q = query.toLowerCase();
  if (c === q) return 1;
  if (c.startsWith(q)) return 0.9;
  if (c.includes(q)) return 0.75;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const hits = qTokens.filter((t) => c.includes(t)).length;
  return qTokens.length > 0 ? (hits / qTokens.length) * 0.6 : 0;
}

export class BillingMemberService {
  static async list(clubId: string, opts: { includeInactive?: boolean; q?: string }, asOf: Date) {
    const members = await prisma.athlete.findMany({
      where: {
        clubId,
        ...(opts.includeInactive ? {} : { isActive: true }),
        ...(opts.q
          ? {
              OR: [
                { firstName: { contains: opts.q, mode: "insensitive" as const } },
                { lastName: { contains: opts.q, mode: "insensitive" as const } },
                { invoiceRef: { contains: opts.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: memberSelect,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const outstanding = await this.outstandingByAthlete(clubId, asOf);

    return members.map((m) => ({
      ...withAge(m, asOf),
      outstandingCents: outstanding.get(m.id)?.outstandingCents ?? 0,
      openInvoiceCount: outstanding.get(m.id)?.count ?? 0,
    }));
  }

  static async getById(clubId: string, athleteId: string, asOf: Date) {
    const member = await prisma.athlete.findFirst({
      where: { id: athleteId, clubId },
      select: memberSelect,
    });
    if (!member) return null;

    const outstanding = await this.outstandingByAthlete(clubId, asOf, athleteId);
    return {
      ...withAge(member, asOf),
      outstandingCents: outstanding.get(member.id)?.outstandingCents ?? 0,
      openInvoiceCount: outstanding.get(member.id)?.count ?? 0,
    };
  }

  /**
   * Ranked candidates for "who is Ben Fourie?".
   *
   * Always returns a list, even for one hit. The caller — including the agent —
   * must handle 0 and >1 explicitly rather than being handed a single record
   * that looks authoritative. Picking the wrong Ben is how a model invoices
   * the wrong family.
   */
  static async search(clubId: string, name: string, limit = 10) {
    const tokens = name.trim().split(/\s+/).filter(Boolean);
    const members = await prisma.athlete.findMany({
      where: {
        clubId,
        OR: tokens.flatMap((t) => [
          { firstName: { contains: t, mode: "insensitive" as const } },
          { lastName: { contains: t, mode: "insensitive" as const } },
          { guardianName1: { contains: t, mode: "insensitive" as const } },
          { guardianName2: { contains: t, mode: "insensitive" as const } },
        ]),
      },
      select: { id: true, firstName: true, lastName: true, isActive: true, invoiceRef: true, dob: true },
      take: 50,
    });

    return members
      .map((m) => ({
        id: m.id,
        name: fullName(m),
        isActive: m.isActive,
        invoiceRef: m.invoiceRef,
        score: Number(nameScore(fullName(m), name).toFixed(3)),
      }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  /**
   * Birthdays inside a window. The window is resolved here, server-side —
   * callers pass `days` and are told what that meant, so an answer can say
   * "in the 7 days from 2 to 9 August" without anyone downstream subtracting
   * dates.
   */
  static async birthdays(
    clubId: string,
    opts: { days?: number; from?: string; to?: string },
    asOf: Date,
  ) {
    const window =
      opts.from && opts.to
        ? { from: startOfUtcDay(new Date(`${opts.from}T00:00:00Z`)),
            to: startOfUtcDay(new Date(`${opts.to}T00:00:00Z`)) }
        : windowFromDays(asOf, opts.days ?? 7);

    const members = await prisma.athlete.findMany({
      where: { clubId, isActive: true },
      select: { id: true, firstName: true, lastName: true, dob: true, contactPhone: true, guardianName1: true, guardianPhone1: true },
    });

    const hits = birthdaysBetween(members, window.from, window.to);

    return {
      window: { from: toIsoDate(window.from), to: toIsoDate(window.to) },
      asOf: toIsoDate(asOf),
      count: hits.length,
      birthdays: hits.map((h) => ({
        athleteId: h.id,
        name: fullName(h),
        dob: toIsoDate(h.dob),
        date: toIsoDate(h.dateInWindow),
        turningAge: h.turningAge,
        daysAway: h.daysAway,
        guardianName: h.guardianName1,
        guardianPhone: h.guardianPhone1,
        contactPhone: h.contactPhone,
      })),
    };
  }

  /** Outstanding totals per athlete. Shared by list, detail and arrears. */
  private static async outstandingByAthlete(clubId: string, asOf: Date, athleteId?: string) {
    const invoices = await prisma.memberInvoice.findMany({
      where: {
        clubId,
        status: { in: [...OPEN_INVOICE_STATUSES] },
        ...(athleteId ? { athleteId } : {}),
      },
      select: { athleteId: true, totalCents: true, amountPaidCents: true, dueDate: true, status: true },
    });

    const map = new Map<string, { outstandingCents: number; count: number; oldestDueDate: Date | null }>();
    for (const inv of invoices) {
      const owed = inv.totalCents - inv.amountPaidCents;
      if (owed <= 0) continue;
      const acc = map.get(inv.athleteId) ?? { outstandingCents: 0, count: 0, oldestDueDate: null };
      acc.outstandingCents += owed;
      acc.count += 1;
      if (!acc.oldestDueDate || inv.dueDate < acc.oldestDueDate) acc.oldestDueDate = inv.dueDate;
      map.set(inv.athleteId, acc);
    }
    return map;
  }

  /**
   * What is missing from the roster.
   *
   * Computed here rather than by making a caller pull 54 records and count.
   * A model asked to tally a list gets it wrong often enough to matter, and
   * the whole roster in its context crowds out the question.
   *
   * "No active subscription" is the one that costs money: those members are
   * silently absent from every invoice run.
   */
  static async gaps(clubId: string, asOf: Date) {
    const members = await prisma.athlete.findMany({
      where: { clubId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true, weightKg: true,
        joinDate: true, lastGraded: true, invoiceRef: true,
        contactPhone: true, guardianPhone1: true, guardianName1: true, dob: true,
        subscriptions: {
          where: {
            startDate: { lte: asOf },
            OR: [{ endDate: null }, { endDate: { gte: asOf } }],
            feeSchedule: { cadence: "MONTHLY", active: true },
          },
          select: { id: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const name = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`;
    const pick = (rows: typeof members) =>
      rows.map((m) => ({ athleteId: m.id, name: name(m) }));

    const minorNoGuardian = members.filter(
      (m) => ageInYears(m.dob, asOf) < 18 && !m.guardianPhone1 && !m.contactPhone,
    );

    return {
      asOf: toIsoDate(asOf),
      activeMembers: members.length,
      gaps: {
        noWeight: pick(members.filter((m) => m.weightKg === null)),
        noJoinDate: pick(members.filter((m) => m.joinDate === null)),
        neverGraded: pick(members.filter((m) => m.lastGraded === null)),
        noPaymentReference: pick(members.filter((m) => !m.invoiceRef)),
        // Nobody to send an invoice to.
        noContactAtAll: pick(members.filter((m) => !m.contactPhone && !m.guardianPhone1)),
        // A minor with no reachable adult — the sharper version of the above.
        minorWithNoGuardianContact: pick(minorNoGuardian),
        // Would not appear in any invoice run.
        noActiveSubscription: pick(members.filter((m) => m.subscriptions.length === 0)),
      },
    };
  }

  /**
   * Who owes what. `isOverdue` and `daysOverdue` are derived here rather than
   * stored, so arrears stay correct even when a nightly job does not run —
   * silent stoppage is the failure mode this design keeps out of the read path.
   */
  static async arrears(clubId: string, asOf: Date) {
    const invoices = await prisma.memberInvoice.findMany({
      where: { clubId, status: { in: [...OPEN_INVOICE_STATUSES] } },
      select: {
        id: true, athleteId: true, periodKey: true, paymentRef: true, status: true,
        totalCents: true, amountPaidCents: true, dueDate: true, issueDate: true,
        athlete: {
          select: {
            firstName: true, lastName: true, invoiceRef: true,
            guardianName1: true, guardianPhone1: true, contactPhone: true, contactEmail: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const byAthlete = new Map<string, {
      athleteId: string; name: string; memberRef: string | null;
      guardianName: string | null; guardianPhone: string | null;
      contactPhone: string | null; contactEmail: string | null;
      outstandingCents: number; oldestDueDate: string | null; daysOverdue: number;
      invoices: Array<Record<string, unknown>>;
    }>();

    for (const inv of invoices) {
      const owed = inv.totalCents - inv.amountPaidCents;
      if (owed <= 0) continue;

      const overdueEligible = (OVERDUE_ELIGIBLE_STATUSES as readonly string[]).includes(inv.status);
      const isOverdue = overdueEligible && inv.dueDate < asOf;
      const daysOverdue = isOverdue ? daysBetween(inv.dueDate, asOf) : 0;

      const entry = byAthlete.get(inv.athleteId) ?? {
        athleteId: inv.athleteId,
        name: fullName(inv.athlete),
        memberRef: inv.athlete.invoiceRef,
        guardianName: inv.athlete.guardianName1,
        guardianPhone: inv.athlete.guardianPhone1,
        contactPhone: inv.athlete.contactPhone,
        contactEmail: inv.athlete.contactEmail,
        outstandingCents: 0,
        oldestDueDate: null,
        daysOverdue: 0,
        invoices: [],
      };

      entry.outstandingCents += owed;
      entry.daysOverdue = Math.max(entry.daysOverdue, daysOverdue);
      if (!entry.oldestDueDate || toIsoDate(inv.dueDate) < entry.oldestDueDate) {
        entry.oldestDueDate = toIsoDate(inv.dueDate);
      }
      entry.invoices.push({
        id: inv.id,
        periodKey: inv.periodKey,
        paymentRef: inv.paymentRef,
        status: inv.status,
        issueDate: toIsoDate(inv.issueDate),
        dueDate: toIsoDate(inv.dueDate),
        totalCents: inv.totalCents,
        amountPaidCents: inv.amountPaidCents,
        outstandingCents: owed,
        isOverdue,
        daysOverdue,
      });

      byAthlete.set(inv.athleteId, entry);
    }

    const members = [...byAthlete.values()].sort(
      (a, b) => b.daysOverdue - a.daysOverdue || b.outstandingCents - a.outstandingCents,
    );

    return {
      asOf: toIsoDate(asOf),
      totalOutstandingCents: members.reduce((sum, m) => sum + m.outstandingCents, 0),
      memberCount: members.length,
      members,
    };
  }
}
