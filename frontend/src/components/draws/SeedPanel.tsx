import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Medal, RotateCcw } from "lucide-react"

import { useToast, useApiErrorToast } from "@/components/Toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { listCategorySeeds, setCategorySeeds, type CategorySeedRow } from "@/lib/draws"

const STATUS_STYLES: Record<CategorySeedRow["status"], string> = {
  DRAFT: "text-muted-foreground",
  SUBMITTED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  APPROVED: "bg-belt-green/15 text-belt-green border-belt-green/30",
}

const NONE = "none"
/** Seeding only the top handful is the norm; more than 8 defeats the purpose. */
const MAX_SEED = 8

export function SeedPanel({
  eventId,
  divisionId,
  weightClassId,
  canManage,
}: {
  eventId: string
  divisionId: string
  weightClassId: string | null
  canManage: boolean
}) {
  const toast = useToast()
  const apiError = useApiErrorToast()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, number | null>>({})

  const queryKey = ["category-seeds", eventId, divisionId, weightClassId ?? ""]
  // Loaded even while collapsed so the header can show the seeded count — that
  // summary is the reason to open the panel in the first place.
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => listCategorySeeds({ eventId, divisionId, weightClassId }),
    enabled: !!eventId && !!divisionId,
  })

  // Reset the draft whenever the server's view changes or we switch category.
  useEffect(() => {
    if (data) setDraft(Object.fromEntries(data.entries.map((e) => [e.entryId, e.seed])))
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () =>
      setCategorySeeds({
        eventId,
        divisionId,
        weightClassId,
        seeds: Object.entries(draft).map(([entryId, seed]) => ({ entryId, seed })),
      }),
    onSuccess: () => {
      toast.success("Seeding saved")
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ["draw-categories", eventId] })
      if (data?.drawId) queryClient.invalidateQueries({ queryKey: ["draw", data.drawId] })
    },
    onError: (err) => apiError(err, "Could not save the seeding"),
  })

  const duplicates = useMemo(() => {
    const counts = new Map<number, number>()
    for (const seed of Object.values(draft)) {
      if (seed !== null) counts.set(seed, (counts.get(seed) ?? 0) + 1)
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([seed]) => seed))
  }, [draft])

  const dirty = useMemo(() => {
    if (!data) return false
    return data.entries.some((e) => (draft[e.entryId] ?? null) !== e.seed)
  }, [data, draft])

  const seededCount = Object.values(draft).filter((s) => s !== null).length

  /** Close up gaps so the saved values read 1..N, purely for tidiness. */
  const renumber = () => {
    const ordered = Object.entries(draft)
      .filter(([, seed]) => seed !== null)
      .sort((a, b) => a[1]! - b[1]!)
    setDraft((prev) => {
      const next = { ...prev }
      ordered.forEach(([entryId], i) => { next[entryId] = i + 1 })
      return next
    })
  }

  const clearAll = () =>
    setDraft((prev) => Object.fromEntries(Object.keys(prev).map((id) => [id, null])))

  return (
    <Card className="print:hidden">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-accent"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Medal className="h-4 w-4 shrink-0 text-belt-orange" />
          <span className="min-w-0 flex-1 text-sm font-medium">Seeding</span>
          {seededCount > 0 && (
            <Badge variant="outline" className="shrink-0 font-normal text-[10px]">
              {seededCount} seeded
            </Badge>
          )}
        </button>

        {open && (
          <div className="border-t px-4 py-3">
            <p className="mb-3 text-xs text-muted-foreground">
              Seed the strongest few athletes from prior performance. Seeds 1 and 2 are placed in
              opposite halves so they can only meet in the final; everyone left unseeded is drawn
              at random, except that athletes from the same club are kept apart for as many rounds
              as the bracket allows. Seeding takes effect the next time this category is drawn.
            </p>

            {isLoading || !data ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : data.entries.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No entries in this category yet.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  {data.entries.map((entry) => {
                    const value = draft[entry.entryId] ?? null
                    const clash = value !== null && duplicates.has(value)
                    return (
                      <div
                        key={entry.entryId}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-2 py-1.5",
                          clash ? "border-flag-red/50 bg-flag-red/5" : "border-transparent",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{entry.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{entry.clubName}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "hidden shrink-0 font-normal text-[10px] sm:inline-flex",
                            STATUS_STYLES[entry.status],
                          )}
                        >
                          {entry.status.toLowerCase()}
                        </Badge>
                        <Select
                          value={value === null ? NONE : String(value)}
                          onValueChange={(next) =>
                            setDraft((prev) => ({
                              ...prev,
                              [entry.entryId]: next === NONE ? null : Number(next),
                            }))
                          }
                          disabled={!canManage || saveMutation.isPending}
                        >
                          <SelectTrigger className="h-8 w-[72px] shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {Array.from({ length: MAX_SEED }, (_, i) => i + 1).map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>

                {duplicates.size > 0 && (
                  <p className="mt-2 text-xs text-flag-red">
                    Two athletes share seed {[...duplicates].sort((a, b) => a - b).join(", ")}.
                    Give each a different number before saving.
                  </p>
                )}

                {data.drawLocked && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This category's draw is locked. Seeding changes won't affect the published
                    bracket until it is unlocked and regenerated.
                  </p>
                )}

                {canManage && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate()}
                      disabled={!dirty || duplicates.size > 0 || saveMutation.isPending}
                    >
                      Save seeding
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={renumber}
                      disabled={seededCount === 0 || saveMutation.isPending}
                      title="Close up gaps so the seeds read 1, 2, 3 …"
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Renumber
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      disabled={seededCount === 0 || saveMutation.isPending}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
