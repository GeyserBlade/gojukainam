// Call-up sheet: turns one draw's bracket into "who to seat where, in what
// order" for the tatami coordinator gathering athletes ahead of a division —
// pure logic, no network, so it's unit testable directly
// (scripts/test-callup.ts), same convention as lib/schedule.ts.
//
// Reuses lib/draws.ts's roundLabel (the same "Final"/"Semi-finals"/"Round of
// N" naming already shown on the bracket view) rather than inventing a
// second round-naming convention that could drift from what's on screen.

import { roundLabel, type DrawBout, type DrawEntrySummary } from "./draws"

/** The subset of DrawDetail this module actually needs, kept narrow so a
 * test fixture doesn't have to fake slots/sync/placements it never reads. */
export interface CallupDraw {
  division: { category: "KATA" | "KUMITE" };
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
   * pending" (a repechage predecessor — see kumiteBronzeRows for why that
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
}

export interface CallupPerformanceRow {
  label: string;
  /** Which bout this performance belongs to, for context — not an AKA/AO
   * side, kata drops that distinction entirely per the brief. */
  boutLabel: string;
  section: "MAIN" | "BRONZE";
  boutId: string | null;
  performer: CallupSlot;
}

export type CallupSheet =
  | { isKata: false; mainRows: CallupBoutRow[]; bronzeRows: CallupBoutRow[] }
  | { isKata: true; mainRows: CallupPerformanceRow[]; bronzeRows: CallupPerformanceRow[] };

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

/**
 * The main bracket, round 1 first, in fight order. Byes and other rows with
 * nothing to call up are omitted — see hasSomethingToCallUp.
 */
export function kumiteMainRows(draw: CallupDraw): CallupBoutRow[] {
  const totalRounds = Math.log2(draw.size);
  const mainBouts = draw.bouts
    .filter((b) => b.phase === "MAIN")
    .sort((a, b) => a.round - b.round || a.position - b.position);

  const rows: CallupBoutRow[] = [];
  for (const bout of mainBouts) {
    if (!hasSomethingToCallUp(bout)) continue;
    const roundBouts = boutsInRound(draw.size, bout.round);
    const base = roundLabel(bout.round, totalRounds, draw.size);
    const label = roundBouts === 1 ? base : `${base} — Bout ${bout.position + 1}`;
    // Round 1 has no predecessor bout — an empty round-1 slot with no
    // winner yet is not a shape this draw engine produces (a real bye
    // auto-resolves immediately), but the fallback keeps this honest
    // rather than mislabeling an edge case it can't actually explain.
    const feederLabel = (side: 0 | 1) =>
      bout.round === 1 ? "an earlier stage" : mainPredecessorLabel(draw.size, totalRounds, bout.round, bout.position, side);
    rows.push({
      label,
      section: "MAIN",
      boutId: bout.id,
      aka: bout.aka ? knownSlot(bout.aka) : tbdSlot(feederLabel(0)),
      ao: bout.ao ? knownSlot(bout.ao) : tbdSlot(feederLabel(1)),
    });
  }
  return rows;
}

/**
 * The repechage/bronze bracket, one labeled sub-bracket per side ("Bronze
 * 1", "Bronze 2"). A side can be a single bout or a whole chain of stages
 * (WKF double repechage) — a chain gets "Bronze 1.1", "Bronze 1.2", ... so
 * every stage is still individually identifiable.
 *
 * Unlike the main bracket, an empty repechage slot is *not* traced to an
 * exact predecessor bout: stage 1's `aka` in particular is sourced from
 * "whichever main-bracket round the eventual finalist happened to beat
 * someone in", a trace that only exists in DrawService's backend-only
 * finalist-path walk. Reproducing that here would mean duplicating real
 * backend logic for a print-only label, so a pending repechage slot reads
 * "TBD (result pending)" instead of a precise bout reference.
 */
export function kumiteBronzeRows(draw: CallupDraw): CallupBoutRow[] {
  const rows: CallupBoutRow[] = [];
  for (const side of [0, 1] as const) {
    const sideBouts = draw.bouts
      .filter((b) => b.phase === "REPECHAGE" && b.position === side)
      .sort((a, b) => a.round - b.round);
    const multiStage = sideBouts.length > 1;
    for (const bout of sideBouts) {
      if (!hasSomethingToCallUp(bout)) continue;
      const label = multiStage ? `Bronze ${side + 1}.${bout.round}` : `Bronze ${side + 1}`;
      rows.push({
        label,
        section: "BRONZE",
        boutId: bout.id,
        aka: bout.aka ? knownSlot(bout.aka) : tbdSlot("result pending"),
        ao: bout.ao ? knownSlot(bout.ao) : tbdSlot("result pending"),
      });
    }
  }
  return rows;
}

/** Every bout row's two sides, flattened into individual performances in
 * bout order — AKA's slot performs before AO's, matching WKF's standard
 * sequential kata order. No side identity carries through: kata's call-up
 * need is "who's next", not "which side of the floor". */
function flattenToPerformances(rows: CallupBoutRow[]): CallupPerformanceRow[] {
  const out: CallupPerformanceRow[] = [];
  let n = 0;
  for (const row of rows) {
    for (const slot of [row.aka, row.ao]) {
      n += 1;
      out.push({ label: `Performance ${n}`, boutLabel: row.label, section: row.section, boutId: row.boutId, performer: slot });
    }
  }
  return out;
}

export function kataMainPerformances(draw: CallupDraw): CallupPerformanceRow[] {
  return flattenToPerformances(kumiteMainRows(draw));
}

export function kataBronzePerformances(draw: CallupDraw): CallupPerformanceRow[] {
  return flattenToPerformances(kumiteBronzeRows(draw));
}

/** The one entry point pages/CallupPrint.tsx actually needs — picks kata's
 * flattened single-column form or kumite's two-sided bout rows based on the
 * draw's own division category. */
export function buildCallupSheet(draw: CallupDraw): CallupSheet {
  if (draw.division.category === "KATA") {
    return { isKata: true, mainRows: kataMainPerformances(draw), bronzeRows: kataBronzePerformances(draw) };
  }
  return { isKata: false, mainRows: kumiteMainRows(draw), bronzeRows: kumiteBronzeRows(draw) };
}
