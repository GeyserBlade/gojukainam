// BulkActionBar — floating sticky bar that appears when athletes are multi-selected.
// Offers "Enrol in all Kata", "Enrol in all Kumite", or "Enrol in both" — each
// adds the selected athletes to every division they're eligible for in that
// category that they're not already entered in.

import { useMemo } from "react"
import { X, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Division, PoolAthlete } from "@/lib/events"
import type { Entry } from "@/lib/entries"
import { isEligible } from "./eligibility"

export interface BulkActionBarProps {
  selectedAthleteIds: Set<string>
  athletes: Pick<PoolAthlete, "id" | "dob" | "gender">[]
  divisions: Division[]
  entries: Entry[]
  eventDate: string
  onClear: () => void
  onBulkAdd: (category: "KATA" | "KUMITE" | "BOTH") => void
  isPending?: boolean
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedAthleteIds,
  athletes,
  divisions,
  entries,
  eventDate,
  onClear,
  onBulkAdd,
  isPending,
}) => {
  const counts = useMemo(() => {
    const out = { KATA: 0, KUMITE: 0, BOTH: 0 }
    selectedAthleteIds.forEach((athleteId) => {
      const a = athletes.find((x) => x.id === athleteId)
      if (!a) return
      divisions.forEach((d) => {
        if (!isEligible(a, d, eventDate)) return
        const exists = entries.find((e) => e.athleteId === athleteId && e.divisionId === d.id)
        if (exists) return
        if (d.category === "KATA") out.KATA++
        if (d.category === "KUMITE") out.KUMITE++
        out.BOTH++
      })
    })
    return out
  }, [selectedAthleteIds, athletes, divisions, entries, eventDate])

  const count = selectedAthleteIds.size

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
        "animate-in slide-in-from-bottom-4 fade-in duration-200",
      )}
      role="region"
      aria-label="Bulk actions"
    >
      <div
        className="rounded-lg border bg-card shadow-2xl flex items-center gap-2 px-3 py-2"
        style={{ boxShadow: "0 12px 36px -8px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center gap-2 pr-2 border-r">
          <span className="font-display text-2xl text-flag-red tabular-nums leading-none">
            {count}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            athlete{count === 1 ? "" : "s"}
            <br />
            selected
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkAdd("KATA")}
          disabled={counts.KATA === 0 || isPending}
          title="Enrol every selected athlete in every eligible Kata division"
        >
          <span className="font-semibold text-belt-blue">KATA</span>
          <span className="text-muted-foreground text-xs">+{counts.KATA}</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkAdd("KUMITE")}
          disabled={counts.KUMITE === 0 || isPending}
          title="Enrol every selected athlete in every eligible Kumite division"
        >
          <span className="font-semibold text-flag-red">KUMITE</span>
          <span className="text-muted-foreground text-xs">+{counts.KUMITE}</span>
        </Button>
        <Button
          size="sm"
          onClick={() => onBulkAdd("BOTH")}
          disabled={counts.BOTH === 0 || isPending}
          title="Enrol every selected athlete in every eligible division (Kata + Kumite)"
        >
          <Zap className="size-3.5" />
          Enrol in both
          <span className="text-primary-foreground/70 text-xs">+{counts.BOTH}</span>
        </Button>

        <button
          type="button"
          onClick={onClear}
          className="ml-1 size-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
