/**
 * Splitting a fee between the instructors who taught it — the pure half.
 *
 * Shared is always an even split (the dojo's rule, not a setting), and money
 * is integer cents, so an odd amount cannot halve. The remainder goes one cent
 * at a time to the instructors in id order: deterministic, so the same
 * payments split the same way on every run, and the parts always add back up
 * to exactly what was paid. A split that rounds each half independently can
 * pay out a cent more or less than came in, and over a year of 770s that is a
 * discrepancy nobody can explain.
 */

export interface Share {
  instructorId: string;
  cents: number;
}

export function splitEvenly(cents: number, instructorIds: readonly string[]): Share[] {
  if (!Number.isInteger(cents)) throw new Error(`Cannot split ${cents}: amounts are whole cents.`);
  const ids = [...new Set(instructorIds)].sort();
  if (ids.length === 0) return [];
  const base = Math.trunc(cents / ids.length);
  let remainder = cents - base * ids.length;
  const step = remainder < 0 ? -1 : 1;
  return ids.map((instructorId) => {
    let share = base;
    if (remainder !== 0) {
      share += step;
      remainder -= step;
    }
    return { instructorId, cents: share };
  });
}

/** "2026-09" → the 1st of that month, midnight UTC; null for anything else. */
export function periodStart(periodKey: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(periodKey ?? "");
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(Number(m[1]), month - 1, 1));
}
