import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Radio, Swords, Trophy } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getPublicBoard } from "@/lib/public"
import type { RunQueueItem } from "@/lib/run"

const roundLabel = (item: RunQueueItem) =>
  item.phase === "REPECHAGE" ? "Repechage" : `Round ${item.round}`

const Fighter = ({ name, club }: { name: string; club: string }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="truncate text-sm font-medium">{name}</span>
    <span className="shrink-0 truncate text-xs text-muted-foreground">{club}</span>
  </div>
)

const BoutCard = ({ item, isNow }: { item: RunQueueItem; isNow: boolean }) => (
  <Card className={cn(isNow && "border-primary ring-1 ring-primary/40")}>
    <CardContent className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isNow && <Badge className="bg-primary text-primary-foreground text-[10px]">On now</Badge>}
          <span className="truncate text-xs text-muted-foreground">
            {item.category} · {roundLabel(item)}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px]",
            item.isKumite ? "text-flag-red border-flag-red/30" : "text-belt-blue border-belt-blue/30",
          )}
        >
          {item.isKumite ? "Kumite" : "Kata"}
        </Badge>
      </div>
      <div className="space-y-1 border-t pt-2">
        <Fighter name={item.aka.name} club={item.aka.clubName} />
        <Fighter name={item.ao.name} club={item.ao.clubName} />
      </div>
    </CardContent>
  </Card>
)

export default function PublicBoard() {
  const { token = "" } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-board", token],
    queryFn: () => getPublicBoard(token),
    enabled: !!token,
    refetchInterval: 15000,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6 text-center">
        <div>
          <Swords className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h1 className="font-display text-xl tracking-wide">Board not available</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This link is invalid or the organizer has turned the public board off.
          </p>
        </div>
      </div>
    )
  }

  const { event, board, results } = data
  const columns = [
    ...board.mats.map((m) => ({ id: m.id as string | null, name: m.name, queue: m.queue })),
    ...(board.unassigned.length > 0
      ? [{ id: null as string | null, name: "Unassigned", queue: board.unassigned }]
      : []),
  ]
  const anyBouts = columns.some((c) => c.queue.length > 0)
  const decidedCategories = results.categories.filter((c) => c.first)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="font-display text-2xl tracking-wide sm:text-3xl">{event.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.venue} · {event.city}, {event.country}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="size-3.5 text-belt-green" />
            Live · updates automatically
          </div>
        </header>

        {/* Live mats */}
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Swords className="size-4" /> On the mats
          </div>
          {!anyBouts ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No bouts are running right now. Check back soon.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {columns
                .filter((c) => c.queue.length > 0)
                .map((col) => (
                  <div key={col.id ?? "unassigned"} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg tracking-wide">{col.name}</h2>
                      <span className="text-xs text-muted-foreground">
                        {col.queue.length} {col.queue.length === 1 ? "bout" : "bouts"}
                      </span>
                    </div>
                    {col.queue.map((item, idx) => (
                      <BoutCard
                        key={`${item.drawId}:${item.phase}:${item.round}:${item.position}`}
                        item={item}
                        isNow={idx === 0 && col.id !== null}
                      />
                    ))}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Medals */}
        {(results.clubTally.length > 0 || decidedCategories.length > 0) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Trophy className="size-4" /> Medals
            </div>

            {results.clubTally.length > 0 && (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Club</th>
                        <th className="px-3 py-2 text-center font-medium">🥇</th>
                        <th className="px-3 py-2 text-center font-medium">🥈</th>
                        <th className="px-3 py-2 text-center font-medium">🥉</th>
                        <th className="px-3 py-2 text-center font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.clubTally.map((r) => (
                        <tr key={r.clubId} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{r.clubName}</td>
                          <td className="px-3 py-2 text-center">{r.gold}</td>
                          <td className="px-3 py-2 text-center">{r.silver}</td>
                          <td className="px-3 py-2 text-center">{r.bronze}</td>
                          <td className="px-3 py-2 text-center font-medium">{r.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {decidedCategories.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {decidedCategories.map((c) => (
                  <Card key={c.drawId}>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                          {c.divisionName}
                          {c.weightClassName ? ` · ${c.weightClassName}` : ""}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px]",
                            c.category === "KUMITE"
                              ? "text-flag-red border-flag-red/30"
                              : "text-belt-blue border-belt-blue/30",
                          )}
                        >
                          {c.category}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        {c.first && (
                          <p>
                            <span className="mr-1">🥇</span>
                            {c.first.name}{" "}
                            <span className="text-xs text-muted-foreground">{c.first.clubName}</span>
                          </p>
                        )}
                        {c.second && (
                          <p>
                            <span className="mr-1">🥈</span>
                            {c.second.name}{" "}
                            <span className="text-xs text-muted-foreground">{c.second.clubName}</span>
                          </p>
                        )}
                        {c.thirds.map((t) => (
                          <p key={t.entryId}>
                            <span className="mr-1">🥉</span>
                            {t.name}{" "}
                            <span className="text-xs text-muted-foreground">{t.clubName}</span>
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
          Read-only spectator view · Gojukai Namibia
        </footer>
      </div>
    </div>
  )
}
