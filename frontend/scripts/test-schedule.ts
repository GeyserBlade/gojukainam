/**
 * Unit tests for the plan's schedule engine (src/lib/schedule.ts). No network,
 * no DOM — plain fixtures in, assertions out. Mirrors scripts/test-timing.ts.
 *
 * Run: npx tsx scripts/test-schedule.ts
 */
import {
  bandAnchor,
  boutSecondsFor,
  buildSchedule,
  categoryBouts,
  categoryMinutes,
  formatClock,
  formatSpan,
  interleaveMatOrder,
  parseClock,
  type ScheduleBlockInput,
  type ScheduleCategoryInput,
  type ScheduleInput,
  type OrderedPlanItem,
} from "../src/lib/schedule";
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
  entries: number,
  overrides: Partial<ScheduleCategoryInput> = {},
): ScheduleCategoryInput => ({
  drawId,
  title: drawId,
  isKata: false,
  entryCount: entries,
  drawEntryCount: entries,
  boutDurationSec: null,
  bufferPct: null,
  ...overrides,
});

const block = (
  id: string,
  minutes: number,
  overrides: Partial<ScheduleBlockInput> = {},
): ScheduleBlockInput => ({
  id,
  kind: "BREAK",
  label: id,
  minutes,
  matId: null,
  startTime: null,
  ...overrides,
});

/** One mat, its categories/blocks already in the order given. */
function plan(
  opts: {
    timing?: EventTiming;
    mats?: { id: string; name: string; items: (ScheduleCategoryInput | ScheduleBlockInput)[] }[];
    venueBlocks?: ScheduleBlockInput[];
    unassignedCount?: number;
  } = {},
): ScheduleInput {
  const mats = opts.mats ?? [];
  const order = new Map<string, OrderedPlanItem[]>();
  for (const m of mats) {
    order.set(
      m.id,
      m.items.map((i) =>
        "drawId" in i
          ? { kind: "CATEGORY" as const, id: i.drawId }
          : { kind: "BLOCK" as const, id: i.id },
      ),
    );
  }
  return {
    timing: opts.timing ?? timing(),
    mats: mats.map((m) => ({
      id: m.id,
      name: m.name,
      categories: m.items.filter((i): i is ScheduleCategoryInput => "drawId" in i),
      blocks: m.items.filter((i): i is ScheduleBlockInput => !("drawId" in i)),
    })),
    venueBlocks: opts.venueBlocks ?? [],
    unassignedCount: opts.unassignedCount ?? 0,
    order,
  };
}

// ---------------------------------------------------------------------------

console.log("\nClock parsing and formatting:");
{
  check("08:00 -> 480", parseClock("08:00") === 480);
  check("00:00 -> 0", parseClock("00:00") === 0);
  check("23:59 -> 1439", parseClock("23:59") === 1439);
  check("24:00 is rejected", parseClock("24:00") === null);
  check("8:00 (unpadded) is rejected", parseClock("8:00") === null);
  check("nonsense is rejected", parseClock("lunch") === null);
  check("null is rejected", parseClock(null) === null);

  check("480 -> 08:00", formatClock(480) === "08:00");
  check("1439 -> 23:59", formatClock(1439) === "23:59");
  check("negative clamps to 00:00", formatClock(-30) === "00:00");
  check(
    "past midnight says so rather than printing 25:15",
    formatClock(25 * 60 + 15) === "01:15 +1d",
    formatClock(25 * 60 + 15),
  );

  check("45 -> 45min", formatSpan(45) === "45min");
  check("120 -> 2h", formatSpan(120) === "2h");
  check("95 -> 1h 35min", formatSpan(95) === "1h 35min");
}

console.log("\nBout counts include the repechage, for kata as well as kumite:");
{
  check("0 entries -> 0 bouts", categoryBouts(cat("a", 0)) === 0);
  check("1 entry -> 0 bouts (walkover gold)", categoryBouts(cat("a", 1)) === 0);
  check("2 entries -> 1 bout, no bronze", categoryBouts(cat("a", 2)) === 1);
  check(
    "8 entries -> 7 main + 2 bronze",
    categoryBouts(cat("a", 8)) === 9,
    categoryBouts(cat("a", 8)),
  );
  check(
    "the bracket's own entry count wins over the live one",
    categoryBouts(cat("a", 3, { drawEntryCount: 8 })) === 9,
  );
  check(
    "no draw falls back to the live entry count",
    categoryBouts(cat("a", 8, { drawEntryCount: null })) === 9,
  );
}

console.log("\nCategory minutes resolve overrides against the event defaults:");
{
  const t = timing({
    defaultBoutDurationSec: 120,
    transitionSecondsPerBout: 60,
    defaultBufferPct: 10,
    changeoverMinutes: 5,
  });
  // 8 entries -> 9 bouts * 3min = 27, +10% = 29.7, +5 changeover = 34.7 -> 35
  check("inherited values", categoryMinutes(cat("a", 8), t) === 35, categoryMinutes(cat("a", 8), t));
  // 9 bouts * 2min = 18, +10% = 19.8, +5 = 24.8 -> 25
  check(
    "a shorter bout clock override shortens the block",
    categoryMinutes(cat("a", 8, { boutDurationSec: 60 }), t) === 25,
    categoryMinutes(cat("a", 8, { boutDurationSec: 60 }), t),
  );
  // An explicit 0 buffer is an override, not an absent value: 27 + 5 = 32
  check(
    "bufferPct: 0 is honoured as a real override, not treated as absent",
    categoryMinutes(cat("a", 8, { bufferPct: 0 }), t) === 32,
    categoryMinutes(cat("a", 8, { bufferPct: 0 }), t),
  );
  check(
    "a category with no bouts costs no floor time, changeover included",
    categoryMinutes(cat("a", 1), t) === 0,
  );
}

console.log("\nA plain day: opening, floors running in parallel, closing:");
{
  const t = timing({ dayStartTime: "08:00" });
  const s = buildSchedule(
    plan({
      timing: t,
      mats: [
        { id: "m1", name: "Mat 1", items: [cat("a", 8), cat("b", 4)] },
        { id: "m2", name: "Mat 2", items: [cat("c", 8)] },
      ],
      venueBlocks: [
        block("open", 15, { kind: "OPENING", label: "Opening" }),
        block("close", 20, { kind: "CLOSING", label: "Closing" }),
      ],
    }),
  );

  check("the day starts at the configured time", s.dayStartMin === parseClock("08:00"));
  check("floors start after the opening ceremony", s.matStartMin === parseClock("08:15"), formatClock(s.matStartMin));
  check(
    "the first category on a floor starts when the floor does",
    s.mats[0].items[0].startMin === s.matStartMin,
  );
  check(
    "the second category follows the first with no gap",
    s.mats[0].items[1].startMin === s.mats[0].items[0].endMin,
  );
  check(
    "floors run in parallel, not in sequence",
    s.mats[1].items[0].startMin === s.matStartMin,
  );
  check(
    "competition ends when the slowest floor does",
    s.competitionEndMin === Math.max(s.mats[0].endMin, s.mats[1].endMin),
  );
  check(
    "the closing ceremony starts after the last floor finishes",
    s.bands.find((b) => b.id === "close")!.startMin === s.competitionEndMin,
  );
  check("the day ends after the closing ceremony", s.finishMin === s.competitionEndMin + 20);
  check(
    "total bouts sums across floors",
    s.totalBouts === categoryBouts(cat("a", 8)) + categoryBouts(cat("b", 4)) + categoryBouts(cat("c", 8)),
    s.totalBouts,
  );
}

console.log("\nA venue-wide break stops every floor:");
{
  const t = timing({ dayStartTime: "08:00" });
  // One long category on each floor, and lunch lands in the middle of it.
  const s = buildSchedule(
    plan({
      timing: t,
      mats: [
        { id: "m1", name: "Mat 1", items: [cat("a", 32)] },
        { id: "m2", name: "Mat 2", items: [cat("b", 32)] },
      ],
      venueBlocks: [block("lunch", 30, { kind: "LUNCH", label: "Lunch", startTime: "09:00" })],
    }),
  );

  const a = s.mats[0].items[0];
  check("the category still starts on time", a.startMin === parseClock("08:00"), formatClock(a.startMin));
  check("it absorbs the break rather than being pushed", a.pausedMin === 30, a.pausedMin);
  check(
    "its end is its work plus the break",
    a.endMin === a.startMin + a.minutes + 30,
    { end: formatClock(a.endMin), minutes: a.minutes },
  );
  check(
    "every floor pays the same pause",
    s.mats[1].items[0].pausedMin === 30,
  );
  check("the band is where the planner put it", s.bands.find((b) => b.id === "lunch")!.startMin === 540);
}

console.log("\nA break splits the item that is running, and pushes one that isn't:");
{
  const t = timing({ dayStartTime: "08:00" });
  // "a" is 15min, so it runs 08:00-08:15 and the 08:20 break lands inside "b".
  const running = buildSchedule(
    plan({
      timing: t,
      mats: [{ id: "m1", name: "Mat 1", items: [cat("a", 4), cat("b", 8)] }],
      venueBlocks: [block("lunch", 30, { kind: "LUNCH", label: "Lunch", startTime: "08:20" })],
    }),
  );
  const [first, second] = running.mats[0].items;
  check("a category that finishes first is untouched", first.pausedMin === 0, first);
  check(
    "the one that is running when the venue stops absorbs the break",
    second.pausedMin === 30 && second.waitMin === 0,
    second,
  );
  check(
    "nothing starts inside the break window",
    ![first, second].some((i) => i.startMin >= 500 && i.startMin < 530),
    running.mats[0].items.map((i) => formatClock(i.startMin)),
  );

  // Break starts exactly when "a" ends, so "b" cannot begin — it waits.
  const waiting = buildSchedule(
    plan({
      timing: t,
      mats: [{ id: "m1", name: "Mat 1", items: [cat("a", 4), cat("b", 8)] }],
      venueBlocks: [block("lunch", 30, { kind: "LUNCH", label: "Lunch", startTime: "08:15" })],
    }),
  );
  const next = waiting.mats[0].items[1];
  check(
    "an item that would start inside the break waits for it instead",
    next.startMin === parseClock("08:45") && next.waitMin === 30 && next.pausedMin === 0,
    next,
  );
}

console.log("\nA per-floor break only costs its own floor:");
{
  const t = timing({ dayStartTime: "08:00" });
  const s = buildSchedule(
    plan({
      timing: t,
      mats: [
        {
          id: "m1",
          name: "Mat 1",
          items: [cat("a", 4), block("b1", 30, { kind: "LUNCH", matId: "m1" }), cat("b", 4)],
        },
        { id: "m2", name: "Mat 2", items: [cat("c", 4), cat("d", 4)] },
      ],
    }),
  );
  check(
    "the break sits in the floor's running order",
    s.mats[0].items[1].kind === "BLOCK" && s.mats[0].items[1].minutes === 30,
  );
  check(
    "it delays only that floor",
    s.mats[0].endMin - s.mats[1].endMin === 30,
    { m1: s.mats[0].endMin, m2: s.mats[1].endMin },
  );
  check("the other floor takes no pause", s.mats[1].items.every((i) => i.pausedMin === 0));
}

console.log("\nBand anchoring:");
{
  check("an opening with no time runs at the start", bandAnchor(block("o", 10, { kind: "OPENING" })) === "START");
  check("a closing with no time runs at the end", bandAnchor(block("c", 10, { kind: "CLOSING" })) === "END");
  check(
    "an explicit time always wins, even on a ceremony",
    bandAnchor(block("o", 10, { kind: "OPENING", startTime: "07:30" })) === "TIME",
  );
  check(
    "a break with no time has nowhere to sit",
    bandAnchor(block("b", 10, { kind: "BREAK" })) === "UNSCHEDULED",
  );

  const s = buildSchedule(
    plan({
      mats: [{ id: "m1", name: "Mat 1", items: [cat("a", 4)] }],
      venueBlocks: [block("orphan", 20, { kind: "BREAK", label: "Awards" })],
    }),
  );
  check(
    "and it is reported rather than guessed at",
    s.warnings.some((w) => w.code === "BLOCK_UNSCHEDULED"),
    s.warnings,
  );
  check("it takes no time off the schedule", s.finishMin === s.competitionEndMin, s.finishMin);
}

console.log("\nWarnings that matter to a planner:");
{
  const s = buildSchedule(
    plan({
      timing: timing({ dayStartTime: "08:00" }),
      mats: [
        { id: "m1", name: "Mat 1", items: [cat("a", 4)] },
        { id: "m2", name: "Mat 2", items: [] },
      ],
      venueBlocks: [block("late", 30, { kind: "LUNCH", label: "Lunch", startTime: "20:00" })],
      unassignedCount: 3,
    }),
  );
  check("an empty floor is called out", s.warnings.some((w) => w.code === "EMPTY_MAT"), s.warnings);
  check(
    "a break after the last bout is called out",
    s.warnings.some((w) => w.code === "BAND_AFTER_FINISH"),
    s.warnings,
  );
  check(
    "categories left in the pool are called out",
    s.warnings.some((w) => w.code === "UNASSIGNED_CATEGORIES"),
  );

  const early = buildSchedule(
    plan({
      timing: timing({ dayStartTime: "09:00" }),
      mats: [{ id: "m1", name: "Mat 1", items: [cat("a", 4)] }],
      venueBlocks: [block("early", 15, { kind: "BREAK", label: "Briefing", startTime: "07:00" })],
    }),
  );
  check(
    "a break before competition starts is called out",
    early.warnings.some((w) => w.code === "BAND_BEFORE_START"),
    early.warnings,
  );

  const noMats = buildSchedule(plan({}));
  check("no floors at all is called out", noMats.warnings.some((w) => w.code === "NO_MATS"));
}

console.log("\ninterleaveMatOrder shares one index space between both kinds:");
{
  const order = interleaveMatOrder(
    [
      { drawId: "d1", matOrder: 0 },
      { drawId: "d2", matOrder: 2 },
    ],
    [{ id: "b1", matOrder: 1 }],
  );
  check(
    "a break really sits between two categories",
    JSON.stringify(order) ===
      JSON.stringify([
        { kind: "CATEGORY", id: "d1" },
        { kind: "BLOCK", id: "b1" },
        { kind: "CATEGORY", id: "d2" },
      ]),
    order,
  );

  const withNulls = interleaveMatOrder(
    [
      { drawId: "d2", matOrder: null },
      { drawId: "d1", matOrder: 0 },
    ],
    [],
  );
  check(
    "an unpositioned item sorts to the end rather than to the front",
    withNulls[0].id === "d1" && withNulls[1].id === "d2",
    withNulls,
  );

  const tied = interleaveMatOrder([{ drawId: "d1", matOrder: 0 }], [{ id: "b1", matOrder: 0 }]);
  check("a tie puts the category first, deterministically", tied[0].kind === "CATEGORY", tied);
}

console.log("\nAn empty plan is still a valid schedule:");
{
  const s = buildSchedule(plan({ timing: timing({ dayStartTime: "07:30" }) }));
  check("it starts when the day does", s.dayStartMin === parseClock("07:30"));
  check("it finishes at the same moment", s.finishMin === s.dayStartMin, s.finishMin);
  check("with no bouts", s.totalBouts === 0);
  check("and no floors", s.mats.length === 0);
}

console.log("\nKata is timed on its own terms:");
{
  const t = timing({
    defaultBoutDurationSec: 120,
    kataBoutDurationSec: 90,
    transitionSecondsPerBout: 60,
    defaultBufferPct: 0,
    changeoverMinutes: 0,
    kataMode: "SEQUENTIAL",
  });
  const kata = cat("k", 8, { isKata: true });
  const kumite = cat("c", 8);

  check(
    "a kumite bout costs its match clock plus the transition",
    boutSecondsFor(kumite, t) === 180,
    boutSecondsFor(kumite, t),
  );
  check(
    "a sequential kata bout costs two performances plus the transition",
    boutSecondsFor(kata, t) === 90 * 2 + 60,
    boutSecondsFor(kata, t),
  );

  const together = timing({ ...t, kataMode: "TOGETHER" });
  check(
    "sharing the floor costs one performance instead of two",
    boutSecondsFor(kata, together) === 90 + 60,
    boutSecondsFor(kata, together),
  );
  check(
    "which is the whole point — the category gets materially shorter",
    categoryMinutes(kata, together) < categoryMinutes(kata, t),
    { together: categoryMinutes(kata, together), sequential: categoryMinutes(kata, t) },
  );
  // 9 bouts. Sequential: (90+90+60)s = 4min each -> 36. Together: (90+60)s =
  // 2.5min each -> 22.5, rounded up to 23. Nearly an hour saved over a day of
  // kata categories, which is why this is a setting and not an assumption.
  check(
    "9 bouts: 23min together vs 36min one after the other",
    categoryMinutes(kata, together) === 23 && categoryMinutes(kata, t) === 36,
    { together: categoryMinutes(kata, together), sequential: categoryMinutes(kata, t) },
  );
  check(
    "kata does not borrow the kumite clock",
    categoryMinutes(kata, t) !== categoryMinutes(kumite, t),
    { kata: categoryMinutes(kata, t), kumite: categoryMinutes(kumite, t) },
  );

  // A per-category override means "this category's performance length", and
  // the sequential doubling still applies on top of it.
  const overridden = cat("k2", 8, { isKata: true, boutDurationSec: 60 });
  check(
    "a per-category override replaces the kata default, doubling included",
    boutSecondsFor(overridden, t) === 60 * 2 + 60,
    boutSecondsFor(overridden, t),
  );

  // The kata mode must not touch kumite at all.
  check(
    "the kata format leaves kumite alone",
    boutSecondsFor(kumite, t) === boutSecondsFor(kumite, together),
  );
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
