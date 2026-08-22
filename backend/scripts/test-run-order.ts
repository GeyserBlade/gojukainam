/**
 * Unit tests for run.service.ts's sortBoutsForRunning — the pure WKF
 * running-order rule (main bracket through semis, then bronze/repechage,
 * then the final last). No DB: importing run.service.ts pulls in
 * ../lib/prisma.js, but PrismaClient only connects on first query, and this
 * script never issues one — mirrors the frontend's pure-script convention
 * (frontend/scripts/test-callup.ts) since this helper has no DB dependency.
 *
 * Run: npx tsx scripts/test-run-order.ts
 */
import { sortBoutsForRunning, type RunOrderableBout } from "../src/services/run.service.js";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

interface Bout extends RunOrderableBout {
  id: string;
}
const bout = (id: string, phase: "MAIN" | "REPECHAGE", round: number, position: number): Bout => ({
  id,
  phase,
  round,
  position,
});

console.log("\n— sortBoutsForRunning: main-only bracket (no bronze) —");
{
  // 4-entry bracket, given out of order: final before semis.
  const bouts = [
    bout("final", "MAIN", 2, 0),
    bout("semi2", "MAIN", 1, 1),
    bout("semi1", "MAIN", 1, 0),
  ];
  const sorted = sortBoutsForRunning(bouts, 4);
  check(
    "semis come before the final, in position order",
    sorted.map((b) => b.id).join(",") === "semi1,semi2,final",
    sorted.map((b) => b.id),
  );
}

console.log("\n— sortBoutsForRunning: bracket with bronze —");
{
  // 8-entry bracket: R1(4 bouts) -> QF... actually round labels aside, use
  // round numbers directly: round 1, round 2 (semis), round 3 (final) for
  // an 8-entry bracket, plus a two-stage repechage chain on each side.
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
    "round 1 before semis before bronze before the final, final strictly last",
    order.join(",") ===
      ["r1-a", "r1-b", "r1-c", "r1-d", "semi1", "semi2", "bronze1-stage1", "bronze2-stage1", "bronze1-stage2", "final"].join(","),
    order,
  );
  check("the final is the very last bout", order[order.length - 1] === "final", order);
  check(
    "every bronze bout runs after every non-final main bout and before the final",
    order.indexOf("bronze1-stage1") > order.indexOf("semi2") && order.indexOf("bronze1-stage2") < order.indexOf("final"),
    order,
  );
}

console.log("\n— sortBoutsForRunning: 2-entry bracket, no bronze at all —");
{
  // The whole division is a single bout, which is trivially both the only
  // round and the final.
  const bouts = [bout("only", "MAIN", 1, 0)];
  const sorted = sortBoutsForRunning(bouts, 2);
  check("the sole bout survives untouched", sorted.length === 1 && sorted[0].id === "only", sorted);
}

console.log("\n— sortBoutsForRunning: never drops a bout, the final included —");
{
  // The exact shape of a real report: "the final bout isn't showing up."
  // sortBoutsForRunning itself was never the culprit (this suite already
  // pins the final's *position*), but this asserts the stronger, more
  // direct guarantee the report actually needs: nothing that goes in ever
  // fails to come back out, named explicitly for the final since that's
  // the bout in question.
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
  const bouts = [bout("final", "MAIN", 2, 0), bout("semi", "MAIN", 1, 0)];
  const original = bouts.map((b) => b.id).join(",");
  sortBoutsForRunning(bouts, 4);
  check("the caller's array is untouched", bouts.map((b) => b.id).join(",") === original, bouts);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
