import { CheckCircle2, Clock, GripVertical, Lock, Pencil, Trash2, Users, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { categoryTitle, type PlanCategory } from "@/lib/plan"
import {
  categoryBouts,
  formatClock,
  formatSpan,
  type ScheduleCategoryInput,
  type ScheduledBand,
  type ScheduledItem,
} from "@/lib/schedule"
import type { PlanBlock } from "@/lib/plan"
import {
  BLOCK_LABELS,
  SPAN_ALL_HATCH,
  STATUS_BADGE,
  STATUS_LABELS,
  blockSurface,
  blockText,
  categoryAccent,
  categorySurface,
} from "./plan-visuals"

/** The bits of a category the bout-count maths needs. */
const toScheduleInput = (c: PlanCategory): ScheduleCategoryInput => ({
  drawId: c.drawId ?? c.key,
  title: categoryTitle(c),
  isKata: c.category === "KATA",
  entryCount: c.entryCount,
  drawEntryCount: c.drawEntryCount,
  boutDurationSec: c.boutDurationSec,
  bufferPct: c.bufferPct,
})

/** The grip that starts a drag. Omitted entirely when the card cannot move. */
export function DragHandle({
  label,
  handleProps,
}: {
  label: string
  handleProps?: Record<string, unknown>
}) {
  if (!handleProps)
    return <span className="w-4 shrink-0" aria-hidden />
  return (
    <button
      type="button"
      className="-my-1 shrink-0 touch-none cursor-grab rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
      aria-label={`Drag ${label}`}
      {...handleProps}
    >
      <GripVertical className="size-3.5" />
    </button>
  )
}

/**
 * A category in a floor's running order, or in the unassigned pool.
 *
 * `scheduled` is absent in the pool: a category with no floor has no start
 * time, and inventing one would be the single most misleading thing this
 * screen could do.
 */
export function PlanCategoryCard({
  category,
  index,
  scheduled,
  handleProps,
  onUnassign,
  dragging,
}: {
  category: PlanCategory
  /** 1-based position on the floor; omitted in the pool. */
  index?: number
  scheduled?: ScheduledItem
  handleProps?: Record<string, unknown>
  onUnassign?: () => void
  dragging?: boolean
}) {
  const isKumite = category.category === "KUMITE"
  const title = categoryTitle(category)
  const completed = category.status === "COMPLETED"

  // A category in the pool has no start time — inventing one would be the most
  // misleading thing this screen could do — but it does have a known size, and
  // that is exactly what you need to decide which floor to put it on.
  const bouts = scheduled ? scheduled.bouts : categoryBouts(toScheduleInput(category))

  return (
    <div
      className={cn(
        "group relative flex items-stretch gap-2 overflow-hidden rounded-lg border pr-1.5 shadow-xs transition-shadow",
        categorySurface(isKumite, category.status),
        dragging && "opacity-40",
        !dragging && "hover:shadow-sm",
      )}
    >
      <span className={cn("w-1 shrink-0", categoryAccent(isKumite, category.status))} aria-hidden />

      <div className="flex min-w-0 flex-1 items-start gap-2 py-2">
        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          <DragHandle label={title} handleProps={handleProps} />
          {index !== undefined && (
            <span className="w-4 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
              {index}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* The weight class is what distinguishes one card from the next in a
              kumite division, so it gets its own chip that never shrinks —
              inside the title it was the first thing the ellipsis ate, leaving
              five identical "Cadet Boys Kumite (14/15…" rows. */}
          <p className="flex items-center gap-1.5 text-sm leading-tight font-medium">
            <span className="truncate">{category.divisionName}</span>
            {category.weightClassName && (
              <span
                className={cn(
                  "shrink-0 rounded px-1 py-px text-[10px] font-semibold tabular-nums",
                  isKumite ? "bg-flag-red/15 text-flag-red" : "bg-belt-blue/15 text-belt-blue",
                )}
              >
                {category.weightClassName}
              </span>
            )}
            {category.locked && (
              <Lock className="size-3 shrink-0 text-belt-blue" aria-label="Draw locked" />
            )}
            {completed && (
              <CheckCircle2 className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </p>

          {scheduled && bouts > 0 ? (
            <>
              {/* Deliberately not a flex row: at this column width the parts
                  would each become a wrapping flex item and break mid-time. */}
              <p className="mt-0.5 text-[11px] leading-tight tabular-nums text-muted-foreground">
                <Clock className="mr-1 mb-px inline size-3" aria-hidden />
                {formatClock(scheduled.startMin)} – {formatClock(scheduled.endMin)}
                <span className="mx-1 text-muted-foreground/60">·</span>
                {formatSpan(scheduled.minutes)} of mat time
              </p>
              {scheduled.pausedMin > 0 && (
                <p className="text-[11px] leading-tight text-belt-orange">
                  paused {formatSpan(scheduled.pausedMin)} for a venue break
                </p>
              )}
            </>
          ) : null}

          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
            {isKumite ? "Kumite" : "Kata"} · {category.gender === "Male" ? "M" : "F"}
            {category.drawSize ? ` · ${category.drawSize}-draw` : ""} ·{" "}
            <Users className="mb-px inline size-3" aria-hidden /> {category.entryCount}
            {bouts > 0 ? ` · ${bouts} ${bouts === 1 ? "bout" : "bouts"}` : " · no bouts"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          {category.status && (
            <Badge
              variant="outline"
              className={cn("px-1.5 text-[10px] font-medium", STATUS_BADGE[category.status])}
            >
              {STATUS_LABELS[category.status]}
            </Badge>
          )}
          {onUnassign && !completed && (
            <Button
              size="icon-xs"
              variant="ghost"
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              onClick={onUnassign}
              aria-label={`Take ${title} off this floor`}
            >
              <X />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/** A break that belongs to one floor and sits in its running order. */
export function PlanBlockCard({
  block,
  scheduled,
  handleProps,
  onEdit,
  onDelete,
  dragging,
}: {
  block: PlanBlock
  scheduled?: ScheduledItem
  handleProps?: Record<string, unknown>
  onEdit?: () => void
  onDelete?: () => void
  dragging?: boolean
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-dashed px-1.5 py-2 shadow-xs",
        blockSurface(block.kind),
        dragging && "opacity-40",
      )}
    >
      <DragHandle label={block.label} handleProps={handleProps} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm leading-tight font-medium", blockText(block.kind))}>
          {block.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-tight tabular-nums text-muted-foreground">
          {scheduled
            ? `${formatClock(scheduled.startMin)} – ${formatClock(scheduled.endMin)} · ${formatSpan(block.minutes)}`
            : `${formatSpan(block.minutes)} · this floor only`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {onEdit && (
          <Button size="icon-xs" variant="ghost" onClick={onEdit} aria-label={`Edit ${block.label}`}>
            <Pencil />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Remove ${block.label}`}
          >
            <Trash2 className="text-flag-red" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * A venue-wide band, drawn inside each floor's column at the point its running
 * order reaches. Hatched and full-bleed on purpose: it has to read as one strip
 * crossing every column rather than as a card belonging to this floor.
 */
export function VenueBandRow({
  band,
  onEdit,
  onDelete,
}: {
  band: ScheduledBand
  onEdit?: () => void
  onDelete?: () => void
}) {
  const anchorNote =
    band.anchor === "START"
      ? "before the first bout"
      : band.anchor === "END"
        ? "after the last bout"
        : `${formatClock(band.startMin)} – ${formatClock(band.endMin)}`

  return (
    <div
      className={cn(
        // Full-bleed and wrapping rather than truncating: in a narrow floor
        // column the time is the part a planner actually needs to read.
        "group relative -mx-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-y border-dashed px-2 py-1.5",
        blockSurface(band.kind),
        blockText(band.kind),
        SPAN_ALL_HATCH,
      )}
    >
      <span className="text-[11px] font-semibold tracking-wide uppercase">{band.label}</span>
      <span className="text-[11px] tabular-nums opacity-80">{anchorNote}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1">
        <Badge
          variant="outline"
          className="border-current/30 bg-background/60 px-1.5 text-[9px] tracking-wide uppercase"
        >
          Every floor
        </Badge>
        <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {onEdit && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onEdit}
              aria-label={`Edit ${band.label}`}
            >
              <Pencil />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onDelete}
              aria-label={`Remove ${band.label}`}
            >
              <Trash2 className="text-flag-red" />
            </Button>
          )}
        </span>
      </span>
    </div>
  )
}

/** Compact summary of a venue-wide block that isn't tied to a floor's order. */
export function VenueBlockChip({
  block,
  band,
  onEdit,
  onDelete,
}: {
  block: PlanBlock
  band?: ScheduledBand
  onEdit?: () => void
  onDelete?: () => void
}) {
  const unscheduled = !band || band.anchor === "UNSCHEDULED"
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-full border border-dashed py-1 pr-1 pl-3",
        blockSurface(block.kind),
        SPAN_ALL_HATCH,
        blockText(block.kind),
      )}
    >
      <span className="text-xs font-medium">{block.label}</span>
      <span className="text-[11px] tabular-nums opacity-80">
        {unscheduled
          ? "no time set"
          : band.anchor === "START"
            ? `day start · ${formatSpan(block.minutes)}`
            : band.anchor === "END"
              ? `after the last bout · ${formatSpan(block.minutes)}`
              : `${formatClock(band.startMin)} · ${formatSpan(block.minutes)}`}
      </span>
      <span className="flex items-center gap-0.5">
        {onEdit && (
          <Button size="icon-xs" variant="ghost" onClick={onEdit} aria-label={`Edit ${block.label}`}>
            <Pencil />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Remove ${block.label}`}
          >
            <Trash2 className="text-flag-red" />
          </Button>
        )}
      </span>
    </div>
  )
}

export { BLOCK_LABELS }
