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
 *   npm run seed-club-fees -- <clubId> --assign-by-class [--apply]
 *   npm run seed-club-fees -- <clubId> --assign MONTHLY_BEGINNER --all-active
 *   npm run seed-club-fees -- <clubId> --assign MONTHLY_SENIOR --athlete <id>
 *   npm run seed-club-fees -- <clubId> --end --athlete <id> [--from 2026-09]
 *   npm run seed-club-fees -- <clubId> --family <id,id,...>
 *   npm run seed-club-fees -- <clubId> --suggest-families
 *   npm run seed-club-fees -- <clubId> --status
 */

const YEAR_START = new Date("2026-01-01T00:00:00Z");

/**
 * First day of a billing period, and the last day before it.
 *
 * An invoice run counts a subscription when `endDate >= issueDate`, and
 * issueDate is the 1st of the period. So "stop billing them from September"
 * means endDate = 31 August, not "today" — an endDate of today still bills the
 * whole current month, which is the sort of off-by-one a parent notices on an
 * invoice and nobody notices in a script.
 */
function periodStart(periodKey: string): Date {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodKey);
  if (!m) throw new Error(`Expected YYYY-MM, got "${periodKey}"`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
}

function dayBefore(d: Date): Date {
  return new Date(d.getTime() - 24 * 60 * 60 * 1000);
}

function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
/** N$160 off each additional sibling. */
const FAMILY_DISCOUNT_CENTS = 16_000;

/**
 * Class placement, from the Class Information sheet:
 *   Beginners  white to green belt, up to 15 years of age   N$770
 *   Advanced   green belt and up, up to 16 years of age     N$830
 *   Seniors    over 16 years of age                         N$830
 *
 * Green is 6th Kyu, which is Belt.order 4 — verified against the club's own
 * belt table, not assumed:
 *
 *   1 White    2 Yellow(8th Kyu)  3 Orange(7th Kyu)  4 GREEN(6th Kyu)
 *   5 Blue     6 Purple           7-9 Brown          10+ Black (dan grades)
 *
 * This was 40, from a guess that the order column was a 0-100 scale. It is
 * 1-15, so `beltOrder >= 40` was unsatisfiable: every member of 16 or under
 * fell through to Beginners regardless of grade, and the Advanced class would
 * have had nobody in it. Thirteen juniors from green to 1st Kyu would have
 * been billed N$770 instead of N$830 — about N$7,800 a year across the club,
 * and nothing about the output would have looked wrong.
 *
 * The sheet says plainly that these are guidelines and instructors place each
 * student, so this decides the obvious cases and reports the rest rather than
 * pretending it knows.
 */
const GREEN_BELT_ORDER = 4;

function placeMember(ageYears: number, beltOrder: number): { code: string; sure: boolean } {
  if (ageYears > 16) return { code: "MONTHLY_SENIOR", sure: true };
  if (beltOrder >= GREEN_BELT_ORDER) return { code: "MONTHLY_ADVANCED", sure: true };
  if (ageYears <= 15) return { code: "MONTHLY_BEGINNER", sure: true };
  // 16 years old and below green: too old for Beginners, not graded for
  // Advanced. A real person an instructor places by hand.
  return { code: "MONTHLY_BEGINNER", sure: false };
}

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

  // --- end a monthly subscription ----------------------------------------
  //
  // The missing half of "I'll correct the exceptions". Without it the only way
  // to stop billing someone was a hand-written UPDATE, and the roster has
  // instructors on it who train free — a subscription assigned in bulk had no
  // sanctioned way back out.
  if (args.includes("--end")) {
    const athleteId = flag(args, "athlete");
    if (!athleteId) {
      console.error("--end needs --athlete <id>.");
      process.exit(1);
    }
    const from = flag(args, "from") ?? currentPeriodKey();
    const endDate = dayBefore(periodStart(from));

    const sub = await prisma.memberSubscription.findFirst({
      where: {
        athleteId,
        endDate: null,
        feeSchedule: { cadence: "MONTHLY" },
        athlete: { clubId },
      },
      select: {
        id: true,
        athlete: { select: { firstName: true, lastName: true } },
        feeSchedule: { select: { code: true } },
      },
    });
    if (!sub) {
      console.error(`\nNo open monthly subscription for ${athleteId} in this club.\n`);
      process.exit(1);
    }

    await prisma.memberSubscription.update({ where: { id: sub.id }, data: { endDate } });
    const who = `${sub.athlete.firstName} ${sub.athlete.lastName}`;
    console.log(
      `\n${who}: ${sub.feeSchedule.code} ended ${endDate.toISOString().slice(0, 10)}.\n` +
        `  Not billed from ${from} onwards. Invoices already issued are untouched —\n` +
        `  cancel or write those off individually if they should not stand.\n`,
    );
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

    // When one athlete is moved between classes, the switch takes effect at a
    // period boundary rather than mid-month: the old subscription ends the day
    // before, the new one starts on the 1st, and no month is billed twice or
    // skipped.
    const switchKey = flag(args, "from") ?? currentPeriodKey();
    const switchOn = periodStart(switchKey);

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
        select: { id: true, feeSchedule: { select: { code: true } } },
      });
      let replaced = false;
      if (clash && schedule.cadence === "MONTHLY") {
        if (clash.feeSchedule.code === code) {
          skipped += 1;
          continue;
        }
        // Naming ONE athlete is an instruction to put that person in that
        // class, so honour it: close the old subscription and open the new one
        // at the period boundary. Bulk (--all-active) still skips, because
        // there the clash is a member who was already placed deliberately and
        // silently re-classing the whole club is not what anyone asked for.
        //
        // Before this, the script's own closing line told you to correct
        // exceptions with --assign --athlete <id> and that command did nothing
        // but print "skip".
        if (!athleteId) {
          console.log(`  skip ${a.firstName} ${a.lastName} — already on ${clash.feeSchedule.code}`);
          skipped += 1;
          continue;
        }
        await prisma.memberSubscription.update({
          where: { id: clash.id },
          data: { endDate: dayBefore(switchOn) },
        });
        console.log(
          `  ${a.firstName} ${a.lastName}: ${clash.feeSchedule.code} -> ${code} from ${switchKey}`,
        );
        replaced = true;
      }

      // A replacement starts at the switch boundary, not in January: the
      // member genuinely was on the old fee until then, and back-dating the
      // new one to YEAR_START would rewrite months already invoiced.
      const startDate = replaced ? switchOn : YEAR_START;
      await prisma.memberSubscription.upsert({
        where: {
          athleteId_feeScheduleId_startDate: {
            athleteId: a.id,
            feeScheduleId: schedule.id,
            startDate,
          },
        },
        update: {},
        create: { athleteId: a.id, feeScheduleId: schedule.id, startDate },
      });
      created += 1;
    }
    console.log(
      `\n${schedule.name}: ${created} subscribed, ${skipped} skipped (already on a monthly fee).\n`,
    );
  }

  // --- assign by belt and age -------------------------------------------
  if (args.includes("--assign-by-class")) {
    const apply = args.includes("--apply");
    const athletes = await prisma.athlete.findMany({
      where: { clubId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true, dob: true,
        belt: { select: { name: true, order: true } },
        subscriptions: {
          where: { endDate: null, feeSchedule: { cadence: "MONTHLY" } },
          select: { feeSchedule: { select: { code: true } } },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const schedules = await prisma.feeSchedule.findMany({
      where: { clubId, cadence: "MONTHLY" },
      select: { id: true, code: true },
    });
    const byCode = new Map(schedules.map((s) => [s.code, s.id]));

    const asOf = new Date();
    const review: string[] = [];
    let placed = 0;
    let already = 0;

    console.log(`\n${clubName} — placement by belt and age${apply ? "" : "  (PREVIEW — pass --apply to write)"}\n`);
    for (const a of athletes) {
      // UTC components: dob is a date-only value read back as UTC (see
      // utils/dates.ts and the August 2026 normalisation).
      let age = asOf.getUTCFullYear() - a.dob.getUTCFullYear();
      const md = asOf.getUTCMonth() - a.dob.getUTCMonth();
      if (md < 0 || (md === 0 && asOf.getUTCDate() < a.dob.getUTCDate())) age -= 1;

      const { code, sure } = placeMember(age, a.belt.order);
      const current = a.subscriptions[0]?.feeSchedule.code;
      const name = `${a.firstName} ${a.lastName}`;

      if (current) {
        already += 1;
        if (current !== code) {
          review.push(`  ${name.padEnd(24)} on ${current}, rule says ${code}`);
        }
        continue;
      }

      console.log(
        `  ${name.padEnd(24)} age ${String(age).padStart(2)}  ${(a.belt.name ?? "?").padEnd(18)} -> ${code}${sure ? "" : "   ** review **"}`,
      );
      if (!sure) review.push(`  ${name.padEnd(24)} age ${age}, ${a.belt.name} — placed in Beginners, confirm`);

      if (apply) {
        const feeScheduleId = byCode.get(code);
        if (!feeScheduleId) {
          console.error(`    no fee schedule ${code} — run --fees first`);
          continue;
        }
        await prisma.memberSubscription.upsert({
          where: {
            athleteId_feeScheduleId_startDate: {
              athleteId: a.id, feeScheduleId, startDate: YEAR_START,
            },
          },
          update: {},
          create: { athleteId: a.id, feeScheduleId, startDate: YEAR_START },
        });
      }
      placed += 1;
    }

    console.log(`\n  ${placed} to place, ${already} already subscribed`);
    if (review.length) {
      console.log(`\n  Needs your eye (${review.length}):`);
      for (const r of review) console.log(r);
    }
    console.log(
      apply
        ? "\n  Written. Move someone with --assign <CODE> --athlete <id>, or stop\n" +
          "  billing them entirely with --end --athlete <id>. Both take effect at a\n" +
          "  period boundary; add --from YYYY-MM to choose which.\n"
        : "\n  Nothing written. Re-run with --apply.\n",
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
