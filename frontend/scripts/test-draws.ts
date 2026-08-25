/**
 * Unit tests for lib/draws.ts's pure podium helpers — isFinalBout and
 * finalBronzeMedalists — the "identify the final / gather medalists" logic
 * behind the scoreboard's end-of-bout podium. No network, no DOM, mirrors
 * scripts/test-scoreboard.ts's convention (plain script run via tsx).
 *
 * Run: npx tsx scripts/test-draws.ts
 */
import {
  isFinalBout,
  boutMedalType,
  finalBronzeMedalists,
  sortBoutsForRunning,
  type DrawDetail,
  type DrawEntrySummary,
  type RunOrderableBout,
} from "../src/lib/draws";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const entry = (entryId: string): DrawEntrySummary => ({ entryId, name: entryId, clubName: "Club" });

// Only size and placements.thirds matter to these two functions — the rest
// is filled in with harmless defaults to satisfy the type.
function makeDraw(size: number, thirds: DrawEntrySummary[] = []): DrawDetail {
  return {
    id: "draw-1",
    eventId: "event-1",
    division: { id: "div-1", name: "Test Division", category: "KUMITE" },
    weightClass: null,
    size,
    status: "IN_PROGRESS",
    locked: false,
    slots: [],
    bouts: [],
    placements: { first: null, second: null, thirds },
    sync: { inSync: true, seedsChanged: false, added: [], removed: [], seedChanges: [] },
  };
}

console.log("\n— isFinalBout —");
{
  const draw = makeDraw(8); // 3 rounds: 1, 2, 3(final)
  check(
    "the single round-3 MAIN bout is the final",
    isFinalBout(draw, { phase: "MAIN", round: 3 }) === true,
  );
  check(
    "an earlier MAIN round is not the final",
    isFinalBout(draw, { phase: "MAIN", round: 1 }) === false,
  );
  check(
    "semi-final (round 2 of 3) is not the final",
    isFinalBout(draw, { phase: "MAIN", round: 2 }) === false,
  );
  check(
    "a REPECHAGE bout at the same round number is never the final",
    isFinalBout(draw, { phase: "REPECHAGE", round: 3 }) === false,
  );

  const draw16 = makeDraw(16); // 4 rounds
  check("size 16 -> final is round 4", isFinalBout(draw16, { phase: "MAIN", round: 4 }) === true);
  check("size 16 -> round 3 (semis) is not the final", isFinalBout(draw16, { phase: "MAIN", round: 3 }) === false);

  const draw2 = makeDraw(2); // 1 round: the only bout IS the final
  check(
    "smallest possible bracket (size 2) — its one bout is the final",
    isFinalBout(draw2, { phase: "MAIN", round: 1 }) === true,
  );
}

console.log("\n— boutMedalType: 2-entry bracket, just a final, no bronze at all —");
{
  // The whole division is a single bout — trivially the final, and there's
  // no repechage bracket possible with only 2 entries (a finalist can have
  // beaten at most one opponent, never enough for a bronze chain).
  check("the sole bout is \"final\"", boutMedalType({ phase: "MAIN", round: 1 }, 2) === "final");
}

console.log("\n— boutMedalType: 4-entry bracket, 1 final + bronze bouts —");
{
  // Round 1 = semis (not a medal bout), round 2 = the final; any
  // REPECHAGE row is "bronze" regardless of round/position.
  check("round 1 (semis) is not a medal bout", boutMedalType({ phase: "MAIN", round: 1 }, 4) === null);
  check("round 2 (the final) is \"final\"", boutMedalType({ phase: "MAIN", round: 2 }, 4) === "final");
  check("a REPECHAGE bout is \"bronze\"", boutMedalType({ phase: "REPECHAGE", round: 1 }, 4) === "bronze");
}

console.log("\n— boutMedalType: 8-entry bracket, multi-stage bronze chain —");
{
  // 3 rounds: round 1, round 2 (semis), round 3 (final). A double-
  // repechage chain's later stage (round 2 of the REPECHAGE side) is still
  // "bronze", not reclassified as anything else just because its round
  // number happens to equal the MAIN bracket's semi-final round.
  check("round 1 is not a medal bout", boutMedalType({ phase: "MAIN", round: 1 }, 8) === null);
  check("round 2 (semis) is not a medal bout", boutMedalType({ phase: "MAIN", round: 2 }, 8) === null);
  check("round 3 (the final) is \"final\"", boutMedalType({ phase: "MAIN", round: 3 }, 8) === "final");
  check("REPECHAGE stage 1 is \"bronze\"", boutMedalType({ phase: "REPECHAGE", round: 1 }, 8) === "bronze");
  check(
    "REPECHAGE stage 2 is still \"bronze\", not confused with the MAIN semis at the same round number",
    boutMedalType({ phase: "REPECHAGE", round: 2 }, 8) === "bronze",
  );
}

console.log("\n— boutMedalType: 16-entry bracket —");
{
  check("round 3 (semis of 4 rounds) is not a medal bout", boutMedalType({ phase: "MAIN", round: 3 }, 16) === null);
  check("round 4 (the final) is \"final\"", boutMedalType({ phase: "MAIN", round: 4 }, 16) === "final");
}

console.log("\n— boutMedalType and isFinalBout agree on every case —");
{
  // isFinalBout now delegates to boutMedalType; pin that they can't drift
  // apart across a spread of sizes/rounds/phases.
  for (const size of [2, 4, 8, 16, 32]) {
    const totalRounds = Math.log2(size);
    for (let round = 1; round <= totalRounds; round++) {
      for (const phase of ["MAIN", "REPECHAGE"] as const) {
        const draw = makeDraw(size);
        const bout = { phase, round };
        check(
          `size ${size}, ${phase} round ${round}: isFinalBout === (boutMedalType === "final")`,
          isFinalBout(draw, bout) === (boutMedalType(bout, size) === "final"),
          { size, phase, round },
        );
      }
    }
  }
}

console.log("\n— finalBronzeMedalists —");
{
  check("no bronzes decided yet -> null", finalBronzeMedalists(makeDraw(8, [])) === null);
  check(
    "only one side's repechage resolved -> still null (not a complete podium)",
    finalBronzeMedalists(makeDraw(8, [entry("bronze-a")])) === null,
  );
  const both = finalBronzeMedalists(makeDraw(8, [entry("bronze-a"), entry("bronze-b")]));
  check("both sides resolved -> both medalists returned", both !== null && both.length === 2, both);
  check(
    "returns the actual entries, not placeholders",
    both?.[0].entryId === "bronze-a" && both?.[1].entryId === "bronze-b",
    both,
  );
  // Bracket-half order, not seed order — thirds[0]/[1] pass through as-is.
  const reordered = finalBronzeMedalists(makeDraw(8, [entry("bronze-b"), entry("bronze-a")]));
  check(
    "order mirrors draw.placements.thirds verbatim (no re-sorting)",
    reordered?.[0].entryId === "bronze-b" && reordered?.[1].entryId === "bronze-a",
    reordered,
  );
}

console.log("\n— sortBoutsForRunning: main-only bracket (no bronze) —");
{
  interface B extends RunOrderableBout { id: string }
  const bout = (id: string, phase: "MAIN" | "REPECHAGE", round: number, position: number): B => ({ id, phase, round, position });

  // 4-entry bracket, given out of order: final before semis.
  const bouts = [bout("final", "MAIN", 2, 0), bout("semi2", "MAIN", 1, 1), bout("semi1", "MAIN", 1, 0)];
  const sorted = sortBoutsForRunning(bouts, 4);
  check(
    "semis come before the final, in position order",
    sorted.map((b) => b.id).join(",") === "semi1,semi2,final",
    sorted.map((b) => b.id),
  );
}

console.log("\n— sortBoutsForRunning: bracket with bronze —");
{
  interface B extends RunOrderableBout { id: string }
  const bout = (id: string, phase: "MAIN" | "REPECHAGE", round: number, position: number): B => ({ id, phase, round, position });

  // 8-entry bracket: round 1 (4 bouts), round 2 (semis), round 3 (final),
  // plus a two-stage repechage chain on each side.
  const bouts = [
    bout("final", "MAIN", 3, 0),
    bout("r1-a", "MAIN", 1, 0),
    bout("r1-b", "MAIN", 1, 1),
    bout("r1-c", "MAIN", 1, 2),
    bout("r1-d", "MAIN", 1, 3),
    bout("semi1", "MAIN", 2, 0),
    bout("semi2", "MAIN", 2, 1),
    bout("bronze1-stage2", "REPECHAGE", 2, 0),
    bout("bronze1-stage1", "REPECHAGE", 1, 0),
    bout("bronze2-stage1", "REPECHAGE", 1, 1),
  ];
  const sorted = sortBoutsForRunning(bouts, 8);
  const order = sorted.map((b) => b.id);
  check(
    "round 1, then semis, then bronze (stage-major), then the final strictly last",
    order.join(",") ===
      ["r1-a", "r1-b", "r1-c", "r1-d", "semi1", "semi2", "bronze1-stage1", "bronze2-stage1", "bronze1-stage2", "final"].join(","),
    order,
  );
  check("the final is the very last bout", order[order.length - 1] === "final", order);
}

console.log("\n— sortBoutsForRunning: 2-entry bracket, no bronze at all —");
{
  interface B extends RunOrderableBout { id: string }
  const bouts: B[] = [{ id: "only", phase: "MAIN", round: 1, position: 0 }];
  const sorted = sortBoutsForRunning(bouts, 2);
  check("the sole bout — trivially the final — survives untouched", sorted.length === 1 && sorted[0].id === "only", sorted);
}

console.log("\n— sortBoutsForRunning: never drops a bout, the final included —");
{
  interface B extends RunOrderableBout { id: string }
  const bout = (id: string, phase: "MAIN" | "REPECHAGE", round: number, position: number): B => ({ id, phase, round, position });
  // The exact shape of a real report: "the final bout isn't showing up." A
  // separate live check found the actual cause was a UI truncation on the
  // public spectator board, not this sorter — but this pins the stronger
  // guarantee directly: nothing that goes in ever fails to come back out.
  const bouts = [
    bout("r1-a", "MAIN", 1, 0),
    bout("r1-b", "MAIN", 1, 1),
    bout("semi", "MAIN", 2, 0),
    bout("bronze", "REPECHAGE", 1, 0),
    bout("final", "MAIN", 3, 0),
  ];
  const sorted = sortBoutsForRunning(bouts, 8);
  check("every input bout comes back out — none silently dropped", sorted.length === bouts.length, sorted);
  check("the final specifically is present in the output", sorted.some((b) => b.id === "final"), sorted);
}

console.log("\n— sortBoutsForRunning: does not mutate the input array —");
{
  interface B extends RunOrderableBout { id: string }
  const bouts: B[] = [
    { id: "final", phase: "MAIN", round: 2, position: 0 },
    { id: "semi", phase: "MAIN", round: 1, position: 0 },
  ];
  const original = bouts.map((b) => b.id).join(",");
  sortBoutsForRunning(bouts, 4);
  check("the caller's array is untouched", bouts.map((b) => b.id).join(",") === original, bouts);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
