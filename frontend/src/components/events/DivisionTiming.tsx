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
  const isKata = division.category === "KATA"
  const resolved = resolveDivisionTiming({ ...division, ...overrides, isKata }, timing)

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

  const hasOverride = isKata
    ? !resolved.inherited.boutDurationSec || !resolved.inherited.bufferPct
    : Object.values(resolved.inherited).some((v) => !v)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{division.name}</p>
        <p className="text-xs text-muted-foreground">
          {isKata ? "Kata" : "Kumite"} · {division.gender} · Ages {division.minAge}-
          {division.maxAge}
        </p>
      </div>
      {field(
        "boutDurationSec",
        isKata ? "kata performance length in seconds" : "bout duration in seconds",
        String(isKata ? timing.kataBoutDurationSec : timing.defaultBoutDurationSec),
      )}
      {field("bufferPct", "injury/stoppage buffer percent", String(timing.defaultBufferPct))}
      {isKata ? (
        // Kata is judged on flags, not points — there is no gap to win by.
        <div
          className="w-24 text-center text-xs text-muted-foreground"
          title="Kata is decided by flags, so a win-by-points gap does not apply."
        >
          n/a
        </div>
      ) : (
        field("winByGap", "win by points gap", String(resolved.winByGap))
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Reset ${division.name} to inherited timing`}
        title="Clear all three overrides for this category"
        disabled={!canManage || saving || !hasOverride}
        onClick={() =>
          onSave(division.id, {
            boutDurationSec: null,
            bufferPct: null,
            ...(isKata ? {} : { winByGap: null }),
          })
        }
      >
        <RotateCcw />
      </Button>
    </div>
  )
}

/**
 * Per-category timing under the event hub's Setup tab: bout duration,
 * injury/stoppage buffer and win-by-points gap, for every category.
 *
 * Kumite and kata are both listed but mean different things by "duration" — a
 * match clock against the length of one performance — so they inherit from
 * different event defaults and are shown in separate tables rather than one
 * list with a column that changes meaning halfway down. Kata has no
 * win-by-points gap at all; it is judged on flags.
 *
 * These values are consumed: the Plan tab's schedule times every category from
 * them (frontend/src/lib/schedule.ts).
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

  const kumite = divisions.filter((d) => d.category === "KUMITE")
  const kata = divisions.filter((d) => d.category === "KATA")

  if (loadingDivisions || loadingTiming) return <Skeleton className="h-48 w-full" />

  const table = (rows: Division[], heading: string, durationLabel: string, note: string) => (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <h4 className="text-sm font-medium">{heading}</h4>
        <span className="text-[11px] text-muted-foreground">{note}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 text-[11px] text-muted-foreground">
        <span className="min-w-0 flex-1">Category</span>
        <span className="w-24">{durationLabel}</span>
        <span className="w-24">Buffer (%)</span>
        <span className="w-24">Win gap</span>
        <span className="w-8" />
      </div>
      {rows.map((d) => (
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
  )

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium">Category timing</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everything here is inherited from the tournament defaults under Overview — leave a box
          empty to inherit, or type a value to override it for that one category. The Plan tab's
          schedule times every category from these.
        </p>
      </div>

      {divisions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No categories on this event yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {kumite.length > 0 &&
            table(
              kumite,
              "Kumite",
              "Bout (sec)",
              `match clock, default ${formatBoutDuration(timing.defaultBoutDurationSec)}`,
            )}
          {kata.length > 0 &&
            table(
              kata,
              "Kata",
              "Performance (sec)",
              `one performance, default ${formatBoutDuration(timing.kataBoutDurationSec)}`,
            )}

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" />
            Defaults come from the tournament settings:{" "}
            {formatBoutDuration(timing.defaultBoutDurationSec)} kumite bout,{" "}
            {formatBoutDuration(timing.kataBoutDurationSec)} kata performance, and{" "}
            {timing.defaultBufferPct}% buffer. The win gap follows the age rule — {WIN_GAP_YOUTH}{" "}
            for categories aged {WIN_GAP_AGE_THRESHOLD} and below, {WIN_GAP_SENIOR} above that —
            and does not apply to kata, which is judged on flags.
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
