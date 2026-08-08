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
  type DrawDetail,
  type DrawEntrySummary,
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

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
