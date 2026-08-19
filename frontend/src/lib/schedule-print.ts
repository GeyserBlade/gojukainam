// Pure layout math for the printable one-page schedule (pages/PlanPrint.tsx).
// Split out from the page itself so it can be unit tested directly
// (scripts/test-schedule-print.ts), same convention as lib/schedule.ts.
//
// The on-screen ScheduleTimeline positions items in pixels at a chosen zoom
// level, which is exactly wrong for a fixed physical page: a print layout has
// to fit one sheet of paper regardless of how many hours the day spans, so
// every item is placed as a *percentage* of the whole day's span instead.

import { formatClock } from "./schedule"

/**
 * "10:30 – 10:45" — a block's own start and end, so its finish time doesn't
 * have to be eyeballed from its height on the page. En dash with spaces on
 * both sides, matching this app's other range formatting (e.g. the toolbar's
 * "08:00 – 16:25 on site").
 */
export function formatTimeRange(startMin: number, endMin: number): string {
  return `${formatClock(startMin)} – ${formatClock(endMin)}`
}

/**
 * Where an item sits on the page, as a percentage of the full day span
 * (`dayStartMin` to `dayStartMin + totalSpanMin`). Both values are clamped to
 * [0, 100] — an item's own start/end should already be inside the schedule's
 * own range, but clamping means a rounding edge case draws a sliver at the
 * very top/bottom of the page instead of pushing the layout off it.
 */
export function layoutPercent(
  startMin: number,
  endMin: number,
  dayStartMin: number,
  totalSpanMin: number,
): { topPct: number; heightPct: number } {
  if (totalSpanMin <= 0) return { topPct: 0, heightPct: 0 }
  const topPct = clampPct(((startMin - dayStartMin) / totalSpanMin) * 100)
  const bottomPct = clampPct(((endMin - dayStartMin) / totalSpanMin) * 100)
  return { topPct, heightPct: Math.max(0, bottomPct - topPct) }
}

function clampPct(v: number): number {
  return Math.min(100, Math.max(0, v))
}

/**
 * One mat's items, laid out with a minimum height so a short category's
 * label is never too small to read — sizing strictly proportional to
 * duration (plain `layoutPercent`) meant a 15-20 minute category could
 * shrink below the height its own text needs, which is the bug this fixes.
 *
 * Items are expected already in time order and non-overlapping, which is
 * guaranteed by construction: `ScheduledMat.items` is built by walking one
 * floor's running order with a single advancing cursor (lib/schedule.ts),
 * so there is never two items on the same mat competing for the same
 * minute.
 *
 * Two passes:
 * 1. Walk the items in order, flooring each one's height at `minHeightPct`
 *    and pushing its top down to clear whatever the previous item grew
 *    into. A block therefore always starts at or after its true time, and
 *    the hour grid behind it stays accurate — only a short block's own
 *    *bottom* edge (and everything stacked after it) drifts later than the
 *    real clock. Its printed text still states the real start time and
 *    duration, so nothing is lost, only the vertical position of a block
 *    that already had to be stretched to stay legible.
 * 2. If enough short blocks stack up that the floor pushes the column past
 *    100% (the bottom of the page), scale every block in that column back
 *    down proportionally so it still fits on the one page — the minimum
 *    becomes a soft floor under real overflow pressure rather than a hard
 *    guarantee that could run the schedule onto a second sheet. This is the
 *    "slightly compress each other" case: rare with normal data (most days
 *    have some slack — breaks, a faster mat finishing early), but bounded
 *    rather than silently broken when it happens.
 */
export function layoutMatColumn(
  items: { id: string; startMin: number; endMin: number }[],
  dayStartMin: number,
  totalSpanMin: number,
  minHeightPct: number,
): { id: string; topPct: number; heightPct: number }[] {
  if (totalSpanMin <= 0 || items.length === 0) return items.map((i) => ({ id: i.id, topPct: 0, heightPct: 0 }))

  let cursorPct = 0
  const stacked = items.map((item) => {
    const natural = layoutPercent(item.startMin, item.endMin, dayStartMin, totalSpanMin)
    const topPct = Math.max(natural.topPct, cursorPct)
    const heightPct = Math.max(natural.heightPct, minHeightPct)
    cursorPct = topPct + heightPct
    return { id: item.id, topPct, heightPct }
  })

  const bottom = cursorPct
  if (bottom <= 100) return stacked
  const scale = 100 / bottom
  return stacked.map((s) => ({ topPct: s.topPct * scale, heightPct: s.heightPct * scale, id: s.id }))
}

/**
 * Hour gridlines for the time gutter, rounded out to whole hours the same way
 * ScheduleTimeline does on screen, so a printed copy and the live board never
 * disagree about where the hour lines fall.
 */
export function hourTicks(dayStartMin: number, finishMin: number): number[] {
  const from = Math.floor(dayStartMin / 60) * 60
  const to = Math.ceil(Math.max(finishMin, dayStartMin + 60) / 60) * 60
  const ticks: number[] = []
  for (let t = from; t <= to; t += 60) ticks.push(t)
  return ticks
}

/**
 * Team events aren't a division-level flag in the data model — a division's
 * `category` is only KATA/KUMITE, individual vs. team is an entry-level
 * `entryType`. But every team division in this app's templates puts "Team"
 * literally in the name ("Cadet Male Team Kata", "Senior Female Team
 * Kumite" — see backend/src/data/wkf-template.ts), so matching on the title
 * is a reliable, honest heuristic without needing a schema/API change for a
 * print-only concern. A division manually renamed to omit the word would
 * defeat this — acceptable for a provisional schedule printout.
 */
export function isTeamCategory(title: string): boolean {
  return /\bteam\b/i.test(title)
}
