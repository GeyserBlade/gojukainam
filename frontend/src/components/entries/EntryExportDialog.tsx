// "Export entries" — the dialog behind the Review tab's Export button.
//
// Two documents, one picker. Choosing a club produces that club's
// entry-confirmation sheet: the feature exists for clubs with no login, so the
// organizer picks a club, produces a sheet, emails it, and the club confirms
// it. Choosing **All clubs** produces the organizer's own document instead —
// the whole event laid out like the hub's Entries board, every club on it.
//
// They are one dialog because "export the entries" is one thought, and both
// documents are built from a payload the dialog fetches up front, so the real
// counts are on screen before anything is sent: an empty or half-drafted
// export is worth catching here rather than in a club's inbox.

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, ExternalLink, FileSpreadsheet, Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useApiErrorToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  downloadClubEntriesXlsx,
  entrySheetPath,
  getClubEntrySheet,
  listSheetClubs,
} from "@/lib/entry-sheet"
import {
  downloadEventEntriesXlsx,
  entryListPath,
  getEventEntryList,
} from "@/lib/entry-list"

/** Sentinel for the picker's whole-event option; no club can have this id. */
const ALL_CLUBS = "__all__"

export function EntryExportDialog({
  open,
  onOpenChange,
  eventId,
  /** Preselect the club the page is already filtered to, when there is one. */
  defaultClubId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  defaultClubId?: string
}) {
  const showApiError = useApiErrorToast()
  const { canManageEvent } = useAuth()
  // The whole-event list crosses club boundaries, so it is offered to exactly
  // the people the API will serve it to: admins and this event's coordinator.
  const canExportAll = canManageEvent(eventId)

  const [clubId, setClubId] = useState(defaultClubId ?? "")
  const [downloading, setDownloading] = useState(false)
  const allClubs = clubId === ALL_CLUBS

  const { data: clubs = [], isLoading: loadingClubs } = useQuery({
    queryKey: ["sheet-clubs", eventId],
    queryFn: () => listSheetClubs(eventId),
    enabled: open && !!eventId,
  })

  // Land on something usable: the page's current club filter if it has entries,
  // otherwise the only club the caller can export, otherwise nothing. An
  // organizer who can export everything starts on the whole-event list, which
  // is the one they came for when no club filter is set.
  useEffect(() => {
    if (!open) return
    setClubId((prev) => {
      if (prev === ALL_CLUBS && canExportAll) return prev
      if (prev && clubs.some((c) => c.id === prev)) return prev
      if (defaultClubId && clubs.some((c) => c.id === defaultClubId)) return defaultClubId
      if (canExportAll) return ALL_CLUBS
      if (clubs.length === 1) return clubs[0].id
      return ""
    })
  }, [open, clubs, defaultClubId, canExportAll])

  const { data: sheet, isFetching: loadingSheet } = useQuery({
    queryKey: ["club-entry-sheet", eventId, clubId],
    queryFn: () => getClubEntrySheet(eventId, clubId),
    enabled: open && !!eventId && !!clubId && !allClubs,
  })

  // Same query key the printable list uses, so opening it in the new tab
  // renders from cache rather than fetching the event a second time.
  const { data: list, isFetching: loadingList } = useQuery({
    queryKey: ["event-entry-list", eventId],
    queryFn: () => getEventEntryList(eventId),
    enabled: open && !!eventId && allClubs,
  })

  const handleXlsx = async () => {
    setDownloading(true)
    try {
      if (allClubs) await downloadEventEntriesXlsx(eventId)
      else await downloadClubEntriesXlsx(eventId, clubId)
    } catch (e) {
      showApiError(e, "Failed to download the workbook")
    } finally {
      setDownloading(false)
    }
  }

  // A new tab, not a navigation: the organizer is usually working through a
  // list of clubs and should not lose their place in Review.
  const handleOpenDocument = () => {
    const path = allClubs ? entryListPath(eventId) : entrySheetPath(eventId, clubId)
    window.open(path, "_blank", "noopener")
  }

  const totals = sheet?.totals
  const loadingCounts = allClubs ? loadingList || !list : loadingSheet || !totals

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export entries</DialogTitle>
          <DialogDescription>
            {allClubs
              ? "The whole event, category by category, the way the entry board shows it — for the organizer."
              : "A confirmation sheet to send to a club that doesn't use the system. Returned entries are listed separately and are not part of the roster."}
          </DialogDescription>
        </DialogHeader>

        {loadingClubs ? (
          <Skeleton className="h-9 w-full" />
        ) : clubs.length === 0 && !canExportAll ? (
          <p className="py-4 text-sm text-muted-foreground">
            No club has entries in this event yet.
          </p>
        ) : (
          <div>
            <Label className="mb-1.5">Export</Label>
            <Select value={clubId} onValueChange={setClubId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose what to export" />
              </SelectTrigger>
              <SelectContent>
                {canExportAll && (
                  <SelectItem value={ALL_CLUBS}>All clubs — full entry list</SelectItem>
                )}
                {clubs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.entryCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {clubId && (
          <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
            {loadingCounts ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Reading the entries…
              </span>
            ) : allClubs && list ? (
              <>
                <p className="font-medium">
                  {list.totals.clubs} {list.totals.clubs === 1 ? "club" : "clubs"} ·{" "}
                  {list.totals.athletes} {list.totals.athletes === 1 ? "athlete" : "athletes"} ·{" "}
                  {list.totals.entries} entries
                </p>
                <p className="text-xs text-muted-foreground">
                  {list.totals.counts.approved} approved · {list.totals.counts.submitted} pending
                  · {list.totals.counts.draft} draft
                  {list.totals.counts.returned > 0 &&
                    ` · ${list.totals.counts.returned} returned (shown in place, marked)`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {list.totals.divisionsEntered} of {list.totals.divisions} categories have
                  entries.
                </p>
              </>
            ) : totals ? (
              <>
                <p className="font-medium">
                  {totals.athletes} {totals.athletes === 1 ? "athlete" : "athletes"} ·{" "}
                  {totals.individualEntries + totals.teamEntries} entries
                </p>
                <p className="text-xs text-muted-foreground">
                  {totals.approved} approved · {totals.submitted} pending · {totals.draft} draft
                  {totals.returned > 0 && ` · ${totals.returned} returned (listed separately)`}
                </p>
                {totals.draft > 0 && (
                  <p className="mt-1 text-xs text-belt-orange">
                    {totals.draft} {totals.draft === 1 ? "entry has" : "entries have"} not been
                    submitted yet — they appear on the sheet marked Draft.
                  </p>
                )}
              </>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleXlsx} disabled={!clubId || downloading}>
              {downloading ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
              Excel
            </Button>
            <Button onClick={handleOpenDocument} disabled={!clubId}>
              <ExternalLink />
              {allClubs ? "Open list (PDF)" : "Open sheet (PDF)"}
            </Button>
          </div>
        </DialogFooter>

        <p className="text-xs text-muted-foreground">
          <Download className="mr-1 inline size-3" />
          The document opens in a new tab with a Print button — choose “Save as PDF” in the
          print dialog to get a file you can email.
        </p>
      </DialogContent>
    </Dialog>
  )
}
