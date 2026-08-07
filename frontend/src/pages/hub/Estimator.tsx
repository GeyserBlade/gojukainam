// Kumite tournament duration estimator (v1) — a single tuneable total-time
// estimate, not a running order/timetable (that's a natural v2). Kata is out
// of scope for v1; every input here only ever counts kumite divisions.
//
// Bout counts are auto-derived from the event's real data (draws where they
// exist, APPROVED entries otherwise) via deriveKumiteBoutBreakdown; the time
// math is estimateKumiteDuration. Both are pure functions in lib/estimator.ts
// and unit-tested there (scripts/test-estimator.ts) — this component is just
// data-fetching + the form.
//
// Tuning inputs are session-only: no persistence yet. Natural v2 is per-event
// persistence (see docs/state.md) once this shape has been used for real.

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Info, RotateCcw, Swords, Timer } from "lucide-react"

import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getDivisions } from "@/lib/events"
import { listDrawCategories, getDraw } from "@/lib/draws"
import {
  DEFAULT_ESTIMATOR_INPUTS,
  deriveKumiteBoutBreakdown,
  estimateKumiteDuration,
  formatDuration,
  minutesForDivision,
  type EstimatorInputs,
  type KumiteCategoryData,
} from "@/lib/estimator"

const SEGMENT_STYLES: Record<string, string> = {
  bouts: "bg-primary",
  buffer: "bg-belt-orange",
  changeover: "bg-belt-blue",
  checkin: "bg-belt-blue/60",
  lunch: "bg-muted-foreground/40",
  opening: "bg-belt-green",
  closing: "bg-belt-green/60",
}

const NumberField = ({
  id,
  label,
  hint,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  min?: number
  step?: number
  suffix?: string
}) => (
  <div>
    <Label htmlFor={id} className="mb-1.5">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={suffix ? "pr-10" : undefined}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
  </div>
)

const ToggleField = ({
  id,
  label,
  checked,
  onCheckedChange,
  minutes,
  onMinutesChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  minutes: number
  onMinutesChange: (v: number) => void
}) => (
  <div className="flex items-center gap-3">
    <label
      htmlFor={id}
      className="flex flex-1 items-center gap-2 cursor-pointer select-none text-sm"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
    <div className="w-24">
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        disabled={!checked}
        value={minutes}
        onChange={(e) => onMinutesChange(Number(e.target.value))}
        className="h-8 text-sm"
      />
    </div>
    <span className="w-8 text-xs text-muted-foreground">min</span>
  </div>
)

export default function Estimator() {
  const { eventId: selectedEventId } = useSelectedEvent()
  const [inputs, setInputs] = useState<EstimatorInputs>(DEFAULT_ESTIMATOR_INPUTS)

  const setField = <K extends keyof EstimatorInputs>(key: K, value: EstimatorInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const { data: divisions = [], isLoading: loadingDivisions } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId,
  })

  // Same query Draws.tsx/EntriesView.tsx already use — shares cache, and
  // already gives entry counts + draw-existence per (division, weight class).
  const { data: drawCategories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["draw-categories", selectedEventId],
    queryFn: () => listDrawCategories(selectedEventId),
    enabled: !!selectedEventId,
  })

  const kumiteCategories = useMemo(
    () => drawCategories.filter((c) => c.category === "KUMITE"),
    [drawCategories],
  )
  const kumiteDrawIds = useMemo(
    () =>
      kumiteCategories
        .filter((c) => c.draw)
        .map((c) => c.draw!.id)
        .sort(),
    [kumiteCategories],
  )

  // Real (bye-excluded) entry count for every kumite category that already
  // has a draw. Bounded by how many draws actually exist — often small/zero
  // early in event planning, which is exactly when this tool is most useful.
  //
  // Deliberately `slots.length`, NOT counting bout rows that currently have
  // both fighters filled in: for an unplayed draw only round 1 (plus any
  // bye-cascades) is populated, so that count only reflects how much of the
  // bracket has been *scored so far*, not how many bouts it will ever need —
  // it would badly undercount the normal case of "draw generated, nothing
  // played yet." slots.length is the bracket's real entry count regardless
  // of how much has been played; deriveKumiteBoutBreakdown turns that into
  // main-bracket bouts (entries - 1, exact) and an expected repechage count.
  const { data: drawEntryCounts = {}, isFetching: loadingDrawBouts } = useQuery({
    queryKey: ["estimator-draw-slots", selectedEventId, kumiteDrawIds.join(",")],
    queryFn: async () => {
      const draws = await Promise.all(kumiteDrawIds.map((id) => getDraw(id)))
      const map: Record<string, number> = {}
      for (const d of draws) map[d.id] = d.slots.length
      return map
    },
    enabled: !!selectedEventId,
  })

  const categoryData: KumiteCategoryData[] = useMemo(
    () =>
      kumiteCategories.map((c) => ({
        divisionId: c.divisionId,
        entryCount: c.entryCount,
        drawEntryCount: c.draw ? drawEntryCounts[c.draw.id] ?? null : null,
      })),
    [kumiteCategories, drawEntryCounts],
  )

  const breakdown = useMemo(
    () => deriveKumiteBoutBreakdown(divisions, categoryData),
    [divisions, categoryData],
  )
  const visibleBreakdown = useMemo(() => breakdown.filter((d) => d.bouts > 0), [breakdown])

  const estimate = useMemo(() => estimateKumiteDuration(breakdown, inputs), [breakdown, inputs])

  const loading = loadingDivisions || loadingCategories

  if (!selectedEventId) return null

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl tracking-wide sm:text-2xl">Duration estimator</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A single total-time estimate for kumite, tuned from real entries and draws.
          Not a running order — just "how long is today going to take."
        </p>
      </div>

      {breakdown.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No kumite divisions on this event yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
          {/* Inputs */}
          <Card className="h-fit">
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Tuning</h3>
                <button
                  type="button"
                  onClick={() => setInputs(DEFAULT_ESTIMATOR_INPUTS)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  Reset to defaults
                </button>
              </div>

              <NumberField
                id="mats"
                label="Mats / floors"
                value={inputs.mats}
                min={1}
                onChange={(v) => setField("mats", v)}
              />
              <NumberField
                id="minutesPerBout"
                label="Minutes per bout"
                hint="Default: 3 min match + 1 min transition between bouts."
                value={inputs.minutesPerBout}
                min={0}
                step={0.5}
                suffix="min"
                onChange={(v) => setField("minutesPerBout", v)}
              />
              <NumberField
                id="bufferPct"
                label="Injury / stoppage buffer"
                hint="Added on top of total bout time to absorb delays."
                value={inputs.bufferPct}
                min={0}
                suffix="%"
                onChange={(v) => setField("bufferPct", v)}
              />
              <NumberField
                id="changeoverMinutes"
                label="Changeover per division"
                hint="Time a mat loses moving to the next division's pool."
                value={inputs.changeoverMinutes}
                min={0}
                suffix="min"
                onChange={(v) => setField("changeoverMinutes", v)}
              />

              <div className="space-y-2.5 border-t pt-4">
                <ToggleField
                  id="lunchEnabled"
                  label="Officials lunch break"
                  checked={inputs.lunchEnabled}
                  onCheckedChange={(v) => setField("lunchEnabled", v)}
                  minutes={inputs.lunchMinutes}
                  onMinutesChange={(v) => setField("lunchMinutes", v)}
                />
                <ToggleField
                  id="openingEnabled"
                  label="Opening ceremony"
                  checked={inputs.openingEnabled}
                  onCheckedChange={(v) => setField("openingEnabled", v)}
                  minutes={inputs.openingMinutes}
                  onMinutesChange={(v) => setField("openingMinutes", v)}
                />
                <ToggleField
                  id="closingEnabled"
                  label="Closing ceremony"
                  checked={inputs.closingEnabled}
                  onCheckedChange={(v) => setField("closingEnabled", v)}
                  minutes={inputs.closingMinutes}
                  onMinutesChange={(v) => setField("closingMinutes", v)}
                />
                <ToggleField
                  id="checkinEnabled"
                  label="Athlete check-in / warm-up"
                  checked={inputs.checkinEnabled}
                  onCheckedChange={(v) => setField("checkinEnabled", v)}
                  minutes={inputs.checkinMinutes}
                  onMinutesChange={(v) => setField("checkinMinutes", v)}
                />
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  Check-in wasn't in the original brief — off by default. Turn it on if the
                  day needs a block before the first bout for athletes to check in and warm up.
                </p>
              </div>

              <p className="border-t pt-3 text-[11px] text-muted-foreground">
                Not saved — these reset if you leave the page. Per-event saved presets are a
                natural next step once this shape has been used for real.
              </p>
            </CardContent>
          </Card>

          {/* Result */}
          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated total time</p>
                    <p className="font-display text-4xl tracking-wide">
                      {formatDuration(estimate.totalMinutes)}
                    </p>
                  </div>
                  <div className="flex gap-4 text-right text-xs text-muted-foreground">
                    <div>
                      <p className="font-display text-lg text-foreground">{estimate.totalBouts}</p>
                      <p>kumite bouts</p>
                    </div>
                    <div>
                      <p className="font-display text-lg text-foreground">{estimate.totalDivisions}</p>
                      <p>divisions</p>
                    </div>
                    <div>
                      <p className="font-display text-lg text-foreground">{inputs.mats}</p>
                      <p>mat{inputs.mats === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                </div>

                {/* Segment bar */}
                <div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                    {estimate.segments.map((s) => (
                      <div
                        key={s.key}
                        className={cn(SEGMENT_STYLES[s.key] ?? "bg-muted-foreground")}
                        style={{ width: `${(s.minutes / Math.max(1, estimate.totalMinutes)) * 100}%` }}
                        title={`${s.label}: ${formatDuration(s.minutes)}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {estimate.segments.map((s) => (
                      <span key={s.key} className="flex items-center gap-1.5">
                        <span className={cn("size-2 rounded-full", SEGMENT_STYLES[s.key] ?? "bg-muted-foreground")} />
                        {s.label}: {formatDuration(s.minutes)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* The model, stated plainly */}
                <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                    <Timer className="size-3.5" />
                    How this is calculated
                  </p>
                  <p>
                    Total bout minutes = (bouts × minutes/bout) × (1 + buffer%) ={" "}
                    {estimate.boutMinutesRaw}
                    {" × "}
                    {(1 + inputs.bufferPct / 100).toFixed(2)} = {Math.round(estimate.boutMinutesWithBuffer)}
                    min. Split across {inputs.mats} mat{inputs.mats === 1 ? "" : "s"}:{" "}
                    ⌈{Math.round(estimate.boutMinutesWithBuffer)} / {inputs.mats}⌉ ={" "}
                    {estimate.perMatBoutMinutes}min. Plus {estimate.divisionsPerMat} division
                    {estimate.divisionsPerMat === 1 ? "" : "s"}/mat ×{" "}
                    {inputs.changeoverMinutes}min changeover, lunch, and ceremonies.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium">
                    <Swords className="size-4" />
                    Bout breakdown by division
                  </h3>
                  {loadingDrawBouts && (
                    <span className="text-[11px] text-muted-foreground">Refining drawn brackets…</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {visibleBreakdown.map((d) => (
                    <div
                      key={d.divisionId}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate">{d.divisionName}</span>
                      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                        {d.entries} entr{d.entries === 1 ? "y" : "ies"}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 font-normal text-[10px]",
                          d.source === "draw"
                            ? "border-belt-green/30 bg-belt-green/10 text-belt-green"
                            : d.source === "mixed"
                            ? "border-belt-blue/30 bg-belt-blue/10 text-belt-blue"
                            : "text-muted-foreground",
                        )}
                        title={
                          d.source === "draw"
                            ? "From the bracket's actual entries — accounts for changes since it was drawn"
                            : d.source === "mixed"
                            ? "Some weight classes drawn, others estimated"
                            : "Estimated from approved entries"
                        }
                      >
                        {d.source === "draw" ? "drawn" : d.source === "mixed" ? "mixed" : "estimated"}
                      </Badge>
                      <span className="w-16 shrink-0 text-right font-display tracking-wide">
                        {d.bouts} bout{d.bouts === 1 ? "" : "s"}
                      </span>
                      <span
                        className="w-20 shrink-0 text-right text-xs text-muted-foreground"
                        title="This division's own bout time, buffer and one changeover included — not divided across mats"
                      >
                        ≈ {formatDuration(minutesForDivision(d.bouts, inputs))}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  Bouts = main-bracket matches (entries − 1, exact) plus an expected WKF
                  double-repechage bronze-bout count computed from this bracket's actual bye
                  structure. "Drawn" divisions use the bracket's real entry count rather than
                  re-estimating, which matters if entries changed since it was drawn (a
                  withdrawal, say). Repechage is a genuine expectation, not a guarantee — the
                  exact count depends on who wins each match, which isn't knowable before the
                  bracket is fought, so the real total may land a bout or two either side of
                  this once played.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
