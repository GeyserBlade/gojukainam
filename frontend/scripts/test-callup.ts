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

console.log("\n— mainBoutRows: basic ordering and labels —");
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
  check("only 2 rows remain: the real round-1 bout and the pending final", rows.length === 2, rows.map((r) => r.label));
}

console.log("\n— bronzeBoutRows: single-stage vs. multi-stage sides —");
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
  check("3 main rows, each carrying a real aka/ao pair", sheet.mainRows.length === 3 && sheet.mainRows.every((r) => "aka" in r && "ao" in r), sheet.mainRows);
  check("aka/ao carry real names and club, not flattened into single performers", sheet.mainRows[0].aka.name === "A" && sheet.mainRows[0].aka.clubName === "Club" && sheet.mainRows[0].ao.name === "B", sheet.mainRows[0]);
  check("the bronze bout is included and labeled the same as kumite's", sheet.bronzeRows.length === 1 && sheet.bronzeRows[0].label === "Bronze 1", sheet.bronzeRows);
  check("the still-pending final is included, not dropped, same as kumite", sheet.mainRows[2].label === "Final" && sheet.mainRows[2].aka.name === "TBD", sheet.mainRows[2]);
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
    "buildCallupSheet just wraps mainBoutRows/bronzeBoutRows — same output either way",
    JSON.stringify(sheet) === JSON.stringify({ mainRows: mainBoutRows(draw), bronzeRows: bronzeBoutRows(draw) }),
    sheet,
  );
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
