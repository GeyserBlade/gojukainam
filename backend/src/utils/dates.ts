/**
 * Date-only arithmetic for billing and member questions.
 *
 * WHY THIS FILE EXISTS AT ALL: the sensai agent answers questions like "how old
 * is Ben today?" and "whose birthday is next week?". A language model asked to
 * compute those produces a number that is confidently wrong roughly whenever
 * the birthday has not yet passed this year, with nothing in the output to
 * show it computed rather than looked up. Same error class as computing money.
 * So the API returns computed values and the model only phrases them. Both the
 * API and the tool layer must agree, which means one implementation, here.
 *
 * WHY UTC COMPONENTS: `Athlete.dob` is `timestamp(3) without time zone`
 * (Prisma's default mapping for DateTime), and the Prisma client hands it back
 * as a JS Date interpreted as UTC — 2010-11-03 becomes 2010-11-03T00:00:00Z.
 * Reading LOCAL components from a process behind UTC would therefore report
 * the previous day. Every function here reads getUTC* only.
 *
 * This is correct only because the stored values are true midnight. They were
 * not until August 2026: 84 of 88 athletes had a dob written as the UTC instant
 * of local midnight, putting the date component a day early. See
 * scripts/fix-dob-timezone-shift.sql. If you are reading this while planning to
 * import dates from somewhere new, normalise on the way in — the round-tripping
 * that hid the original bug will hide yours too.
 */

const MS_PER_DAY = 86_400_000;

/** Midnight-UTC Date for a calendar day, the canonical shape for a date-only value. */
export function utcDate(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day));
}

/** Strip any time component, keeping the UTC calendar day. */
export function startOfUtcDay(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** ISO yyyy-mm-dd, from UTC components. */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whole days between two calendar days. Positive when `to` is later. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

/**
 * Completed years lived as of `asOf`.
 *
 * The subtraction is on calendar components, not elapsed milliseconds: leap
 * years make a millisecond-based age wrong for anyone whose birthday is near
 * the boundary.
 */
export function ageInYears(dob: Date, asOf: Date): number {
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = asOf.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Completed months since the last birthday — the "11 years, 8 months" half. */
export function ageMonthsRemainder(dob: Date, asOf: Date): number {
  let months = asOf.getUTCMonth() - dob.getUTCMonth();
  if (asOf.getUTCDate() < dob.getUTCDate()) months -= 1;
  if (months < 0) months += 12;
  return months;
}

/**
 * The birthday as observed in `year`.
 *
 * 29 February is observed on 28 February in non-leap years. That is a choice,
 * not a fact — the alternative (1 March) is equally defensible — but it must be
 * made once, here, so a "turns 12 today" message and an eligibility check can
 * never disagree about the same person.
 */
export function birthdayInYear(dob: Date, year: number): Date {
  const month = dob.getUTCMonth() + 1;
  const day = dob.getUTCDate();
  if (month === 2 && day === 29 && !isLeapYear(year)) return utcDate(year, 2, 28);
  return utcDate(year, month, day);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export type NextBirthday = {
  /** The next occurrence, at or after `asOf`. Today counts as today. */
  date: Date;
  /** Age they will reach on it. */
  turningAge: number;
  /** 0 when it is today. */
  daysAway: number;
};

export function nextBirthday(dob: Date, asOf: Date): NextBirthday {
  const today = startOfUtcDay(asOf);
  let date = birthdayInYear(dob, today.getUTCFullYear());
  if (date.getTime() < today.getTime()) {
    date = birthdayInYear(dob, today.getUTCFullYear() + 1);
  }
  return {
    date,
    turningAge: date.getUTCFullYear() - dob.getUTCFullYear(),
    daysAway: daysBetween(today, date),
  };
}

export type BirthdayHit<T> = T & {
  /** The observed date inside the queried window. */
  dateInWindow: Date;
  turningAge: number;
  daysAway: number;
};

/**
 * Members whose birthday falls in [from, to], inclusive on both ends.
 *
 * Handles windows spanning a year boundary (late December into January) by
 * testing the occurrence in each year the window touches, rather than assuming
 * one. That is the case people forget, and it fails silently for exactly one
 * week a year — long enough to ship and short enough never to be noticed in
 * testing.
 */
export function birthdaysBetween<T extends { dob: Date }>(
  rows: readonly T[],
  from: Date,
  to: Date,
): BirthdayHit<T>[] {
  const start = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  if (end.getTime() < start.getTime()) return [];

  const years = new Set([start.getUTCFullYear(), end.getUTCFullYear()]);
  const hits: BirthdayHit<T>[] = [];

  for (const row of rows) {
    for (const year of years) {
      const occurrence = birthdayInYear(row.dob, year);
      if (occurrence.getTime() < start.getTime()) continue;
      if (occurrence.getTime() > end.getTime()) continue;
      hits.push({
        ...row,
        dateInWindow: occurrence,
        turningAge: year - row.dob.getUTCFullYear(),
        daysAway: daysBetween(start, occurrence),
      });
      break; // a window under a year long can only match once
    }
  }

  return hits.sort((a, b) => a.dateInWindow.getTime() - b.dateInWindow.getTime());
}

/** Resolve a day-count window server-side, so no caller ever subtracts dates. */
export function windowFromDays(asOf: Date, days: number): { from: Date; to: Date } {
  const from = startOfUtcDay(asOf);
  return { from, to: new Date(from.getTime() + days * MS_PER_DAY) };
}

/** "2026-08" for a date. The period key every subscription invoice is keyed on. */
export function periodKeyOf(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Parse "2026-08" into the first day of that month. Throws on anything else. */
export function parsePeriodKey(key: string): Date {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) throw { status: 400, message: `Invalid period key "${key}" — expected YYYY-MM` };
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) {
    throw { status: 400, message: `Invalid period key "${key}" — month must be 01-12` };
  }
  return utcDate(year, month, 1);
}
