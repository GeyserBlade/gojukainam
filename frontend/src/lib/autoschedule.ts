// Drafting a running order automatically — pure calculation, no network calls,
// so it can be unit tested directly (scripts/test-autoschedule.ts).
//
// The house rule this encodes: **youngest to oldest, and within an age group
// the kata before the kumite.** That is how a tournament is actually run — the
// small children compete and go home, and an athlete does their kata before
// they are tired from fighting.
//
// Everything here only *proposes*. Nothing is written until the planner looks
// at the summary and applies it, and every proposal can be re-drafted with
// different options or thrown away by dragging.

import {
  buildSchedule,
  categoryBouts,
  categoryMinutes,
  formatClock,
  type OrderedPlanItem,
  type ScheduleBlockInput,
  type ScheduleCategoryInput,
} from "./schedule";
import type { EventTiming } from "./timing";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** What the drafter needs to know about one category. */
export interface DraftCategory extends ScheduleCategoryInput {
  /** Age range of the category — the primary sort key. */
  minAge: number;
  maxAge: number;
  gender: "Male" | "Female";
  /**
   * Already fought, or being fought right now. These keep the floor and the
   * position they have; the draft schedules around them.
   */
  pinned: boolean;
  /** Floor it is already on, if any. Only meaningful when `pinned`. */
  matId: string | null;
}

export type DraftStrategy = "BALANCE_FLOORS" | "AGE_GROUP_PER_FLOOR";

export const STRATEGY_LABELS: Record<DraftStrategy, string> = {
  BALANCE_FLOORS: "Spread evenly across the floors",
  AGE_GROUP_PER_FLOOR: "Keep each age group on one floor",
};

export const STRATEGY_HINTS: Record<DraftStrategy, string> = {
  BALANCE_FLOORS:
    "Every category goes to whichever floor is free soonest. Finishes earliest, but an age group's kata and kumite can end up running at the same time on different floors.",
  AGE_GROUP_PER_FLOOR:
    "An age group's kata and kumite stay on one floor, joining any of its categories already fought there. Removes most of the clashes; the rest are listed below.",
};

export interface DraftOptions {
  strategy: DraftStrategy;
  /** Add the opening, lunch and closing from the event's timing settings. */
  includeBlocks: boolean;
}

export const DEFAULT_DRAFT_OPTIONS: DraftOptions = {
  strategy: "AGE_GROUP_PER_FLOOR",
  includeBlocks: true,
};

export interface DraftInput {
  timing: EventTiming;
  mats: { id: string; name: string }[];
  categories: DraftCategory[];
  /** Blocks already in the plan — the draft won't propose a duplicate. */
  existingBlocks: { kind: ScheduleBlockInput["kind"]; matId: string | null }[];
  options: DraftOptions;
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

/** A block the draft wants to create. Ids don't exist yet. */
export interface ProposedBlock {
  kind: ScheduleBlockInput["kind"];
  label: string;
  minutes: number;
  matId: string | null;
  startTime: string | null;
  /**
   * For a per-floor block: where it goes in that floor's order. The venue-wide
   * ones are placed by the clock instead, so they carry no index.
   */
  index?: number;
}

export interface DraftConflict {
  kataTitle: string;
  kumiteTitle: string;
  /** The two floors they would run on at the same time. */
  matNames: [string, string];
  fromMin: number;
  toMin: number;
}

export interface DraftFloorSummary {
  matId: string;
  name: string;
  categories: number;
  bouts: number;
  endMin: number;
}

export interface DraftPlan {
  /** Categories per floor, in running order. Pinned ones keep their place. */
  lanes: Map<string, OrderedPlanItem[]>;
  blocks: ProposedBlock[];
  floors: DraftFloorSummary[];
  /** Categories that could not be placed, with the reason. */
  skipped: { title: string; reason: string }[];
  conflicts: DraftConflict[];
  finishMin: number;
  competitionEndMin: number;
  placedCount: number;
  pinnedCount: number;
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

/**
 * Youngest first; within the same age range kata before kumite; then a stable
 * tail so two runs of the drafter never disagree.
 *
 * Sorting on `minAge` then `maxAge` keeps genuinely different bands apart
 * (Junior 16-17 sorts ahead of Senior 16-99) rather than lumping everything
 * that happens to start at the same age.
 */
export function compareCategories(a: DraftCategory, b: DraftCategory): number {
  return (
    a.minAge - b.minAge ||
    a.maxAge - b.maxAge ||
    Number(!a.isKata) - Number(!b.isKata) ||
    a.gender.localeCompare(b.gender) ||
    a.title.localeCompare(b.title)
  );
}

/**
 * The unit that must not be split across floors: one age range, one gender.
 *
 * Gender is in the key because a boys' and a girls' category never share an
 * athlete, so running them on different floors at the same time is free
 * parallelism. Age range is in it because that is what does share athletes —
 * the same child is in the U12 kata and the U12 kumite.
 */
export const ageGroupKey = (c: DraftCategory) => `${c.minAge}-${c.maxAge}:${c.gender}`;

/** Do these two categories plausibly draw on the same athletes? */
function sharesAthletes(a: DraftCategory, b: DraftCategory): boolean {
  // Within one discipline an athlete has exactly one category — one kata
  // division, one kumite weight class — so only kata-vs-kumite can clash.
  if (a.isKata === b.isKata) return false;
  if (a.gender !== b.gender) return false;
  return a.minAge <= b.maxAge && b.minAge <= a.maxAge;
}

// ---------------------------------------------------------------------------
// The drafter
// ---------------------------------------------------------------------------

/**
 * Propose a running order for every category that isn't already fought.
 *
 * Floors are filled greedily by projected finish time, so "the next category
 * goes wherever a mat frees up first" — which is what keeps the floors even
 * without needing to solve anything.
 */
export function draftPlan(input: DraftInput): DraftPlan {
  const { timing, mats, categories, options } = input;

  const lanes = new Map<string, OrderedPlanItem[]>();
  for (const mat of mats) lanes.set(mat.id, []);

  const skipped: { title: string; reason: string }[] = [];
  if (mats.length === 0) {
    return {
      lanes,
      blocks: [],
      floors: [],
      skipped: categories.map((c) => ({ title: c.title, reason: "there are no floors yet" })),
      conflicts: [],
      finishMin: 0,
      competitionEndMin: 0,
      placedCount: 0,
      pinnedCount: 0,
    };
  }

  // Running load per floor, in minutes of mat time. Pinned categories are laid
  // down first so the draft schedules around what has already happened rather
  // than pretending the day starts empty.
  const load = new Map<string, number>(mats.map((m) => [m.id, 0]));
  const matIds = new Set(mats.map((m) => m.id));

  const pinned = categories
    .filter((c) => c.pinned && c.matId && matIds.has(c.matId))
    .sort(compareCategories);
  for (const c of pinned) {
    lanes.get(c.matId!)!.push({ kind: "CATEGORY", id: c.drawId });
    load.set(c.matId!, (load.get(c.matId!) ?? 0) + categoryMinutes(c, timing));
  }

  // A pinned category with no floor can't be honoured as pinned — it has
  // nothing to be pinned to — so it joins the queue like anything else.
  const pinnedIds = new Set(pinned.map((c) => c.drawId));
  const queue = categories
    .filter((c) => !pinnedIds.has(c.drawId))
    .filter((c) => {
      if (categoryBouts(c) <= 0) {
        skipped.push({
          title: c.title,
          reason: c.entryCount < 2 ? "fewer than two entries" : "no bouts to run",
        });
        return false;
      }
      return true;
    })
    .sort(compareCategories);

  const leastLoaded = () => {
    let best = mats[0].id;
    for (const mat of mats) if ((load.get(mat.id) ?? 0) < (load.get(best) ?? 0)) best = mat.id;
    return best;
  };

  const place = (c: DraftCategory, matId: string) => {
    lanes.get(matId)!.push({ kind: "CATEGORY", id: c.drawId });
    load.set(matId, (load.get(matId) ?? 0) + categoryMinutes(c, timing));
  };

  if (options.strategy === "AGE_GROUP_PER_FLOOR") {
    const groups = new Map<string, DraftCategory[]>();
    for (const c of queue) {
      const key = ageGroupKey(c);
      const list = groups.get(key);
      if (list) list.push(c);
      else groups.set(key, [c]);
    }

    // Where an age group already has a foothold: a category of this group that
    // has been fought, or is being fought, sits on a floor and cannot move. The
    // rest of the group belongs with it — otherwise the one thing this strategy
    // promises, that nobody is called to two floors at once, is broken by
    // exactly the category that is hardest to fix by hand.
    const pinnedFloorOfGroup = new Map<string, string>();
    for (const c of pinned) pinnedFloorOfGroup.set(ageGroupKey(c), c.matId!);

    const cost = (group: DraftCategory[]) =>
      group.reduce((sum, c) => sum + categoryMinutes(c, timing), 0);

    // Only bind together what actually clashes. Two weight classes of one
    // division never share an athlete, so a group that is all kumite (or all
    // kata) can be spread freely — and must be, or six senior weight classes
    // pile onto one floor and the day is hours longer than it needs to be.
    // What has to stay together is a group holding *both* disciplines: the
    // same child is in the U12 kata and the U12 kumite.
    const entries = [...groups.entries()];
    const bound = entries.filter(
      ([key, g]) => pinnedFloorOfGroup.has(key) || (g.some((c) => c.isKata) && g.some((c) => !c.isKata)),
    );
    const free = entries.filter(([key, g]) => !bound.some(([k]) => k === key)).flatMap(([, g]) => g);

    // Biggest first. Assigning in age order instead reads nicely but balances
    // badly: the largest groups land last, when there is no room left to even
    // them out. Each floor is sorted back into age order below, so the running
    // order the organizer sees is unaffected.
    bound.sort((a, b) => cost(b[1]) - cost(a[1]));
    for (const [key, group] of bound) {
      const matId = pinnedFloorOfGroup.get(key) ?? leastLoaded();
      for (const c of group) place(c, matId);
    }
    for (const c of free.sort((a, b) => categoryMinutes(b, timing) - categoryMinutes(a, timing)))
      place(c, leastLoaded());
  } else {
    for (const c of queue) place(c, leastLoaded());
  }

  // Each floor runs youngest to oldest, kata before kumite — the house rule.
  // Enforced here rather than relying on the assignment order, because the
  // group strategy deliberately assigns out of order to balance the floors.
  // The pinned categories keep the front of the lane: they already happened.
  const categoryByDrawId = new Map(categories.map((c) => [c.drawId, c]));
  const pinnedCountByMat = new Map<string, number>();
  for (const c of pinned) pinnedCountByMat.set(c.matId!, (pinnedCountByMat.get(c.matId!) ?? 0) + 1);

  for (const [matId, items] of lanes) {
    const pinnedItems = items.slice(0, pinnedCountByMat.get(matId) ?? 0);
    const rest = items.slice(pinnedItems.length);
    rest.sort((a, b) => {
      const ca = categoryByDrawId.get(a.id);
      const cb = categoryByDrawId.get(b.id);
      return ca && cb ? compareCategories(ca, cb) : 0;
    });
    lanes.set(matId, [...pinnedItems, ...rest]);
  }

  // ---- Blocks --------------------------------------------------------------
  //
  // Built against a schedule of the categories alone, so lunch lands at the
  // real midpoint of the day the draft has just produced rather than at a
  // guessed clock time.
  const byDrawId = new Map(categories.map((c) => [c.drawId, c]));
  const scheduleFor = (blocks: ScheduleBlockInput[]) =>
    buildSchedule({
      timing,
      mats: mats.map((m) => ({
        id: m.id,
        name: m.name,
        categories: (lanes.get(m.id) ?? [])
          .map((i) => byDrawId.get(i.id))
          .filter((c): c is DraftCategory => !!c),
        blocks: blocks.filter((b) => b.matId === m.id),
      })),
      venueBlocks: blocks.filter((b) => b.matId === null),
      unassignedCount: 0,
      order: lanes,
    });

  const bare = scheduleFor([]);
  const proposed = options.includeBlocks
    ? proposeBlocks(timing, mats, input.existingBlocks, bare)
    : [];

  // Re-time with the proposed blocks in place, so the summary the planner
  // approves is the day they will actually get.
  const preview = scheduleFor(
    proposed.map((p, i) => ({
      id: `proposed-${i}`,
      kind: p.kind,
      label: p.label,
      minutes: p.minutes,
      matId: p.matId,
      startTime: p.startTime,
    })),
  );

  // ---- Conflicts -----------------------------------------------------------
  const conflicts: DraftConflict[] = [];
  const scheduledItems = preview.mats.flatMap((m) =>
    m.items
      .filter((i) => i.kind === "CATEGORY")
      .map((i) => ({ item: i, matId: m.id, matName: m.name })),
  );
  for (let i = 0; i < scheduledItems.length; i++) {
    for (let j = i + 1; j < scheduledItems.length; j++) {
      const a = scheduledItems[i];
      const b = scheduledItems[j];
      if (a.matId === b.matId) continue;
      const ca = byDrawId.get(a.item.id);
      const cb = byDrawId.get(b.item.id);
      if (!ca || !cb || !sharesAthletes(ca, cb)) continue;
      const from = Math.max(a.item.startMin, b.item.startMin);
      const to = Math.min(a.item.endMin, b.item.endMin);
      if (from >= to) continue;
      const [kata, kumite] = ca.isKata ? [ca, cb] : [cb, ca];
      conflicts.push({
        kataTitle: kata.title,
        kumiteTitle: kumite.title,
        matNames: [a.matName, b.matName],
        fromMin: from,
        toMin: to,
      });
    }
  }

  return {
    lanes,
    blocks: proposed,
    floors: preview.mats.map((m) => ({
      matId: m.id,
      name: m.name,
      categories: m.items.filter((i) => i.kind === "CATEGORY").length,
      bouts: m.bouts,
      endMin: m.endMin,
    })),
    skipped,
    conflicts,
    finishMin: preview.finishMin,
    competitionEndMin: preview.competitionEndMin,
    placedCount: queue.length,
    pinnedCount: pinned.length,
  };
}

// ---------------------------------------------------------------------------
// Ceremonies and breaks
// ---------------------------------------------------------------------------

/**
 * Turn the event's timing settings into the blocks the day needs, skipping any
 * kind already in the plan — re-drafting must not stack a second opening
 * ceremony on top of the one that is already there.
 */
function proposeBlocks(
  timing: EventTiming,
  mats: { id: string; name: string }[],
  existing: { kind: ScheduleBlockInput["kind"]; matId: string | null }[],
  bare: ReturnType<typeof buildSchedule>,
): ProposedBlock[] {
  const has = (kind: ScheduleBlockInput["kind"]) => existing.some((b) => b.kind === kind);
  const blocks: ProposedBlock[] = [];

  if (timing.opening.enabled && !has("OPENING"))
    blocks.push({
      kind: "OPENING",
      label: "Opening ceremony",
      minutes: timing.opening.minutes,
      matId: null,
      startTime: null, // anchored to the start of the day
    });

  if (timing.lunch.enabled && !has("LUNCH")) {
    // Aim for the midpoint of the competition, rounded to the half hour — the
    // point at which stopping costs the least, because every floor is roughly
    // half done.
    const midpoint = (bare.matStartMin + bare.competitionEndMin) / 2;
    const target = Math.round(midpoint / 30) * 30;

    if (timing.lunch.mode === "ALL_MATS") {
      blocks.push({
        kind: "LUNCH",
        label: "Lunch break",
        minutes: timing.lunch.minutes,
        matId: null,
        startTime: formatClock(Math.min(Math.max(target, bare.matStartMin), 23 * 60 + 30)).slice(0, 5),
      });
    } else {
      // Each floor breaks on its own, so the break goes *between two
      // categories* — a floor can't stop mid-category. Pick the gap nearest
      // the target time on each floor.
      for (const mat of mats) {
        const scheduled = bare.mats.find((m) => m.id === mat.id);
        if (!scheduled || scheduled.items.length === 0) continue;
        let bestIndex = scheduled.items.length;
        let bestDelta = Infinity;
        scheduled.items.forEach((item, i) => {
          const delta = Math.abs(item.endMin - target);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestIndex = i + 1;
          }
        });
        blocks.push({
          kind: "LUNCH",
          label: "Lunch break",
          minutes: timing.lunch.minutes,
          matId: mat.id,
          startTime: null,
          index: bestIndex,
        });
      }
    }
  }

  if (timing.closing.enabled && !has("CLOSING"))
    blocks.push({
      kind: "CLOSING",
      label: "Closing ceremony",
      minutes: timing.closing.minutes,
      matId: null,
      startTime: null, // anchored to the end of the day
    });

  return blocks;
}

/**
 * Splice the per-floor blocks into their lanes once they have real ids.
 * Venue-wide blocks aren't in any lane, so they are ignored here.
 */
export function applyBlockIndexes(
  lanes: Map<string, OrderedPlanItem[]>,
  placed: { block: ProposedBlock; id: string }[],
): Map<string, OrderedPlanItem[]> {
  const next = new Map(lanes);
  // Descending by index so an earlier splice can't shift a later one's target.
  const perFloor = placed
    .filter((p) => p.block.matId !== null && p.block.index !== undefined)
    .sort((a, b) => (b.block.index ?? 0) - (a.block.index ?? 0));

  for (const { block, id } of perFloor) {
    const lane = [...(next.get(block.matId!) ?? [])];
    const at = Math.min(Math.max(0, block.index ?? lane.length), lane.length);
    lane.splice(at, 0, { kind: "BLOCK", id });
    next.set(block.matId!, lane);
  }
  return next;
}
