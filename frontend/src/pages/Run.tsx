import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Flag,
  GripVertical,
  ListRestart,
  MonitorPlay,
  MoveRight,
  Search,
  Swords,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { useApiErrorToast } from "@/components/Toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MedalBadge } from "@/components/MedalBadge"
import { cn } from "@/lib/utils"
import { EntryService, type Entry } from "@/lib/entries"
import { setBoutScore, setBoutWinner, boutMedalType } from "@/lib/draws"
import {
  clearMatQueueOrder,
  getRunBoard,
  reorderMatQueue,
  setBoutMat,
  type RunBoard,
  type RunEntry,
  type RunQueueItem,
} from "@/lib/run"

// The mat/category planning that used to live here as a "Plan" sub-tab moved to
// the hub's own Plan tab, which does the same job against a real schedule. This
// page is now day-of only: run the bouts, check people in.
type TabKey = "checkin" | "run"

const boutKeyOf = (i: RunQueueItem) => `${i.drawId}:${i.phase}:${i.round}:${i.position}`

const roundLabel = (item: RunQueueItem) =>
  item.phase === "REPECHAGE" ? "Repechage" : `Round ${item.round}`

// ---------- Presence dot ----------
const PresenceDot = ({ checkedIn }: { checkedIn: boolean }) => (
  <span
    title={checkedIn ? "Checked in" : "Not checked in"}
    className={cn(
      "inline-block size-2.5 shrink-0 rounded-full",
      checkedIn ? "bg-belt-green" : "bg-belt-orange/60 ring-1 ring-belt-orange",
    )}
  />
)

// ---------- Fighter line ----------
const Fighter = ({ side, entry }: { side: "AKA" | "AO"; entry: RunEntry }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
        side === "AKA" ? "bg-flag-red/15 text-flag-red" : "bg-belt-blue/15 text-belt-blue",
      )}
    >
      {side}
    </span>
    <PresenceDot checkedIn={entry.checkedIn} />
    <div className="min-w-0">
      <p className="truncate text-sm font-medium leading-tight">{entry.name}</p>
      <p className="truncate text-[11px] text-muted-foreground leading-tight">{entry.clubName}</p>
    </div>
  </div>
)

export default function RunPage() {
  const { canManageEvent } = useAuth()
  const { eventId } = useSelectedEvent()
  // Admin, or coordinator of the selected event — mirrors the backend's
  // requireEventManager on every mutating run route.
  const canManage = canManageEvent(eventId)
  const [tab, setTab] = useState<TabKey>("run")

  if (!eventId) return null

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-4">
        <TabsList>
          <TabsTrigger value="run">Run</TabsTrigger>
          <TabsTrigger value="checkin">Check-in</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "run" && <RunTab eventId={eventId} canManage={canManage} />}
      {tab === "checkin" && <CheckInTab eventId={eventId} canManage={canManage} />}
    </>
  )
}

// ============================ RUN TAB ============================
function RunTab({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const apiError = useApiErrorToast()

  const { data: board, isLoading } = useQuery({
    queryKey: ["run-board", eventId],
    queryFn: () => getRunBoard(eventId),
    refetchOnWindowFocus: true,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["run-board", eventId] })

  const winnerMutation = useMutation({
    mutationFn: ({ drawId, boutId, winnerEntryId }: { drawId: string; boutId: string; winnerEntryId: string }) =>
      setBoutWinner(drawId, boutId, winnerEntryId),
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not save the result"),
  })

  // Kiken (walkover): the present fighter wins by the opponent's withdrawal.
  const kikenMutation = useMutation({
    mutationFn: ({ item, winnerEntryId }: { item: RunQueueItem; winnerEntryId: string }) =>
      setBoutScore(item.drawId, item.boutId!, {
        winnerEntryId,
        outcome: "KIKEN",
        akaScore: 0,
        aoScore: 0,
      }),
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not record the walkover"),
  })

  const moveMutation = useMutation({
    mutationFn: ({ boutId, matId }: { boutId: string; matId: string | null }) => setBoutMat(boutId, matId),
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not move the bout"),
  })

  const reorderMutation = useMutation({
    mutationFn: ({ matId, boutIds }: { matId: string; boutIds: string[] }) =>
      reorderMatQueue(matId, boutIds),
    onError: (e) => {
      apiError(e, "Could not save the running order")
      invalidate()
    },
    onSettled: invalidate,
  })

  const clearOrderMutation = useMutation({
    mutationFn: (matId: string) => clearMatQueueOrder(matId),
    onError: (e) => apiError(e, "Could not clear the running order"),
    onSettled: invalidate,
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Reorder a mat's queue: optimistic local move, then persist the new order.
  const handleReorder = (matId: string, queue: RunQueueItem[]) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = queue.map(boutKeyOf)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const newQueue = arrayMove(queue, oldIndex, newIndex)
    queryClient.setQueryData<RunBoard>(["run-board", eventId], (old) =>
      old
        ? { ...old, mats: old.mats.map((m) => (m.id === matId ? { ...m, queue: newQueue } : m)) }
        : old,
    )
    const boutIds = newQueue.map((i) => i.boutId).filter((x): x is string => !!x)
    reorderMutation.mutate({ matId, boutIds })
  }

  const busy = winnerMutation.isPending || kikenMutation.isPending || moveMutation.isPending
  const allMats = board?.mats ?? []

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const columns = [
    ...(board?.mats ?? []).map((m) => ({ id: m.id, name: m.name, queue: m.queue })),
    ...(board && board.unassigned.length > 0
      ? [{ id: null as string | null, name: "Unassigned", queue: board.unassigned }]
      : []),
  ]

  if (columns.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Swords className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No bouts ready to run. Generate draws, then put the categories on a floor under Plan.
          </p>
        </CardContent>
      </Card>
    )
  }

  const BoutCard = ({ item, isNow }: { item: RunQueueItem; isNow: boolean }) => {
    const canAct = canManage && !!item.boutId
    const medalType = boutMedalType(item, item.size)
    return (
      <Card className={cn(isNow && "border-primary ring-1 ring-primary/40")}>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isNow && (
                <Badge className="bg-primary text-primary-foreground text-[10px]">On now</Badge>
              )}
              <span className="truncate text-xs text-muted-foreground">
                {item.category} · {roundLabel(item)}
              </span>
              {medalType && <MedalBadge type={medalType} />}
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

          <div className="space-y-1.5">
            <Fighter side="AKA" entry={item.aka} />
            <Fighter side="AO" entry={item.ao} />
          </div>

          {canAct && (
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
              <Button
                size="xs"
                onClick={() =>
                  navigate(`${item.isKumite ? "/scoreboard" : "/kata"}/${item.drawId}/${item.boutId}`)
                }
                disabled={busy}
              >
                <MonitorPlay />
                Score
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  winnerMutation.mutate({ drawId: item.drawId, boutId: item.boutId!, winnerEntryId: item.aka.entryId })
                }
                disabled={busy}
              >
                AKA wins
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  winnerMutation.mutate({ drawId: item.drawId, boutId: item.boutId!, winnerEntryId: item.ao.entryId })
                }
                disabled={busy}
              >
                AO wins
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="xs" variant="ghost" disabled={busy}>
                    <Flag />
                    Kiken
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onSelect={() => kikenMutation.mutate({ item, winnerEntryId: item.ao.entryId })}
                  >
                    AKA absent → AO advances
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => kikenMutation.mutate({ item, winnerEntryId: item.aka.entryId })}
                  >
                    AO absent → AKA advances
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {allMats.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="xs" variant="ghost" disabled={busy}>
                      <MoveRight />
                      Move
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {allMats.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onSelect={() => moveMutation.mutate({ boutId: item.boutId!, matId: m.id })}
                      >
                        Move to {m.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => moveMutation.mutate({ boutId: item.boutId!, matId: null })}
                    >
                      Clear override
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Draggable wrapper: a grip handle on the left reorders bouts within a mat.
  const SortableBoutCard = ({ item, isNow }: { item: RunQueueItem; isNow: boolean }) => {
    const id = boutKeyOf(item)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
    return (
      <div ref={setNodeRef} style={style} className="relative pl-5">
        <button
          type="button"
          className="absolute inset-y-0 left-0 z-10 flex w-5 touch-none cursor-grab items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <BoutCard item={item} isNow={isNow} />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((col) => (
        <div key={col.id ?? "unassigned"} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">{col.name}</h3>
            <span className="text-xs text-muted-foreground">
              {col.queue.length} {col.queue.length === 1 ? "bout" : "bouts"}
            </span>
          </div>
          {/* A drag-to-reorder is otherwise invisible and permanent: the mat
              keeps following an order someone set hours ago with no way to
              tell, and no way back. */}
          {canManage && col.id !== null && col.queue.some((i) => i.queueOrder !== null) ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2 py-1">
              <span className="text-[11px] leading-tight text-muted-foreground">
                Manually ordered
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 shrink-0 px-2 text-[11px]"
                onClick={() => clearOrderMutation.mutate(col.id as string)}
                disabled={clearOrderMutation.isPending}
              >
                <ListRestart className="mr-1 size-3" />
                Clear
              </Button>
            </div>
          ) : null}
          {col.queue.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Nothing ready on this mat.
              </CardContent>
            </Card>
          ) : canManage && col.id !== null && col.queue.length > 1 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleReorder(col.id, col.queue)}
            >
              <SortableContext
                items={col.queue.map(boutKeyOf)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {col.queue.map((item, idx) => (
                    <SortableBoutCard key={boutKeyOf(item)} item={item} isNow={idx === 0} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            col.queue.map((item, idx) => (
              <BoutCard
                key={boutKeyOf(item)}
                item={item}
                isNow={idx === 0 && col.id !== null}
              />
            ))
          )}
        </div>
      ))}
    </div>
  )
}

// ============================ CHECK-IN TAB ============================
function CheckInTab({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const queryClient = useQueryClient()
  const apiError = useApiErrorToast()
  const [search, setSearch] = useState("")

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", { eventId, status: "APPROVED", searchQuery: search || undefined }],
    queryFn: () => EntryService.list({ eventId, status: "APPROVED", searchQuery: search || undefined }),
    enabled: !!eventId,
  })

  const checkInMutation = useMutation({
    mutationFn: ({ id, checkedIn }: { id: string; checkedIn: boolean }) =>
      EntryService.setCheckIn(id, checkedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entries"] }),
    onError: (e) => apiError(e, "Could not update check-in"),
  })

  const checkedCount = entries.filter((e) => e.checkedIn).length

  const name = (e: Entry) =>
    e.athlete ? `${e.athlete.firstName} ${e.athlete.lastName}` : e.team?.name ?? "Unknown"

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search athletes, teams, clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {checkedCount} / {entries.length} checked in
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No approved entries to check in.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id} className={cn(e.checkedIn && "border-belt-green/40 bg-belt-green/5")}>
              <CardContent className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PresenceDot checkedIn={!!e.checkedIn} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name(e)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.club.name} · {e.division.name}
                      {e.weightClass ? ` · ${e.weightClass.name}` : ""}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    variant={e.checkedIn ? "outline" : "default"}
                    onClick={() => checkInMutation.mutate({ id: e.id, checkedIn: !e.checkedIn })}
                    disabled={checkInMutation.isPending}
                  >
                    <Check />
                    {e.checkedIn ? "Checked in" : "Check in"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
