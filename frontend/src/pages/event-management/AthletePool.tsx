// AthletePool — left pane of the entry-management screen.
// Filters, multi-select, and a scrollable list of <AthleteRow>s.

import { useMemo } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CLUBS_FALLBACK, type ClubLike } from "./types"
import { AthleteRow, type EnrichedAthlete } from "./AthleteRow"
import type { Division } from "@/lib/events"
import type { Entry } from "@/lib/entries"

const BELT_ORDER = [
  "white",
  "yellow",
  "orange",
  "green",
  "blue",
  "purple",
  "brown",
  "black",
  "red",
] as const

type BeltColour = (typeof BELT_ORDER)[number]

const BELT_SWATCH_HEX: Record<BeltColour, string> = {
  white: "var(--belt-white, #f8fafc)",
  yellow: "var(--belt-yellow, #f5c518)",
  orange: "var(--belt-orange, #f97316)",
  green: "var(--belt-green, #16a34a)",
  blue: "var(--belt-blue, #1d4ed8)",
  purple: "var(--belt-purple, #7c3aed)",
  brown: "var(--belt-brown, #78350f)",
  black: "var(--belt-black, #0a0a0a)",
  red: "var(--flag-red, #c8102e)",
}

export interface AthletePoolProps {
  athletes: EnrichedAthlete[]
  totalCount: number
  divisions: Division[]
  entries: Entry[]
  clubs: ClubLike[]
  eventDate: string
  isAdmin: boolean

  // Search / filters
  search: string
  setSearch: (v: string) => void
  filterClubId: string
  setFilterClubId: (v: string) => void
  filterBelt: string
  setFilterBelt: (v: string) => void
  filterEnteredMode: "all" | "entered" | "unentered"
  setFilterEnteredMode: (v: "all" | "entered" | "unentered") => void

  // Selection
  selectedAthleteIds: Set<string>
  toggleSelect: (id: string) => void
  clearSelection: () => void
  selectAllVisible: () => void

  // Focus (hover / expand)
  hoveredAthleteId: string | null
  setHoveredAthleteId: (id: string | null) => void
  expandedAthleteId: string | null
  setExpandedAthleteId: (id: string | null) => void

  // Mutations
  onAddEntry: (athleteId: string, divisionId: string) => void
  onRemoveEntry: (athleteId: string, divisionId: string) => void
  /** Registration closed for this viewer — entry toggles are inert. */
  addDisabled?: boolean

  density: "compact" | "comfortable"
  showFees: boolean
  maxIndividualEvents: number
}

export const AthletePool: React.FC<AthletePoolProps> = ({
  athletes,
  totalCount,
  divisions,
  entries,
  clubs,
  eventDate,
  isAdmin,
  search,
  setSearch,
  filterClubId,
  setFilterClubId,
  filterBelt,
  setFilterBelt,
  filterEnteredMode,
  setFilterEnteredMode,
  selectedAthleteIds,
  toggleSelect,
  clearSelection,
  selectAllVisible,
  hoveredAthleteId,
  setHoveredAthleteId,
  expandedAthleteId,
  setExpandedAthleteId,
  onAddEntry,
  onRemoveEntry,
  addDisabled,
  density,
  showFees,
  maxIndividualEvents,
}) => {
  // Build the set of belt colours actually present in the pool
  const beltColoursPresent = useMemo(() => {
    const set = new Set<string>()
    athletes.forEach((a) => {
      const colour = parseBeltColour(a.belt?.colour ?? a.belt?.name)
      if (colour) set.add(colour)
    })
    return BELT_ORDER.filter((c) => set.has(c))
  }, [athletes])

  const clubsForFilter: ClubLike[] = isAdmin ? clubs : CLUBS_FALLBACK

  return (
    <div className="rounded-lg border bg-card sticky top-[64px] self-start flex flex-col max-h-[calc(100vh-88px)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <h2 className="font-display text-xl tracking-wider whitespace-nowrap">ATHLETE POOL</h2>
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {athletes.length} / {totalCount}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search athletes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            data-no-drag
          />
        </div>

        {/* Club pills */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <FilterPill active={!filterClubId} onClick={() => setFilterClubId("")}>
              All clubs
            </FilterPill>
            {clubsForFilter.map((c) => (
              <FilterPill
                key={c.id}
                active={filterClubId === c.id}
                onClick={() => setFilterClubId(filterClubId === c.id ? "" : c.id)}
                title={c.name}
              >
                {clubAbbreviation(c.name)}
              </FilterPill>
            ))}
          </div>
        )}

        {/* Belt swatches */}
        {beltColoursPresent.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <FilterPill active={!filterBelt} onClick={() => setFilterBelt("")}>
              All belts
            </FilterPill>
            {beltColoursPresent.map((c) => (
              <FilterPill
                key={c}
                active={filterBelt === c}
                onClick={() => setFilterBelt(filterBelt === c ? "" : c)}
                title={c}
              >
                <span
                  className="inline-block size-2 rounded-full border border-foreground/15"
                  style={{ background: BELT_SWATCH_HEX[c] }}
                />
              </FilterPill>
            ))}
          </div>
        )}

        {/* Mode toggle + select all */}
        <div className="flex items-center justify-between gap-2 mt-2.5">
          <div className="flex items-center rounded-md border p-0.5 text-[10px] font-medium">
            {(
              [
                { v: "all", label: "All" },
                { v: "unentered", label: "Unentered" },
                { v: "entered", label: "Entered" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setFilterEnteredMode(o.v)}
                className={cn(
                  "h-6 px-2 rounded-sm transition-colors whitespace-nowrap",
                  filterEnteredMode === o.v
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={
              selectedAthleteIds.size === athletes.length && athletes.length > 0
                ? clearSelection
                : selectAllVisible
            }
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            {selectedAthleteIds.size === athletes.length && athletes.length > 0
              ? "Clear all"
              : "Select all"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {athletes.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-12">
            No athletes match these filters.
          </div>
        ) : (
          athletes.map((a) => (
            <AthleteRow
              key={a.id}
              athlete={a}
              divisions={divisions}
              entries={entries}
              eventDate={eventDate}
              isSelected={selectedAthleteIds.has(a.id)}
              isHovered={hoveredAthleteId === a.id}
              isExpanded={expandedAthleteId === a.id}
              onToggleSelect={() => toggleSelect(a.id)}
              onHover={(b) => setHoveredAthleteId(b ? a.id : null)}
              onExpand={() => setExpandedAthleteId(expandedAthleteId === a.id ? null : a.id)}
              onAdd={(divisionId) => onAddEntry(a.id, divisionId)}
              onRemove={(divisionId) => onRemoveEntry(a.id, divisionId)}
              addDisabled={addDisabled}
              density={density}
              showFees={showFees}
              maxIndividualEvents={maxIndividualEvents}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t text-[10px] text-muted-foreground">
        Click row to view eligible divisions · Drag onto a board · Shift-select for bulk
      </div>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap",
        active
          ? "border-primary/60 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
      )}
    >
      {children}
    </button>
  )
}

function clubAbbreviation(name: string): string {
  // First-letter abbreviation of each capitalised word, max 4 chars
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase()
}

function parseBeltColour(value?: string | null): BeltColour | null {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes("white")) return "white"
  if (v.includes("yellow")) return "yellow"
  if (v.includes("orange")) return "orange"
  if (v.includes("green")) return "green"
  if (v.includes("purple") || v.includes("violet")) return "purple"
  if (v.includes("blue")) return "blue"
  if (v.includes("brown")) return "brown"
  if (v.includes("black")) return "black"
  if (v.includes("red")) return "red"
  return null
}
