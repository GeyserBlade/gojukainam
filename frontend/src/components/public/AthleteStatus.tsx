import { cn } from "@/lib/utils"
import { roundLabel } from "@/lib/draws"
import type { AthleteRunSummary, AthleteRunStatus } from "@/lib/public"

/** 🥇/🥈/🥉 for a finishing place, or null for anything else. */
export const medalFor = (place: number | null) =>
  place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : null

const PLACE_WORD: Record<number, string> = { 1: "Gold", 2: "Silver", 3: "Bronze" }

/**
 * The one line that answers a parent's actual question: is my child on now,
 * when are they next, or is it over?
 *
 * Round naming reuses `lib/draws.ts`'s `roundLabel`, the same function the
 * bracket view and the coordinator's call-up sheets use, so "Semi-finals"
 * means the same thing on every screen in the app.
 */
export function runStatusText(run: AthleteRunSummary): string {
  if (run.status === "NOT_DRAWN") return "Entered · not drawn yet"
  if (run.status === "MEDAL" && run.place) return `${PLACE_WORD[run.place]} medal`
  if (run.status === "OUT") return "Knocked out"
  if (run.status === "REPECHAGE_HOPE") return "Out of the main draw · repechage still possible"
  if (!run.next) return "Waiting"
  const round =
    run.next.phase === "REPECHAGE"
      ? "Repechage"
      : roundLabel(run.next.round, Math.log2(run.size), run.size)
  if (run.status === "READY")
    return run.next.opponentName ? `${round} · vs ${run.next.opponentName}` : `${round} · up next`
  return `${round} · waiting for an opponent`
}

const TONE: Record<AthleteRunStatus, string> = {
  NOT_DRAWN: "border-border text-muted-foreground",
  READY: "border-primary/40 bg-primary/10 text-foreground",
  WAITING: "border-border text-muted-foreground",
  REPECHAGE_HOPE: "border-border text-muted-foreground",
  OUT: "border-border text-muted-foreground",
  MEDAL: "border-belt-yellow/40 bg-belt-yellow/10 text-foreground",
}

/** Compact status pill for one category run. */
export function RunStatusChip({ run, className }: { run: AthleteRunSummary; className?: string }) {
  const medal = medalFor(run.place)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-4",
        TONE[run.status],
        className,
      )}
    >
      {medal && <span aria-hidden>{medal}</span>}
      {runStatusText(run)}
    </span>
  )
}
