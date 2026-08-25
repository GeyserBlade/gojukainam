// Call-up sheet — one printable page per division, for the tatami
// coordinator gathering athletes ahead of their category: who to seat where
// (AKA/red vs AO/blue, not karate rank), in the order they'll fight.
//
// Two routes share this one component (see App.tsx):
//   /callup/print/:eventId/:drawId       — one division
//   /callup/print/:eventId/mat/:matNumber — every division on that floor,
//     ordered by scheduled time, one page-broken section each
// They resolve to the same thing internally: a list of "targets" (one
// PlanCategory for the single-division route, several for the mat route),
// each rendered by the same per-division section below.
//
// Lives outside the hub chrome, same reasoning as pages/PlanPrint.tsx and
// pages/EntrySheet.tsx: a document that gets saved as PDF should show on
// screen exactly what prints. A4 *portrait* this time (unlike the
// multi-tatami schedule's landscape) — the app's existing global @page rule
// in index.css already is A4 portrait, so this page doesn't need its own
// override the way PlanPrint.tsx did for landscape.
//
// Unlike the multi-tatami schedule, a call-up sheet is a flowing list, not a
// time-scaled grid — there's no natural "compress to fit" dimension for a
// list of names the way there is for a duration-sized block, so a large
// bracket's sheet is allowed to spill onto a second physical page. "One
// division per page" means each division starts a fresh page, not that its
// whole bout list is forced into exactly one sheet.

import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueries } from "@tanstack/react-query"
import { ArrowLeft, Printer } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { PageSpinner } from "@/components/UIState"
import { cn } from "@/lib/utils"
import { categoryTitle, getPlanBoard, toScheduleCategory, type PlanCategory } from "@/lib/plan"
import { buildSchedule, formatClock, interleaveMatOrder, type ScheduleCategoryInput, type ScheduleInput } from "@/lib/schedule"
import { getDraw, type DrawDetail, type BoutMedalType } from "@/lib/draws"
import { buildCallupSheet, type CallupBoutRow, type CallupSlot } from "@/lib/callup"

const formatGeneratedAt = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

/** A hand-markable checkbox glyph — a real `<input type="checkbox">` prints
 * inconsistently across browsers, and this sheet is meant to be printed
 * then ticked off with a pen, not clicked on screen. */
const CheckSquare = () => <span className="inline-block h-3 w-3 shrink-0 border border-foreground/50 align-middle" />

const SlotText = ({ slot }: { slot: CallupSlot }) =>
  slot.tbdFrom ? (
    <span className="italic text-muted-foreground">TBD (from {slot.tbdFrom})</span>
  ) : (
    <>
      <span className="font-medium">{slot.name}</span>
      <span className="text-muted-foreground"> · {slot.clubName}</span>
    </>
  )

/**
 * A medal marker that survives black-and-white printing: colored ink is a
 * "nice to have" here, not something to rely on, so the final gets a
 * thicker (2px) border and the bronze bouts a thinner one, with a ★ glyph
 * and the word itself doing the actual work — a coordinator scanning a
 * grayscale photocopy still sees exactly which rows matter.
 */
const MedalMark = ({ type }: { type: NonNullable<BoutMedalType> }) => (
  <span
    className={cn(
      "ml-1.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 align-middle text-[9px] font-bold tracking-wide uppercase",
      type === "final" ? "border-2 border-foreground bg-yellow-400/25" : "border border-foreground/70 bg-orange-500/20",
    )}
  >
    ★ {type === "final" ? "Final" : "Bronze"}
  </span>
)

// Kata and kumite both run as a real aka/ao head-to-head bracket (kata just
// decides the winner by flags instead of points), so both are seated the
// same way — one shared table, no separate single-column kata format.
const BoutTable = ({ rows, heading }: { rows: CallupBoutRow[]; heading?: string }) => {
  if (rows.length === 0) return null
  return (
    <div className="print-keep mb-4">
      {heading && <h3 className="mb-1.5 font-display text-sm tracking-wide">{heading}</h3>}
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="w-20 border border-foreground/20 bg-muted/40 px-2 py-1 text-left font-semibold">Bout</th>
            <th className="border border-foreground/20 bg-red-600 px-2 py-1 text-left font-semibold text-white">
              AKA · red
            </th>
            <th className="border border-foreground/20 bg-blue-700 px-2 py-1 text-left font-semibold text-white">
              AO · blue
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.boutId ?? row.label} className="print-keep">
              <td className="border border-foreground/20 px-2 py-1.5 align-top font-medium">
                {row.label}
                {row.medalType && <MedalMark type={row.medalType} />}
              </td>
              <td className="border border-foreground/20 bg-red-50 px-2 py-1.5 align-top">
                <div className="flex items-start gap-2">
                  <CheckSquare />
                  <SlotText slot={row.aka} />
                </div>
              </td>
              <td className="border border-foreground/20 bg-blue-50 px-2 py-1.5 align-top">
                <div className="flex items-start gap-2">
                  <CheckSquare />
                  <SlotText slot={row.ao} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** One division's whole printable page — the unit both routes ultimately
 * render one or more of. */
function DivisionSheet({
  eventName,
  category,
  matName,
  startMin,
  draw,
  isLast,
  generatedAt,
}: {
  eventName: string
  category: PlanCategory
  matName: string | null
  startMin: number | null
  draw: DrawDetail
  isLast: boolean
  generatedAt: string
}) {
  const sheet = useMemo(() => buildCallupSheet(draw), [draw])

  return (
    <div className={cn("px-2 py-4 text-[11px] leading-snug print:px-0", !isLast && "break-after-page")}>
      <header className="print-keep mb-3 flex items-start justify-between gap-4 border-b border-foreground/20 pb-2">
        <div>
          <p className="font-display text-xs tracking-[0.2em] text-primary">GOJU KAI NAMIBIA</p>
          <h1 className="font-display text-lg tracking-wide">{categoryTitle(category)}</h1>
          <p className="text-xs text-muted-foreground">{eventName}</p>
        </div>
        <div className="shrink-0 text-right text-[10px] text-muted-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-belt-orange">Call-up sheet</p>
          <p>{category.category === "KUMITE" ? "Kumite" : "Kata"}</p>
          {matName && <p>{matName}</p>}
          {startMin !== null && <p>Est. start {formatClock(startMin)}</p>}
          <p>{category.entryCount} entries</p>
          <p>Generated at {generatedAt}</p>
        </div>
      </header>

      {/* WKF running order: main bracket up through the semis, then bronze,
          then the final last — printed as three sections in that order so
          the coordinator's sheet matches what the operator will actually be
          asked to call, not bracket-index order (which would put the final
          right after the semis, ahead of bronze). */}
      <BoutTable rows={sheet.mainRows} />
      <BoutTable rows={sheet.bronzeRows} heading={sheet.bronzeRows.length > 0 ? "Bronze bouts" : undefined} />
      <BoutTable rows={sheet.finalRows} heading={sheet.finalRows.length > 0 ? "Final" : undefined} />

      {sheet.mainRows.length === 0 && sheet.bronzeRows.length === 0 && sheet.finalRows.length === 0 && (
        <p className="rounded border border-dashed p-3 text-center text-muted-foreground">
          Nothing to call up yet — this bracket has no bouts ready.
        </p>
      )}
    </div>
  )
}

export default function CallupPrintPage() {
  const { eventId = "", drawId, matNumber } = useParams<{ eventId: string; drawId?: string; matNumber?: string }>()
  const navigate = useNavigate()
  const { canManageEvent } = useAuth()
  const canManage = canManageEvent(eventId)

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["plan-board", eventId],
    queryFn: () => getPlanBoard(eventId),
    enabled: !!eventId,
  })

  // Both routes resolve to the same shape: which PlanCategory rows to print,
  // in print order. Single-division is a list of exactly one; the mat route
  // is every drawn category on that floor, ordered the same way the floor
  // itself runs (matOrder — the same field buildSchedule reads).
  const targets = useMemo(() => {
    if (!board) return []
    if (drawId) {
      const cat = board.categories.find((c) => c.drawId === drawId)
      return cat ? [cat] : []
    }
    if (matNumber) {
      const mat = board.mats[Number(matNumber) - 1]
      if (!mat) return []
      return board.categories
        .filter((c) => c.hasDraw && c.matId === mat.id)
        .sort((a, b) => (a.matOrder ?? Number.MAX_SAFE_INTEGER) - (b.matOrder ?? Number.MAX_SAFE_INTEGER))
    }
    return []
  }, [board, drawId, matNumber])

  const schedule = useMemo(() => {
    if (!board) return null
    const drawn = board.categories.filter((c) => c.hasDraw && c.drawId)
    const input: ScheduleInput = {
      timing: board.timing,
      mats: board.mats.map((mat) => ({
        id: mat.id,
        name: mat.name,
        categories: drawn.filter((c) => c.matId === mat.id).map(toScheduleCategory),
        blocks: board.blocks.filter((b) => b.matId === mat.id),
      })),
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

  const drawQueries = useQueries({
    queries: targets.map((c) => ({
      queryKey: ["draw", c.drawId],
      queryFn: () => getDraw(c.drawId!),
      enabled: !!c.drawId,
    })),
  })

  if (!eventId || (!drawId && !matNumber)) return null

  const stillLoading = boardLoading || !board || !schedule || drawQueries.some((q) => q.isLoading)
  if (stillLoading) return <PageSpinner label="Building the call-up sheet" />

  if (!canManage) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Only admins and this event's coordinators can print call-up sheets.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>
    )
  }

  if (targets.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          {drawId
            ? "This division doesn't have a draw yet — there's nothing to call up."
            : "This floor has no divisions with a draw on it yet."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>
    )
  }

  const generatedAt = formatGeneratedAt(new Date())
  const matNameById = new Map(board.mats.map((m) => [m.id, m.name]))
  const startMinByDrawId = new Map(
    schedule.mats.flatMap((m) => m.items.filter((i) => i.kind === "CATEGORY").map((i) => [i.id, i.startMin] as const)),
  )

  return (
    <div className="paper min-h-screen bg-background text-foreground">
      {/* Toolbar — not part of the document */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
          <span className="truncate text-sm text-muted-foreground">
            {board.event.name} — {drawId ? "Call-up sheet" : `Call-up sheets — Tatami ${matNumber}`}
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[210mm]">
        {targets.map((category, i) => {
          const draw = drawQueries[i]?.data
          if (!draw) return null
          return (
            <DivisionSheet
              key={category.drawId ?? category.key}
              eventName={board.event.name}
              category={category}
              matName={category.matId ? matNameById.get(category.matId) ?? null : null}
              startMin={category.drawId ? startMinByDrawId.get(category.drawId) ?? null : null}
              draw={draw}
              isLast={i === targets.length - 1}
              generatedAt={generatedAt}
            />
          )
        })}
      </div>
    </div>
  )
}
