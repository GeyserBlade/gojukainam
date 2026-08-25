/**
 * Unit tests for run.service.ts's pure ordering rules:
 *  - sortBoutsForRunning — WKF running order *within one division* (main
 *    bracket through semis, then bronze/repechage, then the final last).
 *  - sortRunQueue — the mat-wide, *multi-division* queue that wraps it:
 *    what is live first, then what is mid-category, then the coordinator's
 *    manual order, then each division's own place on the mat — with
 *    divisions always kept together.
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
  // Distinct by default: most cases are about ordering, not about who is
  // fighting, and two bouts sharing nobody is the ordinary situation.
  akaEntryId: string | null = `${id}-aka`,
  aoEntryId: string | null = `${id}-ao`,
): QItem => ({
  id, drawId, phase, round, position, size, drawMatOrder, queueOrder, startedAt,
  divisionStarted, akaEntryId, aoEntryId,
});

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

console.log("\n— sortRunQueue: one mat, three divisions (complete / mid-category / untouched) — the pattern from a real 3rd report —");
{
  // A user reported PR #34 "still didn't work" and, on further digging,
  // that it only seemed to happen on one specific tatami. Live
  // reproduction against the real seeded event (not just this fixture)
  // found no mat-position-specific behavior at all — this locks in the
  // exact pattern investigated: a mat carrying one division that's fully
  // decided (getBoard already excludes a completed division's bouts
  // entirely, so it contributes nothing here — not modeled as an input
  // row at all, exactly like the real board never gives sortRunQueue one),
  // one genuinely mid-category division scheduled *behind* it on paper,
  // and one untouched division scheduled *ahead* of it on paper. The
  // mid-category division must still float to the very top regardless of
  // where matOrder would otherwise place it, on any mat.
  //
  // MIDCAT's round-2 bout is only "ready" because its own round-1 feeders
  // (positions 0 and 1) are already decided and excluded — this fixture
  // sticks to a bracket-realistic shape: round-1 position 2 is a separate,
  // still-pending bout unrelated to that round-2 bout's feeders.
  const items = [
    qitem("untouched-r1", "UNTOUCHED", "MAIN", 1, 0, 8, 0), // matOrder 0 — earliest on paper, never started
    qitem("midcat-r1-pos2", "MIDCAT", "MAIN", 1, 2, 8, 2, null, null, true), // matOrder 2 — a real result recorded elsewhere in this division, this bout's still to come
    qitem("midcat-r2-live", "MIDCAT", "MAIN", 2, 0, 8, 2, null, "2026-08-22T10:00:00Z", true), // same division, live right now
    // COMPLETE's own bouts are deliberately absent — a fully decided
    // division is invisible to sortRunQueue in practice, never an input.
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "the mid-category division's bouts float entirely ahead of the untouched division, in bracket order",
    order.join(",") === "midcat-r1-pos2,midcat-r2-live,untouched-r1",
    order,
  );
}

console.log("\n— sortRunQueue: a live bout outranks a manual queueOrder —");
{
  // Reversed deliberately in 2026-08: a pin is a plan made earlier, a
  // running clock is what is happening on the floor now, and the
  // coordinator's screen should agree with the floor. Set up so the two
  // signals disagree: B is the live division, A holds the lower queueOrder.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, 0), // queueOrder 0, not live
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, 1, "2026-08-22T10:00:00Z"), // queueOrder 1, but live
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("the live division sorts first despite the other item's lower queueOrder", order.join(",") === "b-r1,a-r1", order);
}

console.log("\n— sortRunQueue: a mid-category division outranks a manual queueOrder —");
{
  // Same principle one tier down: A was pinned this morning and has not
  // been touched; B is halfway through its category with nothing on the
  // clock this instant. B is the mat's real current business.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, 0), // pinned first, untouched
    qitem("b-r2", "B", "MAIN", 2, 0, 4, 1, null, null, true), // mid-category
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("the mid-category division sorts first despite the other item's queueOrder", order.join(",") === "b-r2,a-r1", order);
}

console.log("\n— sortRunQueue: regression — a pinned division's later bouts travel with it —");
{
  // The production bug, from the 2026-08-22 tournament. A drag can only
  // ever stamp the bouts that are *ready at that moment*: a round-2 bout
  // does not exist in the queue until its round-1 feeders are decided, so
  // it can never carry a queueOrder. When queueOrder was the outright
  // first key, per bout, that unpinned round-2 bout sorted as
  // MAX_SAFE_INTEGER — behind every pinned bout of every other division on
  // the mat, splitting its own category in half for the rest of the day.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, 0),
    qitem("a-r2", "A", "MAIN", 2, 0, 4, 0, null), // became ready after the drag
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, 1),
    qitem("b-r1b", "B", "MAIN", 1, 1, 4, 1, 2),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "A's unpinned round-2 bout stays with A instead of sinking below B",
    order.join(",") === "a-r1,a-r2,b-r1,b-r1b",
    order,
  );
}

console.log("\n— sortRunQueue: a manual pin still orders divisions nobody has started —");
{
  // The pin has not been demoted to decoration: among divisions that are
  // neither live nor mid-category it is still what decides, over matOrder.
  const items = [
    qitem("a-r1", "A", "MAIN", 1, 0, 4, 0, 3),
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, 1),
    qitem("c-r1", "C", "MAIN", 1, 0, 4, 2, null), // never pinned at all
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("pinned divisions lead, in pin order, and the unpinned one follows", order.join(",") === "b-r1,a-r1,c-r1", order);
}

console.log("\n— sortRunQueue: property — a mat's queue is always division-contiguous —");
{
  // The guarantee the coordinator actually cares about: one category runs
  // to completion before the next begins, so a bout of a different category
  // can never be called while the current one still has bouts to run.
  //
  // It holds structurally rather than by luck. Every sort key ahead of
  // `drawId` — live, activeSince, divisionStarted, manualRank, drawMatOrder
  // — is a property of the *division*, identical for all of its bouts. So
  // for any two divisions X and Y, either X's whole key prefix sorts before
  // Y's, or they tie and `drawId.localeCompare` breaks it one way for every
  // pairing. Neither outcome can put an X bout between two Y bouts.
  //
  // Rather than trust that argument, this brute-forces it over randomised
  // fixtures that mix every signal at once.
  const rand = (n: number) => Math.floor(Math.random() * n);
  let worstOffender = "";
  let contiguous = true;
  for (let trial = 0; trial < 500; trial++) {
    const items: QItem[] = [];
    const divisions = 2 + rand(5);
    for (let d = 0; d < divisions; d++) {
      const drawId = `d${rand(1000)}-${d}`; // deliberately unsorted ids
      const size = [2, 4, 8][rand(3)]!;
      const matOrder = rand(4) === 0 ? null : rand(6); // ties and nulls
      const started = rand(3) === 0;
      const liveAt = rand(4) === 0 ? `2026-08-22T10:0${rand(9)}:00Z` : null;
      const bouts = 1 + rand(4);
      for (let b = 0; b < bouts; b++) {
        items.push(
          qitem(
            `${drawId}#${b}`,
            drawId,
            rand(5) === 0 ? "REPECHAGE" : "MAIN",
            1 + rand(Math.log2(size)),
            rand(4),
            size,
            matOrder,
            rand(2) === 0 ? rand(20) : null, // partial pins, the real-world case
            b === 0 ? liveAt : null,
            started,
          ),
        );
      }
    }
    const order = sortRunQueue(items).map((i) => i.drawId);
    const seen = new Set<string>();
    let previous = "";
    for (const drawId of order) {
      if (drawId !== previous) {
        if (seen.has(drawId)) {
          contiguous = false;
          worstOffender = `${drawId} resumes after ${previous} — ${order.join(",")}`;
          break;
        }
        seen.add(drawId);
        previous = drawId;
      }
    }
    if (!contiguous) break;
  }
  check("500 randomised mats, mixing live/started/pinned/tied-matOrder: no division is ever split", contiguous, worstOffender);
}

console.log("\n— sortRunQueue: a live division's bouts stay together ahead of everything else —");
{
  // The specific promise: while a category is being fought, nothing from
  // another category can be called before its remaining bouts.
  const items = [
    qitem("other-1", "OTHER", "MAIN", 1, 0, 4, 0, 0), // pinned first, scheduled first
    qitem("live-semi", "LIVE", "MAIN", 1, 0, 4, 9, null, "2026-08-22T10:00:00Z"),
    qitem("live-other-semi", "LIVE", "MAIN", 1, 1, 4, 9), // not started itself
    qitem("live-final", "LIVE", "MAIN", 2, 0, 4, 9), // not even ready in practice
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "every remaining bout of the live division precedes the other category",
    order.join(",") === "live-semi,live-other-semi,live-final,other-1",
    order,
  );
}

console.log("\n— sortRunQueue: the repechage runs before the final, inside the mat queue too —");
{
  // The rule sortBoutsForRunning enforces per division has to survive the
  // merged, multi-division queue as well: bronze before the final, always.
  const items = [
    qitem("final", "A", "MAIN", 2, 0, 4, 0),
    qitem("bronze", "A", "REPECHAGE", 1, 0, 4, 0),
    qitem("semi", "A", "MAIN", 1, 0, 4, 0),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("semi, then bronze, then the final last", order.join(",") === "semi,bronze,final", order);
}

console.log("\n— sortRunQueue: guard — two queued bouts never share a competitor —");
{
  // Defensive only: real getBoard input cannot produce this, since a bout
  // is queued only while undecided and an athlete reaches their next bout
  // only by winning the previous one (which decides it, dropping it out of
  // the queue). Covered so the guard cannot rot if that ever changes.
  const items = [
    qitem("r1", "A", "MAIN", 1, 0, 8, 0, null, null, false, "vera", "ana"),
    qitem("r2-vera", "A", "MAIN", 2, 0, 8, 0, null, null, false, "vera", "bo"),
    qitem("r2-others", "A", "MAIN", 2, 1, 8, 0, null, null, false, "cass", "dee"),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "the bout without the just-finished athlete is pulled in between",
    order.join(",") === "r1,r2-others,r2-vera",
    order,
  );
}

console.log("\n— sortRunQueue: the athlete who has just come off the mat is not called straight back on —");
{
  // The live case, and the whole reason justFought exists: the bout they
  // just won is already gone from the queue, so the queue alone cannot see
  // the clash. Happened 27 times in one real tournament day.
  const items = [
    qitem("next-vera", "A", "MAIN", 2, 0, 8, 0, null, null, true, "vera", "bo"),
    qitem("next-others", "A", "MAIN", 2, 1, 8, 0, null, null, true, "cass", "dee"),
  ];
  const order = sortRunQueue(items, ["vera", "ana"]).map((i) => i.id);
  check("the queue leads with the bout the just-finished athlete is not in", order.join(",") === "next-others,next-vera", order);
}

console.log("\n— sortRunQueue: spacing never reorders a bout that is on the clock —");
{
  // The mat has already started it. Whatever the rest rule would prefer,
  // a bout being fought stays where it is.
  const items = [
    qitem("live", "A", "MAIN", 2, 0, 8, 0, null, "2026-08-22T10:00:00Z", true, "vera", "bo"),
    qitem("other", "A", "MAIN", 2, 1, 8, 0, null, null, true, "cass", "dee"),
  ];
  const order = sortRunQueue(items, ["vera", "ana"]).map((i) => i.id);
  check("the live bout stays first even though its competitor just fought", order.join(",") === "live,other", order);
}

console.log("\n— sortRunQueue: spacing never pulls a final ahead of a bronze bout —");
{
  // "vera" is in both the bronze bout and the final, back to back. The
  // final is the only candidate to swap in, and it is in a later run group,
  // so the clash is left standing rather than breaking WKF order.
  const items = [
    qitem("semi", "A", "MAIN", 1, 0, 4, 0, null, null, false, "vera", "ana"),
    qitem("bronze", "A", "REPECHAGE", 1, 0, 4, 0, null, null, false, "vera", "bo"),
    qitem("final", "A", "MAIN", 2, 0, 4, 0, null, null, false, "cass", "dee"),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check("the final stays last even though swapping it forward would give a rest", order.join(",") === "semi,bronze,final", order);
}

console.log("\n— sortRunQueue: spacing never borrows a bout from another category —");
{
  // Division A has the clash and nothing of its own to fix it with.
  // Division B's bout would do the job and must not be used: categories run
  // to completion.
  const items = [
    qitem("a-semi", "A", "MAIN", 1, 0, 4, 0, null, null, false, "vera", "ana"),
    qitem("a-final", "A", "MAIN", 2, 0, 4, 0, null, null, false, "vera", "bo"),
    qitem("b-r1", "B", "MAIN", 1, 0, 4, 1, null, null, false, "cass", "dee"),
  ];
  const order = sortRunQueue(items).map((i) => i.id);
  check(
    "division A keeps its unavoidable back-to-back rather than splitting the category",
    order.join(",") === "a-semi,a-final,b-r1",
    order,
  );
}

console.log("\n— sortRunQueue: property — spacing preserves contiguity and the bronze/final order —");
{
  // The spacing pass reorders the queue after the comparator has run, so
  // the two invariants it must not break are re-checked here against
  // randomised brackets whose bouts deliberately share fighters.
  let ok = true;
  let detail = "";
  for (let trial = 0; trial < 300 && ok; trial++) {
    const items: QItem[] = [];
    const divisions = 2 + Math.floor(Math.random() * 3);
    for (let d = 0; d < divisions; d++) {
      const drawId = `d${Math.floor(Math.random() * 1000)}-${d}`;
      const size = 8;
      const matOrder = Math.random() < 0.25 ? null : Math.floor(Math.random() * 4);
      // A small pool per division, so bouts collide the way a real bracket does.
      const pool = ["p", "q", "r", "s"].map((n) => `${drawId}-${n}`);
      const pick = () => pool[Math.floor(Math.random() * pool.length)]!;
      for (let b = 0; b < 2 + Math.floor(Math.random() * 4); b++) {
        const repechage = Math.random() < 0.3;
        items.push(
          qitem(
            `${drawId}#${b}`, drawId,
            repechage ? "REPECHAGE" : "MAIN",
            repechage ? 1 : 1 + Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 4), size, matOrder,
            null, null, Math.random() < 0.3, pick(), pick(),
          ),
        );
      }
    }
    const sorted = sortRunQueue(items, [items[0]!.akaEntryId!]);

    const seen = new Set<string>();
    let previous = "";
    for (const item of sorted) {
      if (item.drawId !== previous) {
        if (seen.has(item.drawId)) {
          ok = false;
          detail = `division ${item.drawId} resumes after ${previous}`;
          break;
        }
        seen.add(item.drawId);
        previous = item.drawId;
      }
    }
    if (!ok) break;

    // Within each division: no final before a repechage bout.
    const byDraw = new Map<string, QItem[]>();
    for (const item of sorted) byDraw.set(item.drawId, [...(byDraw.get(item.drawId) ?? []), item]);
    for (const [drawId, bouts] of byDraw) {
      const lastRepechage = bouts.map((b) => b.phase === "REPECHAGE").lastIndexOf(true);
      const firstFinal = bouts.findIndex((b) => b.phase === "MAIN" && b.round === Math.log2(b.size));
      if (firstFinal !== -1 && lastRepechage !== -1 && firstFinal < lastRepechage) {
        ok = false;
        detail = `${drawId}: a final at ${firstFinal} precedes a bronze bout at ${lastRepechage}`;
        break;
      }
    }
  }
  check("300 randomised mats with colliding fighters: categories stay whole, bronze stays before the final", ok, detail);
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
