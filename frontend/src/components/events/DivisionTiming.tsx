import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Info, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiErrorToast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import { getDivisions, getEventTiming, updateDivision, type Division } from "@/lib/events"
import {
  DEFAULT_EVENT_TIMING,
  WIN_GAP_AGE_THRESHOLD,
  WIN_GAP_SENIOR,
  WIN_GAP_YOUTH,
  formatBoutDuration,
  resolveDivisionTiming,
  type EventTiming,
} from "@/lib/timing"

type TimingField = "boutDurationSec" | "bufferPct" | "winByGap"

/** Matches the Zod ranges on CreateDivision — clamp here so a typo can't 400. */
const LIMITS: Record<TimingField, { min: number; max: number; step: number }> = {
  boutDurationSec: { min: 10, max: 1800, step: 10 },
  bufferPct: { min: 0, max: 100, step: 1 },
  winByGap: { min: 1, max: 20, step: 1 },
}

const clamp = (field: TimingField, value: number) =>
  Math.min(LIMITS[field].max, Math.max(LIMITS[field].min, value))

/**
 * One category's three timing fields. Empty means "inherited" and shows the
 * inherited value as the placeholder, so a blank box always reads as the value
 * that will actually be used rather than as nothing.
 *
 * Edits commit on blur, not on every keystroke: a controlled input that fires a
 * mutation per keystroke gets clobbered by the refetch mid-typing (the bug
 * fixed in the Run → Plan mat order — see docs/state.md).
 */
function DivisionTimingRow({
  division,
  timing,
  canManage,
  saving,
  onSave,
}: {
  division: Division
  timing: EventTiming
  canManage: boolean
  saving: boolean
  onSave: (id: string, patch: Partial<Record<TimingField, number | null>>) => void
}) {
  const overrides = {
    boutDurationSec: division.boutDurationSec ?? null,
    bufferPct: division.bufferPct ?? null,
    winByGap: division.winByGap ?? null,
  }
  const resolved = resolveDivisionTiming({ ...division, ...overrides }, timing)

  const asText = (v: number | null) => (v === null ? "" : String(v))
  const [draft, setDraft] = useState({
    boutDurationSec: asText(overrides.boutDurationSec),
    bufferPct: asText(overrides.bufferPct),
    winByGap: asText(overrides.winByGap),
  })

  // Re-sync when the stored values change (our own save landing, or someone
  // else's edit arriving on a refetch).
  useEffect(() => {
    setDraft({
      boutDurationSec: asText(division.boutDurationSec ?? null),
      bufferPct: asText(division.bufferPct ?? null),
      winByGap: asText(division.winByGap ?? null),
    })
  }, [division.boutDurationSec, division.bufferPct, division.winByGap])

  const commit = (field: TimingField) => {
    const text = draft[field].trim()
    const next = text === "" ? null : clamp(field, Number(text))
    if (text !== "" && !Number.isFinite(Number(text))) {
      setDraft((prev) => ({ ...prev, [field]: asText(overrides[field]) }))
      return
    }
    if (next === overrides[field]) {
      // Unchanged in value, but the text may need normalizing after a clamp.
      setDraft((prev) => ({ ...prev, [field]: asText(next) }))
      return
    }
    setDraft((prev) => ({ ...prev, [field]: asText(next) }))
    onSave(division.id, { [field]: next })
  }

  const field = (f: TimingField, label: string, placeholder: string) => (
    <div className="w-24">
      <Input
        type="number"
        aria-label={`${division.name} — ${label}`}
        title={
          resolved.inherited[f]
            ? `Inherited: ${placeholder}. Type a value to override just this category.`
            : `Overridden for this category. Clear the box to go back to ${placeholder}.`
        }
        min={LIMITS[f].min}
        max={LIMITS[f].max}
        step={LIMITS[f].step}
        placeholder={placeholder}
        disabled={!canManage || saving}
        value={draft[f]}
        onChange={(e) => setDraft((prev) => ({ ...prev, [f]: e.target.value }))}
        onBlur={() => commit(f)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        className={cn("h-8 text-sm", !resolved.inherited[f] && "border-primary/60")}
      />
    </div>
  )

  const hasOverride = Object.values(resolved.inherited).some((v) => !v)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{division.name}</p>
        <p className="text-xs text-muted-foreground">
          {division.gender} · Ages {division.minAge}-{division.maxAge}
        </p>
      </div>
      {field("boutDurationSec", "bout duration in seconds", String(timing.defaultBoutDurationSec))}
      {field("bufferPct", "injury/stoppage buffer percent", String(timing.defaultBufferPct))}
      {field("winByGap", "win by points gap", String(resolved.winByGap))}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Reset ${division.name} to inherited timing`}
        title="Clear all three overrides for this category"
        disabled={!canManage || saving || !hasOverride}
        onClick={() =>
          onSave(division.id, { boutDurationSec: null, bufferPct: null, winByGap: null })
        }
      >
        <RotateCcw />
      </Button>
    </div>
  )
}

/**
 * Per-category timing under the event hub's Setup tab: bout duration,
 * injury/stoppage buffer and win-by-points gap for each kumite category.
 *
 * Duration and buffer inherit the tournament defaults set under Overview; the
 * win gap inherits the age rule (6 at 13 and under, 8 above). Nothing consumes
 * these values yet — this captures and stores them.
 */
export function DivisionTiming({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const qc = useQueryClient()
  const apiError = useApiErrorToast()

  const { data: divisions = [], isLoading: loadingDivisions } = useQuery({
    queryKey: ["divisions", eventId],
    queryFn: () => getDivisions(eventId),
    enabled: !!eventId,
  })

  // Shares the cache with the Overview tab's timing card.
  const { data: timing = DEFAULT_EVENT_TIMING, isLoading: loadingTiming } = useQuery({
    queryKey: ["event-timing", eventId],
    queryFn: () => getEventTiming(eventId),
    enabled: !!eventId,
  })

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Record<TimingField, number | null>> }) =>
      updateDivision(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["divisions", eventId] })
    },
    onError: (e) => apiError(e, "Could not save the category timing"),
  })

  // Kumite only: a bout clock and a win-by-points gap have no meaning for a
  // kata category, and the estimator these feed is kumite-only too.
  const kumite = divisions.filter((d) => d.category === "KUMITE")

  if (loadingDivisions || loadingTiming) return <Skeleton className="h-48 w-full" />

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium">Category timing</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Bout duration and injury/stoppage buffer are inherited from the tournament defaults set
          under Overview — leave a box empty to inherit, or type a value to override it for that
          category.
        </p>
      </div>

      {kumite.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No kumite categories on this event yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 text-[11px] text-muted-foreground">
            <span className="min-w-0 flex-1">Category</span>
            <span className="w-24">Bout (sec)</span>
            <span className="w-24">Buffer (%)</span>
            <span className="w-24">Win gap</span>
            <span className="w-8" />
          </div>
          <div className="space-y-1.5">
            {kumite.map((d) => (
              <DivisionTimingRow
                key={d.id}
                division={d}
                timing={timing}
                canManage={canManage}
                saving={mutation.isPending && mutation.variables?.id === d.id}
                onSave={(id, data) => mutation.mutate({ id, data })}
              />
            ))}
          </div>
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" />
            Defaults: {formatBoutDuration(timing.defaultBoutDurationSec)} bout and{" "}
            {timing.defaultBufferPct}% buffer from the tournament settings; a win gap of{" "}
            {WIN_GAP_YOUTH} for categories aged {WIN_GAP_AGE_THRESHOLD} and below, {WIN_GAP_SENIOR}{" "}
            above that. Kata categories aren't listed — a bout clock and a points gap don't apply
            to them.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="font-normal text-[10px]">
              Empty box = inherited
            </Badge>
            <Badge variant="outline" className="border-primary/60 font-normal text-[10px]">
              Highlighted box = overridden
            </Badge>
          </div>
        </>
      )}
    </section>
  )
}
