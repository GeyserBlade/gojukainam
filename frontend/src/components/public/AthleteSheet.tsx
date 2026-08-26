import { useQuery } from "@tanstack/react-query"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { AthleteRuns } from "@/components/athletes/AthleteRuns"
import { getPublicAthlete } from "@/lib/public"

/**
 * The detail view behind a search result: every category this athlete entered,
 * and every bout in each, fetched on demand rather than shipped to all 300
 * spectators in the search index.
 *
 * The runs themselves render from `AthleteRuns`, shared with the event hub's
 * athlete search; only the fetch (by share token) and the bottom-sheet framing
 * belong to the spectator board.
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

        <div className="p-4 pt-2">
          {isLoading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <AthleteRuns runs={data.runs} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
