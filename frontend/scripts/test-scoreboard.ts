/**
 * Unit tests for the live scoreboard's pure functions (src/lib/scoreboard.ts),
 * focused on the post-buzzer awarding window: timer expired -> awarding
 * window -> finalized. No network, no DOM — plain values in, assertions out.
 * Mirrors scripts/test-estimator.ts's convention (no test framework on the
 * frontend, so this is a plain script run via tsx, same as the backend's
 * scripts/test-*.ts).
 *
 * Run: npx tsx scripts/test-scoreboard.ts
 */
import {
  anyPostTime,
  finalizeAwardingWindow,
  isBoutOver,
  startAwardingWindow,
  tickAward,
  DEFAULT_AWARD_WINDOW_MS,
  type BoutAction,
} from "../src/lib/scoreboard";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

console.log("\n— tickAward —");
{
  check("counts down by the tick delta", tickAward(30_000, 100) === 29_900);
  check("clamps at 0, doesn't go negative", tickAward(50, 100) === 0);
  check("null (not in a window) is a no-op", tickAward(null, 100) === null);
  check("0 (already spent) is a no-op", tickAward(0, 100) === 0);
}

console.log("\n— startAwardingWindow —");
{
  check(
    "clock hits 0, bout not decisively over -> starts the window",
    startAwardingWindow(null, null, DEFAULT_AWARD_WINDOW_MS) === DEFAULT_AWARD_WINDOW_MS,
  );
  check(
    "bout already decisively ended (gap/hansoku/kiken) -> no window needed",
    startAwardingWindow("GAP", null, DEFAULT_AWARD_WINDOW_MS) === null,
  );
  check(
    "idempotent: a window already counting down is not restarted",
    startAwardingWindow(null, 12_345, DEFAULT_AWARD_WINDOW_MS) === 12_345,
  );
  check(
    "idempotent even once spent (0): does not hand out a fresh window",
    startAwardingWindow(null, 0, DEFAULT_AWARD_WINDOW_MS) === 0,
  );
}

console.log("\n— finalizeAwardingWindow —");
{
  check("always closes the window to exactly 0", finalizeAwardingWindow() === 0);
}

console.log("\n— isBoutOver —");
{
  check(
    "clock still running -> not over",
    isBoutOver({ ended: null, clockMs: 45_000, awardMs: null }) === false,
  );
  check(
    "clock at 0, no window ever entered -> over",
    isBoutOver({ ended: null, clockMs: 0, awardMs: null }) === true,
  );
  check(
    "clock at 0, window actively counting down -> NOT over (this is the feature)",
    isBoutOver({ ended: null, clockMs: 0, awardMs: 18_000 }) === false,
  );
  check(
    "clock at 0, window spent (0) -> over",
    isBoutOver({ ended: null, clockMs: 0, awardMs: 0 }) === true,
  );
  check(
    "decisive ending overrides an active window -> over regardless",
    isBoutOver({ ended: "HANSOKU", clockMs: 0, awardMs: 25_000 }) === true,
  );
  check(
    "decisive ending mid-bout (clock still running) -> over",
    isBoutOver({ ended: "KIKEN", clockMs: 60_000, awardMs: null }) === true,
  );
}

console.log("\n— anyPostTime —");
{
  const mk = (postTime?: boolean): BoutAction => ({ type: "SCORE", side: "aka", kind: "yuko", at: 0, postTime });
  check("empty log -> false", anyPostTime([]) === false);
  check("no action tagged postTime -> false", anyPostTime([mk(), mk(false)]) === false);
  check("one action tagged postTime -> true", anyPostTime([mk(), mk(true)]) === true);
  check("every action tagged postTime -> true", anyPostTime([mk(true), mk(true)]) === true);
}

console.log("\n— full lifecycle: IN_PROGRESS -> AWARDING -> FINALIZED —");
{
  // Simulates the exact sequence Scoreboard.tsx drives: clock ticks down,
  // hits 0, the window opens, a late score comes in and gets tagged, the
  // window ticks out, the bout locks. This is the scenario the feature
  // request names explicitly.
  let clockMs = 300; // 0.3s left on the main clock
  let awardMs: number | null = null;
  let ended: "GAP" | "HANSOKU" | "KIKEN" | null = null;
  const awardWindowMs = 5_000;

  // tick the main clock out
  clockMs = Math.max(0, clockMs - 100);
  clockMs = Math.max(0, clockMs - 100);
  clockMs = Math.max(0, clockMs - 100);
  check("main clock reaches exactly 0", clockMs === 0);
  // Before startAwardingWindow runs, awardMs is still null, so in isolation
  // isBoutOver reads "over" — the component always opens the window in the
  // same effect that observes clockMs hit 0, so this instant is never
  // actually rendered, but it's worth documenting the ordering dependency.
  check("without an open window, hitting 0 alone reads as over", isBoutOver({ ended, clockMs, awardMs }) === true);

  // the "time up" effect fires: open the window
  awardMs = startAwardingWindow(ended, awardMs, awardWindowMs);
  check("window opened at the full configured length", awardMs === awardWindowMs);
  check("scoring is allowed again once the window is open", isBoutOver({ ended, clockMs, awardMs }) === false);

  // a late score comes in — this is what the operator's dispatch() tags
  const postTime = awardMs !== null && awardMs > 0;
  const log: BoutAction[] = [{ type: "SCORE", side: "aka", kind: "ippon", at: 999, postTime }];
  check("the late score is tagged post-time", anyPostTime(log) === true);
  check("bout is still not over right after the late score — the window doesn't end early just because someone scored", isBoutOver({ ended, clockMs, awardMs }) === false);

  // window ticks all the way out
  for (let i = 0; i < 50; i++) awardMs = tickAward(awardMs, 100);
  check("window ticked down to exactly 0", awardMs === 0);
  check("bout is now over — this is where the resolution dialog opens", isBoutOver({ ended, clockMs, awardMs }) === true);
  check("the score entered during the window is still on record as post-time", anyPostTime(log) === true);
}

console.log("\n— full lifecycle: Finalize clicked early —");
{
  // Same start, but the operator closes the window themselves instead of
  // waiting it out.
  let awardMs: number | null = startAwardingWindow(null, null, DEFAULT_AWARD_WINDOW_MS);
  check("window opened", awardMs === DEFAULT_AWARD_WINDOW_MS);
  // tick it partway, then finalize
  awardMs = tickAward(awardMs, 100);
  awardMs = tickAward(awardMs, 100);
  check("window has time left before Finalize", (awardMs ?? 0) > 0);
  awardMs = finalizeAwardingWindow();
  check("Finalize closes the window immediately, not gradually", awardMs === 0);
  check("bout is over the instant Finalize is clicked", isBoutOver({ ended: null, clockMs: 0, awardMs }) === true);
}

console.log("\n— full lifecycle: decisive ending mid-award pre-empts the window —");
{
  // A gap-winning score lands during the awarding window itself — the bout
  // is decided outright, so there's no reason to keep waiting out the timer.
  let awardMs: number | null = startAwardingWindow(null, null, DEFAULT_AWARD_WINDOW_MS);
  awardMs = tickAward(awardMs, 5_000); // window still has time left
  check("window still active before the decisive score", (awardMs ?? 0) > 0);
  const ended: "GAP" = "GAP";
  check("a decisive ending locks the bout even mid-window", isBoutOver({ ended, clockMs: 0, awardMs }) === true);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
