import { useMemo, useState } from "react"
import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { categoryTitle, type PlanCategory } from "@/lib/plan"
import { formatClock, formatSpan, type Schedule } from "@/lib/schedule"
import { SPAN_ALL_HATCH, blockSurface, blockText, categorySurface } from "./plan-visuals"

// The shape of the day, drawn to scale. The board answers "what runs where and
// in what order"; this answers "and therefore, when" — same data, same colours,
// read vertically against a clock instead of as a list.

const ZOOMS = [0.6, 1, 1.8, 3] as const
const DEFAULT_ZOOM = 1
/** Pixels per minute at zoom 1 — a 9-hour day lands at a readable ~490px. */
const BASE_PX_PER_MIN = 0.9
/** Below this height a bar can't hold its label, so the text is dropped. */
const LABEL_MIN_PX = 26

export function ScheduleTimeline({
  schedule,
  categoriesByDrawId,
}: {
  schedule: Schedule
  categoriesByDrawId: Map<string, PlanCategory>
}) {
  const [zoomIndex, setZoomIndex] = useState(ZOOMS.indexOf(DEFAULT_ZOOM))
  const pxPerMin = BASE_PX_PER_MIN * ZOOMS[zoomIndex]

  // Round the window out to whole hours so the tick labels are on the hour.
  const { fromMin, toMin } = useMemo(() => {
    const start = Math.floor(schedule.dayStartMin / 60) * 60
    const end = Math.ceil(Math.max(schedule.finishMin, schedule.dayStartMin + 60) / 60) * 60
    return { fromMin: start, toMin: end }
  }, [schedule])

  const height = (toMin - fromMin) * pxPerMin
  const y = (minute: number) => (minute - fromMin) * pxPerMin

  const hours = useMemo(() => {
    const ticks: number[] = []
    for (let t = fromMin; t <= toMin; t += 60) ticks.push(t)
    return ticks
  }, [fromMin, toMin])

  const hasContent = schedule.mats.some((m) => m.items.length > 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {formatClock(schedule.dayStartMin)} – {formatClock(schedule.finishMin)} ·{" "}
          {formatSpan(schedule.finishMin - schedule.dayStartMin)} on site
        </p>
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Zoom out"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-[11px] tabular-nums text-muted-foreground">
            {ZOOMS[zoomIndex]}×
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Zoom in"
            disabled={zoomIndex === ZOOMS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOMS.length - 1, i + 1))}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* The hour labels are centred on their tick, so the first one needs
            room above the grid or its top half is clipped. */}
        <div className="flex min-w-max gap-2 py-2">
          {/* Time gutter */}
          <div className="relative w-12 shrink-0" style={{ height }}>
            {hours.map((t) => (
              <span
                key={t}
                className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                style={{ top: y(t) }}
              >
                {formatClock(t)}
              </span>
            ))}
          </div>

          {/* Floor columns, with the venue-wide bands laid over all of them */}
          <div className="relative flex gap-2">
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
              {hours.map((t) => (
                <div
                  key={t}
                  className="absolute inset-x-0 border-t border-border/40"
                  style={{ top: y(t) }}
                />
              ))}
            </div>

            {schedule.mats.map((mat) => (
              <div key={mat.id} className="relative w-40 shrink-0" style={{ height }}>
                <div className="absolute inset-0 rounded-lg border bg-muted/10" aria-hidden />
                {mat.items.map((item) => {
                  const top = y(item.startMin)
                  const barHeight = Math.max(2, (item.endMin - item.startMin) * pxPerMin)
                  const category = item.category
                    ? categoriesByDrawId.get(item.id)
                    : undefined
                  const isKumite = category?.category === "KUMITE"
                  return (
                    <div
                      key={`${item.kind}:${item.id}`}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded border px-1.5 py-0.5",
                        item.kind === "CATEGORY"
                          ? categorySurface(!!isKumite, category?.status ?? null)
                          : cn("border-dashed", blockSurface(item.block!.kind)),
                      )}
                      style={{ top, height: barHeight }}
                      title={`${item.title}\n${formatClock(item.startMin)} – ${formatClock(item.endMin)} · ${formatSpan(item.minutes)}${item.bouts ? ` · ${item.bouts} bouts` : ""}`}
                    >
                      {barHeight >= LABEL_MIN_PX && (
                        <>
                          <p
                            className={cn(
                              "truncate text-[10px] leading-tight font-medium",
                              item.kind === "BLOCK" && blockText(item.block!.kind),
                            )}
                          >
                            {category ? categoryTitle(category) : item.title}
                          </p>
                          <p className="truncate text-[9px] leading-tight tabular-nums text-muted-foreground">
                            {formatClock(item.startMin)} · {formatSpan(item.minutes)}
                          </p>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Venue-wide bands sit above every column — that is the point. */}
            {schedule.bands.map((band) => {
              const top = y(band.startMin)
              const bandHeight = Math.max(3, band.minutes * pxPerMin)
              if (band.anchor === "UNSCHEDULED") return null
              return (
                <div
                  key={band.id}
                  className={cn(
                    "pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5 overflow-hidden border-y border-dashed px-2",
                    blockSurface(band.kind),
                    blockText(band.kind),
                    SPAN_ALL_HATCH,
                  )}
                  style={{ top, height: bandHeight }}
                >
                  <span className="truncate text-[10px] font-semibold tracking-wide uppercase">
                    {band.label}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums opacity-80">
                    {formatClock(band.startMin)} – {formatClock(band.endMin)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!hasContent && (
        <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
          Put some categories on a floor and the day takes shape here.
        </p>
      )}
    </div>
  )
}
