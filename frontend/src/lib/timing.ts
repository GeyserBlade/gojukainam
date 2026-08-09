// Tournament timing config — pure shapes, defaults and resolution rules for
// the event's timing defaults (event hub → Overview) and each category's
// per-division overrides (event hub → Setup). No network calls here; the API
// functions live in lib/events.ts and the unit tests in
// scripts/test-timing.ts.
//
// This module defines the shapes only. `lib/schedule.ts` is what consumes them,
// turning the stored config plus the plan's running order into a wall-clock
// schedule. The older Estimator tab still runs on its own session-only inputs
// (lib/estimator.ts) and is deliberately untouched.

export type LunchMode = "ALL_MATS" | "PER_FLOOR";

/**
 * How a kata bout is run, which decides how many performances it costs the mat.
 * The single biggest lever on how long a kata category takes.
 */
export type KataMode = "SEQUENTIAL" | "TOGETHER";

export const KATA_MODE_LABELS: Record<KataMode, string> = {
  SEQUENTIAL: "One after the other",
  TOGETHER: "Both on the floor together",
};

export const KATA_MODE_HINTS: Record<KataMode, string> = {
  SEQUENTIAL:
    "AKA performs, then AO, then the flags — the WKF format. Two performances per bout.",
  TOGETHER:
    "Both competitors perform side by side at the same time. One performance per bout, so a category takes about half as long.",
};

/** Performances one bout costs the mat under each format. */
export const KATA_PERFORMANCES_PER_BOUT: Record<KataMode, number> = {
  SEQUENTIAL: 2,
  TOGETHER: 1,
};

export const LUNCH_MODE_LABELS: Record<LunchMode, string> = {
  ALL_MATS: "All mats close together",
  PER_FLOOR: "Each floor breaks on its own",
};

export const LUNCH_MODE_HINTS: Record<LunchMode, string> = {
  ALL_MATS: "The whole venue stops at the same time — one break, no competition running.",
  PER_FLOOR: "Each floor takes its break when its own running order allows, so other mats keep going.",
};

/** A block of the day that either happens or doesn't, with a length. */
export interface TimedBlock {
  enabled: boolean;
  minutes: number;
}

export interface LunchBreak extends TimedBlock {
  mode: LunchMode;
}

/** Tournament-wide timing defaults. Mirrors `EventTimingConfig` on the backend. */
export interface EventTiming {
  /** Mats/floors running in parallel. */
  mats: number;
  /** "HH:MM" — when the day starts. The plan's schedule counts from here. */
  dayStartTime: string;
  /** Default kumite bout clock for a category that doesn't override it. */
  defaultBoutDurationSec: number;
  /** How long one kata performance takes — unrelated to the kumite clock. */
  kataBoutDurationSec: number;
  /** Whether a kata bout costs the mat one performance or two. */
  kataMode: KataMode;
  /** Mat time between bouts — competitor changeover, not the match itself. */
  transitionSecondsPerBout: number;
  /** Default injury/stoppage buffer, as a percentage on top of bout time. */
  defaultBufferPct: number;
  /** Time a mat loses moving from one category to the next. */
  changeoverMinutes: number;
  opening: TimedBlock;
  closing: TimedBlock;
  lunch: LunchBreak;
  /** Athlete check-in / warm-up block before the first bout. Off by default. */
  checkin: TimedBlock;
}

/**
 * Must stay in sync with `EventTimingConfig`'s Zod defaults in
 * `backend/src/utils/validators.ts` — the backend fills these in on read, so a
 * divergence here would show a different "default" than the one that is
 * actually stored on save.
 */
export const DEFAULT_EVENT_TIMING: EventTiming = {
  mats: 2,
  dayStartTime: "08:00",
  defaultBoutDurationSec: 120,
  kataBoutDurationSec: 90,
  kataMode: "SEQUENTIAL",
  transitionSecondsPerBout: 60,
  defaultBufferPct: 10,
  changeoverMinutes: 5,
  opening: { enabled: true, minutes: 15 },
  closing: { enabled: true, minutes: 15 },
  lunch: { enabled: true, minutes: 30, mode: "ALL_MATS" },
  checkin: { enabled: false, minutes: 20 },
};

const num = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

/** "HH:MM", 24-hour. Matches the backend's `ClockTime`. */
export const CLOCK_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isClockTime = (value: unknown): value is string =>
  typeof value === "string" && CLOCK_TIME_RE.test(value);

const clock = (value: unknown, fallback: string): string =>
  isClockTime(value) ? value : fallback;

const block = (value: unknown, fallback: TimedBlock): TimedBlock => {
  const raw = (value ?? {}) as Partial<TimedBlock>;
  return {
    enabled: bool(raw.enabled, fallback.enabled),
    minutes: num(raw.minutes, fallback.minutes, 0, 600),
  };
};

/**
 * Anything → a complete `EventTiming`. The API already returns a normalized
 * config, so this is a belt-and-braces path for partial or hand-edited data
 * (and the seam the unit tests poke at): a missing or nonsense field falls back
 * to its default rather than propagating NaN into an input box.
 */
export function normalizeEventTiming(raw: unknown): EventTiming {
  const t = (raw ?? {}) as Partial<EventTiming>;
  const lunchRaw = (t.lunch ?? {}) as Partial<LunchBreak>;
  return {
    mats: Math.round(num(t.mats, DEFAULT_EVENT_TIMING.mats, 1, 50)),
    dayStartTime: clock(t.dayStartTime, DEFAULT_EVENT_TIMING.dayStartTime),
    defaultBoutDurationSec: Math.round(
      num(t.defaultBoutDurationSec, DEFAULT_EVENT_TIMING.defaultBoutDurationSec, 10, 1800),
    ),
    kataBoutDurationSec: Math.round(
      num(t.kataBoutDurationSec, DEFAULT_EVENT_TIMING.kataBoutDurationSec, 10, 1800),
    ),
    kataMode:
      t.kataMode === "TOGETHER" || t.kataMode === "SEQUENTIAL"
        ? t.kataMode
        : DEFAULT_EVENT_TIMING.kataMode,
    transitionSecondsPerBout: Math.round(
      num(t.transitionSecondsPerBout, DEFAULT_EVENT_TIMING.transitionSecondsPerBout, 0, 1800),
    ),
    defaultBufferPct: num(t.defaultBufferPct, DEFAULT_EVENT_TIMING.defaultBufferPct, 0, 100),
    changeoverMinutes: num(t.changeoverMinutes, DEFAULT_EVENT_TIMING.changeoverMinutes, 0, 240),
    opening: block(t.opening, DEFAULT_EVENT_TIMING.opening),
    closing: block(t.closing, DEFAULT_EVENT_TIMING.closing),
    lunch: {
      ...block(lunchRaw, DEFAULT_EVENT_TIMING.lunch),
      mode:
        lunchRaw.mode === "PER_FLOOR" || lunchRaw.mode === "ALL_MATS"
          ? lunchRaw.mode
          : DEFAULT_EVENT_TIMING.lunch.mode,
    },
    checkin: block(t.checkin, DEFAULT_EVENT_TIMING.checkin),
  };
}

// ---------------- Per-category timing ----------------

/** Oldest age still treated as a junior category for the win-gap default. */
export const WIN_GAP_AGE_THRESHOLD = 13;
export const WIN_GAP_YOUTH = 6;
export const WIN_GAP_SENIOR = 8;

/**
 * The win-by-points gap a category gets when it has no explicit override: 6 for
 * categories aged 13 and below, 8 above that.
 *
 * Keyed on `maxAge`, not `minAge`: a category is only "13 and below" if nobody
 * in it can be older than 13, so a division spanning 12–14 takes the senior
 * gap. Derived rather than copied onto the division at creation time, so
 * editing a category's age range keeps its default honest.
 */
export function defaultWinByGap(division: { maxAge: number }): number {
  return division.maxAge <= WIN_GAP_AGE_THRESHOLD ? WIN_GAP_YOUTH : WIN_GAP_SENIOR;
}

/** The three per-category overrides. null means "inherit", never "zero". */
export interface DivisionTimingOverrides {
  boutDurationSec: number | null;
  bufferPct: number | null;
  winByGap: number | null;
}

/** What each field falls back to when the category doesn't override it. */
export interface InheritedDivisionTiming {
  boutDurationSec: number;
  bufferPct: number;
  winByGap: number;
}

export interface ResolvedDivisionTiming extends InheritedDivisionTiming {
  /** Per field: true when the value shown came from the fallback, not an override. */
  inherited: { boutDurationSec: boolean; bufferPct: boolean; winByGap: boolean };
}

/**
 * What this category would use with every override cleared — the event's
 * defaults for bout duration and buffer, the age rule for the win gap.
 */
export function inheritedDivisionTiming(
  division: { maxAge: number },
  timing: EventTiming,
): InheritedDivisionTiming {
  return {
    boutDurationSec: timing.defaultBoutDurationSec,
    bufferPct: timing.defaultBufferPct,
    winByGap: defaultWinByGap(division),
  };
}

/** The effective timing for one category, plus where each value came from. */
export function resolveDivisionTiming(
  division: { maxAge: number } & Partial<DivisionTimingOverrides>,
  timing: EventTiming,
): ResolvedDivisionTiming {
  const fallback = inheritedDivisionTiming(division, timing);
  const has = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
  return {
    boutDurationSec: has(division.boutDurationSec) ? division.boutDurationSec : fallback.boutDurationSec,
    bufferPct: has(division.bufferPct) ? division.bufferPct : fallback.bufferPct,
    winByGap: has(division.winByGap) ? division.winByGap : fallback.winByGap,
    inherited: {
      boutDurationSec: !has(division.boutDurationSec),
      bufferPct: !has(division.bufferPct),
      winByGap: !has(division.winByGap),
    },
  };
}

/** Seconds → "m:ss", the way a bout clock reads. */
export function formatBoutDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
