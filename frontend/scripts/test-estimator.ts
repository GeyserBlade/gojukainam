/**
 * Unit tests for the kumite duration estimator's pure functions
 * (src/lib/estimator.ts). No network, no DOM — plain fixtures in, assertions
 * out. Mirrors the backend's scripts/test-*.ts convention (there is no test
 * framework on the frontend; this is the same pattern, run the same way).
 *
 * Run: npx tsx scripts/test-estimator.ts
 */
import {
  deriveKumiteBoutBreakdown,
  estimateKumiteDuration,
  estimatedRepechageBouts,
  formatDuration,
  minutesForDivision,
  DEFAULT_ESTIMATOR_INPUTS,
  type DivisionBoutBreakdown,
  type EstimatorInputs,
} from "../src/lib/estimator";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const inputs = (overrides: Partial<EstimatorInputs> = {}): EstimatorInputs => ({
  ...DEFAULT_ESTIMATOR_INPUTS,
  ...overrides,
});

const division = (
  bouts: number,
  source: DivisionBoutBreakdown["source"] = "entries",
  entries: number = bouts > 0 ? bouts + 1 : 0, // realistic single-elim inverse, not load-bearing
): DivisionBoutBreakdown => ({
  divisionId: `d-${Math.random()}`,
  divisionName: "Test Division",
  bouts,
  entries,
  source,
});

console.log("\n— estimateKumiteDuration —");
{
  // 10 bouts, 4 min/bout, 10% buffer, 2 mats, 3 divisions with bouts:
  //   boutMinutesRaw = 40, withBuffer = 44, perMat = ceil(44/2) = 22
  //   divisionsPerMat = ceil(3/2) = 2, changeover = 2*5 = 10
  //   lunch 30 + opening 15 + closing 15, checkin off by default
  //   total = 22 + 10 + 30 + 15 + 15 = 92
  const divs = [division(4), division(3), division(3)];
  const r = estimateKumiteDuration(divs, inputs({ mats: 2 }));
  check("totalBouts sums the breakdown", r.totalBouts === 10, r);
  check("totalDivisions counts bout-producing divisions", r.totalDivisions === 3, r);
  check("boutMinutesRaw = bouts * minutesPerBout", r.boutMinutesRaw === 40, r);
  check("boutMinutesWithBuffer applies the % buffer", r.boutMinutesWithBuffer === 44, r);
  check("perMatBoutMinutes = ceil(withBuffer / mats)", r.perMatBoutMinutes === 22, r);
  check("divisionsPerMat = ceil(divisions / mats)", r.divisionsPerMat === 2, r);
  check("changeoverMinutesTotal = divisionsPerMat * changeover", r.changeoverMinutesTotal === 10, r);
  check("totalMinutes matches the worked example", r.totalMinutes === 92, r);
  check("formatDuration renders 92 as 1h 32min", formatDuration(r.totalMinutes) === "1h 32min");
}

{
  // Every segment must sum to exactly totalMinutes — the whole point of
  // splitting bouts/buffer as an integer partition rather than two
  // independently-rounded numbers.
  const divs = [division(7), division(5), division(2)];
  const cases: EstimatorInputs[] = [
    inputs({ mats: 1 }),
    inputs({ mats: 3 }),
    inputs({ mats: 4, bufferPct: 0 }),
    inputs({ mats: 2, bufferPct: 37 }),
    inputs({ mats: 2, lunchEnabled: false, openingEnabled: false, closingEnabled: false }),
    inputs({ mats: 2, checkinEnabled: true, checkinMinutes: 25 }),
  ];
  for (const c of cases) {
    const r = estimateKumiteDuration(divs, c);
    const segmentSum = r.segments.reduce((s, seg) => s + seg.minutes, 0);
    check(`segments sum to totalMinutes (mats=${c.mats}, buffer=${c.bufferPct}%)`, segmentSum === r.totalMinutes, {
      segmentSum,
      totalMinutes: r.totalMinutes,
      segments: r.segments,
    });
  }
}

{
  // 0% buffer: buffer segment must be exactly 0, not just "small".
  const r = estimateKumiteDuration([division(6)], inputs({ mats: 1, bufferPct: 0 }));
  const buffer = r.segments.find((s) => s.key === "buffer");
  check("0% buffer produces no buffer segment", buffer === undefined, r.segments);
  check("boutMinutesWithBuffer == boutMinutesRaw at 0% buffer", r.boutMinutesWithBuffer === r.boutMinutesRaw, r);
}

{
  // All optional blocks off: total is just bouts+buffer+changeover.
  const r = estimateKumiteDuration(
    [division(4)],
    inputs({
      mats: 1,
      lunchEnabled: false,
      openingEnabled: false,
      closingEnabled: false,
      checkinEnabled: false,
    }),
  );
  check(
    "all toggles off -> total is bouts+buffer+changeover only",
    r.totalMinutes === r.perMatBoutMinutes + r.changeoverMinutesTotal,
    r,
  );
  check("no lunch/ceremony/checkin segments present", r.segments.every((s) => !["lunch", "opening", "closing", "checkin"].includes(s.key)), r.segments);
}

{
  // mats <= 0 must not divide-by-zero or go negative — clamps to 1.
  const zero = estimateKumiteDuration([division(4)], inputs({ mats: 0 }));
  const negative = estimateKumiteDuration([division(4)], inputs({ mats: -3 }));
  const one = estimateKumiteDuration([division(4)], inputs({ mats: 1 }));
  check("mats=0 clamps to 1 mat", zero.perMatBoutMinutes === one.perMatBoutMinutes, zero);
  check("negative mats clamps to 1 mat", negative.perMatBoutMinutes === one.perMatBoutMinutes, negative);
}

{
  // Divisions with 0 bouts (no entries yet) don't inflate the changeover count.
  const r = estimateKumiteDuration([division(4), division(0), division(0)], inputs({ mats: 1 }));
  check("0-bout divisions excluded from totalDivisions", r.totalDivisions === 1, r);
}

{
  // Ceiling actually rounds up, not down — a mat-division that doesn't come
  // out even must still cost the full extra minute.
  const r = estimateKumiteDuration([division(1)], inputs({ mats: 3, minutesPerBout: 4, bufferPct: 0 }));
  // 1 bout * 4 min = 4 min raw, /3 mats = 1.33..., ceil = 2
  check("perMatBoutMinutes rounds up, not down", r.perMatBoutMinutes === 2, r);
}

console.log("\n— formatDuration —");
{
  check("0 minutes", formatDuration(0) === "0min");
  check("under an hour", formatDuration(45) === "45min");
  check("exact hour", formatDuration(60) === "1h");
  check("exact multiple of an hour", formatDuration(120) === "2h");
  check("hour + minutes", formatDuration(90) === "1h 30min");
  check("rounds fractional minutes", formatDuration(90.6) === "1h 31min");
}

console.log("\n— estimatedRepechageBouts —");
{
  // Verified two ways before trusting this table: (1) a 20,000-trial Monte
  // Carlo simulation of the actual computeDrawState algorithm (random winner
  // at every real match) for N=2..24, giving the true distribution of total
  // bout counts; (2) this closed-form expected-value recursion, cross-checked
  // against that simulation's mean. Full-bracket sizes (4, 8, 16) have zero
  // variance — deterministic, not just "expected" — so those are exact, not
  // approximate.
  //
  // Non-power-of-2 sizes are genuinely not deterministic before the bracket
  // is fought: N=9 comes out to 10 total bouts ~75% of the time and 11 the
  // rest (simulated), because which specific entrant reaches the final
  // depends on who wins, not just on entry count. This function reports the
  // *expected value* (rounded to the nearest whole bout), which is the
  // right statistic for a duration estimate — but note it does not always
  // equal the single most likely outcome: N=5 rounds to 1 repechage bout
  // (expectation ~0.7) while the simulated mode is actually 0 bouts more
  // often than 1. Both are defensible; expectation is what's implemented.
  //
  // N=9 is the case that prompted this: reported as 8 bouts (entries-1, no
  // repechage) when a real check said it should read 10 — this table exists
  // so that regresses to the wrong number again, loudly.
  const cases: [number, number][] = [
    [2, 0],
    [3, 0],
    [4, 0], // full bracket, deterministic: 3 main + 0 repechage = 3
    [5, 1],
    [7, 2],
    [8, 2], // full bracket, deterministic: 7 main + 2 repechage = 9
    [9, 2], // the reported case: 8 main + 2 repechage = 10
    [16, 4], // full bracket, deterministic: 15 main + 4 repechage = 19
  ];
  for (const [n, expected] of cases) {
    const r = estimatedRepechageBouts(n);
    check(`N=${n} -> ${expected} repechage bout${expected === 1 ? "" : "s"} (total ${n - 1 + expected})`, r === expected, r);
  }
}
{
  check("fewer than 4 entries can never need repechage", estimatedRepechageBouts(3) === 0);
  check("0 entries doesn't crash", estimatedRepechageBouts(0) === 0);
}

console.log("\n— deriveKumiteBoutBreakdown —");
{
  const divisions = [
    { id: "kata-1", name: "Kata A", category: "KATA" as const },
    { id: "kumite-1", name: "Kumite A", category: "KUMITE" as const },
  ];

  // KATA divisions are excluded outright, even if categories reference them.
  // 5 entries: main=4, repechage(5)=1 -> 5.
  const r1 = deriveKumiteBoutBreakdown(divisions, [
    { divisionId: "kata-1", entryCount: 8, drawEntryCount: null },
    { divisionId: "kumite-1", entryCount: 5, drawEntryCount: null },
  ]);
  check("KATA divisions excluded", r1.every((d) => d.divisionId !== "kata-1"), r1);
  check("no-draw category is entries-1 plus expected repechage", r1[0]?.bouts === 5, r1);
  check("no-draw source is 'entries'", r1[0]?.source === "entries", r1);
}

{
  // A division with two weight classes must sum bouts per category, not
  // (total entries - 1) across the whole division. Weight class A: 4 entries
  // -> main 3, repechage(4)=0 -> 3. Weight class B: 3 entries -> main 2,
  // repechage(3)=0 -> 2.
  const divisions = [{ id: "kumite-1", name: "Kumite A", category: "KUMITE" as const }];
  const categories = [
    { divisionId: "kumite-1", entryCount: 4, drawEntryCount: null },
    { divisionId: "kumite-1", entryCount: 3, drawEntryCount: null },
  ];
  const r = deriveKumiteBoutBreakdown(divisions, categories);
  check(
    "multi-weight-class division sums per-category, not (total - 1)",
    r[0]?.bouts === 5, // 3 + 2, not (4+3)-1=6
    r,
  );
  check("entries sums across weight classes too", r[0]?.entries === 7, r); // 4 + 3
}

{
  // A category with an existing draw uses the DRAW's entry count, not
  // today's live entryCount — this is the whole reason "pull from the actual
  // bracket if a draw exists" matters: an entry withdrawn (or added) after
  // the draw was made means the two numbers can genuinely differ, and the
  // bracket that will actually run is the correct one to schedule around.
  const divisions = [{ id: "kumite-1", name: "Kumite A", category: "KUMITE" as const }];
  const drawn = deriveKumiteBoutBreakdown(divisions, [
    // Drawn with 7 real entries (main=6, repechage(7)=2 -> 8); one has since
    // withdrawn, so today's live entryCount reads 8 — the draw's count wins.
    { divisionId: "kumite-1", entryCount: 8, drawEntryCount: 7 },
  ]);
  check("drawn category uses the draw's entry count, not today's entryCount", drawn[0]?.bouts === 8, drawn);
  check("drawn source is 'draw'", drawn[0]?.source === "draw", drawn);

  // Same division, but one of its two weight classes hasn't been drawn yet
  // (3 entries -> main 2, repechage(3)=0 -> 2).
  const mixed = deriveKumiteBoutBreakdown(divisions, [
    { divisionId: "kumite-1", entryCount: 8, drawEntryCount: 7 },
    { divisionId: "kumite-1", entryCount: 3, drawEntryCount: null },
  ]);
  check("mixed division sums drawn + estimated", mixed[0]?.bouts === 8 + 2, mixed);
  check("mixed source is 'mixed'", mixed[0]?.source === "mixed", mixed);
  // entries reflects today's live counts regardless of source — it's not
  // meant to explain bouts, just to show alongside it.
  check("entries sums today's live entryCount, not the drawn count", mixed[0]?.entries === 8 + 3, mixed);
}

console.log("\n— minutesForDivision —");
{
  // 6 bouts, 4 min/bout, 10% buffer, 5 min changeover:
  //   boutMinutes = 6*4*1.10 = 26.4, + 5 changeover = 31.4, ceil = 32
  const r = minutesForDivision(6, inputs({ changeoverMinutes: 5 }));
  check("bout time with buffer, plus one changeover, rounded up", r === 32, r);
}
{
  check("0 bouts costs 0 minutes, not just a changeover", minutesForDivision(0, inputs()) === 0);
  check("negative bouts treated as 0", minutesForDivision(-3, inputs()) === 0);
}
{
  // Not divided across mats — a division's own duration doesn't change
  // just because there happen to be more mats running other divisions.
  const withOneMat = minutesForDivision(6, inputs({ mats: 1 }));
  const withFourMats = minutesForDivision(6, inputs({ mats: 4 }));
  check("mat count does not affect a single division's own duration", withOneMat === withFourMats, {
    withOneMat,
    withFourMats,
  });
}
{
  // Summing every division's minutesForDivision should be >= perMatBoutMinutes
  // for a single mat (mats=1 means one division's changeover cost isn't
  // shared, so the per-division sum legitimately runs ahead of the pooled
  // total once more than one division is in play) — sanity-check they are at
  // least in the right neighborhood, not wildly divergent.
  const divs = [division(4), division(3), division(2)];
  const total = estimateKumiteDuration(divs, inputs({ mats: 1 }));
  const perDivisionSum = divs.reduce((sum, d) => sum + minutesForDivision(d.bouts, inputs({ mats: 1 })), 0);
  check(
    "per-division minutes roughly track the pooled bout+changeover total",
    perDivisionSum >= total.perMatBoutMinutes,
    { perDivisionSum, perMatBoutMinutes: total.perMatBoutMinutes },
  );
}

{
  // A division nobody has entered yet still shows up (0 bouts), it isn't
  // silently dropped — estimateKumiteDuration is what excludes 0-bout rows
  // from the changeover count, breakdown derivation itself stays complete.
  const divisions = [{ id: "kumite-1", name: "Empty Division", category: "KUMITE" as const }];
  const r = deriveKumiteBoutBreakdown(divisions, [{ divisionId: "kumite-1", entryCount: 0, drawEntryCount: null }]);
  check("division with 0 entries still appears, with 0 bouts", r[0]?.bouts === 0, r);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
