import { useState } from "react"
import { Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { EventResults, ResultCategory, ResultEntry } from "@/lib/results"

const Medallist = ({ medal, entry }: { medal: string; entry: ResultEntry }) => (
  <li className="flex items-baseline gap-2">
    <span aria-hidden>{medal}</span>
    <span className="min-w-0 flex-1 truncate text-sm">{entry.name}</span>
    <span className="shrink-0 truncate text-xs text-muted-foreground">{entry.clubName}</span>
  </li>
)

function PodiumCard({ category }: { category: ResultCategory }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-base leading-tight tracking-wide">
            {category.divisionName}
            {category.weightClassName ? ` · ${category.weightClassName}` : ""}
          </h3>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[10px]",
              category.category === "KUMITE"
                ? "text-flag-red border-flag-red/30"
                : "text-belt-blue border-belt-blue/30",
            )}
          >
            {category.category === "KUMITE" ? "Kumite" : "Kata"}
          </Badge>
        </div>
        <ul className="space-y-1 border-t pt-2">
          {category.first && <Medallist medal="🥇" entry={category.first} />}
          {category.second && <Medallist medal="🥈" entry={category.second} />}
          {category.thirds.map((t) => (
            <Medallist key={t.entryId} medal="🥉" entry={t} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/**
 * Results first, because that is what a spectator opens the board for once
 * their own child is done — and because the old single-column board buried the
 * medals under every bout on every mat.
 *
 * A category counts as "decided" the moment it has a gold medallist. Ones
 * still running are folded away rather than dropped: seeing that a category
 * exists and has not finished is information too, just not headline
 * information.
 */
export function ResultsTab({ results }: { results: EventResults }) {
  const [showRunning, setShowRunning] = useState(false)
  const decided = results.categories.filter((c) => c.first)
  const running = results.categories.filter((c) => !c.first)

  if (results.categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          No categories have been drawn yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="size-4" />
        {decided.length} of {results.categories.length} categories decided
      </p>

      {decided.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No medals decided yet. Results appear here as each category finishes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {decided.map((c) => (
            <PodiumCard key={c.drawId} category={c} />
          ))}
        </div>
      )}

      {running.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setShowRunning((v) => !v)}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {showRunning ? "Hide" : "Show"} {running.length} categories still to finish
          </button>
          {showRunning && (
            <ul className="mt-2 space-y-1">
              {running.map((c) => (
                <li
                  key={c.drawId}
                  className="flex items-baseline justify-between gap-2 border-b py-1.5 text-sm last:border-0"
                >
                  <span className="min-w-0 truncate">
                    {c.divisionName}
                    {c.weightClassName ? ` · ${c.weightClassName}` : ""}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.status === "IN_PROGRESS" ? "Running" : "Not started"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
