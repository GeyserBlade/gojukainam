/**
 * Unit tests for the schedule drafter (src/lib/autoschedule.ts). No network, no
 * DOM — plain fixtures in, assertions out. Mirrors scripts/test-schedule.ts.
 *
 * Run: npx tsx scripts/test-autoschedule.ts
 */
import {
  applyBlockIndexes,
  buildAgeGroups,
  pairsWith,
  compareCategories,
  draftPlan,
  type DraftCategory,
  type DraftInput,
  type DraftOptions,
} from "../src/lib/autoschedule";
import { formatClock, type OrderedPlanItem } from "../src/lib/schedule";
import { DEFAULT_EVENT_TIMING, type EventTiming } from "../src/lib/timing";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const timing = (overrides: Partial<EventTiming> = {}): EventTiming => ({
  ...DEFAULT_EVENT_TIMING,
  ...overrides,
});

const cat = (
  drawId: string,
  opts: Partial<DraftCategory> & { minAge: number; maxAge: number },
): DraftCategory => ({
  drawId,
  title: drawId,
  isKata: false,
  entryCount: 8,
  drawEntryCount: 8,
  boutDurationSec: null,
  bufferPct: null,
  gender: "Male",
  pinned: false,
  matId: null,
  ...opts,
});

const MATS = [
  { id: "m1", name: "Mat 1" },
  { id: "m2", name: "Mat 2" },
];

function input(
  categories: DraftCategory[],
  options: Partial<DraftOptions> = {},
  extra: Partial<DraftInput> = {},
): DraftInput {
  return {
    timing: timing({ dayStartTime: "08:00" }),
    mats: MATS,
    categories,
    existingBlocks: [],
    options: { strategy: "BALANCE_FLOORS", includeBlocks: false, ...options },
    ...extra,
  };
}

/** Flatten a draft's lanes to `matId -> drawId[]`, for readable assertions. */
const laneIds = (lanes: Map<string, OrderedPlanItem[]>) =>
  Object.fromEntries([...lanes].map(([k, v]) => [k, v.map((i) => i.id)]));

// ---------------------------------------------------------------------------

console.log("\nOrdering: youngest first, kata before kumite:");
{
  const cats = [
    cat("u12-kumite", { minAge: 10, maxAge: 11, isKata: false }),
    cat("senior-kata", { minAge: 18, maxAge: 99, isKata: true }),
    cat("u12-kata", { minAge: 10, maxAge: 11, isKata: true }),
    cat("u14-kata", { minAge: 12, maxAge: 13, isKata: true }),
  ];
  const sorted = [...cats].sort(compareCategories).map((c) => c.drawId);
  check(
    "age ascending, and within an age the kata leads",
    JSON.stringify(sorted) ===
      JSON.stringify(["u12-kata", "u12-kumite", "u14-kata", "senior-kata"]),
    sorted,
  );

  const sameStart = [
    cat("senior-16plus", { minAge: 16, maxAge: 99 }),
    cat("junior-16-17", { minAge: 16, maxAge: 17 }),
  ]
    .sort(compareCategories)
    .map((c) => c.drawId);
  check(
    "two bands starting at the same age are kept apart by their top age",
    JSON.stringify(sameStart) === JSON.stringify(["junior-16-17", "senior-16plus"]),
    sameStart,
  );

  check(
    "the sort is stable across runs",
    JSON.stringify([...cats].sort(compareCategories).map((c) => c.drawId)) ===
      JSON.stringify([...cats].reverse().sort(compareCategories).map((c) => c.drawId)),
  );

  const kata = (id: string, min: number, max: number, g: "Male" | "Female" = "Male") =>
    cat(id, { minAge: min, maxAge: max, gender: g, isKata: true });
  const kumite = (id: string, min: number, max: number, g: "Male" | "Female" = "Male") =>
    cat(id, { minAge: min, maxAge: max, gender: g, isKata: false });

  check(
    "a one-year kata band pairs with the two-year kumite band over it",
    pairsWith(kata("k10", 10, 10), kumite("c10", 10, 11)),
  );
  check("same discipline never pairs", !pairsWith(kata("k10", 10, 10), kata("k11", 11, 11)));
  check("different genders never pair", !pairsWith(kata("k", 10, 10, "Male"), kumite("c", 10, 11, "Female")));
  check("non-overlapping ages never pair", !pairsWith(kata("k", 10, 10), kumite("c", 12, 13)));
  check(
    "an open-ended senior kata does NOT pair with a narrow junior kumite",
    !pairsWith(kata("senior", 16, 99), kumite("junior", 16, 17)),
    "16-99 overlaps 16-17 but the spans are nothing alike",
  );
  check(
    "but it does pair with the senior kumite beside it",
    pairsWith(kata("senior", 16, 99), kumite("senior", 18, 99)),
  );
}

console.log("\nMismatched kata/kumite age bands still group together:");
{
  // The real shape that broke this: kata is graded a year at a time, kumite in
  // two-year bands, so no two of them share an age range exactly.
  const cats = [
    cat("kata-10", { minAge: 10, maxAge: 10, isKata: true }),
    cat("kata-11", { minAge: 11, maxAge: 11, isKata: true }),
    cat("kumite-10-11-under", { minAge: 10, maxAge: 11, isKata: false }),
    cat("kumite-10-11-over", { minAge: 10, maxAge: 11, isKata: false }),
    cat("kata-12", { minAge: 12, maxAge: 12, isKata: true }),
    cat("kumite-12-13", { minAge: 12, maxAge: 13, isKata: false }),
  ];
  const groups = buildAgeGroups(cats);
  const g = (id: string) => groups.get(id);

  check(
    "a one-year kata joins the two-year kumite band over it",
    g("kata-10") === g("kumite-10-11-under"),
    [...groups],
  );
  check(
    "and so does the next year up — transitively, through that kumite band",
    g("kata-11") === g("kata-10"),
    [...groups],
  );
  check(
    "both weight classes of that band come too",
    g("kumite-10-11-over") === g("kata-10"),
    [...groups],
  );
  check("a different age band stays its own group", g("kata-12") !== g("kata-10"), [...groups]);
  check("with its own kumite", g("kata-12") === g("kumite-12-13"), [...groups]);

  const draft = draftPlan(input(cats, { strategy: "AGE_GROUP_PER_FLOOR" }));
  check("so the draft reports no clashes", draft.conflicts.length === 0, draft.conflicts);
  const ids = laneIds(draft.lanes);
  const floorOf = (id: string) => (ids.m1.includes(id) ? "m1" : "m2");
  check(
    "and the whole 10-11 group is on one floor",
    new Set(["kata-10", "kata-11", "kumite-10-11-under", "kumite-10-11-over"].map(floorOf)).size === 1,
    ids,
  );
}

console.log("\nA catch-all senior band does not swallow the tournament:");
{
  // Every one of these overlaps "Senior Kata 16+". Pairing on overlap alone put
  // all of them in one group and half the event on one floor.
  const cats = [
    cat("senior-kata", { minAge: 16, maxAge: 99, isKata: true }),
    cat("senior-kumite", { minAge: 18, maxAge: 99, isKata: false }),
    cat("junior-kata", { minAge: 16, maxAge: 17, isKata: true }),
    cat("junior-kumite", { minAge: 16, maxAge: 17, isKata: false }),
    cat("veteran-kata", { minAge: 35, maxAge: 99, isKata: true }),
    cat("veteran-kumite", { minAge: 35, maxAge: 99, isKata: false }),
  ];
  const groups = buildAgeGroups(cats);
  const g = (id: string) => groups.get(id);

  check("senior kata pairs with senior kumite", g("senior-kata") === g("senior-kumite"), [...groups]);
  check("junior kata pairs with junior kumite", g("junior-kata") === g("junior-kumite"), [...groups]);
  check("veteran kata pairs with veteran kumite", g("veteran-kata") === g("veteran-kumite"), [...groups]);
  check(
    "but junior is not dragged into senior by the 16+ overlap",
    g("junior-kata") !== g("senior-kata"),
    [...groups],
  );
  check(
    "nor veteran",
    g("veteran-kata") !== g("senior-kata"),
    [...groups],
  );
  check("three distinct groups, not one", new Set(groups.values()).size === 3, [...groups]);
}

console.log("\nBALANCE_FLOORS fills whichever floor is free soonest:");
{
  const cats = [
    cat("a", { minAge: 10, maxAge: 11, isKata: true }),
    cat("b", { minAge: 10, maxAge: 11, isKata: false }),
    cat("c", { minAge: 12, maxAge: 13, isKata: true }),
    cat("d", { minAge: 12, maxAge: 13, isKata: false }),
  ];
  const draft = draftPlan(input(cats, { strategy: "BALANCE_FLOORS" }));
  const ids = laneIds(draft.lanes);

  check("every category is placed", draft.placedCount === 4, draft.placedCount);
  check("both floors are used", ids.m1.length > 0 && ids.m2.length > 0, ids);
  check(
    "the first two categories go to different floors",
    ids.m1[0] === "a" && ids.m2[0] === "b",
    ids,
  );
  check("no category is placed twice", new Set([...ids.m1, ...ids.m2]).size === 4, ids);
}

console.log("\nAGE_GROUP_PER_FLOOR keeps a group's kata and kumite together:");
{
  const cats = [
    cat("u12-kata", { minAge: 10, maxAge: 11, isKata: true }),
    cat("u12-kumite", { minAge: 10, maxAge: 11, isKata: false }),
    cat("u14-kata", { minAge: 12, maxAge: 13, isKata: true }),
    cat("u14-kumite", { minAge: 12, maxAge: 13, isKata: false }),
  ];
  const draft = draftPlan(input(cats, { strategy: "AGE_GROUP_PER_FLOOR" }));
  const ids = laneIds(draft.lanes);

  const floorOf = (id: string) => (ids.m1.includes(id) ? "m1" : "m2");
  check(
    "a group's kata and kumite land on the same floor",
    floorOf("u12-kata") === floorOf("u12-kumite") &&
      floorOf("u14-kata") === floorOf("u14-kumite"),
    ids,
  );
  check(
    "and the kata runs first on that floor",
    ids[floorOf("u12-kata")].indexOf("u12-kata") <
      ids[floorOf("u12-kata")].indexOf("u12-kumite"),
    ids,
  );
  check("different groups still spread across floors", floorOf("u12-kata") !== floorOf("u14-kata"), ids);
  check("no clashes are reported", draft.conflicts.length === 0, draft.conflicts);
}

console.log("\nClashes are detected and reported, not hidden:");
{
  // Same age band and gender, kata on one floor and kumite on the other —
  // the same children would be called to both at once.
  const cats = [
    cat("u12-kata", { minAge: 10, maxAge: 11, isKata: true }),
    cat("u12-kumite", { minAge: 10, maxAge: 11, isKata: false }),
  ];
  const balanced = draftPlan(input(cats, { strategy: "BALANCE_FLOORS" }));
  check(
    "splitting a group across floors is reported as a clash",
    balanced.conflicts.length === 1,
    balanced.conflicts,
  );
  check(
    "the clash names both categories and both floors",
    balanced.conflicts[0]?.kataTitle === "u12-kata" &&
      balanced.conflicts[0]?.kumiteTitle === "u12-kumite" &&
      balanced.conflicts[0]?.matNames.length === 2,
    balanced.conflicts[0],
  );

  const grouped = draftPlan(input(cats, { strategy: "AGE_GROUP_PER_FLOOR" }));
  check("keeping the group together removes it", grouped.conflicts.length === 0, grouped.conflicts);

  // Two weight classes of the same division never share an athlete.
  const weights = [
    cat("k-52", { minAge: 14, maxAge: 15, isKata: false }),
    cat("k-57", { minAge: 14, maxAge: 15, isKata: false }),
  ];
  check(
    "two categories of the same discipline are never a clash",
    draftPlan(input(weights, { strategy: "BALANCE_FLOORS" })).conflicts.length === 0,
  );

  // Boys and girls of the same age are different people.
  const genders = [
    cat("boys-kata", { minAge: 10, maxAge: 11, isKata: true, gender: "Male" }),
    cat("girls-kumite", { minAge: 10, maxAge: 11, isKata: false, gender: "Female" }),
  ];
  check(
    "different genders are never a clash",
    draftPlan(input(genders, { strategy: "BALANCE_FLOORS" })).conflicts.length === 0,
  );
}

console.log("\nAlready-fought categories keep their floor:");
{
  const cats = [
    cat("done", { minAge: 10, maxAge: 11, pinned: true, matId: "m2" }),
    cat("todo", { minAge: 10, maxAge: 11, isKata: true }),
    cat("todo2", { minAge: 12, maxAge: 13 }),
  ];
  const draft = draftPlan(input(cats));
  const ids = laneIds(draft.lanes);

  check("the fought category stays where it was", ids.m2.includes("done"), ids);
  check("and is counted as pinned, not placed", draft.pinnedCount === 1 && draft.placedCount === 2, {
    pinned: draft.pinnedCount,
    placed: draft.placedCount,
  });
  check(
    "its floor's existing load is taken into account",
    ids.m1.length >= 1,
    ids,
  );

  // Pinned but never assigned a floor: there is nothing to pin it to.
  const orphan = draftPlan(
    input([cat("orphan", { minAge: 10, maxAge: 11, pinned: true, matId: null })]),
  );
  check(
    "a fought category with no floor is scheduled like any other",
    orphan.placedCount === 1 && orphan.pinnedCount === 0,
    orphan,
  );
}

console.log("\nAn age group joins whichever floor already holds part of it:");
{
  // The kata was fought on m2 and cannot move. Its kumite belongs there too,
  // or the strategy's one promise is broken by the hardest thing to fix.
  const cats = [
    cat("u12-kata", { minAge: 10, maxAge: 11, isKata: true, pinned: true, matId: "m2" }),
    cat("u12-kumite", { minAge: 10, maxAge: 11, isKata: false }),
    cat("u14-kata", { minAge: 12, maxAge: 13, isKata: true }),
    cat("u14-kumite", { minAge: 12, maxAge: 13, isKata: false }),
  ];
  const draft = draftPlan(input(cats, { strategy: "AGE_GROUP_PER_FLOOR" }));
  const ids = laneIds(draft.lanes);
  check(
    "the rest of the group follows the category already on a floor",
    ids.m2.includes("u12-kata") && ids.m2.includes("u12-kumite"),
    ids,
  );
  check("even though m2 was the busier floor", ids.m1.includes("u14-kata"), ids);
  check("and no clash is reported", draft.conflicts.length === 0, draft.conflicts);
}

console.log("\nFloors are balanced, and each still runs youngest to oldest:");
{
  // One huge old group and several small young ones. Assigning strictly in age
  // order leaves the big group for last, with nowhere to put it.
  const big = Array.from({ length: 6 }, (_, i) =>
    cat(`senior-${i}`, { minAge: 18, maxAge: 99, entryCount: 32, drawEntryCount: 32 }),
  );
  const small = [
    cat("u10", { minAge: 8, maxAge: 9, entryCount: 4, drawEntryCount: 4 }),
    cat("u12", { minAge: 10, maxAge: 11, entryCount: 4, drawEntryCount: 4 }),
    cat("u14", { minAge: 12, maxAge: 13, entryCount: 4, drawEntryCount: 4 }),
  ];
  const draft = draftPlan(input([...small, ...big], { strategy: "AGE_GROUP_PER_FLOOR" }));

  const ends = draft.floors.map((f) => f.endMin);
  const spread = Math.max(...ends) - Math.min(...ends);
  const total = draft.competitionEndMin - Math.min(...ends);
  check(
    "the floors finish within a reasonable window of each other",
    spread <= Math.max(60, total * 0.5),
    { ends: ends.map(formatClock), spread },
  );

  for (const [matId, items] of draft.lanes) {
    const ages = items.map((i) =>
      [...small, ...big].find((c) => c.drawId === i.id)!.minAge,
    );
    check(
      `${matId} runs youngest to oldest despite being assigned out of order`,
      ages.every((a, i) => i === 0 || ages[i - 1] <= a),
      ages,
    );
  }
}

console.log("\nCategories with nothing to run are reported, not silently dropped:");
{
  const draft = draftPlan(
    input([
      cat("empty", { minAge: 10, maxAge: 11, entryCount: 1, drawEntryCount: 1 }),
      cat("real", { minAge: 10, maxAge: 11 }),
    ]),
  );
  check("it is left out of the floors", draft.placedCount === 1, draft.placedCount);
  check(
    "and named with a reason",
    draft.skipped.length === 1 && draft.skipped[0].title === "empty",
    draft.skipped,
  );
}

console.log("\nCeremonies and the lunch break:");
{
  const cats = [
    cat("a", { minAge: 10, maxAge: 11 }),
    cat("b", { minAge: 12, maxAge: 13 }),
  ];
  const t = timing({
    dayStartTime: "08:00",
    opening: { enabled: true, minutes: 20 },
    closing: { enabled: true, minutes: 15 },
    lunch: { enabled: true, minutes: 45, mode: "ALL_MATS" },
  });

  const draft = draftPlan({ ...input(cats, { includeBlocks: true }), timing: t });
  const kinds = draft.blocks.map((b) => b.kind);
  check("all three are proposed", kinds.join(",") === "OPENING,LUNCH,CLOSING", kinds);
  check(
    "the ceremonies are venue-wide and anchored to the day",
    draft.blocks[0].matId === null && draft.blocks[0].startTime === null,
    draft.blocks[0],
  );
  check(
    "lunch is venue-wide with a real clock time",
    draft.blocks[1].matId === null && /^\d\d:\d\d$/.test(draft.blocks[1].startTime ?? ""),
    draft.blocks[1],
  );
  check(
    "and it lands inside the competition, not before or after it",
    (() => {
      const at = draft.blocks[1].startTime!;
      const mins = Number(at.slice(0, 2)) * 60 + Number(at.slice(3));
      return mins > 8 * 60 + 20 && mins < draft.competitionEndMin;
    })(),
    { lunch: draft.blocks[1].startTime, end: formatClock(draft.competitionEndMin) },
  );
  check(
    "the opening pushes the finish out",
    draft.finishMin > draft.competitionEndMin,
    { finish: formatClock(draft.finishMin), lastBout: formatClock(draft.competitionEndMin) },
  );

  const none = draftPlan({ ...input(cats, { includeBlocks: false }), timing: t });
  check("turning them off proposes nothing", none.blocks.length === 0, none.blocks);

  // Re-drafting must not stack a second opening on the one already placed.
  const again = draftPlan({
    ...input(cats, { includeBlocks: true }),
    timing: t,
    existingBlocks: [{ kind: "OPENING", matId: null }, { kind: "LUNCH", matId: null }],
  });
  check(
    "a kind already in the plan is not proposed again",
    again.blocks.map((b) => b.kind).join(",") === "CLOSING",
    again.blocks,
  );

  const off = draftPlan({
    ...input(cats, { includeBlocks: true }),
    timing: timing({ ...t, lunch: { enabled: false, minutes: 45, mode: "ALL_MATS" } }),
  });
  check(
    "a break switched off in the settings is not proposed",
    !off.blocks.some((b) => b.kind === "LUNCH"),
    off.blocks,
  );
}

console.log("\nA per-floor lunch goes between two categories on each floor:");
{
  const cats = [
    cat("a", { minAge: 10, maxAge: 11 }),
    cat("b", { minAge: 12, maxAge: 13 }),
    cat("c", { minAge: 14, maxAge: 15 }),
    cat("d", { minAge: 16, maxAge: 17 }),
  ];
  const draft = draftPlan({
    ...input(cats, { includeBlocks: true }),
    timing: timing({
      dayStartTime: "08:00",
      opening: { enabled: false, minutes: 0 },
      closing: { enabled: false, minutes: 0 },
      lunch: { enabled: true, minutes: 40, mode: "PER_FLOOR" },
    }),
  });
  const lunches = draft.blocks.filter((b) => b.kind === "LUNCH");
  check("one break per floor", lunches.length === 2, lunches);
  check("each is tied to a floor, not the venue", lunches.every((b) => b.matId !== null), lunches);
  check("each carries a position rather than a clock time",
    lunches.every((b) => typeof b.index === "number" && b.startTime === null), lunches);
  check(
    "and sits between categories rather than at the very start",
    lunches.every((b) => (b.index ?? 0) > 0),
    lunches,
  );
}

console.log("\napplyBlockIndexes splices per-floor breaks into their lanes:");
{
  const lanes = new Map<string, OrderedPlanItem[]>([
    ["m1", [
      { kind: "CATEGORY", id: "a" },
      { kind: "CATEGORY", id: "b" },
      { kind: "CATEGORY", id: "c" },
    ]],
  ]);
  const next = applyBlockIndexes(lanes, [
    { block: { kind: "LUNCH", label: "L", minutes: 40, matId: "m1", startTime: null, index: 2 }, id: "blk1" },
  ]);
  check(
    "the break lands at the index it was given",
    JSON.stringify(next.get("m1")!.map((i) => i.id)) === JSON.stringify(["a", "b", "blk1", "c"]),
    next.get("m1"),
  );

  // Two breaks on one floor: the second splice must not shift the first.
  const two = applyBlockIndexes(lanes, [
    { block: { kind: "LUNCH", label: "L", minutes: 40, matId: "m1", startTime: null, index: 1 }, id: "x" },
    { block: { kind: "BREAK", label: "B", minutes: 10, matId: "m1", startTime: null, index: 3 }, id: "y" },
  ]);
  check(
    "two breaks on one floor both land where they were asked to",
    JSON.stringify(two.get("m1")!.map((i) => i.id)) ===
      JSON.stringify(["a", "x", "b", "c", "y"]),
    two.get("m1"),
  );

  const venueWide = applyBlockIndexes(lanes, [
    { block: { kind: "LUNCH", label: "L", minutes: 40, matId: null, startTime: "12:00" }, id: "z" },
  ]);
  check(
    "a venue-wide break is not spliced into any lane",
    venueWide.get("m1")!.every((i) => i.id !== "z"),
    venueWide.get("m1"),
  );
}

console.log("\nKata timing feeds straight through to the draft:");
{
  const cats = [cat("kata", { minAge: 10, maxAge: 11, isKata: true })];
  const sequential = draftPlan({
    ...input(cats),
    timing: timing({ kataMode: "SEQUENTIAL" }),
  });
  const together = draftPlan({
    ...input(cats),
    timing: timing({ kataMode: "TOGETHER" }),
  });
  check(
    "sharing the floor finishes the day earlier",
    together.competitionEndMin < sequential.competitionEndMin,
    { together: together.competitionEndMin, sequential: sequential.competitionEndMin },
  );
}

console.log("\nWith no floors there is nothing to draft:");
{
  const draft = draftPlan({
    ...input([cat("a", { minAge: 10, maxAge: 11 })]),
    mats: [],
  });
  check("nothing is placed", draft.placedCount === 0, draft.placedCount);
  check(
    "and every category is reported with the reason",
    draft.skipped.length === 1 && draft.skipped[0].reason.includes("no floors"),
    draft.skipped,
  );
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
