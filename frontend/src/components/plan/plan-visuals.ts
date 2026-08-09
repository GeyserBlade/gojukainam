// Shared visual language for the plan board and its schedule timeline. Both
// surfaces show the same day, so a category has to look the same in either one
// — keeping the class strings here is what makes that true by construction
// rather than by two lists that drift.

import type { CategoryStatus } from "@/lib/plan"
import type { ScheduleBlockKind } from "@/lib/schedule"

/**
 * Category colour is keyed on discipline, matching the rest of the app: kumite
 * takes the flag red already used for AKA and the Kumite chips, kata the belt
 * blue used for AO. A completed category drops to muted — done is background.
 */
export function categorySurface(isKumite: boolean, status: CategoryStatus | null): string {
  if (status === "COMPLETED") return "border-border bg-muted/40"
  return isKumite
    ? "border-flag-red/30 bg-flag-red/8"
    : "border-belt-blue/30 bg-belt-blue/8"
}

export function categoryAccent(isKumite: boolean, status: CategoryStatus | null): string {
  if (status === "COMPLETED") return "bg-muted-foreground/40"
  return isKumite ? "bg-flag-red" : "bg-belt-blue"
}

export const STATUS_LABELS: Record<CategoryStatus, string> = {
  DRAWN: "Ready",
  IN_PROGRESS: "Running",
  COMPLETED: "Complete",
}

export const STATUS_BADGE: Record<CategoryStatus, string> = {
  DRAWN: "border-border text-muted-foreground",
  IN_PROGRESS: "border-belt-green/40 bg-belt-green/15 text-belt-green",
  COMPLETED: "border-muted-foreground/25 bg-muted text-muted-foreground",
}

export const BLOCK_LABELS: Record<ScheduleBlockKind, string> = {
  OPENING: "Opening ceremony",
  CLOSING: "Closing ceremony",
  LUNCH: "Lunch break",
  BREAK: "Break",
}

/**
 * Ceremonies read as belt-purple, breaks as belt-orange — deliberately outside
 * the kata/kumite pair so a non-competition block is never mistaken for a
 * category at a glance on a dense board.
 */
export function blockSurface(kind: ScheduleBlockKind): string {
  return kind === "OPENING" || kind === "CLOSING"
    ? "border-belt-purple/40 bg-belt-purple/10"
    : "border-belt-orange/40 bg-belt-orange/10"
}

export function blockText(kind: ScheduleBlockKind): string {
  return kind === "OPENING" || kind === "CLOSING" ? "text-belt-purple" : "text-belt-orange"
}

/**
 * The diagonal hatch that marks a block as spanning every floor. Applied as a
 * background layer so the band still reads as one continuous strip crossing the
 * columns, which is the whole point of a venue-wide stoppage.
 */
export const SPAN_ALL_HATCH =
  "bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,color-mix(in_srgb,currentColor_12%,transparent)_6px,color-mix(in_srgb,currentColor_12%,transparent)_12px)]"
