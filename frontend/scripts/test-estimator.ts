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
  formatDuration,
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

const division = (bouts: number, source: DivisionBoutBreakdown["source"] = "entries"): DivisionBoutBreakdown => ({
  divisionId: `d-${Math.random()}`,
  divisionName: "Test Division",
  bouts,
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

console.log("\n— deriveKumiteBoutBreakdown —");
{
  const divisions = [
    { id: "kata-1", name: "Kata A", category: "KATA" as const },
    { id: "kumite-1", name: "Kumite A", category: "KUMITE" as const },
  ];

  // KATA divisions are excluded outright, even if categories reference them.
  const r1 = deriveKumiteBoutBreakdown(divisions, [
    { divisionId: "kata-1", entryCount: 8, drawBoutCount: null },
    { divisionId: "kumite-1", entryCount: 5, drawBoutCount: null },
  ]);
  check("KATA divisions excluded", r1.every((d) => d.divisionId !== "kata-1"), r1);
  check("no-draw category estimates as entries - 1", r1[0]?.bouts === 4, r1);
  check("no-draw source is 'entries'", r1[0]?.source === "entries", r1);
}

{
  // A division with two weight classes must sum bouts per category, not
  // (total entries - 1) across the whole division.
  const divisions = [{ id: "kumite-1", name: "Kumite A", category: "KUMITE" as const }];
  const categories = [
    { divisionId: "kumite-1", entryCount: 4, drawBoutCount: null }, // weight class A: 4 entries -> 3 bouts
    { divisionId: "kumite-1", entryCount: 3, drawBoutCount: null }, // weight class B: 3 entries -> 2 bouts
  ];
  const r = deriveKumiteBoutBreakdown(divisions, categories);
  check(
    "multi-weight-class division sums per-category, not (total - 1)",
    r[0]?.bouts === 5, // 3 + 2, not (4+3)-1=6
    r,
  );
}

{
  // A category with an existing draw uses the real (repechage-inclusive)
  // bout count, not entries - 1 — this is the whole reason "pull from the
  // actual bracket if a draw exists" matters: entries-1 undercounts once
  // WKF double-repechage bronze bouts exist.
  const divisions = [{ id: "kumite-1", name: "Kumite A", category: "KUMITE" as const }];
  const drawn = deriveKumiteBoutBreakdown(divisions, [
    { divisionId: "kumite-1", entryCount: 8, drawBoutCount: 9 }, // 8 entries: 7 main + 2 repechage = 9
  ]);
  check("drawn category uses the real bout count, not entries - 1", drawn[0]?.bouts === 9, drawn);
  check("drawn source is 'draw'", drawn[0]?.source === "draw", drawn);

  // Same division, but one of its two weight classes hasn't been drawn yet.
  const mixed = deriveKumiteBoutBreakdown(divisions, [
    { divisionId: "kumite-1", entryCount: 8, drawBoutCount: 9 },
    { divisionId: "kumite-1", entryCount: 3, drawBoutCount: null },
  ]);
  check("mixed division sums drawn + estimated", mixed[0]?.bouts === 9 + 2, mixed);
  check("mixed source is 'mixed'", mixed[0]?.source === "mixed", mixed);
}

{
  // A division nobody has entered yet still shows up (0 bouts), it isn't
  // silently dropped — estimateKumiteDuration is what excludes 0-bout rows
  // from the changeover count, breakdown derivation itself stays complete.
  const divisions = [{ id: "kumite-1", name: "Empty Division", category: "KUMITE" as const }];
  const r = deriveKumiteBoutBreakdown(divisions, [{ divisionId: "kumite-1", entryCount: 0, drawBoutCount: null }]);
  check("division with 0 entries still appears, with 0 bouts", r[0]?.bouts === 0, r);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
