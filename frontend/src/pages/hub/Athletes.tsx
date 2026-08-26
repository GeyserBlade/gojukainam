import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Users, X } from "lucide-react"

import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AthleteRuns } from "@/components/athletes/AthleteRuns"
import { RunStatusChip, medalFor } from "@/components/athletes/AthleteStatus"
import { cn } from "@/lib/utils"
import {
  getEventAthlete,
  getEventAthletes,
  matchesAthlete,
  searchTerms,
  type AthleteRow,
} from "@/lib/athlete-runs"

/**
 * Athlete search for the event hub — the spectator board's "find my child"
 * feature, given to the people running the tournament.
 *
 * The question is the same one a coach at the desk asks all day ("where is
 * this athlete up to?") and the answer is scattered everywhere else in the
 * hub: the Draws tab knows one bracket, Results knows the podiums, Run knows
 * what is on now. Here it is one person's whole day on one screen.
 *
 * Two panes rather than the board's full-screen search-then-sheet: the hub is
 * a desk with a keyboard, and the useful motion there is typing a name, then
 * arrowing down a club's worth of athletes with the detail staying put.
 */

const ROW_CAP = 100

function AthleteRowButton({
  row,
  selected,
  onSelect,
}: {
  row: AthleteRow
  selected: boolean
  onSelect: () => void
}) {
  // Medals first, then whatever is happening now — the two things worth
  // seeing without opening the athlete.
  const headline =
    row.runs.find((r) => r.status === "MEDAL") ??
    row.runs.find((r) => r.status === "READY") ??
    row.runs[0]
  const medalRun = row.runs.find((r) => r.place)

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-start justify-between gap-3 border-b px-3 py-2.5 text-left last:border-0 hover:bg-muted/50",
        selected && "bg-muted",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {medalRun && <span className="mr-1">{medalFor(medalRun.place)}</span>}
          {row.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{row.clubName}</p>
        {headline && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[11px] text-muted-foreground">{headline.category}</span>
            <RunStatusChip run={headline} />
          </p>
        )}
      </div>
      {row.runs.length > 1 && (
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
          {row.runs.length}
        </span>
      )}
    </button>
  )
}

/** The right-hand pane: one athlete's categories and bouts, polled while open. */
function AthleteDetailPane({ eventId, athleteId }: { eventId: string; athleteId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["event-athlete", eventId, athleteId],
    queryFn: () => getEventAthlete(eventId, athleteId),
    // Same cadence as the live run board: someone watching this while the
    // athlete fights should see the result land without a manual refresh.
    refetchInterval: 15000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Could not load this athlete. They may have been withdrawn from the event.
      </p>
    )
  }

  const medals = data.runs.filter((r) => r.place).length

  return (
    <div className="p-4">
      <div className="mb-3 border-b pb-3">
        <h2 className="font-display text-xl tracking-wide">{data.name}</h2>
        <p className="text-sm text-muted-foreground">
          {data.clubName}
          {" · "}
          {data.runs.length === 1 ? "1 category" : `${data.runs.length} categories`}
          {medals > 0 && ` · ${medals === 1 ? "1 medal" : `${medals} medals`}`}
        </p>
      </div>
      {/* Undrawn categories return null and get no link — there is no bracket
          to open yet. */}
      <AthleteRuns
        runs={data.runs}
        bracketHref={(run) => (run.drawId ? `/hub/draws?draw=${run.drawId}` : null)}
      />
    </div>
  )
}

export default function HubAthletesPage() {
  const { eventId } = useSelectedEvent()
  const [query, setQuery] = useState("")
  const [athleteId, setAthleteId] = useState<string | null>(null)

  // The whole index, fetched once so filtering is local and instant. It only
  // moves when a result lands, so it polls far more gently than the run board.
  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ["event-athletes", eventId],
    queryFn: () => getEventAthletes(eventId),
    enabled: !!eventId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const terms = useMemo(() => searchTerms(query), [query])
  const found = useMemo(
    () => (terms.length === 0 ? athletes : athletes.filter((row) => matchesAthlete(row, terms))),
    [athletes, terms],
  )

  // A selected athlete who no longer matches the query is still shown — the
  // detail pane emptying itself as you type another name is worse than a
  // stale-looking header.
  const selected = athleteId && athletes.some((a) => a.id === athleteId) ? athleteId : null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* Search + results list */}
      <Card className="overflow-hidden">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Athlete or club name"
              className="pl-8 pr-8"
              // Names are not words: autocorrect turns them into other names.
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {!isLoading && (
            <p className="mt-2 text-xs text-muted-foreground">
              {found.length} of {athletes.length}
              {athletes.length === 1 ? " athlete" : " athletes"}
              {found.length > ROW_CAP && ` · showing the first ${ROW_CAP}`}
            </p>
          )}
        </div>

        {/* Its own scroll region so the detail pane never scrolls away while
            you work down a club's list. */}
        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : athletes.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nobody is entered in this event yet.
            </p>
          ) : found.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nobody matches “{query}”.
            </p>
          ) : (
            found
              .slice(0, ROW_CAP)
              .map((row) => (
                <AthleteRowButton
                  key={row.id}
                  row={row}
                  selected={row.id === selected}
                  onSelect={() => setAthleteId(row.id)}
                />
              ))
          )}
        </div>
      </Card>

      {/* Detail */}
      <Card>
        {selected ? (
          <AthleteDetailPane eventId={eventId} athleteId={selected} />
        ) : (
          <CardContent className="py-20 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Pick an athlete to see every category they entered, where each one stands, and how
              each bout went.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
