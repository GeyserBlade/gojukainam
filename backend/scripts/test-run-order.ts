/**
 * Unit tests for run.service.ts's pure ordering rules:
 *  - sortBoutsForRunning — WKF running order *within one division* (main
 *    bracket through semis, then bronze/repechage, then the final last).
 *  - sortRunQueue — the mat-wide, *multi-division* queue that wraps it:
 *    manual queueOrder first, then divisions kept together and ordered by
 *    their own place on the mat.
 * No DB: importing run.service.ts pulls in ../lib/prisma.js, but
 * PrismaClient only connects on first query, and this script never issues
 * one — mirrors the frontend's pure-script convention
 * (frontend/scripts/test-callup.ts) since neither helper has a DB
 * dependency.
 *
 * Run: npx tsx scripts/test-run-order.ts
 */
import { sortBoutsForRunning, sortRunQueue, type RunOrderableBout, type QueueSortableBout } from "../src/services/run.service.js";

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

interface QItem extends QueueSortableBout {
  id: string;
}
const qitem = (
  id: string,
  drawId: string,
  phase: "MAIN" | "REPECHAGE",
  round: number,
  position: number,
  size: number,
  drawMatOrder: number | null,
  queueOrder: number | null = null,
  startedAt: string | null = null,
  divisionStarted = false,
): QItem => ({ id, drawId, phase, round, position, size, drawMatOrder, queueOrder, startedAt, divisionStarted });

console.log("\n— sortRunQueue: regression — divisions must run to completion, not phase-by-phase across the mat —");
{
  // The exact bug report: with drawMatOrder distinct per division, a mat
  // with two size-4 divisions (round 1 = semis, round 2 = final) must
  // finish division A entirely (semis, then final) before division B's
  // semis even though A's final and B's semis are both "round 2" — a
  // naive round-number comparison would put them in the same bucket.
  const items = [
    qitem("b-semi1", "B", "MAIN", 1, 0, 4, 1),
    qitem("b-semi2", "B", "MAIN", 1, 1, 4, 1),
    qitem("a-final", "A", "MAIN", 2, 0, 4, 0),
    qitem("a-semi1", "A", "MAIN", 1, 0, 4, 0),
    qitem("a-semi2", "A", "MAIN", 1, 1, 4, 0),
    qitem("b-final", "B", "MAIN", 2, 0, 4, 1),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "division A runs to completion (semis, then final) before division B starts",
    order.join(",") === "a-semi1,a-semi2,a-final,b-semi1,b-semi2,b-final",
    order,
  );
}

console.log("\n— sortRunQueue: regression — tied/missing drawMatOrder must not merge two divisions' phases —");
{
  // This is the actual failure mode: two divisions that both lack a
  // drawMatOrder (or happen to share one) used to fall straight through to
  // boutRunGroup with no notion of which division a bout belongs to,
  // producing "every division's non-final bouts, then every division's
  // bronze bouts, then every division's finals" instead of one division at
  // a time. drawId as the next key is what has to prevent this.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 8, null),
    qitem("a-semi", "A", "MAIN", 2, 0, 8, null),
    qitem("a-bronze", "A", "REPECHAGE", 1, 0, 8, null),
    qitem("a-final", "A", "MAIN", 3, 0, 8, null),
    qitem("b-r1", "B", "MAIN", 1, 0, 8, null),
    qitem("b-semi", "B", "MAIN", 2, 0, 8, null),
    qitem("b-bronze", "B", "REPECHAGE", 1, 0, 8, null),
    qitem("b-final", "B", "MAIN", 3, 0, 8, null),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  const buggyOrder = [
    "a-r1,b-r1,a-semi,b-semi,a-bronze,b-bronze,a-final,b-final", // interleaved by phase (the bug)
  ];
  check(
    "each division's own 4 bouts stay contiguous (grouped by drawId), not interleaved by phase",
    order.join(",") === "a-r1,a-semi,a-bronze,a-final,b-r1,b-semi,b-bronze,b-final" ||
      order.join(",") === "b-r1,b-semi,b-bronze,b-final,a-r1,a-semi,a-bronze,a-final",
    order,
  );
  check("the buggy phase-interleaved order does not occur", !buggyOrder.includes(order.join(",")), order);
}

console.log("\n— sortRunQueue: a manual queueOrder overrides division grouping entirely —");
{
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, 1),
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, 0),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("the coordinator's manual order (b before a) wins over drawMatOrder", order.join(",") === "b-r1,a-r1", order);
}

console.log("\n— sortRunQueue: regression — a currently-active division floats to the top, out of matOrder —");
{
  // The exact reported bug: an operator started a bout in the division
  // scheduled LAST on this mat (drawMatOrder 2, behind two others). Its
  // whole division — including bouts that haven't started yet — must float
  // ahead of both earlier-scheduled divisions, not sit wherever matOrder
  // would otherwise place it.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0),
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1),
    qitem("c-semi1", "C", "MAIN", 1, 0, 4, 2, null, "2026-08-22T10:00:00Z"), // live now
    qitem("c-semi2", "C", "MAIN", 1, 1, 4, 2), // same division, not yet started itself
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "division C (currently live, matOrder 2) floats entirely ahead of A and B",
    order.join(",") === "c-semi1,c-semi2,a-r1,b-r1",
    order,
  );
}

console.log("\n— sortRunQueue: among two active divisions, the one that started earliest goes first —");
{
  // Isolates the rule from plain matOrder by disagreeing with it: B has
  // the *later* matOrder but the *earlier* start time, and must still win.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, null, "2026-08-22T10:05:00Z"), // earlier matOrder, started later
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, null, "2026-08-22T10:00:00Z"), // later matOrder, started first — furthest along
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("B (started 10:00, furthest along) outranks A (started 10:05) despite A's earlier matOrder", order.join(",") === "b-r1,a-r1", order);
}

console.log("\n— sortRunQueue: regression — a division stays on top mid-category, after its live bout is decided —");
{
  // The exact reported follow-up: a division's currently-airing bout gets
  // scored and drops out of the ready queue entirely (a decided bout is
  // never "ready", so it never even reaches this function again), and its
  // next bout — ready now, but not itself started yet — carries no
  // startedAt of its own. The old logic had nothing left to key on and
  // fell straight back to matOrder, visibly "finishing" a division that is
  // still mid-category. Division B (matOrder 1, scheduled *behind* A) has
  // recorded a real result (divisionStarted) and this is its only
  // currently-ready bout, with nothing on the clock right now — it must
  // still float entirely ahead of A, which hasn't started at all.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, null, null, false),
    qitem("b-final", "B", "MAIN", 2, 0, 4, 1, null, null, true),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "division B (mid-category, nothing currently live) still floats ahead of untouched division A",
    order.join(",") === "b-final,a-r1",
    order,
  );
}

console.log("\n— sortRunQueue: a live bout still outranks a merely-started division —");
{
  // Division B has a real result recorded (divisionStarted) but nothing on
  // the clock right now; division C has an actual bout currently live.
  // C's bout being fought *right now* is a stronger signal than B's "has
  // started at some point" — C goes first.
  const items = [
    qitem("b-r2", "B", "MAIN", 2, 0, 4, 0, null, null, true),
    qitem("c-r1", "C", "MAIN", 1, 0, 4, 1, null, "2026-08-22T10:00:00Z", false),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("the currently-live division (C) outranks the merely-started one (B)", order.join(",") === "c-r1,b-r2", order);
}

console.log("\n— sortRunQueue: two merely-started divisions (neither currently live) fall back to matOrder —");
{
  const items = [
    qitem("b-r2", "B", "MAIN", 2, 0, 4, 1, null, null, true),
    qitem("a-r2", "A", "MAIN", 2, 0, 4, 0, null, null, true),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("both mid-category, ordered by their own matOrder same as usual", order.join(",") === "a-r2,b-r2", order);
}

console.log("\n— sortRunQueue: a manual queueOrder still beats an active division —");
{
  // The drag-to-reorder override is an explicit human decision and stays
  // the single highest-priority key, even over "this division is live" —
  // deliberately set up so the two signals disagree: B is the live
  // division, but A has the lower (winning) queueOrder.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, 0), // queueOrder 0, not live
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, 1, "2026-08-22T10:00:00Z"), // queueOrder 1, but live
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("queueOrder 0 sorts first even though the other item is the live division", order.join(",") === "a-r1,b-r1", order);
}

console.log("\n— sortRunQueue: does not mutate the input array —");
{
  const items = [qitem("b", "B", "MAIN", 1, 0, 4, 1), qitem("a", "A", "MAIN", 1, 0, 4, 0)];
  const original = items.map((i) => i.id).join(",");
  sortRunQueue(items);
  check("the caller's array is untouched", items.map((i) => i.id).join(",") === original, items);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
