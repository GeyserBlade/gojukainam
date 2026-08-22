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
