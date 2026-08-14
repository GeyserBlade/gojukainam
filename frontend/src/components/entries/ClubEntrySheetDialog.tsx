// "Export a club's entries" — the dialog behind the Review tab's Export button.
//
// The point of the feature is clubs with no login: the organizer picks a club,
// produces a sheet, emails it, and the club confirms it. Both formats are built
// from the same payload (`/reports/club-entries`), so the dialog can show the
// real counts before anything is sent — an empty or half-drafted sheet is worth
// catching here rather than in the club's inbox.

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, ExternalLink, FileSpreadsheet, Loader2 } from "lucide-react"

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

export function ClubEntrySheetDialog({
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
  const [clubId, setClubId] = useState(defaultClubId ?? "")
  const [downloading, setDownloading] = useState(false)

  const { data: clubs = [], isLoading: loadingClubs } = useQuery({
    queryKey: ["sheet-clubs", eventId],
    queryFn: () => listSheetClubs(eventId),
    enabled: open && !!eventId,
  })

  // Land on something usable: the page's current club filter if it has entries,
  // otherwise the only club the caller can export, otherwise nothing.
  useEffect(() => {
    if (!open || clubs.length === 0) return
    setClubId((prev) => {
      if (prev && clubs.some((c) => c.id === prev)) return prev
      if (defaultClubId && clubs.some((c) => c.id === defaultClubId)) return defaultClubId
      return clubs.length === 1 ? clubs[0].id : ""
    })
  }, [open, clubs, defaultClubId])

  const { data: sheet, isFetching: loadingSheet } = useQuery({
    queryKey: ["club-entry-sheet", eventId, clubId],
    queryFn: () => getClubEntrySheet(eventId, clubId),
    enabled: open && !!eventId && !!clubId,
  })

  const handleXlsx = async () => {
    setDownloading(true)
    try {
      await downloadClubEntriesXlsx(eventId, clubId)
    } catch (e) {
      showApiError(e, "Failed to download the workbook")
    } finally {
      setDownloading(false)
    }
  }

  // A new tab, not a navigation: the organizer is usually working through a
  // list of clubs and should not lose their place in Review.
  const handlePrintSheet = () => {
    window.open(entrySheetPath(eventId, clubId), "_blank", "noopener")
  }

  const totals = sheet?.totals

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export a club's entries</DialogTitle>
          <DialogDescription>
            A confirmation sheet to send to a club that doesn't use the system. Returned
            entries are listed separately and are not part of the roster.
          </DialogDescription>
        </DialogHeader>

        {loadingClubs ? (
          <Skeleton className="h-9 w-full" />
        ) : clubs.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No club has entries in this event yet.
          </p>
        ) : (
          <div>
            <Label className="mb-1.5">Club</Label>
            <Select value={clubId} onValueChange={setClubId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a club" />
              </SelectTrigger>
              <SelectContent>
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
            {loadingSheet || !totals ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Reading the entries…
              </span>
            ) : (
              <>
                <p className="font-medium">
                  {totals.athletes} {totals.athletes === 1 ? "athlete" : "athletes"} ·{" "}
                  {totals.individualEntries + totals.teamEntries} entries
                </p>
                <p className="text-xs text-muted-foreground">
                  {totals.approved} approved · {totals.submitted} pending · {totals.draft}{" "}
                  draft
                  {totals.returned > 0 && ` · ${totals.returned} returned (listed separately)`}
                </p>
                {totals.draft > 0 && (
                  <p className="mt-1 text-xs text-belt-orange">
                    {totals.draft} {totals.draft === 1 ? "entry has" : "entries have"} not been
                    submitted yet — they appear on the sheet marked Draft.
                  </p>
                )}
              </>
            )}
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
            <Button onClick={handlePrintSheet} disabled={!clubId}>
              <ExternalLink />
              Open sheet (PDF)
            </Button>
          </div>
        </DialogFooter>

        <p className="text-xs text-muted-foreground">
          <Download className="mr-1 inline size-3" />
          The sheet opens in a new tab with a Print button — choose “Save as PDF” in the print
          dialog to get a file you can email.
        </p>
      </DialogContent>
    </Dialog>
  )
}
