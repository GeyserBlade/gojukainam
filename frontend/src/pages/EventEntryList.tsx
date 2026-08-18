// The event entry list — the hub's Entries board as a printable document.
//
// The club sheet (pages/EntrySheet.tsx) is one club's roster, shaped for that
// club to check and sign. This is the organizer's whole-event counterpart, and
// it deliberately looks like the screen it comes from: the same stats strip,
// the same age-band sections, the same division cards with the entered
// competitors under them. What's left out is the half of that screen you cannot
// print — the athlete pool and its drag-and-drop.
//
// Like the club sheet it lives outside the hub chrome and is wrapped in
// `.paper`, which re-themes the design tokens to the light palette so the
// document is on white however the app is themed. Anything that is not part of
// the document (the toolbar) is `print:hidden`.

import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Download, Printer } from "lucide-react"

import { useApiErrorToast } from "@/components/Toast"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { Button } from "@/components/ui/button"
import { PageSpinner } from "@/components/UIState"
import { cn } from "@/lib/utils"
import {
  downloadEventEntriesXlsx,
  getEventEntryList,
  groupByAgeBand,
  LIST_STATUS_LABEL,
  type ListCompetitor,
  type ListDivision,
  type ListStatus,
} from "@/lib/entry-list"

// The board's own palette, kept literally — this document is meant to be
// recognisable as the Entries screen on paper.
const STATUS_STYLES: Record<ListStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  APPROVED: "bg-belt-green/15 text-belt-green border-belt-green/30",
  RETURNED: "bg-flag-red/15 text-flag-red border-flag-red/30",
}

const CATEGORY_PILL: Record<"KATA" | "KUMITE", string> = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
}

const StatusChip = ({ status }: { status: ListStatus }) => (
  <span
    className={cn(
      "inline-block shrink-0 rounded border px-1.5 py-px text-[9px] uppercase tracking-wide leading-4",
      STATUS_STYLES[status],
    )}
  >
    {LIST_STATUS_LABEL[status]}
  </span>
)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

/** One figure of the stats strip, matching the board's. */
const Stat = ({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: "orange" | "green" | "red"
}) => (
  <div className="px-3 py-1.5">
    <p
      className={cn(
        "font-display text-lg leading-none tracking-wider tabular-nums",
        tone === "orange" && "text-belt-orange",
        tone === "green" && "text-belt-green",
        tone === "red" && "text-flag-red",
      )}
    >
      {value}
    </p>
    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
)

/** One competitor line inside a card — the board's EnteredChip, printable. */
const CompetitorRow = ({ c }: { c: ListCompetitor }) => (
  <li className="flex items-start gap-1.5 rounded border border-border px-1.5 py-1">
    {!c.isTeam && <BeltBadge name={c.beltName} colour={c.beltColour} iconOnly />}
    <div className="min-w-0 flex-1">
      <p className="truncate text-[11px] font-medium leading-4">
        {c.seed != null && (
          <span className="mr-1 rounded border px-1 text-[9px] font-normal text-muted-foreground">
            seed {c.seed}
          </span>
        )}
        {c.name}
      </p>
      <p className="truncate text-[9px] leading-4 text-muted-foreground">
        {c.clubName}
        {c.age != null && ` · ${c.age}y`}
        {c.weightKg != null && ` · ${c.weightKg}kg`}
        {c.weightClassName && ` · ${c.weightClassName}`}
      </p>
      {c.isTeam && c.members.length > 0 && (
        <p className="text-[9px] leading-4 text-muted-foreground">
          {c.members.join(" · ")}
          {c.reserves.length > 0 && ` (reserve: ${c.reserves.join(" · ")})`}
        </p>
      )}
      {c.status === "RETURNED" && c.statusReason && (
        <p className="text-[9px] leading-4 text-flag-red">Returned: {c.statusReason}</p>
      )}
    </div>
    <StatusChip status={c.status} />
  </li>
)

/** One division card — the board's DivisionBoard without the drop target. */
const DivisionCard = ({
  division,
  currency,
  showFees,
}: {
  division: ListDivision
  currency: string
  showFees: boolean
}) => (
  <div className="print-keep relative mb-3 break-inside-avoid overflow-hidden rounded-lg border bg-card">
    <div
      aria-hidden
      className={cn(
        "absolute inset-x-0 top-0 h-[3px]",
        division.category === "KATA" ? "bg-belt-blue" : "bg-flag-red",
      )}
    />
    <div className="flex items-start justify-between gap-2 px-3 pb-1.5 pt-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider",
              CATEGORY_PILL[division.category],
            )}
          >
            {division.category}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {division.gender === "Male" ? "Boys / Men" : "Girls / Women"}
          </span>
        </div>
        <h4 className="mt-0.5 truncate text-[13px] font-medium">{division.name}</h4>
        <p className="text-[10px] tabular-nums text-muted-foreground">
          Ages {division.minAge}–{division.maxAge}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-2xl leading-none tracking-wider tabular-nums">
          {String(division.counts.total).padStart(2, "0")}
        </p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
          entered
        </p>
      </div>
    </div>

    <div className="px-2.5 pb-2.5">
      {division.competitors.length === 0 ? (
        <div className="rounded border border-dashed py-3 text-center text-[10px] text-muted-foreground">
          No entries
        </div>
      ) : (
        <ul className="space-y-1">
          {division.competitors.map((c) => (
            <CompetitorRow key={c.entryId} c={c} />
          ))}
        </ul>
      )}

      {(showFees || division.counts.returned > 0) && division.counts.total > 0 && (
        <div className="mt-1.5 flex items-center justify-between text-[9px] tabular-nums text-muted-foreground">
          <span>
            {division.counts.returned > 0 && (
              <span className="text-flag-red">
                {division.counts.returned} returned — not in the draw
              </span>
            )}
          </span>
          {showFees && (
            <span>
              {currency} {division.fee.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
)

const EventEntryListPage = () => {
  const { eventId = "" } = useParams()
  const navigate = useNavigate()
  const showApiError = useApiErrorToast()

  // Both toggles live on the toolbar, which does not print — so whatever is on
  // screen is what comes out of the printer.
  const [hideEmpty, setHideEmpty] = useState(true)
  const [showFees, setShowFees] = useState(true)

  const { data: list, isLoading, error } = useQuery({
    queryKey: ["event-entry-list", eventId],
    queryFn: () => getEventEntryList(eventId),
    enabled: !!eventId,
  })

  const bands = useMemo(() => {
    if (!list) return []
    const divisions = hideEmpty
      ? list.divisions.filter((d) => d.counts.total > 0)
      : list.divisions
    return groupByAgeBand(divisions)
  }, [list, hideEmpty])

  const handleXlsx = async () => {
    try {
      await downloadEventEntriesXlsx(eventId)
    } catch (e) {
      showApiError(e, "Failed to download the workbook")
    }
  }

  if (isLoading) return <PageSpinner label="Building the entry list" />

  if (error || !list) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          This entry list could not be loaded. The event may not exist, or you may not have
          access to it — the whole-event list is for admins and the event's coordinator.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>
    )
  }

  const { event, totals, currency } = list
  const location = [event.venue, event.city, event.country].filter(Boolean).join(", ")

  return (
    <div className="paper min-h-screen bg-background text-foreground">
      {/* Toolbar — not part of the document */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
          <span className="truncate text-sm text-muted-foreground">{event.name}</span>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={hideEmpty}
                onChange={() => setHideEmpty((v) => !v)}
              />
              Hide empty categories
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={showFees}
                onChange={() => setShowFees((v) => !v)}
              />
              Fees
            </label>
            <Button variant="outline" size="sm" onClick={handleXlsx}>
              <Download />
              Excel
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] px-6 py-8 text-[12px] leading-snug print:px-0 print:py-0">
        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <header className="print-keep">
          <p className="font-display text-xs tracking-[0.2em] text-primary">GOJU KAI NAMIBIA</p>
          <h1 className="font-display text-2xl tracking-wide">Entry list — all clubs</h1>
          <p className="mt-1 text-sm font-medium">{event.name}</p>
          <p className="text-xs text-muted-foreground">
            {location}
            {location && " — "}
            {formatDate(event.startDate)} · registration closes {formatDate(event.regClose)}
          </p>

          {/* The board's stats strip, same figures in the same order. */}
          <div className="mt-4 flex flex-wrap items-stretch divide-x rounded-md border">
            <Stat label="Clubs" value={totals.clubs} />
            <Stat label="Athletes" value={totals.athletes} />
            <Stat label="Entries" value={totals.entries} />
            <Stat label="Pending" value={totals.counts.submitted} tone="orange" />
            <Stat label="Approved" value={totals.counts.approved} tone="green" />
            <Stat label="Draft" value={totals.counts.draft} />
            {totals.counts.returned > 0 && (
              <Stat label="Returned" value={totals.counts.returned} tone="red" />
            )}
            <Stat
              label="Categories"
              value={`${totals.divisionsEntered}/${totals.divisions}`}
            />
            {showFees && (
              <Stat
                label={`Fees (${currency})`}
                value={totals.fee.toLocaleString()}
              />
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Every club's entries for this event, laid out by category the way the entry board
            is. Entries marked <em>Draft</em> have not been submitted, and{" "}
            <em>Returned</em> entries are shown where they were entered but are not in the
            draw.
          </p>
        </header>

        {/* ── By club ──────────────────────────────────────────────────── */}
        <div className="mb-2 mt-7 flex items-baseline justify-between border-b border-foreground/25 pb-1">
          <h2 className="font-display text-base tracking-wide">By club</h2>
          <span className="text-[11px] text-muted-foreground">
            {totals.clubs} {totals.clubs === 1 ? "club" : "clubs"}
          </span>
        </div>
        {list.clubs.length === 0 ? (
          <p className="py-3 text-sm italic text-muted-foreground">
            No club has entered this event yet.
          </p>
        ) : (
          <table className="w-full border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-foreground/25 text-[10px] uppercase tracking-wide text-muted-foreground [&>th]:py-1 [&>th]:pr-2">
                <th className="font-medium">Club</th>
                <th className="w-14 font-medium">Athletes</th>
                <th className="w-12 font-medium">Entries</th>
                <th className="w-10 font-medium">Kata</th>
                <th className="w-12 font-medium">Kumite</th>
                <th className="w-12 font-medium">Teams</th>
                <th className="w-14 font-medium">Approved</th>
                <th className="w-12 font-medium">Pending</th>
                <th className="w-10 font-medium">Draft</th>
                <th className="w-12 font-medium">Ret.</th>
                {showFees && <th className="w-16 font-medium">Fees</th>}
              </tr>
            </thead>
            <tbody>
              {list.clubs.map((c) => (
                <tr
                  key={c.id}
                  className="print-keep border-b border-foreground/10 [&>td]:py-1 [&>td]:pr-2"
                >
                  <td className="font-medium">{c.name}</td>
                  <td>{c.athletes}</td>
                  <td>{c.entries}</td>
                  <td>{c.kata}</td>
                  <td>{c.kumite}</td>
                  <td>{c.teamEntries}</td>
                  <td className="text-belt-green">{c.counts.approved}</td>
                  <td className="text-belt-orange">{c.counts.submitted}</td>
                  <td>{c.counts.draft}</td>
                  <td className={cn(c.counts.returned > 0 && "text-flag-red")}>
                    {c.counts.returned}
                  </td>
                  {showFees && <td>{c.fee.toLocaleString()}</td>}
                </tr>
              ))}
              <tr className="border-b-2 border-foreground/25 font-medium [&>td]:py-1 [&>td]:pr-2">
                <td>Total</td>
                <td>{totals.athletes}</td>
                <td>{totals.entries}</td>
                <td>{totals.kata}</td>
                <td>{totals.kumite}</td>
                <td>{totals.teamEntries}</td>
                <td>{totals.counts.approved}</td>
                <td>{totals.counts.submitted}</td>
                <td>{totals.counts.draft}</td>
                <td>{totals.counts.returned}</td>
                {showFees && <td>{totals.fee.toLocaleString()}</td>}
              </tr>
            </tbody>
          </table>
        )}

        {/* ── The board itself: age band -> division cards ──────────────── */}
        {bands.length === 0 ? (
          <p className="py-6 text-sm italic text-muted-foreground">
            No categories to show{hideEmpty ? " — every category is empty." : "."}
          </p>
        ) : (
          <div className="mt-7 space-y-5">
            {bands.map(({ band, divisions }) => {
              const entries = divisions.reduce((s, d) => s + d.counts.total, 0)
              // Bands whose name is derived from the division ("Under 12") get
              // the ages spelled out beside them; bands the server already
              // named by their ages do not need them said twice.
              const namedByAge = /^Ages? /.test(band.label)
              return (
                <section key={band.key}>
                  <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-foreground/25 pb-1">
                    <h3 className="font-display text-base tracking-wider">
                      {band.label.toUpperCase()}
                    </h3>
                    <span className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
                      {!namedByAge && `ages ${band.minAge}–${band.maxAge} · `}
                      {divisions.length} div · {entries} {entries === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                  {/* Columns rather than a grid: cards vary a lot in height —
                      a category with 14 entries next to one with 2 — and a
                      grid row is as tall as its tallest cell, which on paper
                      is a page of white space. */}
                  <div className="columns-1 gap-3 sm:columns-2">
                    {divisions.map((d) => (
                      <DivisionCard
                        key={d.id}
                        division={d}
                        currency={currency}
                        showFees={showFees}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-[10px] text-muted-foreground">
          Generated {formatDateTime(list.generatedAt)} · gojukainam.com · This list reflects the
          entries recorded at the time of generation.
        </p>
      </div>
    </div>
  )
}

export default EventEntryListPage
