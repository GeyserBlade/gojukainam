import type { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { recomputeInvoicePaidState } from "./member-invoice.service.js";

/**
 * Recording money.
 *
 * A payment is not an invoice payment: three months paid up front is one bank
 * line and three allocations, and an overpayment leaves a credit that a single
 * invoiceId FK could not represent without lying. So the payment and its
 * allocations are separate, and the invariants below are what keep them honest.
 */

export type AllocationInput = { invoiceId: string; amountCents: number };

export type RecordPaymentInput = {
  clubId: string;
  receivedDate: Date;
  amountCents: number;
  method: PaymentMethod;
  source: string;
  recordedVia: string;
  bankReference?: string | undefined;
  description?: string | undefined;
  externalHash?: string | undefined;
  matchMethod?: string | undefined;
  matchConfidence?: number | undefined;
  notes?: string | undefined;
  allocations?: AllocationInput[] | undefined;
};

/**
 * Apply allocations inside an open transaction, enforcing every money
 * invariant, then recompute each touched invoice's paid state.
 *
 * Rows are locked in a deterministic order — invoices by id — so two
 * concurrent allocations against the same pair cannot deadlock by grabbing
 * them in opposite orders.
 */
async function allocateWithin(
  tx: Prisma.TransactionClient,
  paymentId: string,
  clubId: string,
  allocations: AllocationInput[],
  createdVia: string,
): Promise<void> {
  if (allocations.length === 0) return;

  for (const a of allocations) {
    if (a.amountCents <= 0) {
      throw { status: 422, message: "Allocation amounts must be positive" };
    }
  }

  const ordered = [...allocations].sort((x, y) => x.invoiceId.localeCompare(y.invoiceId));
  const invoiceIds = ordered.map((a) => a.invoiceId);

  // FOR UPDATE via a raw query: Prisma has no row-lock API, and without the
  // lock two payments landing on the same invoice can both read a stale
  // amountPaidCents and each conclude there is room.
  await tx.$queryRaw`SELECT id FROM "MemberInvoice" WHERE id = ANY(${invoiceIds}) FOR UPDATE`;

  const payment = await tx.payment.findUniqueOrThrow({
    where: { id: paymentId },
    select: { amountCents: true, clubId: true },
  });

  const invoices = await tx.memberInvoice.findMany({
    where: { id: { in: invoiceIds } },
    select: { id: true, clubId: true, totalCents: true, status: true },
  });
  const byId = new Map(invoices.map((i) => [i.id, i]));

  for (const a of ordered) {
    const invoice = byId.get(a.invoiceId);
    if (!invoice) throw { status: 404, message: `Invoice ${a.invoiceId} not found` };
    // A payment must never cross a club boundary, even if a caller asks.
    if (invoice.clubId !== clubId || payment.clubId !== clubId) {
      throw { status: 403, message: "Forbidden" };
    }
    if (invoice.status === "CANCELLED") {
      throw { status: 422, message: `Invoice ${a.invoiceId} is cancelled` };
    }
  }

  for (const a of ordered) {
    await tx.paymentAllocation.upsert({
      where: { paymentId_invoiceId: { paymentId, invoiceId: a.invoiceId } },
      create: { paymentId, invoiceId: a.invoiceId, amountCents: a.amountCents, createdVia },
      update: { amountCents: a.amountCents },
    });
  }

  // Invariant 1: a payment cannot be allocated beyond its own value.
  const paymentTotal = await tx.paymentAllocation.aggregate({
    where: { paymentId },
    _sum: { amountCents: true },
  });
  if ((paymentTotal._sum.amountCents ?? 0) > payment.amountCents) {
    throw {
      status: 422,
      message:
        `Allocations (${paymentTotal._sum.amountCents}) exceed the payment ` +
        `(${payment.amountCents})`,
    };
  }

  // Invariant 2 and 3 live in recomputeInvoicePaidState: allocations may not
  // exceed an invoice total, and amountPaidCents is the recomputed sum.
  for (const id of invoiceIds) {
    await recomputeInvoicePaidState(tx, id);
  }
}

export class BillingPaymentWriteService {
  /**
   * Record a payment and its allocations atomically.
   *
   * externalHash conflict returns the existing payment with `replayed: true`
   * rather than 409: re-ingesting the same bank line is a no-op, not an error,
   * and the caller should not have to distinguish "already done" from "failed".
   */
  static async record(input: RecordPaymentInput) {
    if (input.amountCents <= 0) {
      throw { status: 422, message: "Payment amount must be positive" };
    }

    if (input.externalHash) {
      const existing = await prisma.payment.findUnique({
        where: { externalHash: input.externalHash },
        select: { id: true, clubId: true, amountCents: true, receivedDate: true },
      });
      if (existing) {
        if (existing.clubId !== input.clubId) throw { status: 403, message: "Forbidden" };
        return { ...existing, replayed: true };
      }
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          clubId: input.clubId,
          receivedDate: input.receivedDate,
          amountCents: input.amountCents,
          method: input.method,
          source: input.source,
          recordedVia: input.recordedVia,
          ...(input.bankReference !== undefined ? { bankReference: input.bankReference } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.externalHash !== undefined ? { externalHash: input.externalHash } : {}),
          ...(input.matchMethod !== undefined ? { matchMethod: input.matchMethod } : {}),
          ...(input.matchConfidence !== undefined
            ? { matchConfidence: input.matchConfidence }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
        select: { id: true, clubId: true, amountCents: true, receivedDate: true },
      });

      await allocateWithin(
        tx,
        payment.id,
        input.clubId,
        input.allocations ?? [],
        input.recordedVia,
      );

      return { ...payment, replayed: false };
    });
  }

  /** Allocate an existing payment — the "money arrived, match it later" path. */
  static async allocate(
    clubId: string,
    paymentId: string,
    allocations: AllocationInput[],
    createdVia: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, clubId },
        select: { id: true },
      });
      if (!payment) throw { status: 404, message: "Not found" };

      await allocateWithin(tx, paymentId, clubId, allocations, createdVia);

      const total = await tx.paymentAllocation.aggregate({
        where: { paymentId },
        _sum: { amountCents: true },
      });
      const full = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { amountCents: true },
      });
      return {
        paymentId,
        allocatedCents: total._sum.amountCents ?? 0,
        unallocatedCents: full.amountCents - (total._sum.amountCents ?? 0),
      };
    });
  }
}
