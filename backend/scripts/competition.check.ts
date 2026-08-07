/**
 * Pure checks for the podium and per-athlete derivation. No database, no
 * server — brackets are built in memory and asserted against.
 *
 *   pnpm tsx scripts/competition.check.ts
 *
 * This exists because production has no finished tournament yet: every draw on
 * Railway sits at DRAWN, so a smoke test against real data proves only that
 * "nothing has happened" is reported correctly. Medals, byes and the
 * fought-versus-advanced distinction are the parts that will be wrong in front
 * of a parent, and they need results that do not exist yet to exercise.
 */
import { athleteRunIn, resolveDraw, type DrawRow } from "../src/services/competition.service.js";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}\n         expected ${e}\n         actual   ${a}`);
  }
}

/** Build a DrawRow with entries named A, B, C… seated at positions 1..n. */
function draw(size: number, seats: (string | null)[], winners: Array<[string, number, number, string]>): DrawRow {
  return {
    id: "draw1",
    size,
    division: { name: "Test Division", category: "KUMITE", gender: "Male" },
    weightClass: null,
    slots: seats.flatMap((name, i) =>
      name === null
        ? []
        : [{
            position: i + 1,
            entryId: name,
            entry: {
              id: name,
              athlete: { id: `ath-${name}`, firstName: name, lastName: "Test" },
              team: null,
              club: { id: `club-${name}`, name: `Club ${name}` },
            },
          }],
    ),
    bouts: winners.map(([phase, round, position, winnerEntryId]) => ({
      phase, round, position, winnerEntryId,
      akaScore: null, aoScore: null, outcome: null,
    })),
  };
}

// ---------------------------------------------------------------------------
console.log("\nfull 4-bracket, run to completion");
{
  // 1:A 2:B 3:C 4:D — A beats B, C beats D, A beats C.
  const r = resolveDraw(draw(4, ["A", "B", "C", "D"], [
    ["MAIN", 1, 0, "A"],
    ["MAIN", 1, 1, "C"],
    ["MAIN", 2, 0, "A"],
  ]));

  check("gold", r.podium.first?.name, "A Test");
  check("silver", r.podium.second?.name, "C Test");
  // Each finalist beat exactly one person on the way, so both take a bronze
  // without a repechage bout being needed.
  check("bronze", r.podium.thirds.map((t) => t.name).sort(), ["B Test", "D Test"]);
  check("status", r.state.status, "COMPLETED");

  const a = athleteRunIn(r, "A");
  check("A fought 2, won 2", [a.boutsFought, a.boutsWon], [2, 2]);
  check("A placement", [a.placement, a.medal], [1, "gold"]);
  check("A's final is named Final", a.bouts.at(-1)?.round, "Final");
  check("A's opponent in the final", a.bouts.at(-1)?.opponent, "C Test");

  const b = athleteRunIn(r, "B");
  check("B fought 1, won 0", [b.boutsFought, b.boutsWon], [1, 0]);
  check("B took bronze losing its only bout", [b.placement, b.medal], [3, "bronze"]);
  check("field size", b.fieldSize, 4);
}

// ---------------------------------------------------------------------------
console.log("\nbyes are advances, not fights");
{
  // 5 entries in an 8-bracket: seats 1,2 fight; 3,5,7 walk through round 1.
  const r = resolveDraw(draw(8, ["A", "B", "C", null, "E", null, "G", null], [
    ["MAIN", 1, 0, "A"],
  ]));

  const c = athleteRunIn(r, "C");
  check("C reached round 2 without fighting", [c.boutsFought, c.boutsWon], [0, 0]);
  check("C's round-1 bout is uncontested", c.bouts[0]?.contested, false);
  check("C's round-1 result is null, not a win", c.bouts[0]?.result, null);
  check("no placement from an unfinished bracket", [c.placement, c.medal], [null, null]);
  check("status is IN_PROGRESS once one real result exists", r.state.status, "IN_PROGRESS");

  const a = athleteRunIn(r, "A");
  check("A's win over B is contested", [a.bouts[0]?.contested, a.bouts[0]?.result], [true, "WON"]);
  check("A fought 1, won 1", [a.boutsFought, a.boutsWon], [1, 1]);
}

// ---------------------------------------------------------------------------
console.log("\nnothing run yet");
{
  const r = resolveDraw(draw(4, ["A", "B", "C", "D"], []));
  check("status", r.state.status, "DRAWN");
  check("no gold", r.podium.first, null);
  const a = athleteRunIn(r, "A");
  check("no bouts fought", a.boutsFought, 0);
  check("no placement", a.placement, null);
  // Only bouts A is actually IN, which before any result is the semi-final
  // alone. The final's two sides are still empty, so listing it here would be
  // projecting a path A has not earned — "Ben is in the final" for someone who
  // has not fought yet is exactly the sentence this must never produce.
  check("bouts are the ones entered, not a projected path", a.bouts.map((b) => b.round), ["Semi-final"]);
}

// ---------------------------------------------------------------------------
console.log("\nrepechage decides a single bronze");
{
  // Full 8-bracket. A wins its half beating B, D, then takes the final over E.
  //   R1: A>B, C>D, E>F, G>H
  //   R2: A>C, E>G
  //   Final: A>E
  // A's beaten opponents in order: B (R1), C (R2) — two of them, so a
  // repechage bout B vs C decides that half's bronze. Same on E's side.
  const r = resolveDraw(draw(8, ["A", "B", "C", "D", "E", "F", "G", "H"], [
    ["MAIN", 1, 0, "A"], ["MAIN", 1, 1, "C"], ["MAIN", 1, 2, "E"], ["MAIN", 1, 3, "G"],
    ["MAIN", 2, 0, "A"], ["MAIN", 2, 1, "E"],
    ["MAIN", 3, 0, "A"],
    ["REPECHAGE", 1, 0, "B"],
    ["REPECHAGE", 1, 1, "F"],
  ]));

  check("gold/silver", [r.podium.first?.name, r.podium.second?.name], ["A Test", "E Test"]);
  check("bronze from both repechages", r.podium.thirds.map((t) => t.name).sort(), ["B Test", "F Test"]);
  check("status", r.state.status, "COMPLETED");

  const b = athleteRunIn(r, "B");
  check("B lost the first round then won the repechage", [b.boutsFought, b.boutsWon], [2, 1]);
  check("B's bronze", [b.placement, b.medal], [3, "bronze"]);
  check("B's repechage bout is labelled", b.bouts.at(-1)?.round, "Repechage 1");

  const c = athleteRunIn(r, "C");
  check("C lost the repechage and takes nothing", [c.placement, c.medal], [null, null]);
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
