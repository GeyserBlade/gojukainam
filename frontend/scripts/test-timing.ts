/**
 * Unit tests for the tournament timing config's pure functions
 * (src/lib/timing.ts). No network, no DOM — plain fixtures in, assertions out.
 * Mirrors scripts/test-estimator.ts, which mirrors the backend's
 * scripts/test-*.ts convention (there is no test framework on the frontend).
 *
 * Run: npx tsx scripts/test-timing.ts
 */
import {
  DEFAULT_EVENT_TIMING,
  WIN_GAP_SENIOR,
  WIN_GAP_YOUTH,
  defaultWinByGap,
  formatBoutDuration,
  inheritedDivisionTiming,
  normalizeEventTiming,
  resolveDivisionTiming,
  type EventTiming,
} from "../src/lib/timing";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const timing = (overrides: Partial<EventTiming> = {}): EventTiming => ({
  ...DEFAULT_EVENT_TIMING,
  ...overrides,
});

console.log("\nnormalizeEventTiming fills in a complete config:");
{
  const empty = normalizeEventTiming({});
  check(
    "empty object -> every default, nothing undefined",
    JSON.stringify(empty) === JSON.stringify(DEFAULT_EVENT_TIMING),
    empty,
  );
  check("null -> defaults", JSON.stringify(normalizeEventTiming(null)) === JSON.stringify(DEFAULT_EVENT_TIMING));
  check(
    "undefined -> defaults",
    JSON.stringify(normalizeEventTiming(undefined)) === JSON.stringify(DEFAULT_EVENT_TIMING),
  );

  const partial = normalizeEventTiming({ mats: 4, lunch: { enabled: false } });
  check("a supplied field is kept", partial.mats === 4, partial);
  check("a supplied nested field is kept", partial.lunch.enabled === false, partial.lunch);
  check(
    "a missing sibling of a supplied nested field still defaults",
    partial.lunch.minutes === DEFAULT_EVENT_TIMING.lunch.minutes &&
      partial.lunch.mode === DEFAULT_EVENT_TIMING.lunch.mode,
    partial.lunch,
  );
  check(
    "untouched blocks keep their own defaults",
    partial.opening.enabled === true && partial.checkin.enabled === false,
    { opening: partial.opening, checkin: partial.checkin },
  );
}

console.log("\nnormalizeEventTiming refuses to propagate junk into an input box:");
{
  const junk = normalizeEventTiming({
    mats: "not a number",
    defaultBufferPct: NaN,
    lunch: { mode: "SOMETIME_MAYBE" },
  });
  check("non-numeric string -> default", junk.mats === DEFAULT_EVENT_TIMING.mats, junk.mats);
  check("NaN -> default", junk.defaultBufferPct === DEFAULT_EVENT_TIMING.defaultBufferPct, junk.defaultBufferPct);
  check("unknown lunch mode -> default mode", junk.lunch.mode === "ALL_MATS", junk.lunch);

  const clamped = normalizeEventTiming({ mats: 0, defaultBufferPct: 500, defaultBoutDurationSec: 3 });
  check("mats below the minimum clamps to 1", clamped.mats === 1, clamped.mats);
  check("buffer above 100 clamps to 100", clamped.defaultBufferPct === 100, clamped.defaultBufferPct);
  check("bout duration below 10s clamps to 10", clamped.defaultBoutDurationSec === 10, clamped.defaultBoutDurationSec);

  const modeKept = normalizeEventTiming({ lunch: { mode: "PER_FLOOR" } });
  check("a valid PER_FLOOR mode survives", modeKept.lunch.mode === "PER_FLOOR", modeKept.lunch);
}

console.log("\ndefaultWinByGap follows the age rule (6 at 13 and below, 8 above):");
{
  check("maxAge 7 -> 6", defaultWinByGap({ maxAge: 7 }) === WIN_GAP_YOUTH);
  check("maxAge 13 (the boundary, inclusive) -> 6", defaultWinByGap({ maxAge: 13 }) === WIN_GAP_YOUTH);
  check("maxAge 14 -> 8", defaultWinByGap({ maxAge: 14 }) === WIN_GAP_SENIOR);
  check("maxAge 99 -> 8", defaultWinByGap({ maxAge: 99 }) === WIN_GAP_SENIOR);
  // Keyed on maxAge, not minAge: a category spanning the boundary can contain
  // 14-year-olds, so it takes the senior gap.
  check("a 12-14 category takes the senior gap, not the youth one", defaultWinByGap({ maxAge: 14 }) === 8);
}

console.log("\nresolveDivisionTiming: null means inherit, never zero:");
{
  const t = timing({ defaultBoutDurationSec: 90, defaultBufferPct: 12 });
  const inheritedAll = resolveDivisionTiming(
    { maxAge: 11, boutDurationSec: null, bufferPct: null, winByGap: null },
    t,
  );
  check("duration inherits the event default", inheritedAll.boutDurationSec === 90, inheritedAll);
  check("buffer inherits the event default", inheritedAll.bufferPct === 12, inheritedAll);
  check("win gap inherits the age rule", inheritedAll.winByGap === 6, inheritedAll);
  check(
    "all three flagged as inherited",
    inheritedAll.inherited.boutDurationSec &&
      inheritedAll.inherited.bufferPct &&
      inheritedAll.inherited.winByGap,
    inheritedAll.inherited,
  );

  const overridden = resolveDivisionTiming(
    { maxAge: 11, boutDurationSec: 150, bufferPct: 25, winByGap: 8 },
    t,
  );
  check(
    "overrides win over both the event default and the age rule",
    overridden.boutDurationSec === 150 && overridden.bufferPct === 25 && overridden.winByGap === 8,
    overridden,
  );
  check(
    "none flagged as inherited once overridden",
    !overridden.inherited.boutDurationSec &&
      !overridden.inherited.bufferPct &&
      !overridden.inherited.winByGap,
    overridden.inherited,
  );

  const mixed = resolveDivisionTiming({ maxAge: 17, boutDurationSec: 180, bufferPct: null, winByGap: null }, t);
  check("one override + two inherited resolve independently", mixed.boutDurationSec === 180 && mixed.bufferPct === 12 && mixed.winByGap === 8, mixed);
  check(
    "the inherited flags track per field, not per row",
    !mixed.inherited.boutDurationSec && mixed.inherited.bufferPct && mixed.inherited.winByGap,
    mixed.inherited,
  );

  // The distinction the whole nullable design exists for.
  const zeroBuffer = resolveDivisionTiming({ maxAge: 17, bufferPct: 0 }, t);
  check("an explicit 0% buffer is an override, not treated as absent", zeroBuffer.bufferPct === 0 && !zeroBuffer.inherited.bufferPct, zeroBuffer);

  const missingFields = resolveDivisionTiming({ maxAge: 9 }, t);
  check(
    "undefined (field absent entirely) inherits, same as null",
    missingFields.boutDurationSec === 90 && missingFields.winByGap === 6,
    missingFields,
  );
}

console.log("\ninheritedDivisionTiming states the fallback without any override applied:");
{
  const t = timing({ defaultBoutDurationSec: 120, defaultBufferPct: 10 });
  const junior = inheritedDivisionTiming({ maxAge: 13 }, t);
  check("junior fallback", junior.boutDurationSec === 120 && junior.bufferPct === 10 && junior.winByGap === 6, junior);
  const senior = inheritedDivisionTiming({ maxAge: 18 }, t);
  check("senior fallback differs only in the win gap", senior.winByGap === 8 && senior.boutDurationSec === 120, senior);
  check(
    "it ignores the division's own overrides by construction",
    inheritedDivisionTiming({ maxAge: 13 }, t).boutDurationSec ===
      resolveDivisionTiming({ maxAge: 13, boutDurationSec: null }, t).boutDurationSec,
  );
}

console.log("\nA kata category inherits the kata performance length, not the kumite clock:");
{
  const t = timing({ defaultBoutDurationSec: 120, kataBoutDurationSec: 75 });
  check(
    "kumite inherits the match clock",
    inheritedDivisionTiming({ maxAge: 20 }, t).boutDurationSec === 120,
  );
  check(
    "kata inherits the performance length",
    inheritedDivisionTiming({ maxAge: 20, isKata: true }, t).boutDurationSec === 75,
  );
  check(
    "resolve agrees, and still reports it as inherited",
    resolveDivisionTiming({ maxAge: 20, isKata: true, boutDurationSec: null }, t)
      .boutDurationSec === 75 &&
      resolveDivisionTiming({ maxAge: 20, isKata: true, boutDurationSec: null }, t).inherited
        .boutDurationSec,
  );
  check(
    "an override still beats it",
    resolveDivisionTiming({ maxAge: 20, isKata: true, boutDurationSec: 100 }, t)
      .boutDurationSec === 100,
  );
  check(
    "omitting isKata reads as kumite, so existing callers are unchanged",
    inheritedDivisionTiming({ maxAge: 20 }, t).boutDurationSec ===
      inheritedDivisionTiming({ maxAge: 20, isKata: false }, t).boutDurationSec,
  );
}

console.log("\nformatBoutDuration reads like a bout clock:");
{
  check("120 -> 2:00", formatBoutDuration(120) === "2:00", formatBoutDuration(120));
  check("90 -> 1:30", formatBoutDuration(90) === "1:30", formatBoutDuration(90));
  check("60 -> 1:00", formatBoutDuration(60) === "1:00", formatBoutDuration(60));
  check("45 -> 0:45", formatBoutDuration(45) === "0:45", formatBoutDuration(45));
  check("0 -> 0:00", formatBoutDuration(0) === "0:00", formatBoutDuration(0));
  check("negative clamps to 0:00", formatBoutDuration(-5) === "0:00", formatBoutDuration(-5));
  check("seconds pad to two digits", formatBoutDuration(125) === "2:05", formatBoutDuration(125));
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
