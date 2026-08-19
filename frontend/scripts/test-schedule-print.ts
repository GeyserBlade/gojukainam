/**
 * Unit tests for lib/schedule-print.ts's pure layout math — the printable
 * one-page schedule's percentage-based positioning and the team-event name
 * heuristic. No network, no DOM, mirrors scripts/test-schedule.ts's
 * convention (plain script run via tsx).
 *
 * Run: npx tsx scripts/test-schedule-print.ts
 */
import { layoutPercent, layoutMatColumn, hourTicks, isTeamCategory } from "../src/lib/schedule-print";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

console.log("\n— layoutPercent —");
{
  // Day runs 08:00 (480) to 18:00 (1080), a 600-minute span.
  const dayStart = 480;
  const span = 600;

  const first = layoutPercent(480, 540, dayStart, span);
  check("an item starting at day-start sits at top: 0%", first.topPct === 0, first);
  check("a 60-minute item out of a 600-minute day is 10% tall", first.heightPct === 10, first);

  const mid = layoutPercent(780, 840, dayStart, span);
  check("an item 300 minutes in sits at 50%", mid.topPct === 50, mid);

  const last = layoutPercent(1020, 1080, dayStart, span);
  check("an item ending exactly at day-end reaches 100%", last.topPct + last.heightPct === 100, last);

  const clampedLow = layoutPercent(400, 500, dayStart, span);
  check("an item starting before the day's own range clamps to 0%, not negative", clampedLow.topPct === 0, clampedLow);

  const clampedHigh = layoutPercent(1050, 1200, dayStart, span);
  check(
    "an item ending after the day's own range clamps to 100%, not over",
    clampedHigh.topPct + clampedHigh.heightPct === 100,
    clampedHigh,
  );

  const zeroSpan = layoutPercent(480, 480, dayStart, 0);
  check("zero total span (degenerate schedule) -> 0/0, not NaN or Infinity", zeroSpan.topPct === 0 && zeroSpan.heightPct === 0, zeroSpan);
}

console.log("\n— layoutMatColumn —");
{
  // Same 08:00-18:00, 600-minute day as above. Minimum floor: 4% (chosen to
  // be comfortably bigger than a short test item's natural height, same
  // relationship the real MIN_BLOCK_HEIGHT_PCT has to a real ~20min category
  // on a real multi-hour day).
  const dayStart = 480;
  const span = 600;
  const minPct = 4;

  console.log("  no minimum needed:");
  {
    // Two comfortably-long, back-to-back items — 60min each, 10% natural
    // height, well above the 4% floor. The whole point of the fix is that
    // this normal case is untouched: still exactly what layoutPercent alone
    // would have produced.
    const items = [
      { id: "a", startMin: 480, endMin: 540 },
      { id: "b", startMin: 540, endMin: 600 },
    ];
    const laidOut = layoutMatColumn(items, dayStart, span, minPct);
    check("first item keeps its natural 0% top", laidOut[0].topPct === 0, laidOut);
    check("first item keeps its natural 10% height (unstretched)", laidOut[0].heightPct === 10, laidOut);
    check("second item starts exactly where the first ends — no gap introduced", laidOut[1].topPct === laidOut[0].heightPct, laidOut);
  }

  console.log("  the bug's own scenario — a short block that used to disappear:");
  {
    // 480-500: a 20-minute category, 3.33% natural height — below the 4%
    // floor, this app's actual bug. 500-560: the next category, natural and
    // otherwise unaffected once pushed clear of the floored block above it.
    const items = [
      { id: "short", startMin: 480, endMin: 500 },
      { id: "next", startMin: 500, endMin: 560 },
    ];
    const laidOut = layoutMatColumn(items, dayStart, span, minPct);
    const short = laidOut.find((i) => i.id === "short")!;
    const next = laidOut.find((i) => i.id === "next")!;
    check("the short block is floored to the minimum, not its true 3.33%", short.heightPct === minPct, short);
    check("the short block still starts at its true time (0%)", short.topPct === 0, short);
    check(
      "the following block is pushed down to clear the floored block above it, not left overlapping",
      next.topPct === short.topPct + short.heightPct,
      { short, next },
    );
    check(
      "the pushed block visually sits later (4%) than its own true start time would place it (3.33%)",
      next.topPct > layoutPercent(500, 560, dayStart, span).topPct,
      { next, natural: layoutPercent(500, 560, dayStart, span) },
    );
  }

  console.log("  many short blocks — the overflow-into-rescale case:");
  {
    // 30 five-minute categories back to back (a real event would never do
    // this — it is deliberately pathological): each floored to 4% would sum
    // to 120%, past the bottom of the page. This is the "slightly compress
    // each other" fallback the brief itself named.
    const items = Array.from({ length: 30 }, (_, i) => ({
      id: `c${i}`,
      startMin: 480 + i * 5,
      endMin: 480 + i * 5 + 5,
    }));
    const laidOut = layoutMatColumn(items, dayStart, span, minPct);
    const last = laidOut[laidOut.length - 1];
    check("even under enough pressure to force scaling, the column never exceeds 100%", last.topPct + last.heightPct <= 100 + 1e-9, last);
    check(
      "scaling never pushes it below 100% either — the fallback fills the page rather than leaving it short",
      last.topPct + last.heightPct >= 100 - 1e-9,
      last,
    );
    let ordered = true;
    for (let i = 1; i < laidOut.length; i++) {
      if (laidOut[i].topPct < laidOut[i - 1].topPct + laidOut[i - 1].heightPct - 1e-9) ordered = false;
    }
    check("blocks stay in order with no overlaps even after rescaling", ordered, laidOut);
    check(
      "every block still has *some* height after rescaling, not zeroed out",
      laidOut.every((l) => l.heightPct > 0),
      laidOut,
    );
  }

  console.log("  edges:");
  {
    check("empty column -> empty result, not a crash", layoutMatColumn([], dayStart, span, minPct).length === 0);
    const zeroSpanResult = layoutMatColumn([{ id: "x", startMin: 480, endMin: 500 }], dayStart, 0, minPct);
    check("zero total span -> 0/0, not NaN or a divide-by-zero", zeroSpanResult[0].topPct === 0 && zeroSpanResult[0].heightPct === 0, zeroSpanResult);
  }
}

console.log("\n— hourTicks —");
{
  const ticks = hourTicks(490, 1055); // 08:10 to 17:35
  check("rounds the start down to the hour", ticks[0] === 480, ticks);
  check("rounds the end up to the hour", ticks[ticks.length - 1] === 1080, ticks);
  check("one tick per hour across the whole span", ticks.length === 11, ticks);

  const shortDay = hourTicks(480, 500); // less than an hour of content
  check("a day shorter than one hour still gets at least two ticks", shortDay.length >= 2, shortDay);
}

console.log("\n— isTeamCategory —");
{
  check("\"Cadet Male Team Kata (14-15)\" -> true", isTeamCategory("Cadet Male Team Kata (14-15)") === true);
  check("\"Senior Female Team Kumite (18+)\" -> true", isTeamCategory("Senior Female Team Kumite (18+)") === true);
  check("case-insensitive: \"senior TEAM kumite\" -> true", isTeamCategory("senior TEAM kumite") === true);
  check("an individual division -> false", isTeamCategory("Cadet Male Kata (14-15)") === false);
  check(
    "\"Steam\" doesn't false-positive on the substring \"team\" — word boundary required",
    isTeamCategory("Steam Room Division") === false,
  );
  check(
    "a weight-class suffix without \"team\" -> false",
    isTeamCategory("Senior Male Kumite (18+) · -75kg") === false,
  );
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
