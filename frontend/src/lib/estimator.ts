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
   * Real (both-fighters-present) bout count from an already-generated draw
   * for this category, or null if no draw exists yet. Real bout count means
   * main-bracket matches *and* WKF double-repechage bronze bouts — byes are
   * not bouts, nobody fights them.
   */
  drawBoutCount: number | null;
}

export interface DivisionBoutBreakdown {
  divisionId: string;
  divisionName: string;
  /** Summed across every weight class in this division. */
  bouts: number;
  /**
   * "draw": every category in this division already has a generated draw, so
   * `bouts` is exact (repechage included).
   * "entries": every category is still estimated as `entries - 1`, which
   * undercounts once a draw would add repechage bronze bouts (see the caveat
   * surfaced in the UI).
   * "mixed": some categories (weight classes) of this division have a draw,
   * others don't.
   */
  source: "draw" | "entries" | "mixed";
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

  const byDivision = new Map<string, { bouts: number; hasDraw: boolean; hasEstimate: boolean }>();
  for (const cat of categories) {
    if (!kumiteDivisionIds.has(cat.divisionId)) continue;
    const bucket = byDivision.get(cat.divisionId) ?? { bouts: 0, hasDraw: false, hasEstimate: false };
    if (cat.drawBoutCount !== null) {
      bucket.bouts += cat.drawBoutCount;
      bucket.hasDraw = true;
    } else {
      bucket.bouts += Math.max(0, cat.entryCount - 1);
      bucket.hasEstimate = true;
    }
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

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
