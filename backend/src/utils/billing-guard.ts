import type { ClubBillingConfig } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

/**
 * Every billing route calls this first.
 *
 * It returns 404, not 403, and that is the whole multi-tenant story: this is a
 * live federation platform used by clubs that did not ask for billing. A club
 * without a config should not be told "forbidden", because that reveals a
 * feature exists and that someone decided they may not use it. 404 makes the
 * billing surface behave, for them, exactly as if the code were not deployed.
 *
 * `enabled: false` is treated the same as no row at all — switching a club off
 * must close the door as completely as never having opened it.
 */
export async function requireBillingEnabled(clubId: string): Promise<ClubBillingConfig> {
  if (!clubId) throw { status: 404, message: "Not found" };

  const config = await prisma.clubBillingConfig.findUnique({ where: { clubId } });
  if (!config || !config.enabled) throw { status: 404, message: "Not found" };

  return config;
}

/** Invoice statuses that represent money still owed. */
export const OPEN_INVOICE_STATUSES = ["APPROVED", "SENT", "PARTIALLY_PAID"] as const;

/**
 * Statuses that can be overdue. APPROVED is deliberately excluded: an approved
 * invoice has not been sent, so the member does not know it exists and cannot
 * be in arrears on it. It still counts as outstanding for matching a payment
 * that arrives early against a known reference.
 */
export const OVERDUE_ELIGIBLE_STATUSES = ["SENT", "PARTIALLY_PAID"] as const;
