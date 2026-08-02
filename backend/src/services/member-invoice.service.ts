import type { MemberInvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { parsePeriodKey, toIsoDate, utcDate } from "../utils/dates.js";
import { assignMemberRefs, formatInvoiceRef } from "../utils/references.js";

/**
 * The invoice run and the invoice state machine.
 *
 * The run is a pure function of (club, period, subscriptions overlapping it,
 * athlete.isActive). Nothing is judged; everything is looked up. That is what
 * "you approved but computed nothing" requires — a human can check the preview
 * against a spreadsheet by hand, which is exactly the point.
 */

const ALLOWED: Record<MemberInvoiceStatus, MemberInvoiceStatus[]> = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["SENT", "CANCELLED"],
  SENT: ["CANCELLED", "WRITTEN_OFF"],
  PARTIALLY_PAID: ["WRITTEN_OFF"],
  PAID: [],
  CANCELLED: [],
  WRITTEN_OFF: [],
};

/**
 * PAID and PARTIALLY_PAID appear in no allowed-transition list on purpose.
 *
 * They are reachable only from recomputeInvoicePaidState(), inside the
 * allocation transaction. No caller — model, human, or cron — can declare an
 * invoice paid without a payment row behind it. That is "LLMs never write
 * financial state directly" made mechanical rather than promised.
 */
export function assertTransition(from: MemberInvoiceStatus, to: MemberInvoiceStatus): void {
  if (to === "PAID" || to === "PARTIALLY_PAID") {
    throw {
      status: 422,
      message: "paid status is derived from allocations, not set directly",
    };
  }
  if (!ALLOWED[from].includes(to)) {
    throw { status: 422, message: `Cannot move an invoice from ${from} to ${to}` };
  }
}

/**
 * Recompute an invoice's paid state from its allocations.
 *
 * Recomputed, never incremented: an increment drifts the moment anything is
 * retried, and the sum is cheap. Must be called inside the same transaction
 * that changed the allocations, with the invoice row already locked.
 */
export async function recomputeInvoicePaidState(
  tx: Prisma.TransactionClient,
  invoiceId: string,
): Promise<{ amountPaidCents: number; status: MemberInvoiceStatus }> {
  const invoice = await tx.memberInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { id: true, totalCents: true, status: true },
  });

  const agg = await tx.paymentAllocation.aggregate({
    where: { invoiceId },
    _sum: { amountCents: true },
  });
  const paid = agg._sum.amountCents ?? 0;

  if (paid > invoice.totalCents) {
    throw {
      status: 422,
      message: `Allocations (${paid}) exceed invoice total (${invoice.totalCents})`,
    };
  }

  // CANCELLED and WRITTEN_OFF are terminal decisions about the debt itself;
  // money arriving afterwards must not silently resurrect them.
  let status = invoice.status;
  if (invoice.status !== "CANCELLED" && invoice.status !== "WRITTEN_OFF") {
    if (paid === 0) status = invoice.status === "PARTIALLY_PAID" || invoice.status === "PAID"
      ? "SENT"
      : invoice.status;
    else if (paid >= invoice.totalCents) status = "PAID";
    else status = "PARTIALLY_PAID";
  }

  await tx.memberInvoice.update({
    where: { id: invoiceId },
    data: { amountPaidCents: paid, status },
  });

  return { amountPaidCents: paid, status };
}

export type PlannedLine = {
  feeScheduleId: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
};

export type PlannedInvoice = {
  athleteId: string;
  athleteName: string;
  memberRef: string | null;
  paymentRef: string | null;
  lines: PlannedLine[];
  totalCents: number;
  /** Set when this athlete already has an invoice for the period. */
  skipReason?: string;
};

export type InvoicePlan = {
  clubId: string;
  periodKey: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  invoices: PlannedInvoice[];
  skipped: PlannedInvoice[];
  totalCents: number;
  invoiceCount: number;
};

export class MemberInvoiceService {
  /**
   * Compute what a run would produce. Writes nothing.
   *
   * This is what the approval gate previews, and it is the whole "you approved
   * but computed nothing" done-condition made concrete: a human clicking one
   * button in front of a fully computed table.
   */
  static async planRun(clubId: string, periodKey: string): Promise<InvoicePlan> {
    const config = await prisma.clubBillingConfig.findUniqueOrThrow({ where: { clubId } });
    const periodStart = parsePeriodKey(periodKey);

    const issueDate = utcDate(
      periodStart.getUTCFullYear(),
      periodStart.getUTCMonth() + 1,
      config.invoiceDay,
    );
    const dueDate = new Date(issueDate.getTime() + config.dueDaysAfter * 86_400_000);

    // A subscription counts if it overlaps the invoice date. Endless
    // subscriptions (endDate null) always overlap.
    const subscriptions = await prisma.memberSubscription.findMany({
      where: {
        athlete: { clubId, isActive: true },
        startDate: { lte: issueDate },
        OR: [{ endDate: null }, { endDate: { gte: issueDate } }],
        feeSchedule: {
          active: true,
          cadence: "MONTHLY",
          effectiveFrom: { lte: issueDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: issueDate } }],
        },
      },
      select: {
        athleteId: true,
        quantity: true,
        overrideAmountCents: true,
        athlete: { select: { firstName: true, lastName: true, invoiceRef: true } },
        feeSchedule: { select: { id: true, name: true, amountCents: true } },
      },
      orderBy: [{ athlete: { lastName: "asc" } }, { athlete: { firstName: "asc" } }],
    });

    const existing = await prisma.memberInvoice.findMany({
      where: { clubId, periodKey },
      select: { athleteId: true },
    });
    const alreadyInvoiced = new Set(existing.map((e) => e.athleteId));

    const byAthlete = new Map<string, PlannedInvoice>();
    for (const sub of subscriptions) {
      const unit = sub.overrideAmountCents ?? sub.feeSchedule.amountCents;
      const line: PlannedLine = {
        feeScheduleId: sub.feeSchedule.id,
        description: `${sub.feeSchedule.name} — ${periodKey}`,
        quantity: sub.quantity,
        unitAmountCents: unit,
        // Recomputed server-side; never taken from a caller.
        amountCents: unit * sub.quantity,
      };

      const entry = byAthlete.get(sub.athleteId) ?? {
        athleteId: sub.athleteId,
        athleteName: `${sub.athlete.firstName} ${sub.athlete.lastName}`,
        memberRef: sub.athlete.invoiceRef,
        paymentRef: sub.athlete.invoiceRef
          ? formatInvoiceRef(sub.athlete.invoiceRef, periodKey)
          : null,
        lines: [],
        totalCents: 0,
      };
      entry.lines.push(line);
      entry.totalCents += line.amountCents;
      byAthlete.set(sub.athleteId, entry);
    }

    const all = [...byAthlete.values()];
    const invoices = all.filter((i) => !alreadyInvoiced.has(i.athleteId));
    const skipped = all
      .filter((i) => alreadyInvoiced.has(i.athleteId))
      .map((i) => ({ ...i, skipReason: `already invoiced for ${periodKey}` }));

    return {
      clubId,
      periodKey,
      issueDate: toIsoDate(issueDate),
      dueDate: toIsoDate(dueDate),
      currency: config.currency,
      invoices,
      skipped,
      invoiceCount: invoices.length,
      totalCents: invoices.reduce((s, i) => s + i.totalCents, 0),
    };
  }

  /**
   * Create the run and its invoices, in one transaction.
   *
   * Idempotent at the database level twice over: InvoiceRun is unique on
   * (clubId, periodKey), and MemberInvoice on (clubId, athleteId, periodKey).
   * Both survive the agent stack being rebuilt, which the tools-api
   * idempotency table does not.
   */
  static async executeRun(
    clubId: string,
    periodKey: string,
    createdVia: string,
  ): Promise<{ runId: string; invoiceCount: number; totalCents: number; replayed: boolean }> {
    const existingRun = await prisma.invoiceRun.findUnique({
      where: { clubId_periodKey: { clubId, periodKey } },
      select: { id: true, invoiceCount: true, totalCents: true },
    });
    if (existingRun) {
      return { runId: existingRun.id, ...existingRun, replayed: true, invoiceCount: existingRun.invoiceCount, totalCents: existingRun.totalCents };
    }

    const plan = await this.planRun(clubId, periodKey);
    if (plan.invoices.length === 0) {
      throw {
        status: 422,
        message:
          `Nothing to invoice for ${periodKey}. Active members need a subscription ` +
          "to an active monthly fee schedule.",
      };
    }

    return prisma.$transaction(async (tx) => {
      const run = await tx.invoiceRun.create({
        data: {
          clubId,
          periodKey,
          status: "DRAFT",
          createdVia,
          invoiceCount: plan.invoices.length,
          totalCents: plan.totalCents,
        },
        select: { id: true },
      });

      // References are allocated here, in the write phase — a dry run must not
      // consume sequence numbers.
      const refs = await assignMemberRefs(
        tx,
        clubId,
        plan.invoices.map((i) => i.athleteId),
      );

      for (const planned of plan.invoices) {
        const memberRef = refs.get(planned.athleteId);
        if (!memberRef) throw new Error(`No reference allocated for ${planned.athleteId}`);

        await tx.memberInvoice.create({
          data: {
            clubId,
            athleteId: planned.athleteId,
            kind: "SUBSCRIPTION",
            periodKey,
            issueDate: new Date(`${plan.issueDate}T00:00:00Z`),
            dueDate: new Date(`${plan.dueDate}T00:00:00Z`),
            subtotalCents: planned.totalCents,
            totalCents: planned.totalCents,
            currency: plan.currency,
            paymentRef: formatInvoiceRef(memberRef, periodKey),
            runId: run.id,
            createdVia,
            lines: { create: planned.lines },
          },
        });
      }

      return {
        runId: run.id,
        invoiceCount: plan.invoices.length,
        totalCents: plan.totalCents,
        replayed: false,
      };
    });
  }

  /** DRAFT → APPROVED for the run and every invoice in it. */
  static async approveRun(clubId: string, runId: string): Promise<{ approved: number }> {
    return prisma.$transaction(async (tx) => {
      const run = await tx.invoiceRun.findFirst({
        where: { id: runId, clubId },
        select: { id: true, status: true },
      });
      if (!run) throw { status: 404, message: "Not found" };
      if (run.status === "APPROVED") return { approved: 0 };
      if (run.status !== "DRAFT") {
        throw { status: 422, message: `Cannot approve a ${run.status} run` };
      }

      const updated = await tx.memberInvoice.updateMany({
        where: { runId, status: "DRAFT" },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      await tx.invoiceRun.update({
        where: { id: runId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      return { approved: updated.count };
    });
  }

  static async setStatus(
    clubId: string,
    invoiceId: string,
    to: MemberInvoiceStatus,
    reason?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.memberInvoice.findFirst({
        where: { id: invoiceId, clubId },
        select: { id: true, status: true, notes: true },
      });
      if (!invoice) throw { status: 404, message: "Not found" };

      assertTransition(invoice.status, to);

      const now = new Date();
      return tx.memberInvoice.update({
        where: { id: invoiceId },
        data: {
          status: to,
          ...(to === "SENT" ? { sentAt: now } : {}),
          ...(to === "CANCELLED" ? { cancelledAt: now } : {}),
          ...(reason
            ? { notes: invoice.notes ? `${invoice.notes}\n${reason}` : reason }
            : {}),
        },
        select: { id: true, status: true, sentAt: true, cancelledAt: true, notes: true },
      });
    });
  }
}
