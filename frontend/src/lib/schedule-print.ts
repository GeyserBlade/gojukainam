// Pure layout math for the printable one-page schedule (pages/PlanPrint.tsx).
// Split out from the page itself so it can be unit tested directly
// (scripts/test-schedule-print.ts), same convention as lib/schedule.ts.
//
// The on-screen ScheduleTimeline positions items in pixels at a chosen zoom
// level, which is exactly wrong for a fixed physical page: a print layout has
// to fit one sheet of paper regardless of how many hours the day spans, so
// every item is placed as a *percentage* of the whole day's span instead.

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
