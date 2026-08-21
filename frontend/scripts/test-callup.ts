/**
 * Unit tests for lib/callup.ts — the call-up sheet's pure bout ordering,
 * bye/TBD handling, and bronze-bout labeling. No network, no DOM, mirrors
 * scripts/test-schedule.ts's convention (plain script run via tsx).
 *
 * Run: npx tsx scripts/test-callup.ts
 */
import {
  kumiteMainRows,
  kumiteBronzeRows,
  kataMainPerformances,
  kataBronzePerformances,
  buildCallupSheet,
  type CallupDraw,
} from "../src/lib/callup";
import type { DrawBout, DrawEntrySummary } from "../src/lib/draws";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const entry = (name: string, clubName = "Club"): DrawEntrySummary => ({ entryId: name, name, clubName });

function mkBout(overrides: Partial<DrawBout> & Pick<DrawBout, "phase" | "round" | "position">): DrawBout {
  return {
    id: `${overrides.phase}:${overrides.round}:${overrides.position}`,
    aka: null,
    ao: null,
    winnerEntryId: null,
    isUserResult: false,
    akaScore: null,
    aoScore: null,
    outcome: null,
    scoreJson: null,
    postTime: false,
    startedAt: null,
    akaKata: null,
    aoKata: null,
    ...overrides,
  };
}

console.log("\n— kumiteMainRows: basic ordering and labels —");
{
  // A 4-entry bracket: round 1 = semis (2 bouts, both filled), round 2 =
  // final (1 bout, undecided — both sides still waiting on round 1).
  const draw: CallupDraw = {
    division: { category: "KUMITE" },
    size: 4,
    bouts: [
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: null, ao: null, winnerEntryId: null }),
    ],
  };
  const rows = kumiteMainRows(draw);
  check("round 1 comes before round 2", rows[0].label.startsWith("Semi-finals") && rows[2].label === "Final", rows.map((r) => r.label));
  check("semi-final bouts are numbered within the round", rows[0].label === "Semi-finals — Bout 1" && rows[1].label === "Semi-finals — Bout 2", rows.map((r) => r.label));
  check("the sole final bout has no redundant \"— Bout 1\" suffix", rows[2].label === "Final", rows[2].label);
  check("filled slots carry the real name, tbdFrom null", rows[0].aka.name === "A" && rows[0].aka.tbdFrom === null, rows[0]);
  check(
    "the final's still-empty aka names its real predecessor bout",
    rows[2].aka.tbdFrom === "Semi-finals — Bout 1",
    rows[2],
  );
  check(
    "the final's still-empty ao names the *other* semi-final, not the same one",
    rows[2].ao.tbdFrom === "Semi-finals — Bout 2",
    rows[2],
  );
  check("a TBD slot's own name reads \"TBD\"", rows[2].aka.name === "TBD", rows[2].aka);
}

console.log("\n— kumiteMainRows: byes and walkovers are dropped, not shown empty —");
{
  const draw: CallupDraw = {
    division: { category: "KUMITE" },
    size: 4,
    bouts: [
      // A round-1 bye: one side present, already auto-resolved (winnerEntryId set).
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: null, winnerEntryId: "A" }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      // Genuinely pending: not yet decided.
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: null, ao: null, winnerEntryId: null }),
    ],
  };
  const rows = kumiteMainRows(draw);
  check("the bye round-1 bout is dropped entirely — nothing to call up", !rows.some((r) => r.label.includes("Bout 1") && r.section === "MAIN" && r.aka.name === "A" && r.ao.tbdFrom !== null), rows);
  check("only 2 rows remain: the real round-1 bout and the pending final", rows.length === 2, rows.map((r) => r.label));
}

console.log("\n— kumiteBronzeRows: single-stage vs. multi-stage sides —");
{
  const draw: CallupDraw = {
    division: { category: "KUMITE" },
    size: 8,
    bouts: [
      // Side 0: a single bronze bout.
      mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("E"), ao: entry("F") }),
      // Side 1: a two-stage chain (WKF double repechage).
      mkBout({ phase: "REPECHAGE", round: 1, position: 1, aka: entry("G"), ao: entry("H") }),
      mkBout({ phase: "REPECHAGE", round: 2, position: 1, aka: null, ao: entry("I"), winnerEntryId: null }),
    ],
  };
  const rows = kumiteBronzeRows(draw);
  check("side 0 (one stage) is plainly \"Bronze 1\"", rows.some((r) => r.label === "Bronze 1"), rows.map((r) => r.label));
  check("side 1's two stages are \"Bronze 2.1\" and \"Bronze 2.2\"", rows.some((r) => r.label === "Bronze 2.1") && rows.some((r) => r.label === "Bronze 2.2"), rows.map((r) => r.label));
  check("every bronze row is flagged as the BRONZE section", rows.every((r) => r.section === "BRONZE"), rows);
  const stage2 = rows.find((r) => r.label === "Bronze 2.2")!;
  check(
    "a pending repechage slot reads \"result pending\", not a fabricated bout reference",
    stage2.aka.tbdFrom === "result pending",
    stage2,
  );
}

console.log("\n— kumiteBronzeRows: an empty side produces nothing —");
{
  const draw: CallupDraw = {
    division: { category: "KUMITE" },
    size: 8,
    bouts: [mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("E"), ao: entry("F") })],
  };
  const rows = kumiteBronzeRows(draw);
  check("only the one real bronze bout appears, no phantom row for the empty side", rows.length === 1 && rows[0].label === "Bronze 1", rows);
}

console.log("\n— kata flattening —");
{
  const draw: CallupDraw = {
    division: { category: "KATA" },
    size: 4,
    bouts: [
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: null, ao: null, winnerEntryId: null }),
    ],
  };
  const perf = kataMainPerformances(draw);
  // 3 bout rows (the pending final included, same as kumite) -> 6
  // performances, numbered continuously across all of them.
  check(
    "3 bout rows -> 6 performances (2 each), numbered continuously",
    perf.length === 6 && perf.map((p) => p.label).join(",") === Array.from({ length: 6 }, (_, i) => `Performance ${i + 1}`).join(","),
    perf.map((p) => p.label),
  );
  check("performance order is aka then ao, within each bout in bout order", perf[0].performer.name === "A" && perf[1].performer.name === "B" && perf[2].performer.name === "C" && perf[3].performer.name === "D", perf.map((p) => p.performer.name));
  check("each performance carries its parent bout's label as context", perf[0].boutLabel === "Semi-finals — Bout 1" && perf[2].boutLabel === "Semi-finals — Bout 2", perf.map((p) => p.boutLabel));
  check(
    "the still-pending final's two performances are TBD too, not silently dropped",
    perf[4].performer.name === "TBD" && perf[5].performer.name === "TBD" && perf[4].boutLabel === "Final",
    perf.slice(4),
  );

  const bronzeDraw: CallupDraw = {
    division: { category: "KATA" },
    size: 4,
    bouts: [mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("E"), ao: entry("F") })],
  };
  const bronzePerf = kataBronzePerformances(bronzeDraw);
  check(
    "bronze performances restart their own numbering at 1, separate from the main list",
    bronzePerf.length === 2 && bronzePerf[0].label === "Performance 1",
    bronzePerf,
  );
  check("bronze performances are flagged as the BRONZE section", bronzePerf.every((p) => p.section === "BRONZE"), bronzePerf);
}

console.log("\n— buildCallupSheet: picks the shape by discipline —");
{
  const kumiteDraw: CallupDraw = {
    division: { category: "KUMITE" },
    size: 2,
    bouts: [mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") })],
  };
  const kumiteSheet = buildCallupSheet(kumiteDraw);
  check("a KUMITE draw builds bout rows with an aka/ao pair, not flattened performances", !kumiteSheet.isKata && "aka" in kumiteSheet.mainRows[0], kumiteSheet);

  const kataDraw: CallupDraw = {
    division: { category: "KATA" },
    size: 2,
    bouts: [mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") })],
  };
  const kataSheet = buildCallupSheet(kataDraw);
  check(
    "a KATA draw builds flattened performance rows instead — 1 bout, 2 performances",
    kataSheet.isKata && kataSheet.mainRows.length === 2 && "performer" in kataSheet.mainRows[0],
    kataSheet,
  );
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
