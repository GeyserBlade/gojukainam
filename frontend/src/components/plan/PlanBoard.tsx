import { useMemo, useState, type ReactNode } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarPlus, Inbox, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { categoryTitle, type PlanBlock, type PlanCategory } from "@/lib/plan"
import { formatClock, formatSpan, type Schedule, type ScheduledBand } from "@/lib/schedule"
import { PlanBlockCard, PlanCategoryCard, VenueBandRow } from "./PlanCards"

// ---------------------------------------------------------------------------
// Lane model
//
// A "lane" is one droppable column: a floor, or the unassigned pool. Both kinds
// of item live in the same ordered list per lane, because a break has to be
// able to sit *between* two categories — that shared index space is exactly
// what `matOrder` stores on both tables.
// ---------------------------------------------------------------------------

export const POOL = "__pool__"

export interface LaneItem {
  kind: "CATEGORY" | "BLOCK"
  id: string
}

export type Lanes = Record<string, LaneItem[]>

/** dnd-kit needs one id space for every draggable on the board. */
const dragId = (item: LaneItem) => `${item.kind}:${item.id}`
const parseDragId = (id: string): LaneItem => {
  const [kind, ...rest] = id.split(":")
  return { kind: kind as LaneItem["kind"], id: rest.join(":") }
}
const laneDropId = (laneId: string) => `lane:${laneId}`
const isLaneDropId = (id: string) => id.startsWith("lane:")
const parseLaneDropId = (id: string) => id.slice("lane:".length)

/**
 * Completed categories are pulled to the front of their floor, keeping their
 * existing relative order.
 *
 * They are the categories already fought, so the front is where they belong;
 * doing it as a normalization after every drag means a drop can never land
 * above one, and the positions written back stay stable for them. The backend
 * independently refuses to move a completed category to another floor — this is
 * the interaction half of that rule, not a substitute for it.
 */
function normalizeLane(items: LaneItem[], completedDrawIds: Set<string>): LaneItem[] {
  const done: LaneItem[] = []
  const rest: LaneItem[] = []
  for (const item of items) {
    if (item.kind === "CATEGORY" && completedDrawIds.has(item.id)) done.push(item)
    else rest.push(item)
  }
  return done.length === 0 ? items : [...done, ...rest]
}

function findLane(lanes: Lanes, id: string): string | null {
  for (const [laneId, items] of Object.entries(lanes)) {
    if (items.some((i) => dragId(i) === id)) return laneId
  }
  return null
}

// ---------------------------------------------------------------------------
// Sortable wrappers
// ---------------------------------------------------------------------------

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string
  disabled?: boolean
  children: (handleProps: Record<string, unknown> | undefined, dragging: boolean) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "z-10")}
    >
      {children(disabled ? undefined : { ...attributes, ...listeners }, isDragging)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export interface PlanBoardProps {
  lanes: Lanes
  categoriesByDrawId: Map<string, PlanCategory>
  blocksById: Map<string, PlanBlock>
  mats: { id: string; name: string }[]
  schedule: Schedule
  canManage: boolean
  search: string
  onSearchChange: (value: string) => void
  /** Local move; the page persists the lanes named in `touched`. */
  onLanesChange: (next: Lanes, touched: string[]) => void
  /**
   * True from grab to drop. The page holds the lane state, so it needs to know
   * not to let a background refetch overwrite it while a card is in the air.
   */
  onDragActiveChange: (active: boolean) => void
  /** Escape or a drop outside the board — the page restores the server order. */
  onDragCancel: () => void
  onAddMat: () => void
  onRenameMat: (matId: string) => void
  onDeleteMat: (matId: string) => void
  onAddBlock: (matId: string | null) => void
  onEditBlock: (block: PlanBlock) => void
  onDeleteBlock: (block: PlanBlock) => void
}

export function PlanBoard(props: PlanBoardProps) {
  const {
    lanes,
    categoriesByDrawId,
    blocksById,
    mats,
    schedule,
    canManage,
    search,
    onSearchChange,
    onLanesChange,
  } = props

  const [activeId, setActiveId] = useState<string | null>(null)
  // The lane the drag started in, so a cross-floor move persists both ends.
  const [sourceLane, setSourceLane] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const completedDrawIds = useMemo(() => {
    const set = new Set<string>()
    for (const c of categoriesByDrawId.values())
      if (c.status === "COMPLETED" && c.drawId) set.add(c.drawId)
    return set
  }, [categoriesByDrawId])

  const scheduledByMat = useMemo(() => {
    const map = new Map<string, Map<string, (typeof schedule.mats)[number]["items"][number]>>()
    for (const mat of schedule.mats) {
      map.set(mat.id, new Map(mat.items.map((i) => [`${i.kind}:${i.id}`, i])))
    }
    return map
  }, [schedule])

  // Where each venue-wide band falls in a given floor's running order: after
  // every item that had already started when the venue stopped.
  const bandsByMat = useMemo(() => {
    const timeBands = schedule.bands.filter((b) => b.anchor === "TIME")
    const map = new Map<string, Map<number, ScheduledBand[]>>()
    for (const mat of schedule.mats) {
      const atIndex = new Map<number, ScheduledBand[]>()
      for (const band of timeBands) {
        const index = mat.items.filter((i) => i.startMin < band.startMin).length
        const list = atIndex.get(index)
        if (list) list.push(band)
        else atIndex.set(index, [band])
      }
      map.set(mat.id, atIndex)
    }
    return map
  }, [schedule])

  const matchesSearch = (item: LaneItem) => {
    if (!search.trim()) return true
    const needle = search.trim().toLowerCase()
    if (item.kind === "BLOCK") return blocksById.get(item.id)?.label.toLowerCase().includes(needle) ?? false
    const c = categoriesByDrawId.get(item.id)
    return c ? categoryTitle(c).toLowerCase().includes(needle) : false
  }

  // --- drag handlers ---

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveId(id)
    setSourceLane(findLane(lanes, id))
    props.onDragActiveChange(true)
  }

  /**
   * Live cross-lane preview. Moving the item as it crosses a boundary is what
   * makes the drop predictable — without it the columns only reflow after
   * release and the user is aiming at a gap that isn't there yet.
   */
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const activeKey = String(active.id)
    const overKey = String(over.id)

    const from = findLane(lanes, activeKey)
    const to = isLaneDropId(overKey) ? parseLaneDropId(overKey) : findLane(lanes, overKey)
    if (!from || !to || from === to) return

    // The pool holds categories waiting for a floor; a break belongs either to
    // a floor or to the whole venue, so it has nowhere to land here.
    const moving = parseDragId(activeKey)
    if (to === POOL && moving.kind === "BLOCK") return

    const fromItems = lanes[from] ?? []
    const toItems = lanes[to] ?? []
    const item = fromItems.find((i) => dragId(i) === activeKey)
    if (!item) return

    const overIndex = isLaneDropId(overKey)
      ? toItems.length
      : toItems.findIndex((i) => dragId(i) === overKey)
    const insertAt = overIndex < 0 ? toItems.length : overIndex

    onLanesChange(
      {
        ...lanes,
        [from]: fromItems.filter((i) => dragId(i) !== activeKey),
        [to]: normalizeLane(
          [...toItems.slice(0, insertAt), item, ...toItems.slice(insertAt)],
          completedDrawIds,
        ),
      },
      [],
    )
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeKey = String(active.id)
    const from = sourceLane
    setActiveId(null)
    setSourceLane(null)
    props.onDragActiveChange(false)
    // Dropped on nothing. `onDragOver` may already have previewed a cross-lane
    // move, so the page has to put the server's order back rather than keep it.
    if (!over) return props.onDragCancel()

    const overKey = String(over.id)
    const lane = isLaneDropId(overKey) ? parseLaneDropId(overKey) : findLane(lanes, overKey)
    if (!lane) return props.onDragCancel()

    const items = lanes[lane] ?? []
    const oldIndex = items.findIndex((i) => dragId(i) === activeKey)
    const overIndex = isLaneDropId(overKey)
      ? items.length - 1
      : items.findIndex((i) => dragId(i) === overKey)
    if (oldIndex < 0) return props.onDragCancel()

    const reordered =
      overIndex < 0 || oldIndex === overIndex ? items : arrayMove(items, oldIndex, overIndex)
    const next = { ...lanes, [lane]: normalizeLane(reordered, completedDrawIds) }

    // Persist every lane the item passed through — the source too, whose
    // positions closed up behind it.
    const touched = from && from !== lane ? [from, lane] : [lane]
    onLanesChange(next, touched)
  }

  const activeItem = activeId ? parseDragId(activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setSourceLane(null)
        props.onDragActiveChange(false)
        props.onDragCancel()
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        <PoolColumn
          items={(lanes[POOL] ?? []).filter(matchesSearch)}
          totalCount={(lanes[POOL] ?? []).length}
          categoriesByDrawId={categoriesByDrawId}
          canManage={canManage}
          search={search}
          onSearchChange={onSearchChange}
        />

        {mats.map((mat) => {
          const scheduledMat = schedule.mats.find((m) => m.id === mat.id)
          return (
            <MatColumn
              key={mat.id}
              mat={mat}
              items={(lanes[mat.id] ?? []).filter(matchesSearch)}
              categoriesByDrawId={categoriesByDrawId}
              blocksById={blocksById}
              scheduled={scheduledByMat.get(mat.id)}
              bands={bandsByMat.get(mat.id)}
              endMin={scheduledMat?.endMin}
              workMinutes={scheduledMat?.workMinutes ?? 0}
              bouts={scheduledMat?.bouts ?? 0}
              canManage={canManage}
              onRename={() => props.onRenameMat(mat.id)}
              onDelete={() => props.onDeleteMat(mat.id)}
              onAddBlock={() => props.onAddBlock(mat.id)}
              onEditBlock={props.onEditBlock}
              onDeleteBlock={props.onDeleteBlock}
              onUnassign={(drawId) => {
                const pool = lanes[POOL] ?? []
                onLanesChange(
                  {
                    ...lanes,
                    [mat.id]: (lanes[mat.id] ?? []).filter(
                      (i) => !(i.kind === "CATEGORY" && i.id === drawId),
                    ),
                    [POOL]: [...pool, { kind: "CATEGORY", id: drawId }],
                  },
                  [mat.id, POOL],
                )
              }}
              completedDrawIds={completedDrawIds}
            />
          )
        })}

        {canManage && (
          <button
            type="button"
            onClick={props.onAddMat}
            className="flex w-[18rem] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
          >
            <Plus className="size-5" />
            <span className="text-sm font-medium">Add a floor</span>
            <span className="max-w-[12rem] text-center text-[11px]">
              Floors are named however you like, and the tournament's mat count follows.
            </span>
          </button>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-[17rem] rotate-1 cursor-grabbing shadow-lg">
            {activeItem.kind === "CATEGORY" ? (
              categoriesByDrawId.get(activeItem.id) && (
                <PlanCategoryCard category={categoriesByDrawId.get(activeItem.id)!} />
              )
            ) : blocksById.get(activeItem.id) ? (
              <PlanBlockCard block={blocksById.get(activeItem.id)!} />
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function PoolColumn({
  items,
  totalCount,
  categoriesByDrawId,
  canManage,
  search,
  onSearchChange,
}: {
  items: LaneItem[]
  totalCount: number
  categoriesByDrawId: Map<string, PlanCategory>
  canManage: boolean
  search: string
  onSearchChange: (value: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: laneDropId(POOL) })

  return (
    <section className="flex w-[19rem] shrink-0 flex-col">
      <header className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <h3 className="font-display text-lg tracking-wide">Unassigned</h3>
        <Badge variant={totalCount > 0 ? "default" : "outline"} className="tabular-nums">
          {totalCount}
        </Badge>
      </header>

      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Filter categories…"
        className="mb-2 h-8"
      />

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-1.5 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-primary bg-primary/5" : "bg-muted/20",
        )}
      >
        <SortableContext items={items.map(dragId)} strategy={verticalListSortingStrategy}>
          {items.map((item) => {
            const category = categoriesByDrawId.get(item.id)
            if (!category) return null
            return (
              <SortableRow key={dragId(item)} id={dragId(item)} disabled={!canManage}>
                {(handleProps, dragging) => (
                  <PlanCategoryCard
                    category={category}
                    handleProps={handleProps}
                    dragging={dragging}
                  />
                )}
              </SortableRow>
            )
          })}
        </SortableContext>

        {items.length === 0 && (
          <p className="flex flex-col items-center gap-1.5 py-10 text-center text-[11px] text-muted-foreground">
            <Inbox className="size-5" />
            {totalCount === 0
              ? "Every category with a draw is on a floor."
              : "Nothing matches that filter."}
          </p>
        )}
      </div>
    </section>
  )
}

function MatColumn({
  mat,
  items,
  categoriesByDrawId,
  blocksById,
  scheduled,
  bands,
  endMin,
  workMinutes,
  bouts,
  canManage,
  completedDrawIds,
  onRename,
  onDelete,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onUnassign,
}: {
  mat: { id: string; name: string }
  items: LaneItem[]
  categoriesByDrawId: Map<string, PlanCategory>
  blocksById: Map<string, PlanBlock>
  scheduled?: Map<string, Schedule["mats"][number]["items"][number]>
  bands?: Map<number, ScheduledBand[]>
  endMin?: number
  workMinutes: number
  bouts: number
  canManage: boolean
  completedDrawIds: Set<string>
  onRename: () => void
  onDelete: () => void
  onAddBlock: () => void
  onEditBlock: (block: PlanBlock) => void
  onDeleteBlock: (block: PlanBlock) => void
  onUnassign: (drawId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: laneDropId(mat.id) })
  const categoryCount = items.filter((i) => i.kind === "CATEGORY").length

  return (
    <section className="flex w-[19rem] shrink-0 flex-col">
      <header className="mb-2 flex items-center gap-1.5 px-0.5">
        <h3 className="min-w-0 flex-1 truncate font-display text-lg tracking-wide">{mat.name}</h3>
        {endMin !== undefined && categoryCount > 0 && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            ends {formatClock(endMin)}
          </span>
        )}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-xs" variant="ghost" aria-label={`${mat.name} options`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onRename}>
                <Pencil />
                Rename floor
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddBlock}>
                <CalendarPlus />
                Add a break here
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} variant="destructive">
                <Trash2 />
                Remove floor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div className="mb-2 flex items-center gap-2 px-0.5 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {categoryCount} {categoryCount === 1 ? "category" : "categories"}
        </span>
        <span className="opacity-50">·</span>
        <span className="tabular-nums">{bouts} bouts</span>
        <span className="opacity-50">·</span>
        <span className="tabular-nums">{formatSpan(workMinutes)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-1.5 rounded-xl border p-2 transition-colors",
          isOver ? "border-primary bg-primary/5" : "bg-card/40",
        )}
      >
        <SortableContext items={items.map(dragId)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => {
            // One list entry can render a venue band *and* the item itself, so
            // the map yields a small array rather than a single node.
            const rows: ReactNode[] = []
            for (const band of bands?.get(index) ?? [])
              rows.push(
                <VenueBandRow
                  key={`band-${band.id}-${index}`}
                  band={band}
                  onEdit={canManage ? () => onEditBlock(blocksById.get(band.id)!) : undefined}
                  onDelete={canManage ? () => onDeleteBlock(blocksById.get(band.id)!) : undefined}
                />,
              )

            if (item.kind === "CATEGORY") {
              const category = categoriesByDrawId.get(item.id)
              if (category)
                rows.push(
                  <SortableRow
                    key={dragId(item)}
                    id={dragId(item)}
                    disabled={!canManage || completedDrawIds.has(item.id)}
                  >
                    {(handleProps, dragging) => (
                      <PlanCategoryCard
                        category={category}
                        index={index + 1}
                        scheduled={scheduled?.get(dragId(item))}
                        handleProps={handleProps}
                        dragging={dragging}
                        onUnassign={canManage ? () => onUnassign(item.id) : undefined}
                      />
                    )}
                  </SortableRow>,
                )
            } else {
              const block = blocksById.get(item.id)
              if (block)
                rows.push(
                  <SortableRow key={dragId(item)} id={dragId(item)} disabled={!canManage}>
                    {(handleProps, dragging) => (
                      <PlanBlockCard
                        block={block}
                        scheduled={scheduled?.get(dragId(item))}
                        handleProps={handleProps}
                        dragging={dragging}
                        onEdit={canManage ? () => onEditBlock(block) : undefined}
                        onDelete={canManage ? () => onDeleteBlock(block) : undefined}
                      />
                    )}
                  </SortableRow>,
                )
            }
            return rows
          })}
        </SortableContext>

        {/* Bands that fall after everything this floor runs. */}
        {(bands?.get(items.length) ?? []).map((band) => (
          <VenueBandRow
            key={`band-tail-${band.id}`}
            band={band}
            onEdit={canManage ? () => onEditBlock(blocksById.get(band.id)!) : undefined}
            onDelete={canManage ? () => onDeleteBlock(blocksById.get(band.id)!) : undefined}
          />
        ))}

        {items.length === 0 && (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="py-8 text-center text-[11px] text-muted-foreground">
              Drag categories here to put them on {mat.name}.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
