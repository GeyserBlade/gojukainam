import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CalendarPlus,
  ChevronDown,
  Clock3,
  LayoutGrid,
  Layers,
  Plus,
  Sparkles,
  Swords,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { createMat, deleteMat, updateMat } from "@/lib/run"
import { updateEventTiming } from "@/lib/events"
import {
  categoryTitle,
  createPlanBlock,
  deletePlanBlock,
  getPlanBoard,
  setPlanOrder,
  updatePlanBlock,
  type PlanBlock,
  type PlanBoard as PlanBoardData,
  type PlanCategory,
  type PlanLane,
} from "@/lib/plan"
import {
  buildSchedule,
  formatClock,
  formatSpan,
  interleaveMatOrder,
  parseClock,
  type ScheduleCategoryInput,
  type ScheduleInput,
} from "@/lib/schedule"
import { CLOCK_TIME_RE, DEFAULT_EVENT_TIMING } from "@/lib/timing"
import { applyBlockIndexes, draftPlan, type DraftOptions } from "@/lib/autoschedule"
import { PlanBoard, POOL, type LaneItem, type Lanes } from "@/components/plan/PlanBoard"
import { BlockDialog, type BlockDraft } from "@/components/plan/BlockDialog"
import { ScheduleTimeline } from "@/components/plan/ScheduleTimeline"
import { DraftScheduleDialog } from "@/components/plan/DraftScheduleDialog"
import { VenueBlockChip } from "@/components/plan/PlanCards"

// ---------------------------------------------------------------------------

/** Server data -> the board's lane model. */
function buildLanes(board: PlanBoardData | undefined): Lanes {
  const lanes: Lanes = { [POOL]: [] }
  if (!board) return lanes

  const drawn = board.categories.filter((c) => c.hasDraw && c.drawId)
  lanes[POOL] = drawn
    .filter((c) => !c.matId)
    .sort((a, b) => categoryTitle(a).localeCompare(categoryTitle(b)))
    .map((c) => ({ kind: "CATEGORY", id: c.drawId! }) as LaneItem)

  for (const mat of board.mats) {
    lanes[mat.id] = interleaveMatOrder(
      drawn
        .filter((c) => c.matId === mat.id)
        .map((c) => ({ drawId: c.drawId!, matOrder: c.matOrder })),
      board.blocks.filter((b) => b.matId === mat.id).map((b) => ({ id: b.id, matOrder: b.matOrder })),
    )
  }
  return lanes
}

const toScheduleCategory = (c: PlanCategory): ScheduleCategoryInput => ({
  drawId: c.drawId!,
  title: categoryTitle(c),
  isKata: c.category === "KATA",
  entryCount: c.entryCount,
  drawEntryCount: c.drawEntryCount,
  boutDurationSec: c.boutDurationSec,
  bufferPct: c.bufferPct,
})

// ---------------------------------------------------------------------------

export default function PlanPage() {
  const { canManageEvent } = useAuth()
  const { eventId } = useSelectedEvent()
  const canManage = canManageEvent(eventId)
  const queryClient = useQueryClient()
  const toast = useToast()
  const apiError = useApiErrorToast()
  const confirm = useConfirm()

  const [search, setSearch] = useState("")
  const [timelineOpen, setTimelineOpen] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)
  const [blockDialog, setBlockDialog] = useState<
    { open: false } | { open: true; matId: string | null; editing: PlanBlock | null }
  >({ open: false })
  const [matDialog, setMatDialog] = useState<{ open: boolean; matId: string | null; name: string }>({
    open: false,
    matId: null,
    name: "",
  })

  const { data: board, isLoading } = useQuery({
    queryKey: ["plan-board", eventId],
    queryFn: () => getPlanBoard(eventId),
    enabled: !!eventId,
    // The board is a working surface with local drag state on top of it; a
    // focus refetch mid-plan would yank cards out from under the pointer.
    refetchOnWindowFocus: false,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["plan-board", eventId] })
    // The run board and the mat list read the same rows.
    queryClient.invalidateQueries({ queryKey: ["run-board", eventId] })
    queryClient.invalidateQueries({ queryKey: ["mats", eventId] })
    queryClient.invalidateQueries({ queryKey: ["draw-categories", eventId] })
    queryClient.invalidateQueries({ queryKey: ["event-timing", eventId] })
  }

  // --- lane state ---
  //
  // The lanes are held locally so a drag reflows (and the schedule below it
  // re-times) immediately, then written back. Server data is only allowed to
  // overwrite that while nothing is in flight and no drag is in progress.
  const serverLanes = useMemo(() => buildLanes(board), [board])
  const [lanes, setLanes] = useState<Lanes>(serverLanes)

  const orderMutation = useMutation({
    mutationFn: (payload: PlanLane[]) => setPlanOrder(eventId, payload),
    onError: (e) => apiError(e, "Could not save the running order"),
    onSettled: invalidate,
  })

  const orderPending = orderMutation.isPending
  useEffect(() => {
    if (dragActive || orderPending) return
    setLanes(serverLanes)
  }, [serverLanes, dragActive, orderPending])

  const handleLanesChange = (next: Lanes, touched: string[]) => {
    setLanes(next)
    if (touched.length === 0) return
    orderMutation.mutate(
      touched.map((laneId) => ({
        matId: laneId === POOL ? null : laneId,
        items: (next[laneId] ?? []).map((i) => ({ kind: i.kind, id: i.id })),
      })),
    )
  }

  // --- lookups + schedule ---

  const categoriesByDrawId = useMemo(() => {
    const map = new Map<string, PlanCategory>()
    for (const c of board?.categories ?? []) if (c.drawId) map.set(c.drawId, c)
    return map
  }, [board])

  const blocksById = useMemo(() => {
    const map = new Map<string, PlanBlock>()
    for (const b of board?.blocks ?? []) map.set(b.id, b)
    return map
  }, [board])

  const schedule = useMemo(() => {
    const timing = board?.timing
    // Nothing loaded yet. The config's ceremony flags are irrelevant here —
    // bands come from the plan's own blocks, not from the settings — so the
    // defaults stand in rather than a hand-written duplicate of them.
    if (!timing)
      return buildSchedule({
        timing: DEFAULT_EVENT_TIMING,
        mats: [],
        venueBlocks: [],
        unassignedCount: 0,
        order: new Map(),
      })

    const input: ScheduleInput = {
      timing,
      mats: (board?.mats ?? []).map((mat) => {
        const items = lanes[mat.id] ?? []
        return {
          id: mat.id,
          name: mat.name,
          categories: items
            .filter((i) => i.kind === "CATEGORY")
            .map((i) => categoriesByDrawId.get(i.id))
            .filter((c): c is PlanCategory => !!c?.drawId)
            .map(toScheduleCategory),
          blocks: items
            .filter((i) => i.kind === "BLOCK")
            .map((i) => blocksById.get(i.id))
            .filter((b): b is PlanBlock => !!b),
        }
      }),
      venueBlocks: (board?.blocks ?? []).filter((b) => b.matId === null),
      unassignedCount: (lanes[POOL] ?? []).length,
      order: new Map((board?.mats ?? []).map((m) => [m.id, lanes[m.id] ?? []])),
    }
    return buildSchedule(input)
  }, [board, lanes, categoriesByDrawId, blocksById])

  /**
   * What the drafter reasons over. Built from the *server's* placements rather
   * than the local lanes: drafting is a fresh proposal for everything that
   * isn't already fought, so an in-flight drag has no bearing on it.
   *
   * A category that is being fought right now is pinned alongside the finished
   * ones. The backend only locks COMPLETED, but proposing that a running
   * category move floors would be nonsense.
   */
  const draftInput = useMemo(
    () => ({
      timing: board?.timing ?? DEFAULT_EVENT_TIMING,
      mats: board?.mats ?? [],
      categories: (board?.categories ?? [])
        .filter((c) => c.hasDraw && c.drawId)
        .map((c) => ({
          ...toScheduleCategory(c),
          minAge: c.minAge,
          maxAge: c.maxAge,
          gender: c.gender,
          pinned: c.status === "COMPLETED" || c.status === "IN_PROGRESS",
          matId: c.matId,
        })),
      existingBlocks: (board?.blocks ?? []).map((b) => ({ kind: b.kind, matId: b.matId })),
    }),
    [board],
  )

  // --- mutations ---

  const blockMutation = useMutation({
    mutationFn: async (draft: BlockDraft & { id?: string }) => {
      if (draft.id) {
        await updatePlanBlock(draft.id, {
          label: draft.label,
          minutes: draft.minutes,
          startTime: draft.startTime,
        })
        return
      }
      await createPlanBlock({
        eventId,
        kind: draft.kind,
        label: draft.label,
        minutes: draft.minutes,
        matId: draft.matId,
        startTime: draft.startTime,
      })
    },
    onSuccess: () => {
      setBlockDialog({ open: false })
      invalidate()
    },
    onError: (e) => apiError(e, "Could not save that break"),
  })

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) => deletePlanBlock(blockId),
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not remove that break"),
  })

  const matMutation = useMutation({
    mutationFn: ({ matId, name }: { matId: string | null; name: string }) =>
      matId ? updateMat(matId, { name }) : createMat(eventId, name),
    onSuccess: () => {
      setMatDialog({ open: false, matId: null, name: "" })
      invalidate()
    },
    onError: (e) => apiError(e, "Could not save the floor"),
  })

  const deleteMatMutation = useMutation({
    mutationFn: (matId: string) => deleteMat(matId),
    onSuccess: () => {
      invalidate()
      toast.success("Floor removed")
    },
    onError: (e) => apiError(e, "Could not remove the floor"),
  })

  const timingMutation = useMutation({
    mutationFn: (dayStartTime: string) =>
      updateEventTiming(eventId, { ...board!.timing, dayStartTime }),
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not save the start time"),
  })

  // Lunch follows the event's own timing config: one venue-wide band when the
  // whole venue closes together, one break per floor when each floor breaks on
  // its own. Reading the mode here is what keeps the two screens consistent.
  const addLunchMutation = useMutation({
    mutationFn: async () => {
      const timing = board!.timing
      if (timing.lunch.mode === "PER_FLOOR") {
        await Promise.all(
          board!.mats.map((mat) =>
            createPlanBlock({
              eventId,
              kind: "LUNCH",
              label: "Lunch break",
              minutes: timing.lunch.minutes,
              matId: mat.id,
            }),
          ),
        )
        return
      }
      await createPlanBlock({
        eventId,
        kind: "LUNCH",
        label: "Lunch break",
        minutes: timing.lunch.minutes,
        matId: null,
        startTime: suggestedLunchTime(schedule.matStartMin, schedule.competitionEndMin),
      })
    },
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not add the lunch break"),
  })

  const addCeremonyMutation = useMutation({
    mutationFn: (kind: "OPENING" | "CLOSING") =>
      createPlanBlock({
        eventId,
        kind,
        label: kind === "OPENING" ? "Opening ceremony" : "Closing ceremony",
        minutes:
          kind === "OPENING" ? board!.timing.opening.minutes : board!.timing.closing.minutes,
        matId: null,
      }),
    onSuccess: invalidate,
    onError: (e) => apiError(e, "Could not add the ceremony"),
  })

  // --- handlers ---

  /**
   * Apply a draft: create the proposed blocks first so they have real ids,
   * splice the per-floor ones into their lanes, then write every lane in one
   * order call. Blocks first because a lane can't reference a block that does
   * not exist yet.
   */
  const applyDraftMutation = useMutation({
    mutationFn: async (options: DraftOptions) => {
      const draft = draftPlan({ ...draftInput, options })

      const placed = []
      for (const block of draft.blocks) {
        const created = await createPlanBlock({
          eventId,
          kind: block.kind,
          label: block.label,
          minutes: block.minutes,
          matId: block.matId,
          startTime: block.startTime,
        })
        placed.push({ block, id: created.id })
      }

      const lanesWithBlocks = applyBlockIndexes(draft.lanes, placed)

      // Every floor, plus the pool — the pool has to be sent too, or the
      // categories the draft moved out of it keep a stale position.
      const payload: PlanLane[] = [
        ...board!.mats.map((mat) => ({
          matId: mat.id,
          items: (lanesWithBlocks.get(mat.id) ?? []).map((i) => ({ kind: i.kind, id: i.id })),
        })),
        { matId: null, items: [] as PlanLane["items"] },
      ]

      // Anything the draft could not place stays in the pool.
      const placedIds = new Set(
        [...lanesWithBlocks.values()].flatMap((items) => items.map((i) => i.id)),
      )
      payload[payload.length - 1].items = (lanes[POOL] ?? [])
        .filter((i) => !placedIds.has(i.id))
        .map((i) => ({ kind: i.kind, id: i.id }))

      await setPlanOrder(eventId, payload)
    },
    onSuccess: () => {
      setDraftOpen(false)
      invalidate()
      toast.success("Draft applied — drag anything that isn't right")
    },
    onError: (e) => apiError(e, "Could not apply the draft"),
  })

  const handleDeleteMat = async (matId: string) => {
    const mat = board?.mats.find((m) => m.id === matId)
    if (!mat) return
    const onFloor = (lanes[matId] ?? []).length
    const ok = await confirm({
      title: `Remove ${mat.name}?`,
      description:
        onFloor > 0
          ? `Its ${onFloor} scheduled ${onFloor === 1 ? "item goes" : "items go"} back to the unassigned pool, and any break on this floor is deleted. The tournament's floor count drops by one.`
          : "The tournament's floor count drops by one.",
      confirmText: "Remove",
      destructive: true,
    })
    if (ok) deleteMatMutation.mutate(matId)
  }

  const handleDeleteBlock = async (block: PlanBlock) => {
    const ok = await confirm({
      title: `Remove ${block.label}?`,
      description: "It comes off the schedule and the day gets shorter.",
      confirmText: "Remove",
      destructive: true,
    })
    if (ok) deleteBlockMutation.mutate(block.id)
  }

  if (!eventId) return null

  if (isLoading || !board) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const venueBlocks = board.blocks.filter((b) => b.matId === null)
  const bandById = new Map(schedule.bands.map((b) => [b.id, b]))
  const hasKind = (kind: PlanBlock["kind"]) => board.blocks.some((b) => b.kind === kind)
  const placedCount = board.categories.filter((c) => c.hasDraw && c.matId).length
  const drawnCount = board.categories.filter((c) => c.hasDraw).length
  const noDrawCount = board.categories.length - drawnCount

  const suggestions = [
    board.timing.opening.enabled && !hasKind("OPENING")
      ? {
          key: "OPENING",
          label: `Opening ceremony · ${board.timing.opening.minutes}min`,
          onClick: () => addCeremonyMutation.mutate("OPENING"),
        }
      : null,
    board.timing.lunch.enabled && !hasKind("LUNCH")
      ? {
          key: "LUNCH",
          label:
            board.timing.lunch.mode === "PER_FLOOR"
              ? `Lunch · ${board.timing.lunch.minutes}min per floor`
              : `Lunch · ${board.timing.lunch.minutes}min, all floors`,
          onClick: () => addLunchMutation.mutate(),
        }
      : null,
    board.timing.closing.enabled && !hasKind("CLOSING")
      ? {
          key: "CLOSING",
          label: `Closing ceremony · ${board.timing.closing.minutes}min`,
          onClick: () => addCeremonyMutation.mutate("CLOSING"),
        }
      : null,
  ].filter((s): s is { key: string; label: string; onClick: () => void } => s !== null)

  return (
    <div className="space-y-4">
      {/* ---------- The day ---------- */}
      <Card className="overflow-hidden">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-5">
              <div>
                <Label htmlFor="day-start" className="mb-1 block text-[11px] text-muted-foreground">
                  Day starts
                </Label>
                <Input
                  id="day-start"
                  type="time"
                  className="h-9 w-28 font-display text-lg tracking-wide tabular-nums"
                  defaultValue={board.timing.dayStartTime}
                  disabled={!canManage || timingMutation.isPending}
                  // Commit on blur, not per keystroke: a controlled value here
                  // would be overwritten by the refetch mid-edit.
                  onBlur={(e) => {
                    const value = e.target.value
                    if (!CLOCK_TIME_RE.test(value) || value === board.timing.dayStartTime) {
                      e.target.value = board.timing.dayStartTime
                      return
                    }
                    timingMutation.mutate(value)
                  }}
                />
              </div>

              <Stat
                icon={<Clock3 className="size-3.5" />}
                label="Finishes"
                value={formatClock(schedule.finishMin)}
                sub={formatSpan(schedule.finishMin - schedule.dayStartMin)}
              />
              <Stat
                icon={<Layers className="size-3.5" />}
                label="Floors"
                value={String(board.mats.length)}
                sub={`${placedCount}/${drawnCount} categories placed`}
              />
              <Stat
                icon={<Swords className="size-3.5" />}
                label="Bouts scheduled"
                value={String(schedule.totalBouts)}
                sub={
                  schedule.competitionEndMin > schedule.matStartMin
                    ? `last bout ends ${formatClock(schedule.competitionEndMin)}`
                    : "nothing placed yet"
                }
              />
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setDraftOpen(true)}>
                  <Sparkles />
                  Draft schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlockDialog({ open: true, matId: null, editing: null })}
                >
                  <CalendarPlus />
                  Ceremony or break
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMatDialog({ open: true, matId: null, name: "" })}
                >
                  <Plus />
                  Floor
                </Button>
              </div>
            )}
          </div>

          {/* Venue-wide blocks: the shape of the day above the floors */}
          {(venueBlocks.length > 0 || (canManage && suggestions.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Across all floors
              </span>
              {venueBlocks.map((block) => (
                <VenueBlockChip
                  key={block.id}
                  block={block}
                  band={bandById.get(block.id)}
                  onEdit={
                    canManage
                      ? () => setBlockDialog({ open: true, matId: null, editing: block })
                      : undefined
                  }
                  onDelete={canManage ? () => handleDeleteBlock(block) : undefined}
                />
              ))}
              {canManage &&
                suggestions.map((s) => (
                  <Button
                    key={s.key}
                    size="xs"
                    variant="ghost"
                    className="border border-dashed text-muted-foreground"
                    onClick={s.onClick}
                    disabled={addCeremonyMutation.isPending || addLunchMutation.isPending}
                  >
                    <Plus />
                    {s.label}
                  </Button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- What needs attention ---------- */}
      {schedule.warnings.length > 0 && (
        <div className="space-y-1.5">
          {schedule.warnings.map((w, i) => (
            <p
              key={`${w.code}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-belt-orange/30 bg-belt-orange/8 px-3 py-2 text-xs text-belt-orange"
            >
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              <span className="text-foreground/80">{w.message}</span>
            </p>
          ))}
        </div>
      )}

      {noDrawCount > 0 && (
        <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          {noDrawCount} {noDrawCount === 1 ? "category has" : "categories have"} entries but no draw
          yet, so {noDrawCount === 1 ? "it cannot" : "they cannot"} be scheduled. Generate the draws
          on the Draws tab.
        </p>
      )}

      {/* ---------- Timeline ---------- */}
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            className="mb-1 flex w-full items-center gap-2 text-left"
            onClick={() => setTimelineOpen((v) => !v)}
            aria-expanded={timelineOpen}
          >
            <LayoutGrid className="size-4 text-muted-foreground" />
            <span className="font-display text-lg tracking-wide">The day, to scale</span>
            <ChevronDown
              className={cn(
                "ml-auto size-4 text-muted-foreground transition-transform",
                timelineOpen && "rotate-180",
              )}
            />
          </button>
          {timelineOpen && (
            <ScheduleTimeline schedule={schedule} categoriesByDrawId={categoriesByDrawId} />
          )}
        </CardContent>
      </Card>

      {/* ---------- Board ---------- */}
      <PlanBoard
        lanes={lanes}
        categoriesByDrawId={categoriesByDrawId}
        blocksById={blocksById}
        mats={board.mats}
        schedule={schedule}
        canManage={canManage}
        search={search}
        onSearchChange={setSearch}
        onLanesChange={handleLanesChange}
        onDragActiveChange={setDragActive}
        onDragCancel={() => setLanes(serverLanes)}
        onAddMat={() => setMatDialog({ open: true, matId: null, name: "" })}
        onRenameMat={(matId) =>
          setMatDialog({
            open: true,
            matId,
            name: board.mats.find((m) => m.id === matId)?.name ?? "",
          })
        }
        onDeleteMat={handleDeleteMat}
        onAddBlock={(matId) => setBlockDialog({ open: true, matId, editing: null })}
        onEditBlock={(block) => setBlockDialog({ open: true, matId: block.matId, editing: block })}
        onDeleteBlock={handleDeleteBlock}
      />

      {!canManage && (
        <p className="text-xs text-muted-foreground">
          You can read the plan but not change it — only an admin or this event's coordinator can.
        </p>
      )}

      <BlockDialog
        open={blockDialog.open}
        onOpenChange={(open) => !open && setBlockDialog({ open: false })}
        mats={board.mats}
        initial={blockDialog.open ? { matId: blockDialog.matId } : undefined}
        editing={blockDialog.open ? blockDialog.editing : null}
        defaultLunchMinutes={board.timing.lunch.minutes}
        saving={blockMutation.isPending}
        onSubmit={(draft) =>
          blockMutation.mutate({
            ...draft,
            id: blockDialog.open ? blockDialog.editing?.id : undefined,
          })
        }
      />

      <DraftScheduleDialog
        open={draftOpen}
        onOpenChange={setDraftOpen}
        input={draftInput}
        applying={applyDraftMutation.isPending}
        onApply={(options) => applyDraftMutation.mutate(options)}
      />

      <MatDialog
        state={matDialog}
        saving={matMutation.isPending}
        matCount={board.mats.length}
        onOpenChange={(open) => !open && setMatDialog({ open: false, matId: null, name: "" })}
        onNameChange={(name) => setMatDialog((s) => ({ ...s, name }))}
        onSubmit={() => matMutation.mutate({ matId: matDialog.matId, name: matDialog.name.trim() })}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="font-display text-lg leading-none tracking-wide tabular-nums">{value}</p>
      {sub && <p className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function MatDialog({
  state,
  saving,
  matCount,
  onOpenChange,
  onNameChange,
  onSubmit,
}: {
  state: { open: boolean; matId: string | null; name: string }
  saving: boolean
  matCount: number
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onSubmit: () => void
}) {
  const isRename = state.matId !== null
  const valid = state.name.trim().length > 0

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isRename ? "Rename floor" : "Add a floor"}</DialogTitle>
          <DialogDescription>
            {isRename
              ? "Floors carry whatever name the venue uses — Mat 1, Tatami A, the Blue Hall."
              : `The tournament will have ${matCount + 1} ${matCount === 0 ? "floor" : "floors"}, and the timing config follows.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="mat-name">Name</Label>
          <Input
            id="mat-name"
            autoFocus
            value={state.name}
            placeholder={`Mat ${matCount + 1}`}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) onSubmit()
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!valid || saving}>
            {isRename ? "Save" : "Add floor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * A first guess at when lunch should fall: the midpoint of the competition,
 * rounded to the nearest half hour. Only ever a starting value — the planner
 * sets the real time, and the schedule shows what it costs.
 */
function suggestedLunchTime(startMin: number, endMin: number): string {
  const midpoint = endMin > startMin ? (startMin + endMin) / 2 : startMin + 4 * 60
  const rounded = Math.round(midpoint / 30) * 30
  // Never before the day starts, and never past the end of the clock.
  const clamped = Math.min(Math.max(rounded, startMin), 23 * 60 + 30)
  return formatClock(clamped).slice(0, 5)
}

// Exported for the unit tests, which exercise these without a DOM.
export { buildLanes, suggestedLunchTime }
