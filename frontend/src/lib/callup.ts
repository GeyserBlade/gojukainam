// Call-up sheet: turns one draw's bracket into "who to seat where, in what
// order" for the tatami coordinator gathering athletes ahead of a division —
// pure logic, no network, so it's unit testable directly
// (scripts/test-callup.ts), same convention as lib/schedule.ts.
//
// Reuses lib/draws.ts's roundLabel (the same "Final"/"Semi-finals"/"Round of
// N" naming already shown on the bracket view) and sortBoutsForRunning (the
// same WKF running-order rule the tatami operator's queue uses) rather than
// inventing a second version of either that could drift from what's shown
// elsewhere.

import { roundLabel, sortBoutsForRunning, boutMedalType, type BoutMedalType, type DrawBout, type DrawEntrySummary } from "./draws"

/** The subset of DrawDetail this module actually needs, kept narrow so a
 * test fixture doesn't have to fake slots/sync/placements it never reads.
 *
 * No `division.category` field: kata bouts are just as much a real aka/ao
 * head-to-head pairing as kumite bouts (decided by flag majority instead of
 * points, but the bracket shape — and this sheet's layout — is identical),
 * so this module doesn't need to know which discipline it's building for. */
export interface CallupDraw {
  size: number;
  bouts: DrawBout[];
}

export interface CallupSlot {
  name: string;
  clubName: string;
  /**
   * null once the athlete is known. Otherwise a short reason a coordinator
   * can read at a glance — "Round of 8 — Bout 1" (main-bracket predecessor,
   * traceable exactly from the bracket's own 2i/2i+1 indexing) or "result
   * pending" (a repechage predecessor — see bronzeBoutRows for why that
   * one isn't traced to an exact bout).
   */
  tbdFrom: string | null;
}

export interface CallupBoutRow {
  label: string;
  section: "MAIN" | "BRONZE";
  boutId: string | null;
  aka: CallupSlot;
  ao: CallupSlot;
  /** "final" for every row in finalRows, "bronze" for every row in
   * bronzeRows, null for every row in mainRows — carried per-row (rather
   * than left for the page to infer from which array a row came from) so
   * pages/CallupPrint.tsx can badge a row directly off the row itself. */
  medalType: BoutMedalType;
}

/**
 * mainRows / bronzeRows / finalRows are three separate arrays (not one
 * flat, pre-sorted list) so the printed page can give the final its own
 * clearly separated section after the bronze bouts — the whole reason for
 * splitting it out is that WKF running order plays the final *after*
 * bronze, which a single "MAIN bracket, then bronze" layout would get
 * backwards. finalRows is usually 0 or 1 rows (a bracket has exactly one
 * final), kept as an array for symmetry with the other two rather than a
 * single nullable row.
 */
export interface CallupSheet {
  mainRows: CallupBoutRow[];
  bronzeRows: CallupBoutRow[];
  finalRows: CallupBoutRow[];
}

const knownSlot = (entry: DrawEntrySummary): CallupSlot => ({
  name: entry.name,
  clubName: entry.clubName,
  tbdFrom: null,
});

const tbdSlot = (from: string): CallupSlot => ({ name: "TBD", clubName: "", tbdFrom: from });

/**
 * A bout is worth listing unless it's *already decided* with a side
 * missing — a bye or a walkover that auto-advanced without a real
 * opponent, so nothing happens on the mat for it. `winnerEntryId === null`
 * means the bout hasn't been fought yet, and is listed regardless of how
 * many sides are still unknown: a later-round bout with *both* sides still
 * TBD (e.g. an undecided final waiting on both semis) is exactly as real a
 * thing for the coordinator to expect as one with only one side pending —
 * dropping it because neither name is known yet would silently lose a real
 * bout from the sheet, which is the one thing this function exists to
 * avoid.
 */
function hasSomethingToCallUp(bout: Pick<DrawBout, "aka" | "ao" | "winnerEntryId">): boolean {
  return !((!bout.aka || !bout.ao) && bout.winnerEntryId !== null);
}

const boutsInRound = (size: number, round: number) => size / 2 ** round;

/**
 * The label a main-bracket bout's own predecessor would carry — used only
 * to explain a still-empty slot ("TBD (from Round of 8 — Bout 1)"). Uses
 * the bracket's own 2i/2i+1 parent-child indexing (the same relationship
 * DrawService.computeDrawState builds the tree with on the backend), which
 * holds regardless of byes — byes only affect *whether* a slot resolves
 * early, never *which* bout feeds which.
 */
function mainPredecessorLabel(size: number, totalRounds: number, round: number, position: number, side: 0 | 1): string {
  const feederRound = round - 1;
  const feederPosition = position * 2 + side;
  const feederRoundBouts = boutsInRound(size, feederRound);
  const label = roundLabel(feederRound, totalRounds, size);
  return feederRoundBouts === 1 ? label : `${label} — Bout ${feederPosition + 1}`;
}

/** Builds one MAIN-bracket row (used for both the pre-final rounds and the
 * final itself — the two callers differ only in which round they filter
 * for, not in how a row is built). */
function buildMainRow(bout: DrawBout, size: number, totalRounds: number): CallupBoutRow {
  const roundBouts = boutsInRound(size, bout.round);
  const base = roundLabel(bout.round, totalRounds, size);
  const label = roundBouts === 1 ? base : `${base} — Bout ${bout.position + 1}`;
  // Round 1 has no predecessor bout — an empty round-1 slot with no winner
  // yet is not a shape this draw engine produces (a real bye auto-resolves
  // immediately), but the fallback keeps this honest rather than
  // mislabeling an edge case it can't actually explain.
  const feederLabel = (side: 0 | 1) =>
    bout.round === 1 ? "an earlier stage" : mainPredecessorLabel(size, totalRounds, bout.round, bout.position, side);
  return {
    label,
    section: "MAIN",
    boutId: bout.id,
    aka: bout.aka ? knownSlot(bout.aka) : tbdSlot(feederLabel(0)),
    ao: bout.ao ? knownSlot(bout.ao) : tbdSlot(feederLabel(1)),
    medalType: boutMedalType(bout, size),
  };
}

/**
 * The main bracket up through the semi-finals — round 1 first, in fight
 * order, one row per bout, aka and ao side by side. The final is
 * deliberately excluded here; see finalBoutRows. Applies identically to
 * kumite and kata: both run as a real head-to-head bracket (kata just
 * decides the winner by flags instead of points), so both are seated and
 * called up the same way. Byes and other rows with nothing to call up are
 * omitted — see hasSomethingToCallUp.
 */
export function mainBoutRows(draw: CallupDraw): CallupBoutRow[] {
  const totalRounds = Math.log2(draw.size);
  return sortBoutsForRunning(draw.bouts, draw.size)
    .filter((b) => boutMedalType(b, draw.size) === null)
    .filter(hasSomethingToCallUp)
    .map((bout) => buildMainRow(bout, draw.size, totalRounds));
}

/**
 * The final — WKF running order plays it last in the division, after the
 * bronze bouts, so the medal ceremony can follow immediately after. Kept
 * as its own array (rather than folded into mainBoutRows) precisely so the
 * page can print it as a clearly separate, final section.
 */
export function finalBoutRows(draw: CallupDraw): CallupBoutRow[] {
  const totalRounds = Math.log2(draw.size);
  return sortBoutsForRunning(draw.bouts, draw.size)
    .filter((b) => boutMedalType(b, draw.size) === "final")
    .filter(hasSomethingToCallUp)
    .map((bout) => buildMainRow(bout, draw.size, totalRounds));
}

/**
 * The repechage/bronze bouts, in WKF running order (every stage-1 bout
 * before any stage-2 bout, across both sides — see
 * lib/draws.ts's sortBoutsForRunning) but labeled per side: a side can be a
 * single bout ("Bronze 1", "Bronze 2") or a whole chain of stages (WKF
 * double repechage), which gets "Bronze 1.1", "Bronze 1.2", ... so every
 * stage is still individually identifiable even though the printed order
 * interleaves the two sides' stages rather than grouping a side's stages
 * together.
 *
 * An empty repechage slot is *not* traced to an exact predecessor bout:
 * stage 1's `aka` in particular is sourced from "whichever main-bracket
 * round the eventual finalist happened to beat someone in", a trace that
 * only exists in DrawService's backend-only finalist-path walk.
 * Reproducing that here would mean duplicating real backend logic for a
 * print-only label, so a pending repechage slot reads "TBD (result
 * pending)" instead of a precise bout reference.
 */
export function bronzeBoutRows(draw: CallupDraw): CallupBoutRow[] {
  const stageCountBySide = new Map<number, number>();
  for (const b of draw.bouts) {
    if (b.phase !== "REPECHAGE") continue;
    stageCountBySide.set(b.position, (stageCountBySide.get(b.position) ?? 0) + 1);
  }

  return sortBoutsForRunning(draw.bouts, draw.size)
    .filter((b) => boutMedalType(b, draw.size) === "bronze")
    .filter(hasSomethingToCallUp)
    .map((bout) => {
      const multiStage = (stageCountBySide.get(bout.position) ?? 0) > 1;
      const label = multiStage ? `Bronze ${bout.position + 1}.${bout.round}` : `Bronze ${bout.position + 1}`;
      return {
        label,
        section: "BRONZE" as const,
        boutId: bout.id,
        aka: bout.aka ? knownSlot(bout.aka) : tbdSlot("result pending"),
        ao: bout.ao ? knownSlot(bout.ao) : tbdSlot("result pending"),
        medalType: "bronze" as const,
      };
    });
}

/** The one entry point pages/CallupPrint.tsx actually needs. */
export function buildCallupSheet(draw: CallupDraw): CallupSheet {
  return { mainRows: mainBoutRows(draw), bronzeRows: bronzeBoutRows(draw), finalRows: finalBoutRows(draw) };
}
