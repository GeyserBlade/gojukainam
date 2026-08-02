import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fee schedules and subscriptions for a club.
 *
 * The invoice run bills active members who hold a subscription to an active
 * monthly fee schedule. Without both, a run returns 422 and generates nothing,
 * so this is the step between "billing is enabled" and "you can invoice".
 *
 * Windhoek 2026, from the club's own Class Information document:
 *
 *   Beginners            white to green belt          N$770/month
 *   Advanced             green belt and up, under 16  N$830/month
 *   Seniors              over 16                      N$830/month
 *   Affiliation          annual membership            N$250/year
 *   Affiliation (H2)     joined after 30 June         N$140
 *
 * Advanced and Seniors are the same price and the document prices them in one
 * column. They are separate schedules anyway: they are separate classes with
 * separate times and age brackets, so a subscription then records which class
 * a member actually attends, and a future price split needs no migration.
 *
 * NOT modelled here, because they are earned by how someone pays rather than
 * by what they are subscribed to:
 *   N$260  per student, for paying 3 months in advance (excludes January)
 *   N$790  for paying the year in advance
 * Those are applied to an issued invoice — see POST /billing/invoices/:id/discount.
 *
 * The family discount IS modelled, as overrideAmountCents on the additional
 * sibling's subscription: N$160 off each additional member from one family.
 *
 * Usage:
 *   npm run seed-club-fees -- <clubId> --fees
 *   npm run seed-club-fees -- <clubId> --assign MONTHLY_BEGINNER --all-active
 *   npm run seed-club-fees -- <clubId> --assign MONTHLY_SENIOR --athlete <id>
 *   npm run seed-club-fees -- <clubId> --family <id,id,...>
 *   npm run seed-club-fees -- <clubId> --suggest-families
 *   npm run seed-club-fees -- <clubId> --status
 */

const YEAR_START = new Date("2026-01-01T00:00:00Z");
/** N$160 off each additional sibling. */
const FAMILY_DISCOUNT_CENTS = 16_000;

const SCHEDULES = [
  { code: "MONTHLY_BEGINNER", name: "Monthly tuition — Beginners", feeType: "MONTHLY", cadence: "MONTHLY", amountCents: 77_000 },
  { code: "MONTHLY_ADVANCED", name: "Monthly tuition — Advanced", feeType: "MONTHLY", cadence: "MONTHLY", amountCents: 83_000 },
  { code: "MONTHLY_SENIOR", name: "Monthly tuition — Seniors", feeType: "MONTHLY", cadence: "MONTHLY", amountCents: 83_000 },
  { code: "AFFILIATION_ANNUAL", name: "Annual affiliation/membership", feeType: "REGISTRATION", cadence: "ONE_OFF", amountCents: 25_000 },
  { code: "AFFILIATION_MIDYEAR", name: "Affiliation — joined after 30 June", feeType: "REGISTRATION", cadence: "ONE_OFF", amountCents: 14_000 },
] as const;

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

const money = (cents: number) => `N$${(cents / 100).toFixed(2)}`;

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const clubId = args[0];

  if (!clubId || clubId.startsWith("--")) {
    console.error(
      "Usage:\n" +
        "  npm run seed-club-fees -- <clubId> --fees\n" +
        "  npm run seed-club-fees -- <clubId> --assign <CODE> --all-active\n" +
        "  npm run seed-club-fees -- <clubId> --assign <CODE> --athlete <athleteId>\n" +
        "  npm run seed-club-fees -- <clubId> --family <athleteId,athleteId,...>\n" +
        "  npm run seed-club-fees -- <clubId> --suggest-families\n" +
        "  npm run seed-club-fees -- <clubId> --status\n",
    );
    process.exit(1);
  }

  const config = await prisma.clubBillingConfig.findUnique({
    where: { clubId },
    select: { enabled: true, club: { select: { name: true } } },
  });
  if (!config) {
    console.error(
      `\nNo billing config for ${clubId} in ${describeTarget()}.\n` +
        "Run enable-club-billing first — fee schedules on a club without billing\n" +
        "would be invisible to every endpoint.\n",
    );
    process.exit(1);
  }
  const clubName = config.club.name;

  // --- create/update the fee schedules -----------------------------------
  if (args.includes("--fees")) {
    console.log(`\n${clubName} — fee schedules in ${describeTarget()}\n`);
    for (const s of SCHEDULES) {
      const existing = await prisma.feeSchedule.findUnique({
        where: { clubId_code: { clubId, code: s.code } },
        select: { amountCents: true },
      });

      // Amounts are updated in place. A price change mid-year is a real thing,
      // and invoices already issued keep their own line amounts — the line
      // stores unitAmountCents, so history does not move under you.
      await prisma.feeSchedule.upsert({
        where: { clubId_code: { clubId, code: s.code } },
        update: { name: s.name, amountCents: s.amountCents, active: true },
        create: {
          clubId,
          code: s.code,
          name: s.name,
          feeType: s.feeType,
          cadence: s.cadence,
          amountCents: s.amountCents,
          effectiveFrom: YEAR_START,
        },
      });

      const change =
        existing && existing.amountCents !== s.amountCents
          ? `  (was ${money(existing.amountCents)})`
          : existing
            ? "  (unchanged)"
            : "  (new)";
      console.log(`  ${s.code.padEnd(22)} ${money(s.amountCents).padStart(10)}${change}`);
    }
    console.log("");
  }

  // --- suggest sibling groups (read-only) --------------------------------
  if (args.includes("--suggest-families")) {
    const athletes = await prisma.athlete.findMany({
      where: { clubId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        guardianPhone1: true, guardianName1: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // Grouped on guardian phone rather than surname: siblings with different
    // surnames are common, and two unrelated families sharing a surname are
    // not. This is a SUGGESTION — nothing is written.
    const groups = new Map<string, typeof athletes>();
    for (const a of athletes) {
      const key = (a.guardianPhone1 ?? "").replace(/\D/g, "");
      if (key.length < 7) continue;
      groups.set(key, [...(groups.get(key) ?? []), a]);
    }

    const families = [...groups.values()].filter((g) => g.length > 1);
    console.log(`\nLikely sibling groups in ${clubName} (shared guardian phone):\n`);
    if (families.length === 0) console.log("  none found\n");
    for (const f of families) {
      console.log(`  ${f[0]!.guardianName1 ?? "(no guardian name)"}`);
      for (const a of f) console.log(`    ${a.id}  ${a.firstName} ${a.lastName}`);
      console.log(
        `    -> npm run seed-club-fees -- ${clubId} --family ${f.map((a) => a.id).join(",")}\n`,
      );
    }
    console.log("Confirm each before applying — a shared phone is a hint, not a fact.\n");
  }

  // --- assign subscriptions ----------------------------------------------
  const code = flag(args, "assign");
  if (code) {
    const schedule = await prisma.feeSchedule.findUnique({
      where: { clubId_code: { clubId, code } },
      select: { id: true, name: true, amountCents: true, cadence: true },
    });
    if (!schedule) {
      console.error(`No fee schedule ${code} for this club. Run --fees first.`);
      process.exit(1);
    }

    const athleteId = flag(args, "athlete");
    const targets = athleteId
      ? await prisma.athlete.findMany({
          where: { id: athleteId, clubId },
          select: { id: true, firstName: true, lastName: true },
        })
      : args.includes("--all-active")
        ? await prisma.athlete.findMany({
            where: { clubId, isActive: true },
            select: { id: true, firstName: true, lastName: true },
            orderBy: [{ lastName: "asc" }],
          })
        : [];

    if (targets.length === 0) {
      console.error("Pass --athlete <id> or --all-active. Nothing assigned.");
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;
    for (const a of targets) {
      // A member already subscribed to any MONTHLY schedule must not silently
      // gain a second one — that would invoice them twice every month.
      const clash = await prisma.memberSubscription.findFirst({
        where: {
          athleteId: a.id,
          endDate: null,
          feeSchedule: { cadence: "MONTHLY" },
        },
        select: { feeSchedule: { select: { code: true } } },
      });
      if (clash && schedule.cadence === "MONTHLY") {
        if (clash.feeSchedule.code !== code) {
          console.log(`  skip ${a.firstName} ${a.lastName} — already on ${clash.feeSchedule.code}`);
        }
        skipped += 1;
        continue;
      }

      await prisma.memberSubscription.upsert({
        where: {
          athleteId_feeScheduleId_startDate: {
            athleteId: a.id,
            feeScheduleId: schedule.id,
            startDate: YEAR_START,
          },
        },
        update: {},
        create: { athleteId: a.id, feeScheduleId: schedule.id, startDate: YEAR_START },
      });
      created += 1;
    }
    console.log(
      `\n${schedule.name}: ${created} subscribed, ${skipped} skipped (already on a monthly fee).\n`,
    );
  }

  // --- family discount ---------------------------------------------------
  const family = flag(args, "family");
  if (family) {
    const ids = family.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) {
      console.error("--family needs at least two athlete ids.");
      process.exit(1);
    }

    const subs = await prisma.memberSubscription.findMany({
      where: {
        athleteId: { in: ids },
        endDate: null,
        feeSchedule: { cadence: "MONTHLY" },
        athlete: { clubId },
      },
      select: {
        id: true,
        athleteId: true,
        athlete: { select: { firstName: true, lastName: true } },
        feeSchedule: { select: { amountCents: true } },
      },
    });

    if (subs.length !== ids.length) {
      console.error(
        `Found monthly subscriptions for ${subs.length} of ${ids.length} members. ` +
          "Assign them a monthly fee before applying a family discount.",
      );
      process.exit(1);
    }

    // The first member pays full price; every additional one gets N$160 off.
    // Order follows the ids as given, so the caller decides who is "first".
    const ordered = ids.map((id) => subs.find((s) => s.athleteId === id)!);
    console.log(`\nFamily discount in ${clubName}:\n`);
    for (const [i, sub] of ordered.entries()) {
      const full = sub.feeSchedule.amountCents;
      const amount = i === 0 ? null : full - FAMILY_DISCOUNT_CENTS;
      await prisma.memberSubscription.update({
        where: { id: sub.id },
        data: { overrideAmountCents: amount },
      });
      console.log(
        `  ${(sub.athlete.firstName + " " + sub.athlete.lastName).padEnd(24)}` +
          (i === 0 ? `${money(full)} (full price)` : `${money(amount!)} (was ${money(full)})`),
      );
    }
    console.log("");
  }

  // --- status ------------------------------------------------------------
  if (args.includes("--status") || args.length === 1) {
    const schedules = await prisma.feeSchedule.findMany({
      where: { clubId },
      select: {
        code: true, name: true, amountCents: true, active: true, cadence: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { code: "asc" },
    });
    const active = await prisma.athlete.count({ where: { clubId, isActive: true } });
    const subscribed = await prisma.memberSubscription.count({
      where: { athlete: { clubId, isActive: true }, endDate: null, feeSchedule: { cadence: "MONTHLY" } },
    });

    console.log(`\n${clubName} — ${describeTarget()}\n`);
    for (const s of schedules) {
      console.log(
        `  ${s.code.padEnd(22)} ${money(s.amountCents).padStart(10)}  ` +
          `${s.cadence.padEnd(8)} ${s._count.subscriptions} subscription(s)` +
          (s.active ? "" : "  [inactive]"),
      );
    }
    console.log(`\n  active members: ${active}   on a monthly fee: ${subscribed}`);
    if (subscribed < active) {
      console.log(`  ${active - subscribed} active member(s) would NOT be invoiced.`);
    }
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
