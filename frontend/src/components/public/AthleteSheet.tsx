import { useQuery } from "@tanstack/react-query"
import { Loader2, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { MedalBadge } from "@/components/MedalBadge"
import { cn } from "@/lib/utils"
import { roundLabel, boutMedalType } from "@/lib/draws"
import { getPublicAthlete, type AthleteBout, type AthleteRun } from "@/lib/public"
import { RunStatusChip, medalFor } from "./AthleteStatus"

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

function RunCard({ run }: { run: AthleteRun }) {
  const medal = medalFor(run.place)
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

/**
 * The detail view behind a search result: every category this athlete entered,
 * and every bout in each, fetched on demand rather than shipped to all 300
 * spectators in the search index.
 */
export function AthleteSheet({
  token,
  athleteId,
  onClose,
}: {
  token: string
  athleteId: string | null
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["public-athlete", token, athleteId],
    queryFn: () => getPublicAthlete(token, athleteId!),
    enabled: !!athleteId,
    // Same cadence as the live board: a parent watching this screen while
    // their child fights should see the result land without a manual refresh.
    refetchInterval: 15000,
  })

  return (
    <Sheet open={!!athleteId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle className="font-display text-xl tracking-wide">
            {data?.name ?? "Athlete"}
          </SheetTitle>
          {data && <p className="text-sm text-muted-foreground">{data.clubName}</p>}
        </SheetHeader>

        <div className="space-y-3 p-4 pt-2">
          {isLoading || !data ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : data.runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This athlete is entered but no draw has been made for their categories yet.
            </p>
          ) : (
            data.runs.map((run) => <RunCard key={run.drawId ?? run.entryId} run={run} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
