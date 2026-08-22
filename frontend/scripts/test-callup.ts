/**
 * Unit tests for lib/callup.ts — the call-up sheet's pure bout ordering,
 * bye/TBD handling, and bronze-bout labeling. No network, no DOM, mirrors
 * scripts/test-schedule.ts's convention (plain script run via tsx).
 *
 * Run: npx tsx scripts/test-callup.ts
 */
import {
  mainBoutRows,
  bronzeBoutRows,
  finalBoutRows,
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

console.log("\n— mainBoutRows: basic ordering and labels, final excluded —");
{
  // A 4-entry bracket: round 1 = semis (2 bouts, both filled), round 2 =
  // final (1 bout, undecided — both sides still waiting on round 1).
  const draw: CallupDraw = {
    size: 4,
    bouts: [
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: null, ao: null, winnerEntryId: null }),
    ],
  };
  const rows = mainBoutRows(draw);
  check("only the 2 semi-final rows come back — the final is not among them", rows.length === 2, rows.map((r) => r.label));
  check("semi-final bouts are numbered within the round", rows[0].label === "Semi-finals — Bout 1" && rows[1].label === "Semi-finals — Bout 2", rows.map((r) => r.label));
  check("filled slots carry the real name, tbdFrom null", rows[0].aka.name === "A" && rows[0].aka.tbdFrom === null, rows[0]);

  const final = finalBoutRows(draw);
  check("finalBoutRows returns exactly the final, separately", final.length === 1 && final[0].label === "Final", final);
  check(
    "the final's still-empty aka names its real predecessor bout",
    final[0].aka.tbdFrom === "Semi-finals — Bout 1",
    final[0],
  );
  check(
    "the final's still-empty ao names the *other* semi-final, not the same one",
    final[0].ao.tbdFrom === "Semi-finals — Bout 2",
    final[0],
  );
  check("a TBD slot's own name reads \"TBD\"", final[0].aka.name === "TBD", final[0].aka);
}

console.log("\n— mainBoutRows: byes and walkovers are dropped, not shown empty —");
{
  const draw: CallupDraw = {
    size: 4,
    bouts: [
      // A round-1 bye: one side present, already auto-resolved (winnerEntryId set).
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: null, winnerEntryId: "A" }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      // Genuinely pending: not yet decided.
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: null, ao: null, winnerEntryId: null }),
    ],
  };
  const rows = mainBoutRows(draw);
  check("the bye round-1 bout is dropped entirely — nothing to call up", !rows.some((r) => r.label.includes("Bout 1") && r.section === "MAIN" && r.aka.name === "A" && r.ao.tbdFrom !== null), rows);
  check("only 1 mainBoutRows row remains: the real round-1 bout (the pending final lives in finalBoutRows)", rows.length === 1, rows.map((r) => r.label));
  check("the pending final still shows up, just in finalBoutRows now", finalBoutRows(draw).length === 1, finalBoutRows(draw));
}

console.log("\n— bronzeBoutRows: single-stage vs. multi-stage sides, interleaved by stage —");
{
  const draw: CallupDraw = {
    size: 8,
    bouts: [
      // Side 0: a single bronze bout.
      mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("E"), ao: entry("F") }),
      // Side 1: a two-stage chain (WKF double repechage).
      mkBout({ phase: "REPECHAGE", round: 1, position: 1, aka: entry("G"), ao: entry("H") }),
      mkBout({ phase: "REPECHAGE", round: 2, position: 1, aka: null, ao: entry("I"), winnerEntryId: null }),
    ],
  };
  const rows = bronzeBoutRows(draw);
  check("side 0 (one stage) is plainly \"Bronze 1\"", rows.some((r) => r.label === "Bronze 1"), rows.map((r) => r.label));
  check("side 1's two stages are \"Bronze 2.1\" and \"Bronze 2.2\"", rows.some((r) => r.label === "Bronze 2.1") && rows.some((r) => r.label === "Bronze 2.2"), rows.map((r) => r.label));
  check("every bronze row is flagged as the BRONZE section", rows.every((r) => r.section === "BRONZE"), rows);
  check(
    "stage 1 of both sides runs before stage 2 of either — WKF running order, not grouped by side",
    rows.map((r) => r.label).join(",") === "Bronze 1,Bronze 2.1,Bronze 2.2",
    rows.map((r) => r.label),
  );
  const stage2 = rows.find((r) => r.label === "Bronze 2.2")!;
  check(
    "a pending repechage slot reads \"result pending\", not a fabricated bout reference",
    stage2.aka.tbdFrom === "result pending",
    stage2,
  );
}

console.log("\n— bronzeBoutRows: an empty side produces nothing —");
{
  const draw: CallupDraw = {
    size: 8,
    bouts: [mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("E"), ao: entry("F") })],
  };
  const rows = bronzeBoutRows(draw);
  check("only the one real bronze bout appears, no phantom row for the empty side", rows.length === 1 && rows[0].label === "Bronze 1", rows);
}

console.log("\n— kata uses the exact same paired aka/ao shape as kumite —");
{
  // Kata divisions run a real head-to-head bracket too (winner decided by
  // flag majority instead of points) — lib/callup.ts doesn't even know
  // which discipline it's building for, so this just re-runs the same
  // fixture shape a kata draw would actually produce and checks nothing
  // about the output singles kata out for different treatment.
  const draw: CallupDraw = {
    size: 4,
    bouts: [
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: null, ao: null, winnerEntryId: null }),
      mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("E"), ao: entry("F") }),
    ],
  };
  const sheet = buildCallupSheet(draw);
  check("2 main rows (semis only), each carrying a real aka/ao pair", sheet.mainRows.length === 2 && sheet.mainRows.every((r) => "aka" in r && "ao" in r), sheet.mainRows);
  check("aka/ao carry real names and club, not flattened into single performers", sheet.mainRows[0].aka.name === "A" && sheet.mainRows[0].aka.clubName === "Club" && sheet.mainRows[0].ao.name === "B", sheet.mainRows[0]);
  check("the bronze bout is included and labeled the same as kumite's", sheet.bronzeRows.length === 1 && sheet.bronzeRows[0].label === "Bronze 1", sheet.bronzeRows);
  check("the still-pending final is included, not dropped — in its own finalRows section", sheet.finalRows.length === 1 && sheet.finalRows[0].label === "Final" && sheet.finalRows[0].aka.name === "TBD", sheet.finalRows);
}

console.log("\n— buildCallupSheet: WKF running order — semis, then bronze, then the final last —");
{
  const draw: CallupDraw = {
    size: 8,
    bouts: [
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") }),
      mkBout({ phase: "MAIN", round: 1, position: 1, aka: entry("C"), ao: entry("D") }),
      mkBout({ phase: "MAIN", round: 1, position: 2, aka: entry("E"), ao: entry("F") }),
      mkBout({ phase: "MAIN", round: 1, position: 3, aka: entry("G"), ao: entry("H") }),
      mkBout({ phase: "MAIN", round: 2, position: 0, aka: entry("A"), ao: entry("C") }),
      mkBout({ phase: "MAIN", round: 2, position: 1, aka: entry("E"), ao: entry("G") }),
      mkBout({ phase: "MAIN", round: 3, position: 0, aka: null, ao: null, winnerEntryId: null }),
      mkBout({ phase: "REPECHAGE", round: 1, position: 0, aka: entry("B"), ao: entry("D") }),
      mkBout({ phase: "REPECHAGE", round: 1, position: 1, aka: entry("F"), ao: entry("H") }),
    ],
  };
  const sheet = buildCallupSheet(draw);
  check("4 quarter-final rows, then 2 semi-final rows: 6 total in mainRows", sheet.mainRows.length === 6, sheet.mainRows.map((r) => r.label));
  check("mainRows never contains the final", !sheet.mainRows.some((r) => r.label === "Final"), sheet.mainRows.map((r) => r.label));
  check("both bronze bouts are present", sheet.bronzeRows.length === 2, sheet.bronzeRows.map((r) => r.label));
  check("the final is alone in finalRows, still pending", sheet.finalRows.length === 1 && sheet.finalRows[0].aka.name === "TBD", sheet.finalRows);
}

console.log("\n— buildCallupSheet: one universal shape, no discipline branching —");
{
  const draw: CallupDraw = {
    size: 2,
    bouts: [
      mkBout({ phase: "MAIN", round: 1, position: 0, aka: entry("A"), ao: entry("B") }),
    ],
  };
  const sheet = buildCallupSheet(draw);
  check(
    "buildCallupSheet just wraps mainBoutRows/bronzeBoutRows/finalBoutRows — same output either way",
    JSON.stringify(sheet) ===
      JSON.stringify({ mainRows: mainBoutRows(draw), bronzeRows: bronzeBoutRows(draw), finalRows: finalBoutRows(draw) }),
    sheet,
  );
  check("a 2-entry bracket's only bout is the final, not a mainRow", sheet.mainRows.length === 0 && sheet.finalRows.length === 1, sheet);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
