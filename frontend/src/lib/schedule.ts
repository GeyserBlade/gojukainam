// Tournament schedule — pure calculation, no network calls, so it can be unit
// tested directly (scripts/test-schedule.ts).
//
// Turns a plan (which categories sit on which floor, in what order, with which
// ceremonies and breaks between them) into a wall-clock timeline: when each
// category starts and finishes on each floor, where the venue-wide bands fall,
// and what time the day ends.
//
// Relationship to `lib/estimator.ts`: that module answers "roughly how long
// will this tournament take" from session-only tuning inputs, and is
// deliberately left alone. This one answers "what time does Mat 2 get to the
// U14 boys" from the *stored* timing config and the actual running order. The
// only thing shared is `estimatedRepechageBouts`, imported rather than
// re-derived so the two can never disagree about bout counts.

import { estimatedRepechageBouts } from "./estimator";
import { KATA_PERFORMANCES_PER_BOUT, type EventTiming } from "./timing";

// ---------------- Clock helpers ----------------

/** "HH:MM" -> minutes since midnight. Returns null for anything malformed. */
export function parseClock(value: string | null | undefined): number | null {
  if (typeof value !== "string") return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Minutes since midnight -> "HH:MM". A tournament that runs past midnight is a
 * planning mistake, not an impossibility, so it wraps and says so rather than
 * printing "26:30" or silently losing a day.
 */
export function formatClock(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const days = Math.floor(safe / 1440);
  const mins = safe % 1440;
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return days > 0 ? `${hh}:${mm} +${days}d` : `${hh}:${mm}`;
}

/** Minutes -> "1h 20min", for durations rather than clock times. */
export function formatSpan(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ---------------- Inputs ----------------

export type ScheduleBlockKind = "OPENING" | "CLOSING" | "LUNCH" | "BREAK";

/**
 * One category's contribution to the schedule. The two timing fields are the
 * *overrides* — null means "inherit the event default", never zero, matching
 * `lib/timing.ts`.
 */
export interface ScheduleCategoryInput {
  drawId: string;
  title: string;
  /**
   * Kata and kumite cost the mat completely different amounts of time — a kata
   * bout is one or two ~90s performances, a kumite bout is a 2-3 minute fight.
   * Carried per category rather than inferred, because it changes which of the
   * event's two bout-length settings applies.
   */
  isKata: boolean;
  /** APPROVED entries in this category right now. */
  entryCount: number;
  /** Entries the bracket was actually built with; null when there is no draw. */
  drawEntryCount: number | null;
  boutDurationSec: number | null;
  bufferPct: number | null;
}

export interface ScheduleBlockInput {
  id: string;
  kind: ScheduleBlockKind;
  label: string;
  minutes: number;
  /** null = venue-wide (a band across every floor). */
  matId: string | null;
  startTime: string | null;
}

export interface ScheduleMatInput {
  id: string;
  name: string;
  /** Categories on this floor, already in running order. */
  categories: ScheduleCategoryInput[];
  /** Breaks on this floor, already positioned. */
  blocks: ScheduleBlockInput[];
}

/**
 * A floor's running order arrives as two lists that share one index space
 * (`matOrder` on both the draw and the block), so the caller interleaves them
 * before handing them over. `orderKeyOf` exists so the page and the tests
 * interleave the same way.
 */
export interface OrderedPlanItem {
  kind: "CATEGORY" | "BLOCK";
  id: string;
}

// ---------------- Bout counts and durations ----------------

/**
 * Bouts this category will produce: the exact main-bracket count (`n - 1`)
 * plus the *expected* WKF double-repechage bronze bouts.
 *
 * Applied to kata as well as kumite because the draw engine builds both from
 * the same bracket with the same repechage — scheduling kata as though it had
 * no bronze bouts would under-book every kata floor.
 */
export function categoryBouts(c: ScheduleCategoryInput): number {
  const n = c.drawEntryCount ?? c.entryCount;
  if (n < 2) return 0;
  return n - 1 + estimatedRepechageBouts(n);
}

/**
 * Mat seconds one bout of this category costs, before buffer: the competition
 * itself plus the transition to the next bout.
 *
 * For kumite that is one match clock. For kata it is one or two performances
 * depending on the event's kata format — AKA then AO under WKF's sequential
 * rules, or both at once when they share the floor. That factor of two is the
 * biggest single lever on how long a kata category runs, which is why it is a
 * setting rather than an assumption.
 *
 * A per-category `boutDurationSec` override wins over both event defaults, and
 * for a kata category it means "this category's performance length" — the
 * SEQUENTIAL doubling still applies on top.
 */
export function boutSecondsFor(c: ScheduleCategoryInput, timing: EventTiming): number {
  if (c.isKata) {
    const performanceSec = c.boutDurationSec ?? timing.kataBoutDurationSec;
    return performanceSec * KATA_PERFORMANCES_PER_BOUT[timing.kataMode] + timing.transitionSecondsPerBout;
  }
  return (c.boutDurationSec ?? timing.defaultBoutDurationSec) + timing.transitionSecondsPerBout;
}

/**
 * Mat minutes this category occupies: every bout's cost, inflated by the
 * injury/stoppage buffer, plus the one changeover the floor pays when it moves
 * on to the next category.
 *
 * A category with fewer than two entries produces no bouts and therefore no
 * changeover either — booking 5 minutes of floor time for a walkover gold
 * would quietly pad the day by one changeover per empty category.
 */
export function categoryMinutes(c: ScheduleCategoryInput, timing: EventTiming): number {
  const bouts = categoryBouts(c);
  if (bouts <= 0) return 0;
  const bufferPct = c.bufferPct ?? timing.defaultBufferPct;
  const perBoutMinutes = boutSecondsFor(c, timing) / 60;
  return Math.ceil(
    bouts * perBoutMinutes * (1 + Math.max(0, bufferPct) / 100) +
      Math.max(0, timing.changeoverMinutes),
  );
}

// ---------------- Output ----------------

export type BandAnchor = "START" | "TIME" | "END" | "UNSCHEDULED";

/**
 * How a venue-wide block is pinned to the day:
 * - an explicit `startTime` always wins — the planner pinned it to the clock;
 * - otherwise OPENING runs before the first bout and CLOSING after the last;
 * - anything else has nowhere to sit, and is reported rather than guessed at.
 */
export function bandAnchor(block: ScheduleBlockInput): BandAnchor {
  if (parseClock(block.startTime) !== null) return "TIME";
  if (block.kind === "OPENING") return "START";
  if (block.kind === "CLOSING") return "END";
  return "UNSCHEDULED";
}

export interface ScheduledItem {
  kind: "CATEGORY" | "BLOCK";
  id: string;
  title: string;
  /** Working minutes — what the item costs the floor, excluding venue pauses. */
  minutes: number;
  startMin: number;
  /** Includes any venue-wide pause the item straddles. */
  endMin: number;
  /** Venue-wide pause minutes swallowed inside this item's span. */
  pausedMin: number;
  /** Idle floor time before this item because a venue band was in the way. */
  waitMin: number;
  category?: ScheduleCategoryInput;
  block?: ScheduleBlockInput;
  bouts: number;
}

export interface ScheduledMat {
  id: string;
  name: string;
  items: ScheduledItem[];
  startMin: number;
  endMin: number;
  /** Floor time actually spent working, i.e. excluding venue pauses and idling. */
  workMinutes: number;
  bouts: number;
}

export interface ScheduledBand {
  id: string;
  kind: ScheduleBlockKind;
  label: string;
  minutes: number;
  anchor: BandAnchor;
  startMin: number;
  endMin: number;
}

export type ScheduleWarningCode =
  | "BLOCK_UNSCHEDULED"
  | "BAND_BEFORE_START"
  | "BAND_AFTER_FINISH"
  | "EMPTY_MAT"
  | "UNASSIGNED_CATEGORIES"
  | "NO_MATS";

export interface ScheduleWarning {
  code: ScheduleWarningCode;
  message: string;
}

export interface Schedule {
  dayStartMin: number;
  /** When the floors actually start competing — after any opening ceremony. */
  matStartMin: number;
  finishMin: number;
  mats: ScheduledMat[];
  bands: ScheduledBand[];
  totalBouts: number;
  /** The busiest floor's finish, i.e. when competition ends. */
  competitionEndMin: number;
  warnings: ScheduleWarning[];
}

export interface ScheduleInput {
  timing: EventTiming;
  mats: ScheduleMatInput[];
  /** Venue-wide blocks (`matId === null`). */
  venueBlocks: ScheduleBlockInput[];
  /** Categories with a draw that are not on any floor yet. */
  unassignedCount: number;
  /** Ordered item refs per mat id, interleaving categories and blocks. */
  order: Map<string, OrderedPlanItem[]>;
}

// ---------------- The walk ----------------

interface Pause {
  startMin: number;
  endMin: number;
}

/**
 * Push a start time out of any venue-wide pause it lands inside. Loops because
 * clearing one pause can drop the cursor straight into the next — two breaks
 * scheduled back to back are unusual but entirely legal.
 */
function clearPauses(startMin: number, pauses: Pause[]): number {
  let t = startMin;
  let moved = true;
  while (moved) {
    moved = false;
    for (const p of pauses) {
      if (t >= p.startMin && t < p.endMin) {
        t = p.endMin;
        moved = true;
      }
    }
  }
  return t;
}

/**
 * Stretch an item's end across every venue-wide pause that begins while it is
 * running. The category is not split into two cards: competition pauses and
 * resumes, so the honest rendering is one bar whose span includes the break,
 * with the band drawn across it.
 */
function stretchAcrossPauses(startMin: number, workMinutes: number, pauses: Pause[]) {
  const ordered = [...pauses].sort((a, b) => a.startMin - b.startMin);
  let t = startMin;
  let remaining = workMinutes;
  let paused = 0;

  // Work forward until the remaining minutes fit before the next pause. A pause
  // starting exactly at `t + remaining` begins after this item ends, so it does
  // not interrupt it.
  for (;;) {
    const next = ordered.find((p) => p.startMin > t && p.startMin < t + remaining);
    if (!next) break;
    remaining -= next.startMin - t;
    t = clearPauses(next.endMin, ordered);
    paused += t - next.startMin;
  }

  return { endMin: t + remaining, pausedMin: paused };
}

/**
 * The plan -> a wall-clock timeline.
 *
 * Every floor starts together once the opening ceremony is done, runs its own
 * order, and pauses for any venue-wide band. The day ends when the slowest
 * floor finishes, plus the closing ceremony.
 */
export function buildSchedule(input: ScheduleInput): Schedule {
  const { timing, mats, venueBlocks, order } = input;
  const warnings: ScheduleWarning[] = [];

  const dayStartMin = parseClock(timing.dayStartTime) ?? 8 * 60;

  const anchored = venueBlocks.map((b) => ({ block: b, anchor: bandAnchor(b) }));

  for (const { block, anchor } of anchored) {
    if (anchor === "UNSCHEDULED")
      warnings.push({
        code: "BLOCK_UNSCHEDULED",
        message: `"${block.label}" spans every floor but has no start time, so it is not on the schedule yet.`,
      });
  }

  // Opening: consumes the front of the day on every floor.
  const bands: ScheduledBand[] = [];
  let cursor = dayStartMin;
  for (const { block, anchor } of anchored) {
    if (anchor !== "START") continue;
    bands.push({
      id: block.id,
      kind: block.kind,
      label: block.label,
      minutes: block.minutes,
      anchor,
      startMin: cursor,
      endMin: cursor + block.minutes,
    });
    cursor += block.minutes;
  }
  const matStartMin = cursor;

  // Clock-pinned bands: the whole venue stops for these.
  const timeBands: ScheduledBand[] = anchored
    .filter((a) => a.anchor === "TIME")
    .map(({ block, anchor }) => {
      const startMin = parseClock(block.startTime)!;
      return {
        id: block.id,
        kind: block.kind,
        label: block.label,
        minutes: block.minutes,
        anchor,
        startMin,
        endMin: startMin + block.minutes,
      };
    })
    .sort((a, b) => a.startMin - b.startMin);
  bands.push(...timeBands);

  const pauses: Pause[] = timeBands
    .filter((b) => b.minutes > 0)
    .map((b) => ({ startMin: b.startMin, endMin: b.endMin }));

  for (const band of timeBands) {
    if (band.startMin < matStartMin)
      warnings.push({
        code: "BAND_BEFORE_START",
        message: `"${band.label}" is set for ${formatClock(band.startMin)}, before competition starts at ${formatClock(matStartMin)}.`,
      });
  }

  // Walk each floor.
  const scheduledMats: ScheduledMat[] = mats.map((mat) => {
    const categoryById = new Map(mat.categories.map((c) => [c.drawId, c]));
    const blockById = new Map(mat.blocks.map((b) => [b.id, b]));
    const refs = order.get(mat.id) ?? [];

    const items: ScheduledItem[] = [];
    let matCursor = clearPauses(matStartMin, pauses);
    let workMinutes = 0;
    let bouts = 0;

    for (const ref of refs) {
      let title: string;
      let minutes: number;
      let boutCount = 0;
      let category: ScheduleCategoryInput | undefined;
      let block: ScheduleBlockInput | undefined;

      if (ref.kind === "CATEGORY") {
        category = categoryById.get(ref.id);
        if (!category) continue;
        title = category.title;
        boutCount = categoryBouts(category);
        minutes = categoryMinutes(category, timing);
      } else {
        block = blockById.get(ref.id);
        if (!block) continue;
        title = block.label;
        minutes = Math.max(0, block.minutes);
      }

      const startMin = clearPauses(matCursor, pauses);
      const { endMin, pausedMin } = stretchAcrossPauses(startMin, minutes, pauses);
      items.push({
        kind: ref.kind,
        id: ref.id,
        title,
        minutes,
        startMin,
        endMin,
        pausedMin,
        waitMin: startMin - matCursor,
        category,
        block,
        bouts: boutCount,
      });
      workMinutes += minutes;
      bouts += boutCount;
      matCursor = endMin;
    }

    if (items.length === 0)
      warnings.push({ code: "EMPTY_MAT", message: `${mat.name} has nothing on it yet.` });

    return {
      id: mat.id,
      name: mat.name,
      items,
      startMin: items[0]?.startMin ?? matStartMin,
      endMin: matCursor,
      workMinutes,
      bouts,
    };
  });

  if (mats.length === 0)
    warnings.push({
      code: "NO_MATS",
      message: "No floors yet — add one before assigning categories.",
    });

  if (input.unassignedCount > 0)
    warnings.push({
      code: "UNASSIGNED_CATEGORIES",
      message: `${input.unassignedCount} ${input.unassignedCount === 1 ? "category is" : "categories are"} not on a floor yet, so ${input.unassignedCount === 1 ? "it is" : "they are"} not counted in the finish time.`,
    });

  const competitionEndMin = scheduledMats.reduce((max, m) => Math.max(max, m.endMin), matStartMin);

  for (const band of timeBands) {
    if (band.startMin >= competitionEndMin && scheduledMats.some((m) => m.items.length > 0))
      warnings.push({
        code: "BAND_AFTER_FINISH",
        message: `"${band.label}" is set for ${formatClock(band.startMin)}, after the last category finishes at ${formatClock(competitionEndMin)}.`,
      });
  }

  // Closing: after the slowest floor is done.
  let closeCursor = competitionEndMin;
  for (const { block, anchor } of anchored) {
    if (anchor !== "END") continue;
    bands.push({
      id: block.id,
      kind: block.kind,
      label: block.label,
      minutes: block.minutes,
      anchor,
      startMin: closeCursor,
      endMin: closeCursor + block.minutes,
    });
    closeCursor += block.minutes;
  }

  return {
    dayStartMin,
    matStartMin,
    finishMin: closeCursor,
    mats: scheduledMats,
    bands: bands.sort((a, b) => a.startMin - b.startMin),
    totalBouts: scheduledMats.reduce((sum, m) => sum + m.bouts, 0),
    competitionEndMin,
    warnings,
  };
}

/**
 * Interleave a floor's categories and blocks into one running order.
 *
 * Both carry `matOrder` in a single shared index space, so a break really does
 * sit between two categories. Ties break categories-first and then by id, so
 * the order is stable rather than dependent on query result ordering; items
 * with no position at all sort to the end.
 */
export function interleaveMatOrder(
  categories: { drawId: string; matOrder: number | null }[],
  blocks: { id: string; matOrder: number | null }[],
): OrderedPlanItem[] {
  const rows = [
    ...categories.map((c) => ({
      kind: "CATEGORY" as const,
      id: c.drawId,
      matOrder: c.matOrder,
      tie: 0,
    })),
    ...blocks.map((b) => ({ kind: "BLOCK" as const, id: b.id, matOrder: b.matOrder, tie: 1 })),
  ];
  rows.sort(
    (a, b) =>
      (a.matOrder ?? Number.MAX_SAFE_INTEGER) - (b.matOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.tie - b.tie ||
      a.id.localeCompare(b.id),
  );
  return rows.map((r) => ({ kind: r.kind, id: r.id }));
}
