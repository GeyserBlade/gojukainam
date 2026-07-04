import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  RefreshCw,
  Shuffle,
  Swords,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { BracketView, PodiumView, RepechageView } from "@/components/draws/BracketView"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { listEvents } from "@/lib/events"
import {
  createDraw,
  deleteDraw,
  getDraw,
  listDrawCategories,
  regenerateDraw,
  setBoutWinner,
  type DrawBout,
  type DrawCategoryRow,
  type DrawStatus,
} from "@/lib/draws"

const STATUS_STYLES: Record<DrawStatus, string> = {
  DRAWN: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  IN_PROGRESS: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  COMPLETED: "bg-belt-green/15 text-belt-green border-belt-green/30",
}

const STATUS_LABEL: Record<DrawStatus, string> = {
  DRAWN: "Drawn",
  IN_PROGRESS: "In progress",
  COMPLETED: "Complete",
}

const CATEGORY_STYLES = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
} as const

const categoryKey = (row: DrawCategoryRow) => `${row.divisionId}:${row.weightClassId ?? ""}`
const categoryTitle = (row: DrawCategoryRow) =>
  row.weightClassName ? `${row.divisionName} · ${row.weightClassName}` : row.divisionName

const CategoryCard = ({
  row,
  selected,
  onSelect,
}: {
  row: DrawCategoryRow
  selected: boolean
  onSelect: () => void
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent",
      selected && "border-primary ring-1 ring-primary",
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{categoryTitle(row)}</p>
      <Badge
        variant="outline"
        className={cn("shrink-0 font-normal text-[10px]", CATEGORY_STYLES[row.category])}
      >
        {row.category}
      </Badge>
    </div>
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <UsersIcon className="h-3 w-3" />
        {row.entryCount}
      </span>
      {row.draw ? (
        <>
          <Badge
            variant="outline"
            className={cn("font-normal text-[10px]", STATUS_STYLES[row.draw.status])}
          >
            {STATUS_LABEL[row.draw.status]}
          </Badge>
          {!row.draw.inSync && (
            <span className="flex items-center gap-1 text-[10px] text-belt-orange">
              <AlertTriangle className="h-3 w-3" />
              Entries changed
            </span>
          )}
        </>
      ) : (
        <Badge variant="outline" className="font-normal text-[10px] text-muted-foreground">
          No draw
        </Badge>
      )}
    </div>
  </button>
)

export default function DrawsPage() {
  const { role } = useAuth()
  const toast = useToast()
  const apiError = useApiErrorToast()
  const confirm = useConfirm()
  const queryClient = useQueryClient()

  const canManage = role === "ADMIN" || role === "SUPERADMIN"

  const [eventId, setEventId] = useState<string>("")
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  })

  useEffect(() => {
    if (!eventId && events?.length) {
      const preferred = events.find((e) => e.status === "ACTIVE" || e.status === "CLOSED")
      setEventId((preferred ?? events[0]).id)
    }
  }, [events, eventId])

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["draw-categories", eventId],
    queryFn: () => listDrawCategories(eventId),
    enabled: !!eventId,
  })

  const selected = useMemo(
    () => categories?.find((c) => categoryKey(c) === selectedKey) ?? null,
    [categories, selectedKey],
  )

  const drawId = selected?.draw?.id ?? null
  const { data: draw, isLoading: drawLoading } = useQuery({
    queryKey: ["draw", drawId],
    queryFn: () => getDraw(drawId!),
    enabled: !!drawId,
  })

  const invalidate = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["draw-categories", eventId] })
    if (id) queryClient.invalidateQueries({ queryKey: ["draw", id] })
  }

  const generateMutation = useMutation({
    mutationFn: (row: DrawCategoryRow) =>
      createDraw({
        eventId,
        divisionId: row.divisionId,
        weightClassId: row.weightClassId,
      }),
    onSuccess: () => {
      toast.success("Draw generated")
      invalidate()
    },
    onError: (err) => apiError(err, "Could not generate the draw"),
  })

  const regenerateMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) => regenerateDraw(id, force),
    onSuccess: () => {
      toast.success("Draw regenerated")
      invalidate()
    },
    onError: (err) => apiError(err, "Could not regenerate the draw"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDraw(id),
    onSuccess: () => {
      toast.success("Draw deleted")
      invalidate()
    },
    onError: (err) => apiError(err, "Could not delete the draw"),
  })

  const winnerMutation = useMutation({
    mutationFn: ({ boutId, winnerEntryId }: { boutId: string; winnerEntryId: string | null }) =>
      setBoutWinner(drawId!, boutId, winnerEntryId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["draw", drawId], updated)
      queryClient.invalidateQueries({ queryKey: ["draw-categories", eventId] })
    },
    onError: (err) => apiError(err, "Could not save the result"),
  })

  const handleSetWinner = (bout: DrawBout, winnerEntryId: string | null) => {
    if (!bout.id) return
    winnerMutation.mutate({ boutId: bout.id, winnerEntryId })
  }

  const handleRegenerate = async () => {
    if (!draw) return
    const hasResults = draw.status !== "DRAWN"
    const ok = await confirm({
      title: "Regenerate draw?",
      description: hasResults
        ? "This draw already has results captured. Regenerating creates a fresh random draw and discards all results."
        : "This creates a fresh random draw from the current entries.",
      confirmText: "Regenerate",
      destructive: hasResults,
    })
    if (ok) regenerateMutation.mutate({ id: draw.id, force: true })
  }

  const handleDelete = async () => {
    if (!draw) return
    const ok = await confirm({
      title: "Delete draw?",
      description: "The draw and any captured results will be removed. Entries are not affected.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) {
      deleteMutation.mutate(draw.id)
    }
  }

  const busy =
    generateMutation.isPending ||
    regenerateMutation.isPending ||
    deleteMutation.isPending ||
    winnerMutation.isPending

  return (
    <AppShell title="Draws">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider">DRAWS & RESULTS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate random draws per category, capture results and follow each athlete's progression.
        </p>
      </div>

      <div className="mb-4 max-w-md">
        <Label className="mb-1.5 block text-xs text-muted-foreground">Event</Label>
        {eventsLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select
            value={eventId}
            onValueChange={(v) => {
              setEventId(v)
              setSelectedKey(null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Category list */}
        <div className="space-y-2 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-1">
          {categoriesLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : !categories?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No divisions found for this event.
              </CardContent>
            </Card>
          ) : (
            categories.map((row) => (
              <CategoryCard
                key={categoryKey(row)}
                row={row}
                selected={categoryKey(row) === selectedKey}
                onSelect={() => setSelectedKey(categoryKey(row))}
              />
            ))
          )}
        </div>

        {/* Bracket panel */}
        <div className="min-w-0 space-y-4">
          {!selected ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Swords className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a category on the left to view or generate its draw.
                </p>
              </CardContent>
            </Card>
          ) : !selected.draw ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Shuffle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">{categoryTitle(selected)}</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  {selected.entryCount < 2
                    ? "At least 2 submitted or approved entries are needed to generate a draw."
                    : `${selected.entryCount} entries ready — generate a random draw.`}
                </p>
                {canManage && (
                  <Button
                    onClick={() => generateMutation.mutate(selected)}
                    disabled={busy || selected.entryCount < 2}
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    Generate draw
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : drawLoading || !draw ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="truncate font-display text-xl tracking-wide sm:text-2xl">
                    {draw.division.name}
                    {draw.weightClass ? ` · ${draw.weightClass.name}` : ""}
                  </h2>
                  <Badge
                    variant="outline"
                    className={cn("font-normal text-[10px]", STATUS_STYLES[draw.status])}
                  >
                    {STATUS_LABEL[draw.status]}
                  </Badge>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={busy}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDelete} disabled={busy}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5 text-flag-red" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Out-of-sync warning */}
              {!draw.sync.inSync && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-belt-orange/40 bg-belt-orange/10 px-3 py-2.5 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-belt-orange" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-belt-orange">Entries have changed since this draw</p>
                    <p className="text-xs text-muted-foreground">
                      {draw.sync.added.length > 0 &&
                        `New: ${draw.sync.added.map((e) => e.name).join(", ")}. `}
                      {draw.sync.removed.length > 0 &&
                        `Withdrawn: ${draw.sync.removed.map((e) => e.name).join(", ")}.`}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={busy}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                  )}
                </div>
              )}

              <PodiumView draw={draw} />

              <Card>
                <CardContent className="pt-4">
                  <BracketView
                    draw={draw}
                    canManage={canManage}
                    onSetWinner={handleSetWinner}
                    busy={busy}
                  />
                </CardContent>
              </Card>

              <RepechageView
                draw={draw}
                canManage={canManage}
                onSetWinner={handleSetWinner}
                busy={busy}
              />
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
