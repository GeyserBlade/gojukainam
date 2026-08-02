import type { Prisma } from "@prisma/client";

/**
 * Payment reference allocation.
 *
 * Two levels, one pattern (plan §2.1):
 *   member   GKWI-0231        Athlete.invoiceRef — a parent saves this once
 *   invoice  GKWI-0231-2608   MemberInvoice.paymentRef — embeds the member ref
 *
 * The member reference is the one that matters. A parent sets up a beneficiary
 * in their banking app once and never edits it, so a scheme demanding a fresh
 * reference each month degrades to whatever they typed in January. The invoice
 * reference exists for the cases where it *is* typed correctly, and because it
 * embeds the member ref, one regex resolves both.
 *
 * Never model-generated, never client-generated: the sequence is allocated
 * inside the same transaction that assigns the reference.
 */

/** Matches both levels. The period group is present only on invoice refs. */
export const REFERENCE_PATTERN = /\b([A-Z]{2,5})-(\d{3,6})(?:-(\d{4}))?\b/i;

export function formatMemberRef(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

/** `GKWI-0231` + period 2026-08 → `GKWI-0231-2608`. */
export function formatInvoiceRef(memberRef: string, periodKey: string): string {
  const [year, month] = periodKey.split("-");
  return `${memberRef}-${year!.slice(2)}${month}`;
}

/**
 * Assign member references to athletes that lack one, in a stable order.
 *
 * Runs inside the invoice run's transaction, not the dry run: a preview must
 * not write. Consequence, stated so it is not mistaken for a bug — a cancelled
 * or failed run can leave gaps in the sequence. Gaps are harmless; a reference
 * issued twice is not, which is why nextRefSeq only ever moves forward.
 *
 * Ordering is by surname then first name rather than by id, so the numbers a
 * club sees for the first time are in roster order rather than cuid order.
 */
export async function assignMemberRefs(
  tx: Prisma.TransactionClient,
  clubId: string,
  athleteIds: string[],
): Promise<Map<string, string>> {
  const assigned = new Map<string, string>();
  if (athleteIds.length === 0) return assigned;

  const athletes = await tx.athlete.findMany({
    where: { id: { in: athleteIds }, clubId },
    select: { id: true, invoiceRef: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  for (const a of athletes) {
    if (a.invoiceRef) {
      assigned.set(a.id, a.invoiceRef);
      continue;
    }

    // Re-read the counter per allocation and write it back immediately: the
    // row is locked for the rest of the transaction from the first update, so
    // two concurrent runs serialise rather than colliding on the unique index.
    const config = await tx.clubBillingConfig.update({
      where: { clubId },
      data: { nextRefSeq: { increment: 1 } },
      select: { refPrefix: true, nextRefSeq: true },
    });

    // increment returns the NEW value, so the allocated number is one behind.
    const ref = formatMemberRef(config.refPrefix, config.nextRefSeq - 1);
    await tx.athlete.update({ where: { id: a.id }, data: { invoiceRef: ref } });
    assigned.set(a.id, ref);
  }

  return assigned;
}

/**
 * Resolve a reference found in a bank description.
 *
 * With the period group → that specific invoice. Without → that member, and
 * the caller allocates oldest-open-invoice first. Two levels, one pattern, no
 * branching in the matcher (plan §2.3).
 */
export function parseReference(text: string): { memberRef: string; periodKey?: string } | null {
  const m = REFERENCE_PATTERN.exec(text);
  if (!m) return null;

  const memberRef = `${m[1]!.toUpperCase()}-${m[2]}`;
  if (!m[3]) return { memberRef };

  const yy = m[3].slice(0, 2);
  const mm = m[3].slice(2, 4);
  return { memberRef, periodKey: `20${yy}-${mm}` };
}
