// Kumite tournament duration estimator (v1) — pure calculation, no network
// calls, so it can be unit-tested directly (scripts/test-estimator.ts).
//
// Two stages, kept separate on purpose:
//  1. deriveKumiteBoutBreakdown — turns raw division/category data (already
//     fetched by the page) into a bout count per division.
//  2. estimateKumiteDuration — turns that breakdown + the user's tuning
//     inputs into a single total-time estimate.
// Splitting them means the arithmetic (2) can be tested without needing to
// fake an event's worth of divisions/entries/draws, and the data-shaping (1)
// can be tested without needing the time math.

export interface KumiteCategoryData {
  divisionId: string;
  /** APPROVED entries currently in this division × weight-class pairing. */
  entryCount: number;
  /**
   * Real entry count in an already-generated draw for this category (used to
   * derive main-bracket bouts as `drawEntryCount - 1`), or null if no draw
   * exists yet, in which case `entryCount` is used instead.
   *
   * This is mathematically identical to `entryCount` *unless* entries have
   * changed since the draw was made (an entry withdrawn or added without
   * regenerating) — that drift is the entire reason to prefer this over
   * re-deriving from current entries when a draw exists.
   *
   * Deliberately NOT sourced from counting the draw's bout rows that
   * currently have both fighters filled in: for an unplayed draw, only round
   * 1 (and any bye-cascades) are populated — later rounds stay null until
   * earlier rounds are actually scored. Counting that would *undercount* a
   * freshly-generated, not-yet-run bracket, which is the normal state an
   * estimator is used in.
   */
  drawEntryCount: number | null;
}

export interface DivisionBoutBreakdown {
  divisionId: string;
  divisionName: string;
  /**
   * Summed across every weight class in this division. Main-bracket bouts
   * (exact, `entries - 1`) plus an *expected* WKF double-repechage bronze
   * bout count (see `estimatedRepechageBouts` — genuinely not knowable
   * exactly before a bracket is fought, since it depends on who wins each
   * match, not just entry count).
   */
  bouts: number;
  /** APPROVED entries summed across every weight class in this division. */
  entries: number;
  /**
   * "draw": every category in this division already has a generated draw —
   * `bouts` reflects the bracket's actual entry count, not necessarily
   * today's live entry count if it has since drifted.
   * "entries": every category is still estimated from live entry counts.
   * "mixed": some weight classes of this division have a draw, others don't.
   */
  source: "draw" | "entries" | "mixed";
}

/**
 * Bracket placement order — ported from (and must stay in sync with)
 * `backend/src/services/draw.service.ts`'s `bracketPositions`. Deterministic
 * given `size` alone: byes always land on the same structural positions
 * regardless of which real entries occupy the rest, which is exactly what
 * makes `estimatedRepechageBouts` computable from entry count alone, without
 * needing an actual draw (or even real entry identities) to exist.
 * Returns a 0-based array: result[k] = 1-based bracket position for seed k+1.
 */
function bracketPositions(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const m = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) next.push(s, m - s);
    seeds = next;
  }
  const pos = new Array<number>(size);
  seeds.forEach((seedNum, p) => {
    pos[seedNum - 1] = p + 1;
  });
  return pos;
}

/** Smallest power of 2 that is >= n. Mirrors draw.service.ts's bracketSize. */
function nextBracketSize(n: number): number {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

/**
 * Exact expected number of real (non-bye) opponents the eventual winner of
 * bracket range [lo, hi] will have beaten, assuming a fair coin-flip winner
 * at every real match (the only assumption possible before a bracket is
 * actually fought). Recursive: a real entrant on each side is guaranteed to
 * meet at this level once both sides have >= 1 real entrant, and by symmetry
 * every real entrant in a sub-range is equally likely to be the one who
 * reaches this level — so the expectation is a weighted average of "the
 * winning side's own expectation, plus the one match played at this level."
 *
 * This is what makes the repechage estimate more than a guess: it is the
 * true expected value given the bracket's real bye structure, not a flat
 * heuristic — verified against a 20,000-trial Monte Carlo simulation of the
 * actual bracket algorithm across N=2..24 (see docs/state.md).
 */
function expectedOpponents(occupied: Set<number>, lo: number, hi: number): number {
  const size = hi - lo + 1;
  if (size === 1) return 0;
  const mid = lo + size / 2 - 1;
  let leftReal = 0;
  let rightReal = 0;
  for (const p of occupied) {
    if (p >= lo && p <= mid) leftReal++;
    else if (p >= mid + 1 && p <= hi) rightReal++;
  }
  if (leftReal === 0 && rightReal === 0) return 0;
  if (leftReal === 0) return expectedOpponents(occupied, mid + 1, hi);
  if (rightReal === 0) return expectedOpponents(occupied, lo, mid);
  const leftExp = expectedOpponents(occupied, lo, mid);
  const rightExp = expectedOpponents(occupied, mid + 1, hi);
  const total = leftReal + rightReal;
  return (leftReal / total) * (leftExp + 1) + (rightReal / total) * (rightExp + 1);
}

/**
 * Expected WKF double-repechage bronze bout count for a division with `n`
 * real kumite entries — one bracket half at a time, rounded to the nearest
 * whole bout per half. Genuinely an *expectation*, not a guarantee: the true
 * count depends on who actually wins each match, which isn't knowable before
 * the bracket is fought (confirmed by simulation: a 9-entry bracket is 10
 * total bouts ~75% of the time and 11 the rest — there is no single "correct"
 * answer to know in advance, only an expected one).
 */
export function estimatedRepechageBouts(n: number): number {
  if (n < 4) return 0;
  const size = nextBracketSize(n);
  const positions = bracketPositions(size);
  const occupied = new Set(positions.slice(0, n));
  const half = size / 2;
  let repechage = 0;
  for (const [lo, hi] of [
    [1, half],
    [half + 1, size],
  ] as const) {
    let realCount = 0;
    for (const p of occupied) if (p >= lo && p <= hi) realCount++;
    if (realCount < 2) continue; // no bronze possible from a half with 0-1 entrants
    repechage += Math.max(0, Math.round(expectedOpponents(occupied, lo, hi)) - 1);
  }
  return repechage;
}

/**
 * A division can have multiple weight classes, each its own independent
 * single-elimination bracket — bouts must be summed per (division, weight
 * class) pair, not from the division's raw entry count, or multi-weight-class
 * divisions undercount (or overcount) the real bout total.
 */
export function deriveKumiteBoutBreakdown(
  divisions: Array<{ id: string; name: string; category: "KATA" | "KUMITE" }>,
  categories: KumiteCategoryData[],
): DivisionBoutBreakdown[] {
  const kumiteDivisionIds = new Set(
    divisions.filter((d) => d.category === "KUMITE").map((d) => d.id),
  );

  const byDivision = new Map<
    string,
    { bouts: number; entries: number; hasDraw: boolean; hasEstimate: boolean }
  >();
  for (const cat of categories) {
    if (!kumiteDivisionIds.has(cat.divisionId)) continue;
    const bucket =
      byDivision.get(cat.divisionId) ?? { bouts: 0, entries: 0, hasDraw: false, hasEstimate: false };
    bucket.entries += Math.max(0, cat.entryCount);

    const effectiveN = cat.drawEntryCount ?? cat.entryCount;
    const mainBouts = Math.max(0, effectiveN - 1);
    const repechageBouts = estimatedRepechageBouts(effectiveN);
    bucket.bouts += mainBouts + repechageBouts;
    if (cat.drawEntryCount !== null) bucket.hasDraw = true;
    else bucket.hasEstimate = true;

    byDivision.set(cat.divisionId, bucket);
  }

  return divisions
    .filter((d) => d.category === "KUMITE" && byDivision.has(d.id))
    .map((d) => {
      const b = byDivision.get(d.id)!;
      return {
        divisionId: d.id,
        divisionName: d.name,
        bouts: b.bouts,
        entries: b.entries,
        source: (b.hasDraw && b.hasEstimate ? "mixed" : b.hasDraw ? "draw" : "entries") as
          | "draw"
          | "entries"
          | "mixed",
      };
    });
}

export interface EstimatorInputs {
  /** Mats/floors running kumite in parallel. */
  mats: number;
  /** Minutes budgeted per bout, match time + transition combined. */
  minutesPerBout: number;
  /** Injury/stoppage buffer, as a percentage added to total bout time. */
  bufferPct: number;
  /** Changeover time (minutes) each time a mat moves to the next division's pool. */
  changeoverMinutes: number;
  lunchEnabled: boolean;
  lunchMinutes: number;
  openingEnabled: boolean;
  openingMinutes: number;
  closingEnabled: boolean;
  closingMinutes: number;
  /**
   * Not in the original spec — flagging it, not assuming it: most tournaments
   * budget a block at the start of the day for athlete check-in / warm-up
   * before the first bout. Off by default so it never silently inflates an
   * estimate; turn on and adjust if it's wanted.
   */
  checkinEnabled: boolean;
  checkinMinutes: number;
}

export const DEFAULT_ESTIMATOR_INPUTS: EstimatorInputs = {
  mats: 2,
  minutesPerBout: 4, // 3 min match + 1 min transition
  bufferPct: 10,
  changeoverMinutes: 5,
  lunchEnabled: true,
  lunchMinutes: 30,
  openingEnabled: true,
  openingMinutes: 15,
  closingEnabled: true,
  closingMinutes: 15,
  checkinEnabled: false,
  checkinMinutes: 20,
};

export interface EstimateSegment {
  key: string;
  label: string;
  minutes: number;
}

export interface EstimateResult {
  totalBouts: number;
  /** Kumite divisions that actually produce a bout (0- or 1-entry divisions don't). */
  totalDivisions: number;
  boutMinutesRaw: number;
  boutMinutesWithBuffer: number;
  /** ceil(boutMinutesWithBuffer / mats) — the wall-clock bottleneck. */
  perMatBoutMinutes: number;
  divisionsPerMat: number;
  changeoverMinutesTotal: number;
  lunchMinutes: number;
  openingMinutes: number;
  closingMinutes: number;
  checkinMinutes: number;
  totalMinutes: number;
  /** Sums exactly to totalMinutes — safe to render as a stacked bar. */
  segments: EstimateSegment[];
}

export function estimateKumiteDuration(
  divisions: DivisionBoutBreakdown[],
  inputs: EstimatorInputs,
): EstimateResult {
  const totalBouts = divisions.reduce((sum, d) => sum + Math.max(0, d.bouts), 0);
  const totalDivisions = divisions.filter((d) => d.bouts > 0).length;

  const boutMinutesRaw = totalBouts * Math.max(0, inputs.minutesPerBout);
  const boutMinutesWithBuffer = boutMinutesRaw * (1 + Math.max(0, inputs.bufferPct) / 100);

  const mats = Math.max(1, Math.floor(inputs.mats) || 1);
  const perMatBoutMinutes = Math.ceil(boutMinutesWithBuffer / mats);

  const divisionsPerMat = Math.ceil(totalDivisions / mats);
  const changeoverMinutesTotal = divisionsPerMat * Math.max(0, inputs.changeoverMinutes);

  const lunchMinutes = inputs.lunchEnabled ? Math.max(0, inputs.lunchMinutes) : 0;
  const openingMinutes = inputs.openingEnabled ? Math.max(0, inputs.openingMinutes) : 0;
  const closingMinutes = inputs.closingEnabled ? Math.max(0, inputs.closingMinutes) : 0;
  const checkinMinutes = inputs.checkinEnabled ? Math.max(0, inputs.checkinMinutes) : 0;

  const totalMinutes =
    perMatBoutMinutes +
    changeoverMinutesTotal +
    lunchMinutes +
    openingMinutes +
    closingMinutes +
    checkinMinutes;

  // Split perMatBoutMinutes into "bouts" and "buffer" as an exact integer
  // partition (not two independently-rounded values) so every segment sums
  // to totalMinutes exactly, with no drift for a stacked bar to paper over.
  const bufferShare =
    boutMinutesWithBuffer > 0 ? (boutMinutesWithBuffer - boutMinutesRaw) / boutMinutesWithBuffer : 0;
  const bufferSegmentMinutes = Math.round(perMatBoutMinutes * bufferShare);
  const boutSegmentMinutes = perMatBoutMinutes - bufferSegmentMinutes;

  const segments: EstimateSegment[] = [
    { key: "bouts", label: "Bouts", minutes: boutSegmentMinutes },
    { key: "buffer", label: "Buffer", minutes: bufferSegmentMinutes },
    { key: "changeover", label: "Changeover", minutes: changeoverMinutesTotal },
    { key: "checkin", label: "Check-in", minutes: checkinMinutes },
    { key: "lunch", label: "Lunch", minutes: lunchMinutes },
    { key: "opening", label: "Opening", minutes: openingMinutes },
    { key: "closing", label: "Closing", minutes: closingMinutes },
  ].filter((s) => s.minutes > 0);

  return {
    totalBouts,
    totalDivisions,
    boutMinutesRaw,
    boutMinutesWithBuffer,
    perMatBoutMinutes,
    divisionsPerMat,
    changeoverMinutesTotal,
    lunchMinutes,
    openingMinutes,
    closingMinutes,
    checkinMinutes,
    totalMinutes,
    segments,
  };
}

/**
 * How long one division's own bouts take, standalone — its bout time with the
 * buffer applied, plus one changeover (whichever mat runs it pays that cost
 * once). Deliberately NOT divided across mats: mat assignment is a shared,
 * event-wide resource (estimateKumiteDuration's job), not a per-division one,
 * so "this division takes 24 minutes" means 24 minutes of *someone's* mat
 * time, not a wall-clock prediction for that division in isolation.
 */
export function minutesForDivision(bouts: number, inputs: EstimatorInputs): number {
  if (bouts <= 0) return 0;
  const boutMinutes =
    bouts * Math.max(0, inputs.minutesPerBout) * (1 + Math.max(0, inputs.bufferPct) / 100);
  return Math.ceil(boutMinutes + Math.max(0, inputs.changeoverMinutes));
}

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
