// Printable one-page tournament schedule — a running order across every
// tatami, meant to come out of "Cmd/Ctrl+P -> Save as PDF" looking like the
// grid on a real WKF schedule sheet: time down the side, one column per mat,
// division blocks placed and sized to scale.
//
// Lives outside the event hub deliberately, same reasoning as
// pages/EntrySheet.tsx: this is a document, not an app screen, so what's on
// screen should be exactly what prints. `.paper` re-themes it to the light
// palette regardless of the app's dark-mode setting; the toolbar is the only
// thing `print:hidden`.
//
// Reuses lib/schedule.ts's buildSchedule wholesale — same wall-clock timeline
// the interactive Plan tab draws, just laid out in percentages instead of
// on-screen pixels (see lib/schedule-print.ts) so a whole day's plan always
// fits one physical page regardless of how many hours it spans.

import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ArrowLeft, Printer } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { PageSpinner } from "@/components/UIState"
import { cn } from "@/lib/utils"
import { categoryTitle, getPlanBoard, type PlanCategory } from "@/lib/plan"
import {
  buildSchedule,
  formatClock,
  formatSpan,
  interleaveMatOrder,
  type ScheduleCategoryInput,
  type ScheduleInput,
} from "@/lib/schedule"
import { hourTicks, isTeamCategory, layoutMatColumn, layoutPercent } from "@/lib/schedule-print"
import { blockSurface, blockText, categorySurface, SPAN_ALL_HATCH } from "@/components/plan/plan-visuals"

const toScheduleCategory = (c: PlanCategory): ScheduleCategoryInput => ({
  drawId: c.drawId!,
  title: categoryTitle(c),
  isKata: c.category === "KATA",
  entryCount: c.entryCount,
  drawEntryCount: c.drawEntryCount,
  boutDurationSec: c.boutDurationSec,
  bufferPct: c.bufferPct,
})

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

const formatGeneratedAt = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

// Usable grid height inside the printed page: A4 landscape (297 x 210mm)
// minus this page's 10mm margins minus the header block above the grid.
// Estimated, not measured — the actual fit wants checking on a real print
// preview (see docs/state.md); if the header ever grows this needs revisiting.
const GRID_HEIGHT_MM = 155
// Every block is floored at this height regardless of its real duration —
// enough for one line of the category name — via lib/schedule-print.ts's
// layoutMatColumn. Sizing strictly proportional to duration (the previous
// behaviour) meant a 15-20 minute category could shrink below the height
// its own text needs, and the label just disappeared: the bug this fixes.
const MIN_BLOCK_HEIGHT_PCT = 2.6
// At or above this, there's room for the full two-line detail (discipline,
// time, duration, entries) under the title. Below it — a block that only
// cleared the floor above, not its natural size — the detail line drops to
// a compact single line (still the real start time, just nothing else), per
// the fix's brief: no information silently lost, just less of it at once.
const COMPACT_DETAIL_HEIGHT_PCT = 5.5

export default function PlanPrintPage() {
  const { eventId = "" } = useParams()
  const navigate = useNavigate()
  const { canManageEvent } = useAuth()
  const canManage = canManageEvent(eventId)

  const { data: board, isLoading } = useQuery({
    queryKey: ["plan-board", eventId],
    queryFn: () => getPlanBoard(eventId),
    enabled: !!eventId,
  })

  const categoriesByDrawId = useMemo(() => {
    const map = new Map<string, PlanCategory>()
    for (const c of board?.categories ?? []) if (c.drawId) map.set(c.drawId, c)
    return map
  }, [board])

  const schedule = useMemo(() => {
    if (!board) return null
    const drawn = board.categories.filter((c) => c.hasDraw && c.drawId)
    const input: ScheduleInput = {
      timing: board.timing,
      mats: board.mats.map((mat) => {
        const matCategories = drawn.filter((c) => c.matId === mat.id)
        const matBlocks = board.blocks.filter((b) => b.matId === mat.id)
        return {
          id: mat.id,
          name: mat.name,
          categories: matCategories.map(toScheduleCategory),
          blocks: matBlocks,
        }
      }),
      venueBlocks: board.blocks.filter((b) => b.matId === null),
      unassignedCount: drawn.filter((c) => !c.matId).length,
      order: new Map(
        board.mats.map((mat) => [
          mat.id,
          interleaveMatOrder(
            drawn.filter((c) => c.matId === mat.id).map((c) => ({ drawId: c.drawId!, matOrder: c.matOrder })),
            board.blocks.filter((b) => b.matId === mat.id).map((b) => ({ id: b.id, matOrder: b.matOrder })),
          ),
        ]),
      ),
    }
    return buildSchedule(input)
  }, [board])

  if (!eventId) return null

  if (isLoading || !board || !schedule) return <PageSpinner label="Building the schedule" />

  if (!canManage) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Only admins and this event's coordinators can print the schedule.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>
    )
  }

  const totalSpanMin = schedule.finishMin - schedule.dayStartMin
  const ticks = hourTicks(schedule.dayStartMin, schedule.finishMin)
  const generatedAt = formatGeneratedAt(new Date())

  return (
    <div className="paper min-h-screen bg-background text-foreground">
      {/* This page prints landscape; the app-wide rule (index.css) is A4
          portrait for the entry sheet, so it's overridden locally rather
          than changed globally — only this route needs the wider page. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      {/* Toolbar — not part of the document */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[277mm] flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
          <span className="truncate text-sm text-muted-foreground">{board.event.name} — Schedule</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer />
              Print / Save as PDF
            </Button>
          </div>
        </div>
        {schedule.warnings.length > 0 && (
          <div className="mx-auto flex max-w-[277mm] items-start gap-2 px-4 pb-3 text-xs text-belt-orange">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              This printout won't be complete: {schedule.warnings.map((w) => w.message).join(" ")}
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[277mm] px-6 py-6 text-[11px] leading-snug print:px-0 print:py-0">
        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <header className="print-keep mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xs tracking-[0.2em] text-primary">GOJU KAI NAMIBIA</p>
            <h1 className="font-display text-xl tracking-wide">{board.event.name}</h1>
            <p className="text-xs text-muted-foreground">{formatDate(board.event.startDate)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-belt-orange">
              Provisional schedule
            </p>
            <p className="text-[10px] text-muted-foreground">Generated at {generatedAt}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatClock(schedule.dayStartMin)} – {formatClock(schedule.finishMin)} ·{" "}
              {formatSpan(totalSpanMin)} on site
            </p>
          </div>
        </header>

        {/* ── Grid: time gutter + one column per mat ──────────────────── */}
        <div className="print-keep flex gap-2" style={{ height: `${GRID_HEIGHT_MM}mm` }}>
          {/* Time gutter */}
          <div className="relative w-10 shrink-0">
            {ticks.map((t) => {
              const { topPct } = layoutPercent(t, t, schedule.dayStartMin, totalSpanMin)
              return (
                <span
                  key={t}
                  className="absolute right-1 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground"
                  style={{ top: `${topPct}%` }}
                >
                  {formatClock(t)}
                </span>
              )
            })}
          </div>

          {/* Mat columns, with venue-wide bands laid over all of them */}
          <div className="relative flex flex-1 gap-2">
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
              {ticks.map((t) => {
                const { topPct } = layoutPercent(t, t, schedule.dayStartMin, totalSpanMin)
                return (
                  <div
                    key={t}
                    className="absolute inset-x-0 border-t border-border/40"
                    style={{ top: `${topPct}%` }}
                  />
                )
              })}
            </div>

            {schedule.mats.map((mat) => {
              const laidOut = layoutMatColumn(mat.items, schedule.dayStartMin, totalSpanMin, MIN_BLOCK_HEIGHT_PCT)
              const layoutById = new Map(laidOut.map((l) => [l.id, l]))
              return (
                <div key={mat.id} className="relative min-w-0 flex-1">
                  <div className="absolute inset-0 rounded border bg-muted/10" aria-hidden />
                  <p className="absolute -top-4 left-0 right-0 truncate text-center text-[10px] font-semibold uppercase tracking-wide">
                    {mat.name}
                  </p>
                  {mat.items.map((item) => {
                    const { topPct, heightPct } = layoutById.get(item.id) ?? { topPct: 0, heightPct: 0 }
                    const category = item.category ? categoriesByDrawId.get(item.id) : undefined
                    const isKumite = category?.category === "KUMITE"
                    const team = category ? isTeamCategory(categoryTitle(category)) : false
                    // Every block clears MIN_BLOCK_HEIGHT_PCT, so the title
                    // always fits — only the second, more detailed line is
                    // conditional on there being room for it.
                    const compact = heightPct < COMPACT_DETAIL_HEIGHT_PCT
                    return (
                      <div
                        key={`${item.kind}:${item.id}`}
                        className={cn(
                          "absolute inset-x-0.5 overflow-hidden rounded border px-1 py-0.5",
                          item.kind === "CATEGORY"
                            ? categorySurface(!!isKumite, category?.status ?? null)
                            : cn("border-dashed", blockSurface(item.block!.kind)),
                        )}
                        style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                      >
                        <p
                          className={cn(
                            "truncate text-[9px] font-semibold leading-tight",
                            item.kind === "BLOCK" && blockText(item.block!.kind),
                          )}
                        >
                          {category ? categoryTitle(category) : item.title}
                          {team && <span className="ml-1 font-normal uppercase text-belt-purple">· Team</span>}
                          {/* Compact: the one thing a full detail line would
                              have said that isn't in the title — the real
                              start time — folded onto the title's own line
                              rather than dropped. */}
                          {compact && (
                            <span className="ml-1 font-normal normal-case text-muted-foreground">
                              · {formatClock(item.startMin)}
                            </span>
                          )}
                        </p>
                        {!compact &&
                          (item.kind === "CATEGORY" ? (
                            <p className="truncate text-[8px] leading-tight text-muted-foreground">
                              {isKumite ? "Kumite" : "Kata"} · {formatClock(item.startMin)} ·{" "}
                              {formatSpan(item.minutes)} · {category?.entryCount ?? 0} entries
                            </p>
                          ) : (
                            <p className="truncate text-[8px] leading-tight text-muted-foreground">
                              {formatClock(item.startMin)} · {formatSpan(item.minutes)}
                            </p>
                          ))}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Venue-wide bands sit above every column */}
            {schedule.bands.map((band) => {
              if (band.anchor === "UNSCHEDULED") return null
              const { topPct, heightPct } = layoutPercent(
                band.startMin,
                band.endMin,
                schedule.dayStartMin,
                totalSpanMin,
              )
              return (
                <div
                  key={band.id}
                  className={cn(
                    "pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5 overflow-hidden border-y border-dashed px-2",
                    blockSurface(band.kind),
                    blockText(band.kind),
                    SPAN_ALL_HATCH,
                  )}
                  style={{ top: `${topPct}%`, height: `${Math.max(heightPct, MIN_BLOCK_HEIGHT_PCT)}%` }}
                >
                  <span className="truncate text-[9px] font-semibold uppercase tracking-wide">{band.label}</span>
                  <span className="shrink-0 text-[9px] tabular-nums opacity-80">
                    {formatClock(band.startMin)} – {formatClock(band.endMin)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="print-keep mt-3 text-[9px] text-muted-foreground">
          Provisional — subject to change on the day. Kumite bracket times assume every bout runs to its expected
          length; kata performance order within a category is not shown.
        </p>
      </div>
    </div>
  )
}
