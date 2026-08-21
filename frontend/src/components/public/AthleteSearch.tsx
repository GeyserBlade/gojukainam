import { useEffect, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { PublicAthleteRow } from "@/lib/public"
import { RunStatusChip, medalFor } from "./AthleteStatus"

/**
 * Fold accents and case so "Müller" is found by typing "muller" — the search
 * is for a parent thumbing a name into a phone, not for exact matching.
 */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

/**
 * Match every typed word somewhere in the athlete's name or club, in any
 * order, so "sarah windhoek" and "windhoek sarah" both work.
 */
function matches(row: PublicAthleteRow, terms: string[]): boolean {
  const haystack = `${fold(row.name)} ${fold(row.clubName)}`
  return terms.every((term) => haystack.includes(term))
}

function AthleteResult({ row, onSelect }: { row: PublicAthleteRow; onSelect: () => void }) {
  // Medals first, then whatever is happening now — the two things worth
  // seeing without opening the athlete.
  const headline =
    row.runs.find((r) => r.status === "MEDAL") ??
    row.runs.find((r) => r.status === "READY") ??
    row.runs[0]

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-start justify-between gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {row.runs.some((r) => r.place) && (
            <span className="mr-1">{medalFor(row.runs.find((r) => r.place)!.place)}</span>
          )}
          {row.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{row.clubName}</p>
        {headline && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[11px] text-muted-foreground">{headline.category}</span>
            <RunStatusChip run={headline} />
          </p>
        )}
      </div>
      {row.runs.length > 1 && (
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
          {row.runs.length} categories
        </span>
      )}
    </button>
  )
}

/**
 * Full-screen athlete search. The whole index is already on the client, so
 * filtering is instant and works even when the venue's wifi does not.
 *
 * Capped at 40 rendered rows: a two-letter query matches most of a 300-athlete
 * event, and nobody scrolls that. The count above the list says how many were
 * actually found, so a capped list never reads as a complete one.
 */
export function AthleteSearch({
  open,
  onClose,
  athletes,
  isLoading,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  athletes: PublicAthleteRow[]
  isLoading: boolean
  onSelect: (athleteId: string) => void
}) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQuery("")
  }, [open])

  const terms = useMemo(() => fold(query).split(/\s+/).filter(Boolean), [query])
  const found = useMemo(
    () => (terms.length === 0 ? [] : athletes.filter((row) => matches(row, terms))),
    [athletes, terms],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Athlete or club name"
            className="pl-8"
            // Phones love to capitalise and autocorrect proper nouns into
            // something else entirely; a name field wants none of it.
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-2 text-muted-foreground hover:text-foreground"
          aria-label="Close search"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : terms.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            Type a name to find an athlete — then see when they are on, or how they did.
            <span className="mt-2 block text-xs">
              {athletes.length} {athletes.length === 1 ? "athlete" : "athletes"} in this event.
            </span>
          </p>
        ) : found.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            Nobody matches “{query}”.
          </p>
        ) : (
          <>
            <p className={cn("px-4 pt-3 text-xs text-muted-foreground")}>
              {found.length} {found.length === 1 ? "match" : "matches"}
              {found.length > 40 && " · showing the first 40"}
            </p>
            <div className="mt-1">
              {found.slice(0, 40).map((row) => (
                <AthleteResult key={row.id} row={row} onSelect={() => onSelect(row.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
