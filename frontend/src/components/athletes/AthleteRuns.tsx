import { ArrowUpRight, Loader2, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { MedalBadge } from "@/components/MedalBadge"
import { cn } from "@/lib/utils"
import { roundLabel, boutMedalType } from "@/lib/draws"
import type { AthleteBout, AthleteRun } from "@/lib/athlete-runs"
import { RunStatusChip, medalFor } from "./AthleteStatus"

/**
 * One athlete's categories and bouts, rendered the same way wherever they are
 * shown: the spectator board's athlete sheet and the event hub's athlete
 * search both mount `AthleteRuns` over the same payload. A coach comparing the
 * hub against the board a parent is holding should be reading one screen, not
 * two that agree approximately.
 *
 * The one thing that differs is `bracketHref`: the hub links each category
 * through to its bracket, and the spectator board has no bracket view to link
 * to. It is a prop rather than a branch on "am I public?" so that this file
 * never has to know which surface it is rendering on.
 */

/**
 * Where a run's full bracket lives, or null for no link. Returning null for a
 * given run is normal, not an error — an undrawn category has no bracket yet.
 */
export type BracketHref = (run: AthleteRun) => string | null

/** "Semi-finals", "Round of 16", or "Repechage" for the loser's ladder. */
const boutRound = (bout: Pick<AthleteBout, "phase" | "round">, size: number) =>
  bout.phase === "REPECHAGE" ? "Repechage" : roundLabel(bout.round, Math.log2(size), size)

/**
 * One line of an athlete's journey. Deliberately reads from their side — "won
 * 5 - 3", never "aka 5, ao 3" — because the spectator following it does not
 * know or care which corner their child was in.
 */
function BoutRow({ bout, size }: { bout: AthleteBout; size: number }) {
  const decided = bout.won !== null
  const hasScore = bout.scoreFor !== null && bout.scoreAgainst !== null
  const medalType = boutMedalType(bout, size)

  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {boutRound(bout, size)}
          {medalType && <MedalBadge type={medalType} />}
        </p>
        <p className="truncate text-sm">
          {bout.bye ? (
            <span className="text-muted-foreground">Bye — no bout</span>
          ) : bout.opponentName ? (
            <>
              <span className="text-muted-foreground">vs </span>
              {bout.opponentName}
              {bout.opponentClubName && (
                <span className="text-xs text-muted-foreground"> · {bout.opponentClubName}</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Opponent still to be decided</span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {bout.bye ? (
          <span className="text-xs text-muted-foreground">advanced</span>
        ) : decided ? (
          <>
            <span
              className={cn(
                "text-sm font-medium",
                bout.won ? "text-belt-green" : "text-muted-foreground",
              )}
            >
              {bout.won ? "Won" : "Lost"}
            </span>
            {hasScore && (
              <span className="ml-1.5 text-sm tabular-nums text-muted-foreground">
                {bout.scoreFor} – {bout.scoreAgainst}
              </span>
            )}
          </>
        ) : bout.startedAt ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Loader2 className="size-3 animate-spin" /> On now
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">to come</span>
        )}
      </div>
    </li>
  )
}

/** One category: where it stands, and every bout in it. */
export function RunCard({ run, bracketHref }: { run: AthleteRun; bracketHref?: BracketHref }) {
  const medal = medalFor(run.place)
  const href = bracketHref?.(run) ?? null
  return (
    <section className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base tracking-wide">{run.category}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {run.matName && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {run.matName}
              </span>
            )}
            {run.bouts.length > 0 && (
              <span>{run.bouts.length === 1 ? "1 bout" : `${run.bouts.length} bouts`}</span>
            )}
            {href && (
              // A real link, not a button: the useful thing at a desk is
              // middle-clicking a category open while keeping the athlete on
              // screen.
              <Link
                to={href}
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Bracket
                <ArrowUpRight className="size-3" />
              </Link>
            )}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px]",
            run.discipline === "KUMITE"
              ? "text-flag-red border-flag-red/30"
              : "text-belt-blue border-belt-blue/30",
          )}
        >
          {run.discipline === "KUMITE" ? "Kumite" : "Kata"}
        </Badge>
      </div>

      <div className="mt-2">
        {medal ? (
          <p className="text-sm font-medium">
            <span className="mr-1">{medal}</span>
            {run.place === 1 ? "Gold" : run.place === 2 ? "Silver" : "Bronze"} medal
          </p>
        ) : (
          <RunStatusChip run={run} />
        )}
      </div>

      {run.status === "NOT_DRAWN" && (
        <p className="mt-2 text-xs text-muted-foreground">
          The bracket for this category has not been made yet. Bouts appear here once it is drawn.
        </p>
      )}

      {run.bouts.length > 0 && (
        <ul className="mt-2 border-t pt-1">
          {run.bouts.map((bout) => (
            <BoutRow key={`${bout.phase}:${bout.round}`} bout={bout} size={run.size} />
          ))}
        </ul>
      )}
    </section>
  )
}

/** Every category this athlete entered, or a line saying why there are none. */
export function AthleteRuns({
  runs,
  className,
  bracketHref,
}: {
  runs: AthleteRun[]
  className?: string
  bracketHref?: BracketHref
}) {
  if (runs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        This athlete is entered but no draw has been made for their categories yet.
      </p>
    )
  }
  return (
    <div className={cn("space-y-3", className)}>
      {runs.map((run) => (
        <RunCard key={run.drawId ?? run.entryId} run={run} bracketHref={bracketHref} />
      ))}
    </div>
  )
}
