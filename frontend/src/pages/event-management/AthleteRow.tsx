// AthleteRow — single row in the athlete pool.
// Renders name/club/age/belt, current-entry chips, and an expandable panel
// showing every division the athlete is eligible for as toggleable pills.

import { useMemo } from "react"
import { useDraggable } from "@dnd-kit/core"
import { AlertTriangle, ChevronDown, Check, Plus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { cn } from "@/lib/utils"

import type { Division, PoolAthlete } from "@/lib/events"
import type { Entry } from "@/lib/entries"
import { isEligible, individualEntryCount } from "./eligibility"

/**
 * The pool endpoint already resolves age against the event date, so this is
 * just PoolAthlete. Kept as a named alias because the whole screen refers to
 * it, and to leave room for genuinely client-derived fields later.
 */
export type EnrichedAthlete = PoolAthlete

export interface AthleteRowProps {
  athlete: EnrichedAthlete
  divisions: Division[]
  entries: Entry[]
  eventDate: string

  isSelected: boolean
  isHovered: boolean
  isExpanded: boolean

  onToggleSelect: () => void
  onHover: (hovered: boolean) => void
  onExpand: () => void
  onAdd: (divisionId: string) => void
  onRemove: (divisionId: string) => void
  /** Registration closed for this viewer — entry toggles are inert. */
  addDisabled?: boolean

  density: "compact" | "comfortable"
  showFees: boolean
  maxIndividualEvents: number
}

const CATEGORY_PILL_CLASS = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
} as const

export const AthleteRow: React.FC<AthleteRowProps> = ({
  athlete: a,
  divisions,
  entries,
  eventDate,
  isSelected,
  isHovered,
  isExpanded,
  onToggleSelect,
  onHover,
  onExpand,
  onAdd,
  onRemove,
  addDisabled,
  density,
  showFees,
  maxIndividualEvents,
}) => {
  const compact = density === "compact"

  const myEntries = useMemo(
    () => entries.filter((e) => e.athleteId === a.id),
    [entries, a.id],
  )
  const individualCount = useMemo(
    () => individualEntryCount(a.id, entries),
    [entries, a.id],
  )
  const overLimit = individualCount > maxIndividualEvents

  const eligibleDivisions = useMemo(
    () => divisions.filter((d) => isEligible(a, d, eventDate)),
    [divisions, a, eventDate],
  )

  // Make the row draggable (drop targets are the division boards).
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `athlete:${a.id}`,
    data: { athleteId: a.id, type: "athlete" },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "group rounded-md border transition-colors select-none cursor-grab active:cursor-grabbing",
        isSelected
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-card hover:border-ring",
        overLimit && "ring-1 ring-flag-red/40",
        isDragging && "opacity-40",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2.5",
          compact ? "px-2.5 py-1.5" : "px-3 py-2.5",
        )}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          data-no-drag
          className={cn(
            "shrink-0 mt-0.5 size-4 rounded border flex items-center justify-center transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-ring",
          )}
          aria-label="Select athlete"
          aria-pressed={isSelected}
        >
          {isSelected && <Check className="size-3" strokeWidth={3} />}
        </button>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">
                  {a.firstName} {a.lastName}
                </p>
                {overLimit && (
                  <AlertTriangle
                    className="size-3.5 text-flag-red shrink-0"
                    aria-label={`Over limit: ${individualCount}/${maxIndividualEvents} individual events`}
                  />
                )}
              </div>
              <p
                className={cn(
                  "text-xs text-muted-foreground truncate",
                  compact && "text-[11px]",
                )}
              >
                {clubShort(a.club?.name)}
                <span className="mx-1">·</span>
                {a.gender === "Male" ? "♂" : "♀"} {a.age}y
                {a.weightKg ? (
                  <>
                    <span className="mx-1">·</span>
                    {a.weightKg}kg
                  </>
                ) : null}
              </p>
            </div>

            {/* Belt + expand */}
            <div className="flex items-center gap-1.5 shrink-0">
              <BeltBadge name={a.belt?.name} colour={a.belt?.colour} />
              <button
                type="button"
                data-no-drag
                onClick={(e) => {
                  e.stopPropagation()
                  onExpand()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground flex items-center justify-center transition-colors",
                  isExpanded && "bg-accent text-foreground",
                )}
                aria-label="Show eligible divisions"
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            </div>
          </div>

          {/* Current-entry chips (when not expanded) */}
          {myEntries.length > 0 && !isExpanded && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {myEntries.map((e) => {
                const d = divisions.find((dd) => dd.id === e.divisionId)
                if (!d) return null
                return (
                  <EntryMiniChip
                    key={e.id}
                    division={d}
                    onRemove={(ev) => {
                      ev.stopPropagation()
                      onRemove(d.id)
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* Expanded: every eligible division as a toggleable pill */}
          {isExpanded && (
            <div className="mt-2.5 space-y-2 border-t pt-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Eligible · {eligibleDivisions.length} division
                {eligibleDivisions.length === 1 ? "" : "s"}
              </p>
              {eligibleDivisions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No divisions match this athlete's age and gender.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {eligibleDivisions.map((d) => {
                    const entered = myEntries.find((e) => e.divisionId === d.id)
                    return (
                      <EligibilityToggle
                        key={d.id}
                        division={d}
                        entered={!!entered}
                        disabled={addDisabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (entered) onRemove(d.id)
                          else onAdd(d.id)
                        }}
                      />
                    )
                  })}
                </div>
              )}
              {overLimit && (
                <p className="text-[11px] text-flag-red flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Exceeds limit of {maxIndividualEvents} individual events
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EntryMiniChip({
  division,
  onRemove,
}: {
  division: Division
  onRemove: (e: React.MouseEvent) => void
}) {
  const cat = division.category
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-[10px] gap-1 px-1 py-0",
        CATEGORY_PILL_CLASS[cat],
      )}
      title={`${division.name} · ${cat === "KATA" ? "Kata" : "Kumite"}`}
    >
      <span className="font-semibold">{division.key}</span>
      <span className="opacity-70">{cat === "KATA" ? "K" : "U"}</span>
      <button
        type="button"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        data-no-drag
        className="opacity-50 hover:opacity-100 -mr-0.5"
        aria-label="Remove entry"
      >
        <X className="size-2.5" strokeWidth={2.5} />
      </button>
    </Badge>
  )
}

function EligibilityToggle({
  division,
  entered,
  disabled,
  onClick,
}: {
  division: Division
  entered: boolean
  disabled?: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const cat = division.category
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={disabled}
      title={disabled ? "Registration is closed" : undefined}
      data-no-drag
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
        entered
          ? "border-belt-green/50 bg-belt-green/10"
          : "border-border hover:border-ring",
        disabled && "opacity-50 cursor-not-allowed hover:border-border",
      )}
    >
      <span className="font-semibold opacity-80">{division.key}</span>
      <Badge
        variant="outline"
        className={cn(
          "font-normal text-[9px] uppercase tracking-wider px-1 py-0",
          CATEGORY_PILL_CLASS[cat],
        )}
      >
        {cat === "KATA" ? "Kata" : "Kumite"}
      </Badge>
      {entered ? (
        <Check className="size-3 text-belt-green" strokeWidth={3} />
      ) : (
        <Plus className="size-3 text-muted-foreground" strokeWidth={2.5} />
      )}
    </button>
  )
}

function clubShort(name?: string): string {
  if (!name) return "—"
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 8)
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase()
}
