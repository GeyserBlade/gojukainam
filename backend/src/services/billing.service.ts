import { prisma } from "../lib/prisma.js";
import { toIsoDate, daysBetween } from "../utils/dates.js";
import { OPEN_INVOICE_STATUSES, OVERDUE_ELIGIBLE_STATUSES } from "../utils/billing-guard.js";

/** Config, fee schedules, subscriptions, invoices, payments — the read side. */

export class BillingConfigService {
  static async get(clubId: string) {
    const config = await prisma.clubBillingConfig.findUnique({
      where: { clubId },
      select: {
        clubId: true, enabled: true, currency: true, timezone: true,
        refPrefix: true, invoiceDay: true, dueDaysAfter: true,
        createdAt: true, updatedAt: true,
        club: { select: { name: true } },
      },
    });
    if (!config) return null;
    // nextRefSeq is deliberately not exposed: it is an allocation counter, not
    // information, and publishing it invites a caller to predict a reference.
    return { ...config, clubName: config.club.name, club: undefined };
  }
}

export class FeeScheduleService {
  static async list(clubId: string, includeInactive = false) {
    return prisma.feeSchedule.findMany({
      where: { clubId, ...(includeInactive ? {} : { active: true }) },
      select: {
        id: true, code: true, name: true, feeType: true, cadence: true,
        amountCents: true, active: true, effectiveFrom: true, effectiveTo: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: [{ feeType: "asc" }, { name: "asc" }],
    });
  }
}

export class SubscriptionService {
  /** Who is subscribed to what, as of a date — the invoice run's input. */
  static async list(clubId: string, asOf: Date) {
    return prisma.memberSubscription.findMany({
      where: {
        athlete: { clubId },
        startDate: { lte: asOf },
        OR: [{ endDate: null }, { endDate: { gte: asOf } }],
      },
      select: {
        id: true, athleteId: true, quantity: true, overrideAmountCents: true,
        startDate: true, endDate: true,
        athlete: { select: { firstName: true, lastName: true, isActive: true } },
        feeSchedule: { select: { id: true, code: true, name: true, feeType: true, cadence: true, amountCents: true } },
      },
      orderBy: [{ athlete: { lastName: "asc" } }],
    });
  }
}

/** Shared shape so a list row and a detail row cannot drift apart. */
function decorateInvoice(
  inv: {
    status: string; dueDate: Date; issueDate: Date;
    totalCents: number; amountPaidCents: number;
  },
  asOf: Date,
) {
  const outstandingCents = inv.totalCents - inv.amountPaidCents;
  const overdueEligible = (OVERDUE_ELIGIBLE_STATUSES as readonly string[]).includes(inv.status);
  const isOverdue = overdueEligible && inv.dueDate < asOf && outstandingCents > 0;
  return {
    issueDate: toIsoDate(inv.issueDate),
    dueDate: toIsoDate(inv.dueDate),
    outstandingCents,
    isOverdue,
    daysOverdue: isOverdue ? daysBetween(inv.dueDate, asOf) : 0,
  };
}

export class BillingInvoiceService {
  static async list(
    clubId: string,
    filters: { status?: string; periodKey?: string; athleteId?: string },
    asOf: Date,
  ) {
    const invoices = await prisma.memberInvoice.findMany({
      where: {
        clubId,
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.periodKey ? { periodKey: filters.periodKey } : {}),
        ...(filters.athleteId ? { athleteId: filters.athleteId } : {}),
      },
      select: {
        id: true, athleteId: true, kind: true, periodKey: true, status: true,
        paymentRef: true, currency: true, issueDate: true, dueDate: true,
        subtotalCents: true, discountCents: true, totalCents: true, amountPaidCents: true,
        runId: true, sentAt: true, approvedAt: true, createdAt: true,
        athlete: { select: { firstName: true, lastName: true, invoiceRef: true } },
      },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    });

    return invoices.map((inv) => ({
      ...inv,
      athleteName: `${inv.athlete.firstName} ${inv.athlete.lastName}`,
      memberRef: inv.athlete.invoiceRef,
      athlete: undefined,
      ...decorateInvoice(inv, asOf),
    }));
  }

  static async getById(clubId: string, id: string, asOf: Date) {
    const inv = await prisma.memberInvoice.findFirst({
      where: { id, clubId },
      select: {
        id: true, athleteId: true, kind: true, periodKey: true, status: true,
        paymentRef: true, currency: true, issueDate: true, dueDate: true,
        subtotalCents: true, discountCents: true, totalCents: true, amountPaidCents: true,
        runId: true, pdfDocumentId: true, createdVia: true, notes: true,
        approvedAt: true, sentAt: true, cancelledAt: true, createdAt: true, updatedAt: true,
        athlete: {
          select: {
            firstName: true, lastName: true, invoiceRef: true,
            guardianName1: true, guardianPhone1: true, contactEmail: true, contactPhone: true,
          },
        },
        lines: {
          select: {
            id: true, description: true, quantity: true,
            unitAmountCents: true, amountCents: true, feeScheduleId: true,
          },
        },
        allocations: {
          select: {
            id: true, amountCents: true, createdAt: true, createdVia: true,
            payment: { select: { id: true, receivedDate: true, method: true, bankReference: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!inv) return null;

    return {
      ...inv,
      athleteName: `${inv.athlete.firstName} ${inv.athlete.lastName}`,
      memberRef: inv.athlete.invoiceRef,
      ...decorateInvoice(inv, asOf),
    };
  }

  /**
   * The matcher's view, shaped for one call per reconciliation pass rather
   * than N+1 lookups.
   *
   * Guardian names are included deliberately: the commonest EFT description at
   * a dojo is the parent's name, not the child's, so a candidate set built only
   * from athlete names would push most fuzzy matches into the unmatched tail.
   */
  static async openInvoices(clubId: string, asOf: Date) {
    const invoices = await prisma.memberInvoice.findMany({
      where: { clubId, status: { in: [...OPEN_INVOICE_STATUSES] } },
      select: {
        id: true, athleteId: true, paymentRef: true, periodKey: true, status: true,
        totalCents: true, amountPaidCents: true, dueDate: true, issueDate: true,
        athlete: {
          select: {
            firstName: true, lastName: true, invoiceRef: true,
            guardianName1: true, guardianName2: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return invoices
      .filter((inv) => inv.totalCents - inv.amountPaidCents > 0)
      .map((inv) => ({
        id: inv.id,
        athleteId: inv.athleteId,
        athleteName: `${inv.athlete.firstName} ${inv.athlete.lastName}`,
        guardianNames: [inv.athlete.guardianName1, inv.athlete.guardianName2].filter(
          (n): n is string => Boolean(n),
        ),
        paymentRef: inv.paymentRef,
        memberRef: inv.athlete.invoiceRef,
        periodKey: inv.periodKey,
        status: inv.status,
        outstandingCents: inv.totalCents - inv.amountPaidCents,
        issueDate: toIsoDate(inv.issueDate),
        dueDate: toIsoDate(inv.dueDate),
      }));
  }

  static async summary(clubId: string, periodKey: string | undefined, asOf: Date) {
    const invoices = await prisma.memberInvoice.findMany({
      where: { clubId, ...(periodKey ? { periodKey } : {}) },
      select: { status: true, totalCents: true, amountPaidCents: true, dueDate: true },
    });

    const billable = invoices.filter((i) => i.status !== "CANCELLED" && i.status !== "DRAFT");
    const invoicedCents = billable.reduce((s, i) => s + i.totalCents, 0);
    const collectedCents = billable.reduce((s, i) => s + i.amountPaidCents, 0);

    const overdue = billable.filter(
      (i) =>
        (OVERDUE_ELIGIBLE_STATUSES as readonly string[]).includes(i.status) &&
        i.dueDate < asOf &&
        i.totalCents - i.amountPaidCents > 0,
    );

    const byStatus: Record<string, number> = {};
    for (const i of invoices) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;

    return {
      periodKey: periodKey ?? null,
      asOf: toIsoDate(asOf),
      invoiceCount: invoices.length,
      invoicedCents,
      collectedCents,
      outstandingCents: invoicedCents - collectedCents,
      overdueCount: overdue.length,
      overdueCents: overdue.reduce((s, i) => s + (i.totalCents - i.amountPaidCents), 0),
      byStatus,
    };
  }
}

export class BillingPaymentService {
  static async list(
    clubId: string,
    filters: { from?: string; to?: string; unallocatedOnly?: boolean },
  ) {
    const payments = await prisma.payment.findMany({
      where: {
        clubId,
        ...(filters.from || filters.to
          ? {
              receivedDate: {
                ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00Z`) } : {}),
                ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59Z`) } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true, receivedDate: true, amountCents: true, currency: true, method: true,
        bankReference: true, description: true, source: true,
        matchMethod: true, matchConfidence: true, recordedVia: true, notes: true, createdAt: true,
        allocations: {
          select: {
            id: true, amountCents: true, invoiceId: true,
            invoice: {
              select: {
                paymentRef: true, periodKey: true,
                athlete: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { receivedDate: "desc" },
    });

    const rows = payments.map((p) => {
      const allocatedCents = p.allocations.reduce((s, a) => s + a.amountCents, 0);
      return {
        ...p,
        receivedDate: toIsoDate(p.receivedDate),
        matchConfidence: p.matchConfidence === null ? null : Number(p.matchConfidence),
        allocatedCents,
        unallocatedCents: p.amountCents - allocatedCents,
        allocations: p.allocations.map((a) => ({
          id: a.id,
          invoiceId: a.invoiceId,
          amountCents: a.amountCents,
          paymentRef: a.invoice.paymentRef,
          periodKey: a.invoice.periodKey,
          athleteName: `${a.invoice.athlete.firstName} ${a.invoice.athlete.lastName}`,
        })),
      };
    });

    return filters.unallocatedOnly ? rows.filter((r) => r.unallocatedCents > 0) : rows;
  }
}
