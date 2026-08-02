import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Turn club billing on for one club, or inspect/disable it.
 *
 * Nothing in /api/billing responds for a club without a row here — every route
 * returns 404 — so this script is the switch that makes the feature exist for
 * a club, and the only one.
 *
 * Usage:
 *   tsx scripts/enable-club-billing.ts <clubId> --prefix GKWI [--invoice-day 1]
 *                                      [--due-days 7] [--currency NAD] [--tz Africa/Windhoek]
 *   tsx scripts/enable-club-billing.ts --list
 *   tsx scripts/enable-club-billing.ts --disable <clubId>
 *
 * Against production, override the connection for the one command:
 *   DATABASE_URL="$DBURL" npx tsx scripts/enable-club-billing.ts <clubId>
 */

function describeTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "(DATABASE_URL unset)";
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--list") {
    const configs = await prisma.clubBillingConfig.findMany({
      select: {
        clubId: true, enabled: true, currency: true, timezone: true,
        refPrefix: true, nextRefSeq: true, invoiceDay: true, dueDaysAfter: true,
        nonBillableMonths: true,
        club: { select: { name: true, _count: { select: { athletes: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
    console.log(`\n${describeTarget()}\n`);
    if (configs.length === 0) {
      console.log("No clubs have billing configured. Every /api/billing route returns 404.\n");
      return;
    }
    for (const c of configs) {
      console.log(
        `  ${c.club.name}  [${c.enabled ? "ENABLED" : "disabled"}]\n` +
          `    clubId    ${c.clubId}\n` +
          `    refs      ${c.refPrefix}-${String(c.nextRefSeq).padStart(4, "0")} next  (${c.currency}, ${c.timezone})\n` +
          `    cycle     invoice on day ${c.invoiceDay}, due ${c.dueDaysAfter} days later\n` +
          `    skipped   ${c.nonBillableMonths.length ? "months " + c.nonBillableMonths.join(", ") : "none"}\n` +
          `    athletes  ${c.club._count.athletes}\n`,
      );
    }
    return;
  }

  if (args[0] === "--disable") {
    const clubId = args[1];
    if (!clubId) {
      console.error("Usage: tsx scripts/enable-club-billing.ts --disable <clubId>");
      process.exit(1);
    }
    const existing = await prisma.clubBillingConfig.findUnique({ where: { clubId } });
    if (!existing) {
      console.error(`No billing config for ${clubId} in ${describeTarget()}`);
      process.exit(1);
    }
    await prisma.clubBillingConfig.update({ where: { clubId }, data: { enabled: false } });
    console.log(
      `\nBilling disabled for ${clubId}. Every /api/billing route now returns 404 for\n` +
        "this club again. Existing invoices and payments are untouched — this is a\n" +
        "switch, not a delete.\n",
    );
    return;
  }

  const clubId = args[0];
  if (!clubId || clubId.startsWith("--")) {
    console.error(
      "Usage:\n" +
        "  tsx scripts/enable-club-billing.ts <clubId> --prefix GKWI [--invoice-day 1]\n" +
        "                                     [--due-days 7] [--currency NAD] [--tz Africa/Windhoek]\n" +
        "  tsx scripts/enable-club-billing.ts --list\n" +
        "  tsx scripts/enable-club-billing.ts --disable <clubId>\n",
    );
    process.exit(1);
  }

  // No default. A reference prefix identifies one club — "GKWI" for Goju Kai
  // Windhoek — so any value that could be defaulted would be wrong for the
  // next club to enable billing, and would then collide (see the check below).
  const prefixArg = flag(args, "prefix");
  const existingConfig = await prisma.clubBillingConfig.findUnique({ where: { clubId } });
  if (!prefixArg && !existingConfig) {
    console.error(
      "\n--prefix is required when enabling a club.\n\n" +
        "  It identifies this club in every payment reference a parent ever sees\n" +
        "  (GKWI-0231-2608), so it is club-specific and has no sensible default.\n" +
        "  2-5 letters. Pick it carefully: it cannot be changed once references\n" +
        "  are in circulation.\n",
    );
    process.exit(1);
  }
  const refPrefix = (prefixArg ?? existingConfig!.refPrefix).toUpperCase();
  const currency = (flag(args, "currency") ?? "NAD").toUpperCase();
  const timezone = flag(args, "tz") ?? "Africa/Windhoek";
  const invoiceDay = Number(flag(args, "invoice-day") ?? 1);
  const dueDaysAfter = Number(flag(args, "due-days") ?? 7);
  // Months the club closes through — Windhoek is "5,12" (May and December
  // school holidays). Omitting the flag leaves an existing setting alone
  // rather than silently clearing it.
  const nonBillableArg = flag(args, "non-billable");
  const nonBillableMonths = nonBillableArg
    ? nonBillableArg.split(",").map((m) => Number(m.trim())).filter((m) => Number.isInteger(m))
    : undefined;
  if (nonBillableArg && nonBillableMonths!.some((m) => m < 1 || m > 12)) {
    console.error("--non-billable takes calendar months 1-12, e.g. 5,12");
    process.exit(1);
  }

  if (!/^[A-Z]{2,5}$/.test(refPrefix)) {
    console.error(`Invalid --prefix "${refPrefix}": 2-5 letters. It must match the reference`);
    console.error("regex the reconciliation matcher uses: /\\b([A-Z]{2,5})-(\\d{3,6})...");
    process.exit(1);
  }
  if (!Number.isInteger(invoiceDay) || invoiceDay < 1 || invoiceDay > 28) {
    console.error("--invoice-day must be 1-28 (28 so every month has the day).");
    process.exit(1);
  }
  if (!Number.isInteger(dueDaysAfter) || dueDaysAfter < 0 || dueDaysAfter > 90) {
    console.error("--due-days must be 0-90.");
    process.exit(1);
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { name: true, _count: { select: { athletes: true } } },
  });
  if (!club) {
    const total = await prisma.club.count();
    const sample = await prisma.club.findMany({
      select: { id: true, name: true }, orderBy: { name: "asc" }, take: 5,
    });
    console.error(`\nNo club with id ${clubId} in ${describeTarget()}\n`);
    console.error(`That database has ${total} club(s):`);
    for (const c of sample) console.error(`  ${c.id}  ${c.name}`);
    if (total > sample.length) console.error(`  … and ${total - sample.length} more`);
    console.error(
      '\nIf you expected production, override the connection:\n' +
        '  DATABASE_URL="$DBURL" npx tsx scripts/enable-club-billing.ts …\n',
    );
    process.exit(1);
  }

  const existing = existingConfig;

  // Two clubs must never share a prefix.
  //
  // Member references are unique per club — (clubId, invoiceRef) — so both
  // clubs would happily assign 0001. But MemberInvoice.paymentRef is globally
  // unique, deliberately: a bank line quoting GKWI-0001-2607 then identifies
  // exactly one invoice in the whole system without anyone knowing which club
  // it belongs to, which is what makes reconciliation work.
  //
  // Sharing a prefix therefore breaks at INVOICE-RUN time, months later, as an
  // opaque unique-constraint error in the middle of a billing cycle. Catch it
  // here instead, where someone is actually making the choice.
  const clash = await prisma.clubBillingConfig.findFirst({
    where: { refPrefix, NOT: { clubId } },
    select: { clubId: true, club: { select: { name: true } } },
  });
  if (clash) {
    console.error(
      `\nPrefix ${refPrefix} is already used by ${clash.club.name} (${clash.clubId}).\n\n` +
        "  Member references are unique per club, so both clubs would assign\n" +
        `  ${refPrefix}-0001 quite happily — but invoice references are globally unique,\n` +
        `  so the second club's first invoice run would fail on ${refPrefix}-0001-2607\n` +
        "  with a unique-constraint error, mid-cycle, months from now.\n\n" +
        "  Pick a different prefix for this club.\n",
    );
    process.exit(1);
  }

  // Changing the prefix after references are in circulation is the one edit
  // here that cannot be undone by editing a row: parents set up a beneficiary
  // in their banking app once and never revisit it, so every reference already
  // sent keeps arriving under the old prefix forever.
  if (existing && existing.refPrefix !== refPrefix) {
    const issued = await prisma.memberInvoice.count({ where: { clubId } });
    const refsAssigned = await prisma.athlete.count({
      where: { clubId, invoiceRef: { not: null } },
    });
    console.error(
      `\nRefusing to change the reference prefix from ${existing.refPrefix} to ${refPrefix}.\n\n` +
        `  ${refsAssigned} member reference(s) and ${issued} invoice(s) already exist under\n` +
        `  ${existing.refPrefix}. Parents save a beneficiary once and never edit it, so payments\n` +
        `  would keep arriving under the old prefix indefinitely while new invoices\n` +
        `  quoted the new one — the reconciliation matcher would see both and you\n` +
        `  would be chasing people who had paid.\n\n` +
        "  If you genuinely mean to renumber, do it deliberately as a migration that\n" +
        "  rewrites the existing references too.\n",
    );
    process.exit(1);
  }

  const config = await prisma.clubBillingConfig.upsert({
    where: { clubId },
    // nextRefSeq is deliberately absent from the update: it is an allocation
    // counter, and lowering it would hand out a reference twice.
    update: {
      enabled: true, currency, timezone, refPrefix, invoiceDay, dueDaysAfter,
      ...(nonBillableMonths ? { nonBillableMonths } : {}),
    },
    create: {
      clubId, enabled: true, currency, timezone, refPrefix, invoiceDay, dueDaysAfter,
      nonBillableMonths: nonBillableMonths ?? [],
    },
  });

  console.log(`\nBilling ${existing ? "updated" : "enabled"} for ${club.name}`);
  console.log(`  target        ${describeTarget()}`);
  console.log(`  clubId        ${clubId}`);
  console.log(`  athletes      ${club._count.athletes}`);
  console.log(`  currency      ${config.currency}`);
  console.log(`  timezone      ${config.timezone}`);
  console.log(`  refs          ${config.refPrefix}-${String(config.nextRefSeq).padStart(4, "0")} next`);
  console.log(`  cycle         invoice on day ${config.invoiceDay}, due ${config.dueDaysAfter} days later`);
  console.log(
    `  not billed    ${config.nonBillableMonths.length ? config.nonBillableMonths.join(", ") : "(every month billed)"}`,
  );

  const feeCount = await prisma.feeSchedule.count({ where: { clubId, active: true } });
  const subCount = await prisma.memberSubscription.count({ where: { athlete: { clubId } } });
  console.log(`\n  /api/billing now answers for this club instead of 404.`);
  console.log(`  Fee schedules: ${feeCount}   Subscriptions: ${subCount}`);
  if (feeCount === 0 || subCount === 0) {
    console.log(
      "\n  An invoice run would produce nothing yet — it bills active members who\n" +
        "  hold a subscription to a fee schedule. Both are still to come.\n",
    );
  } else {
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
