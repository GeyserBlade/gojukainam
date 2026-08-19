/**
 * Unit tests for lib/schedule-print.ts's pure layout math — the printable
 * one-page schedule's percentage-based positioning and the team-event name
 * heuristic. No network, no DOM, mirrors scripts/test-schedule.ts's
 * convention (plain script run via tsx).
 *
 * Run: npx tsx scripts/test-schedule-print.ts
 */
import { layoutPercent, hourTicks, isTeamCategory } from "../src/lib/schedule-print";

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
