// The club entry-confirmation sheet — a printable document, not an app screen.
//
// It lives outside the event hub's chrome deliberately: this is the artifact
// that gets saved as PDF and emailed to a club with no login, so what is on
// screen is exactly what comes out of the printer. Everything that is not part
// of the document (the toolbar) is `print:hidden`, and the whole thing is
// wrapped in `.paper`, which re-themes the design tokens to the light palette
// so the sheet is on white even though the app is dark by default.

import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Download, Printer } from "lucide-react"

import { useApiErrorToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"
import { PageSpinner } from "@/components/UIState"
import { cn } from "@/lib/utils"
import {
  downloadClubEntriesXlsx,
  getClubEntrySheet,
  SHEET_STATUS_LABEL,
  type SheetStatus,
} from "@/lib/entry-sheet"

const STATUS_STYLES: Record<SheetStatus, string> = {
  DRAFT: "border-border text-muted-foreground",
  SUBMITTED: "border-belt-orange/40 text-belt-orange",
  APPROVED: "border-belt-green/40 text-belt-green",
}

const StatusChip = ({ status }: { status: SheetStatus }) => (
  <span
    className={cn(
      "inline-block shrink-0 rounded border px-1.5 py-px text-[10px] leading-4",
      STATUS_STYLES[status],
    )}
  >
    {SHEET_STATUS_LABEL[status]}
  </span>
)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const SectionTitle = ({ children, count }: { children: string; count?: number }) => (
  <div className="mb-2 mt-7 flex items-baseline justify-between border-b border-foreground/25 pb-1 first:mt-0">
    <h2 className="font-display text-base tracking-wide">{children}</h2>
    {count !== undefined && (
      <span className="text-[11px] text-muted-foreground">
        {count} {count === 1 ? "entry" : "entries"}
      </span>
    )}
  </div>
)

/** A signature field: a caption under a rule wide enough to actually write on. */
const SignatureField = ({ label, className }: { label: string; className?: string }) => (
  <div className={cn("min-w-0", className)}>
    <div className="h-7 border-b border-foreground/40" />
    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
)

const EntrySheet = () => {
  const { eventId = "", clubId = "" } = useParams()
  const navigate = useNavigate()
  const showApiError = useApiErrorToast()

  const { data: sheet, isLoading, error } = useQuery({
    queryKey: ["club-entry-sheet", eventId, clubId],
    queryFn: () => getClubEntrySheet(eventId, clubId),
    enabled: !!eventId && !!clubId,
  })

  // "Kata 12 · Kumite 9" reads better on a document than a bare total, and it
  // is the split a club actually checks.
  const disciplineLine = useMemo(() => {
    if (!sheet) return ""
    const bits = [`${sheet.totals.kata} kata`, `${sheet.totals.kumite} kumite`]
    if (sheet.totals.teamEntries > 0) bits.push(`${sheet.totals.teamEntries} team`)
    return bits.join(" · ")
  }, [sheet])

  const handleXlsx = async () => {
    try {
      await downloadClubEntriesXlsx(eventId, clubId)
    } catch (e) {
      showApiError(e, "Failed to download the workbook")
    }
  }

  if (isLoading) return <PageSpinner label="Building the entry sheet" />

  if (error || !sheet) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          This entry sheet could not be loaded. The event or club may not exist, or you may
          not have access to it.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>
    )
  }

  const { event, club, totals } = sheet
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
          <span className="truncate text-sm text-muted-foreground">
            {club.name} — {event.name}
          </span>
          <div className="ml-auto flex gap-2">
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

      {/* 12px, because the roster table has to hold a division name, a weight
          class and a status on one line inside an A4 column. */}
      <div className="mx-auto max-w-[210mm] px-6 py-8 text-[12px] leading-snug print:px-0 print:py-0">
        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <header className="print-keep">
          <p className="font-display text-xs tracking-[0.2em] text-primary">
            GOJU KAI NAMIBIA
          </p>
          <h1 className="font-display text-2xl tracking-wide">Entry confirmation sheet</h1>
          <p className="mt-1 text-sm font-medium">{event.name}</p>
          <p className="text-xs text-muted-foreground">
            {location}
            {location && " — "}
            {formatDate(event.startDate)}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 border-y border-foreground/20 py-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Club</p>
              <p className="font-medium">{club.name}</p>
              <p className="text-xs text-muted-foreground">
                {club.contactName} · {club.email}
                {club.phone ? ` · ${club.phone}` : ""}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Entries
              </p>
              <p className="font-medium">
                {totals.athletes} {totals.athletes === 1 ? "athlete" : "athletes"} ·{" "}
                {totals.individualEntries + totals.teamEntries} entries
              </p>
              <p className="text-xs text-muted-foreground">{disciplineLine}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <p className="font-medium">
                {totals.approved} approved · {totals.submitted} pending · {totals.draft} draft
              </p>
              <p className="text-xs text-muted-foreground">
                Registration closes {formatDate(event.regClose)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Please check every line below. Anything wrong or missing should be reported to the
            organizer before registration closes — entries marked <em>Draft</em> have not been
            submitted yet and will not be drawn.
          </p>
        </header>

        {/* ── Competitors ──────────────────────────────────────────────── */}
        <SectionTitle count={totals.individualEntries}>Competitors</SectionTitle>
        {sheet.athletes.length === 0 ? (
          <p className="py-4 text-sm italic text-muted-foreground">
            No individual entries for this club.
          </p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-foreground/25 text-[10px] uppercase tracking-wide text-muted-foreground [&>th]:pr-3">
                <th className="w-6 py-1 font-medium">#</th>
                <th className="w-36 py-1 font-medium">Athlete</th>
                <th className="w-8 py-1 font-medium">Sex</th>
                <th className="w-24 py-1 font-medium">Born (age)</th>
                <th className="w-8 py-1 font-medium">Kg</th>
                <th className="py-1 font-medium">Entered in</th>
              </tr>
            </thead>
            <tbody>
              {sheet.athletes.map((athlete, i) => (
                <tr
                  key={athlete.athleteId}
                  className="print-keep border-b border-foreground/10 align-top [&>td]:pr-3"
                >
                  <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5 font-medium">{athlete.name}</td>
                  <td className="py-1.5">{athlete.gender === "Female" ? "F" : "M"}</td>
                  <td className="py-1.5 whitespace-nowrap">
                    {athlete.dob.slice(0, 10)}{" "}
                    <span className="text-muted-foreground">({athlete.age})</span>
                  </td>
                  <td className="py-1.5">
                    {athlete.weightKg != null ? `${athlete.weightKg}` : "—"}
                  </td>
                  <td className="py-1.5">
                    {/* Each category on its own line with the status pinned to
                        the right edge, so the column reads as a small table
                        rather than a paragraph that reflows per athlete. */}
                    <ul className="space-y-0.5">
                      {athlete.lines.map((line) => (
                        <li key={line.entryId} className="flex items-baseline gap-1.5">
                          <span
                            className={cn(
                              "w-11 shrink-0 text-[9px] uppercase tracking-wide",
                              line.category === "KATA" ? "text-belt-blue" : "text-flag-red",
                            )}
                          >
                            {line.category}
                          </span>
                          <span className="min-w-0 flex-1">
                            {line.divisionName}
                            {line.weightClassName && (
                              <span className="ml-1 rounded border px-1 text-[10px]">
                                {line.weightClassName}
                              </span>
                            )}
                          </span>
                          <StatusChip status={line.status} />
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Teams ────────────────────────────────────────────────────── */}
        {sheet.teams.length > 0 && (
          <>
            <SectionTitle count={totals.teamEntries}>Team entries</SectionTitle>
            <div className="space-y-2">
              {sheet.teams.map((team) => (
                <div
                  key={team.entryId}
                  className="print-keep border-b border-foreground/10 pb-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{team.teamName}</span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wide",
                        team.category === "KATA" ? "text-belt-blue" : "text-flag-red",
                      )}
                    >
                      {team.category}
                    </span>
                    <span className="text-muted-foreground">{team.divisionName}</span>
                    <StatusChip status={team.status} />
                  </div>
                  <p className="mt-0.5 text-xs">
                    {team.members.join(" · ") || "No members listed"}
                    {team.reserves.length > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        (reserve: {team.reserves.join(" · ")})
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── The same entries, category first ─────────────────────────── */}
        {sheet.categories.length > 0 && (
          <>
            <SectionTitle>Entries by category</SectionTitle>
            <p className="-mt-1 mb-3 text-xs text-muted-foreground">
              The same entries grouped the way the draws are made, so you can see who the club
              has in each category.
            </p>
            <div className="columns-1 gap-6 sm:columns-2">
              {sheet.categories.map((cat) => (
                <div key={cat.key} className="print-keep mb-4 break-inside-avoid">
                  <p className="font-medium">
                    {cat.divisionName}
                    {cat.weightClassName && (
                      <span className="ml-1 rounded border px-1 text-[10px] font-normal">
                        {cat.weightClassName}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {cat.category} · {cat.gender} · ages {cat.minAge}–{cat.maxAge}
                  </p>
                  <ol className="mt-1 space-y-0.5">
                    {cat.competitors.map((c, i) => (
                      <li key={`${cat.key}-${i}`} className="flex items-center gap-1.5">
                        <span className="w-4 shrink-0 text-muted-foreground">{i + 1}.</span>
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        {c.seed != null && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            seed {c.seed}
                          </span>
                        )}
                        <StatusChip status={c.status} />
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Returned — deliberately outside the roster ───────────────── */}
        {sheet.returned.length > 0 && (
          <>
            <SectionTitle>Returned — not entered</SectionTitle>
            <p className="-mt-1 mb-2 text-xs text-muted-foreground">
              These were returned by the organizer and are <strong>not</strong> part of the
              roster above. They must be corrected and resubmitted to count.
            </p>
            <ul className="space-y-1">
              {sheet.returned.map((r, i) => (
                <li key={i} className="print-keep border-b border-foreground/10 pb-1 text-xs">
                  <span className="font-medium">{r.name}</span>{" "}
                  <span className="text-muted-foreground">
                    — {r.divisionName}
                    {r.weightClassName ? ` (${r.weightClassName})` : ""}
                  </span>
                  {r.reason && <span className="block text-flag-red">Reason: {r.reason}</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ── Sign-off ─────────────────────────────────────────────────── */}
        <div className="print-keep mt-10 border-t border-foreground/25 pt-4">
          <h2 className="font-display text-base tracking-wide">Club confirmation</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            I confirm that the entries listed above are correct and complete for {club.name}.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
            <SignatureField label="Name" />
            <SignatureField label="Position" />
            <SignatureField label="Date" />
            <SignatureField label="Signature" className="sm:col-span-2" />
          </div>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground">
          Generated {formatDateTime(sheet.generatedAt)} · gojukainam.com · This sheet reflects
          the entries recorded at the time of generation.
        </p>
      </div>
    </div>
  )
}

export default EntrySheet
