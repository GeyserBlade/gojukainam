// DivisionBoard — one card per division. Droppable target for athletes.
// Header: category, gender, age range, entered count.
// Body: entered athletes as compact rows, or an empty drop placeholder.

import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { cn } from "@/lib/utils"

import type { Division } from "@/lib/events"
import type { Entry } from "@/lib/entries"
import type { EnrichedAthlete } from "./AthleteRow"
import type { EventConfig } from "./eligibility"
import { feeForEntry } from "./eligibility"

const CATEGORY_PILL_CLASS = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
} as const

const STATUS_STYLES = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  APPROVED: "bg-belt-green/15 text-belt-green border-belt-green/30",
  RETURNED: "bg-flag-red/15 text-flag-red border-flag-red/30",
} as const

const STATUS_LABEL = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
  RETURNED: "Returned",
} as const

export type EligibilityKind = "neutral" | "eligible" | "ineligible" | "partial"

export interface DivisionBoardProps {
  division: Division
  entries: Entry[]
  athletes: EnrichedAthlete[]
  eligibility: { kind: EligibilityKind; count: number; total: number }
  hasFocus: boolean
  hoveredAthleteId: string | null
  setHoveredAthleteId: (id: string | null) => void
  onRemoveEntry: (athleteId: string, divisionId: string) => void
  density: "compact" | "comfortable"
  showFees: boolean
  config: EventConfig
  ghostingEnabled: boolean
}

export const DivisionBoard: React.FC<DivisionBoardProps> = ({
  division,
  entries,
  athletes,
  eligibility,
  hasFocus,
  hoveredAthleteId,
  setHoveredAthleteId,
  onRemoveEntry,
  density,
  showFees,
  config,
  ghostingEnabled,
}) => {
  const cat = division.category
  const compact = density === "compact"

  const ineligible = hasFocus && eligibility.kind === "ineligible" && ghostingEnabled
  const litGlow = hasFocus && eligibility.kind === "eligible" && ghostingEnabled
  const partial = hasFocus && eligibility.kind === "partial" && ghostingEnabled

  const totalFee = useMemo(
    () => entries.reduce((sum, e) => sum + feeForEntry(e, config), 0),
    [entries, config],
  )

  const { setNodeRef, isOver } = useDroppable({
    id: `division:${division.id}`,
    data: { divisionId: division.id, type: "division" },
    disabled: ineligible,
  })

  return (
    <div
      ref={setNodeRef}
      data-board-id={division.id}
      className={cn(
        "rounded-lg border bg-card relative overflow-hidden transition-all",
        ineligible && "opacity-35",
        litGlow && "border-belt-green/50",
        partial && "border-belt-orange/40",
        isOver && !ineligible && "ring-2 ring-belt-green/60 ring-offset-1 ring-offset-background",
      )}
    >
      {/* Category band */}
      <div
        aria-hidden
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px]",
          cat === "KATA" ? "bg-belt-blue" : "bg-flag-red",
        )}
      />

      <div
        className={cn(
          "flex items-start justify-between gap-2",
          compact ? "px-3 pt-3 pb-2" : "px-4 pt-4 pb-2.5",
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "font-semibold text-[10px] uppercase tracking-wider",
                CATEGORY_PILL_CLASS[cat],
              )}
            >
              {cat}
            </Badge>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {division.gender === "Male" ? "Boys / Men" : "Girls / Women"}
            </span>
          </div>
          <h4 className="font-medium mt-1 text-[15px] truncate">{division.name}</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            Ages {division.minAge}–{division.maxAge}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display text-3xl leading-none tracking-wider tabular-nums">
            {String(entries.length).padStart(2, "0")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
            entered
          </p>
        </div>
      </div>

      <div className={cn(compact ? "px-2.5 pb-2.5" : "px-3 pb-3")}>
        {entries.length === 0 ? (
          <div
            className={cn(
              "rounded-md border-2 border-dashed text-center text-[11px] py-6 transition-colors",
              litGlow
                ? "border-belt-green/40 text-belt-green"
                : isOver
                ? "border-belt-green/60 text-belt-green"
                : "border-border text-muted-foreground",
            )}
          >
            {litGlow || isOver ? "Drop to enter" : "Drag athlete here"}
          </div>
        ) : (
          <ul className="space-y-1">
            {entries.map((e) => {
              const a = athletes.find((x) => x.id === e.athleteId)
              if (!a) return null
              return (
                <EnteredChip
                  key={e.id}
                  entry={e}
                  athlete={a}
                  division={division}
                  onRemove={() => onRemoveEntry(a.id, division.id)}
                  isHovered={hoveredAthleteId === a.id}
                  onHover={(b) => setHoveredAthleteId(b ? a.id : null)}
                  compact={compact}
                />
              )
            })}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground tabular-nums">
          <span>
            {hasFocus && ghostingEnabled && eligibility.kind === "partial" && (
              <span className="text-belt-orange">
                {eligibility.count}/{eligibility.total} eligible
              </span>
            )}
            {hasFocus && ghostingEnabled && eligibility.kind === "eligible" && (
              <span className="text-belt-green">all eligible</span>
            )}
            {hasFocus && ghostingEnabled && eligibility.kind === "ineligible" && (
              <span>none eligible</span>
            )}
          </span>
          {showFees && entries.length > 0 && (
            <span>
              {config.currency} {totalFee.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EnteredChip({
  entry,
  athlete,
  division,
  onRemove,
  isHovered,
  onHover,
  compact,
}: {
  entry: Entry
  athlete: EnrichedAthlete
  division: Division
  onRemove: () => void
  isHovered: boolean
  onHover: (b: boolean) => void
  compact: boolean
}) {
  return (
    <li
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "group flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
        isHovered ? "border-primary/60 bg-primary/5" : "border-border bg-card",
      )}
    >
      <BeltBadge name={athlete.belt?.name} colour={athlete.belt?.colour} iconOnly />
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium truncate", compact ? "text-xs" : "text-[13px]")}>
          {athlete.firstName} {athlete.lastName}
        </p>
        {!compact && (
          <p className="text-[10px] text-muted-foreground truncate">
            {athlete.club?.name ?? "—"} · {athlete.age}y
            {division.category === "KUMITE" && athlete.weightKg
              ? ` · ${athlete.weightKg}kg`
              : ""}
          </p>
        )}
        {entry.status === "RETURNED" && entry.statusReason && (
          <p className="mt-0.5 text-[10px] text-flag-red">
            <span className="font-medium">Returned:</span> {entry.statusReason}
          </p>
        )}
      </div>
      <Badge
        variant="outline"
        className={cn("font-normal text-[10px] uppercase tracking-wide", STATUS_STYLES[entry.status])}
      >
        {STATUS_LABEL[entry.status]}
      </Badge>
      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-flag-red flex items-center justify-center"
        aria-label={`Remove ${athlete.firstName} ${athlete.lastName} from ${division.name}`}
      >
        <X className="size-3.5" />
      </button>
    </li>
  )
}
