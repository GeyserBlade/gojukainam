import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileDown,
  Search,
  Send,
  Undo2,
  UserMinus,
  Users as UsersIcon,
  Weight as WeightIcon,
  User as UserIcon,
  X,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { EntryExportDialog } from "@/components/entries/EntryExportDialog"
import { cn } from "@/lib/utils"
import {
  EntryService,
  type Entry,
  type EntryFilters,
  type Division as EntryDivision,
} from "@/lib/entries"
import { getDivisions, registrationState, type Division } from "@/lib/events"
import { listClubs } from "@/lib/clubs"
import { listDrawCategories } from "@/lib/draws"

type StatusKey = "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED"

const STATUS_STYLES: Record<StatusKey, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  APPROVED: "bg-belt-green/15 text-belt-green border-belt-green/30",
  RETURNED: "bg-flag-red/15 text-flag-red border-flag-red/30",
}

const STATUS_LABEL: Record<StatusKey, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
  RETURNED: "Returned",
}

const CATEGORY_STYLES = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
} as const

const StatusBadge = ({ status }: { status: StatusKey }) => (
  <Badge variant="outline" className={cn("font-normal text-[10px]", STATUS_STYLES[status])}>
    {STATUS_LABEL[status]}
  </Badge>
)

// A small native checkbox styled to match the design tokens.
const SelectBox = ({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean
  onChange: () => void
  "aria-label": string
}) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    onClick={(e) => e.stopPropagation()}
    aria-label={ariaLabel}
    className="size-4 shrink-0 cursor-pointer accent-primary"
  />
)

const SEED_NONE = "none"
const MAX_SEED = 8

/**
 * Seed control for the review list. The list spans categories, so the number
 * alone is ambiguous — the adjacent Division column supplies the context.
 * Whole-category seeding lives on the Draws page.
 */
const SeedSelect = ({
  entry,
  disabled,
  onChange,
}: {
  entry: Entry
  disabled: boolean
  onChange: (seed: number | null) => void
}) => (
  <Select
    value={entry.seed == null ? SEED_NONE : String(entry.seed)}
    onValueChange={(next) => onChange(next === SEED_NONE ? null : Number(next))}
    disabled={disabled}
  >
    <SelectTrigger className="h-7 w-[64px]" aria-label="Seed">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={SEED_NONE}>—</SelectItem>
      {Array.from({ length: MAX_SEED }, (_, i) => i + 1).map((n) => (
        <SelectItem key={n} value={String(n)}>
          {n}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const EntryRow = ({
  entry,
  selectable,
  selected,
  onToggleSelect,
  onSubmit,
  onApprove,
  onReturn,
  onWithdraw,
  onSetSeed,
  canReviewEvent,
  isClub,
  busy,
  submitDisabled,
}: {
  entry: Entry
  selectable: boolean
  selected: boolean
  onToggleSelect: () => void
  onSubmit: () => void
  onApprove: () => void
  onReturn: () => void
  onWithdraw: () => void
  onSetSeed: (seed: number | null) => void
  /** Admin, or coordinator of the event this entry belongs to. */
  canReviewEvent: boolean
  isClub: boolean
  busy: boolean
  submitDisabled?: boolean
}) => {
  const isTeam = entry.entryType === "TEAM_KATA" || entry.entryType === "TEAM_KUMITE"
  const cat = entry.division.category
  const canSubmit = isClub && (entry.status === "DRAFT" || entry.status === "RETURNED")
  const canReview = canReviewEvent && entry.status === "SUBMITTED"
  // Once approved, an entry can be in a bracket. Approve/Return only make
  // sense pre-approval; past that, the only lever is Withdraw (-> RETURNED).
  const canWithdraw = canReviewEvent && entry.status === "APPROVED"

  return (
    <Card className={cn(selected && "border-primary/50 ring-1 ring-primary/30")}>
      <CardContent className="space-y-2 px-4 py-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            {selectable && (
              <div className="pt-0.5">
                <SelectBox
                  checked={selected}
                  onChange={onToggleSelect}
                  aria-label="Select entry"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                {isTeam ? (
                  <UsersIcon className="size-4 text-muted-foreground" />
                ) : (
                  <UserIcon className="size-4 text-muted-foreground" />
                )}
                <h3 className="font-medium truncate">
                  {isTeam && entry.team
                    ? entry.team.name
                    : entry.athlete
                    ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                    : "Unknown"}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span>{entry.club.name}</span>
                <span aria-hidden>·</span>
                <Badge variant="outline" className={cn("font-normal text-[10px]", CATEGORY_STYLES[cat])}>
                  {cat}
                </Badge>
                {entry.weightClass && (
                  <Badge variant="outline" className="font-normal text-[10px] gap-1">
                    <WeightIcon className="size-3" />
                    {entry.weightClass.name}
                  </Badge>
                )}
                {/* The athlete's own weight, on kumite entries only. Reviewing
                    a kumite entry is partly a question of whether the person
                    is in the right category at all, and returning them to
                    re-enter elsewhere needs the number that decides it. Kata
                    does not turn on weight, so the row stays quiet there.
                    A missing weight is called out rather than hidden: it is
                    the usual reason an entry cannot be placed. */}
                {!isTeam && cat === "KUMITE" &&
                  (entry.athlete?.weightKg != null ? (
                    <Badge variant="outline" className="font-normal text-[10px] gap-1">
                      {!entry.weightClass && <WeightIcon className="size-3" />}
                      {entry.athlete.weightKg} kg
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-belt-orange/30 text-belt-orange font-normal text-[10px]"
                    >
                      <WeightIcon className="size-3" />
                      No weight recorded
                    </Badge>
                  ))}
                {!isTeam && entry.athlete?.belt && (
                  <span>{entry.athlete.belt.name}</span>
                )}
                {entry.seed != null && (
                  <Badge variant="outline" className="font-normal text-[10px]">
                    Seed {entry.seed}
                  </Badge>
                )}
              </div>
              {isTeam && entry.team && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Members: {entry.team.members.filter((m) => !m.isReserve).length}
                  {entry.team.members.some((m) => m.isReserve) &&
                    ` (+${entry.team.members.filter((m) => m.isReserve).length} reserve)`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={entry.status} />
            {canReviewEvent && entry.status !== "RETURNED" && (
              <SeedSelect entry={entry} disabled={busy} onChange={onSetSeed} />
            )}
            {canSubmit && (
              <Button
                size="xs"
                variant="outline"
                onClick={onSubmit}
                disabled={busy || submitDisabled}
                title={submitDisabled ? "Registration is closed" : undefined}
              >
                <Send />
                Submit
              </Button>
            )}
            {canReview && (
              <div className="flex gap-1">
                <Button size="xs" variant="outline" onClick={onApprove} disabled={busy}>
                  <Check />
                  Approve
                </Button>
                <Button size="xs" variant="outline" onClick={onReturn} disabled={busy}>
                  <Undo2 />
                  Return
                </Button>
              </div>
            )}
            {canWithdraw && (
              <Button size="xs" variant="outline" onClick={onWithdraw} disabled={busy}>
                <UserMinus />
                Withdraw
              </Button>
            )}
          </div>
        </div>
        {entry.status === "RETURNED" && entry.statusReason && (
          <p className="text-xs text-flag-red">
            <span className="font-medium">Returned:</span> {entry.statusReason}
          </p>
        )}
        <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between">
          <span>Division: {entry.division.name}</span>
          <span>
            {entry.entryType === "KATA"
              ? "Kata (Individual)"
              : entry.entryType === "KUMITE"
              ? "Kumite (Individual)"
              : entry.entryType === "TEAM_KATA"
              ? "Kata (Team)"
              : "Kumite (Team)"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

const EntriesView = () => {
  const { role, clubId, canManageEvent } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"
  const isClub = role === "CLUB_MANAGER" || role === "COACH"

  const { eventId: selectedEventId, event: selectedEvent } = useSelectedEvent()

  // Review/approve/return/seed is an admin power, or a coordinator's for the
  // event they were granted — canManageEvent already covers admins too, this
  // separate name is just for readability at each call site below.
  const canReviewEvent = canManageEvent(selectedEventId)

  // Clubs can only submit while registration is open; admins bypass it.
  const reg = registrationState(selectedEvent)
  const submitBlocked = isClub && !reg.open
  const [filterClubId, setFilterClubId] = useState<string>(clubId || "")
  const [filterDivisionId, setFilterDivisionId] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [filterEntryType, setFilterEntryType] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped")
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set())

  // Bulk selection + return dialog
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [returnTarget, setReturnTarget] = useState<string[] | null>(null)
  const [returnReason, setReturnReason] = useState("")
  const [acting, setActing] = useState(false)

  // Withdraw dialog — single entry, separate from the (multi-select,
  // SUBMITTED-only) return dialog above because it targets APPROVED entries
  // through a different endpoint and the reason is optional, not required.
  const [withdrawTarget, setWithdrawTarget] = useState<Entry | null>(null)
  const [withdrawReason, setWithdrawReason] = useState("")

  // Export a club's entries as a confirmation sheet (print/PDF or Excel).
  const [exportOpen, setExportOpen] = useState(false)

  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: listClubs,
    enabled: isAdmin,
  })

  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId,
  })

  // Only reviewers need this, and only to tell the withdraw dialog whether a
  // draw already exists for the entry's category — same query Draws.tsx uses,
  // so the cache is warm if they follow the "Go to Draws" link.
  const { data: drawCategories = [] } = useQuery({
    queryKey: ["draw-categories", selectedEventId],
    queryFn: () => listDrawCategories(selectedEventId),
    enabled: !!selectedEventId && canReviewEvent,
  })
  const hasDrawFor = (divisionId: string, weightClassId: string | null) =>
    drawCategories.some(
      (c) => c.divisionId === divisionId && c.weightClassId === weightClassId && c.draw !== null,
    )

  const filters: EntryFilters = {
    eventId: selectedEventId,
    // Admins get the club-filter dropdown below; a coordinator has no such
    // control but must still see every club's entries for the event they
    // coordinate, not just their own — so "no filter" rather than own-club.
    clubId: isAdmin ? filterClubId || undefined : canReviewEvent ? undefined : clubId || undefined,
    divisionId: filterDivisionId || undefined,
    status: filterStatus !== "ALL" ? (filterStatus as EntryFilters["status"]) : undefined,
    entryType:
      filterEntryType !== "ALL" ? (filterEntryType as EntryFilters["entryType"]) : undefined,
    searchQuery: searchQuery || undefined,
  }

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["entries", filters],
    queryFn: () => EntryService.list(filters),
    enabled: !!selectedEventId,
  })

  // Whether the current user can act on an entry (and therefore select it).
  // Not mutually exclusive: a club-manager coordinator can both submit their
  // own club's drafts and review everyone's submitted entries.
  const canSelect = (entry: Entry) =>
    (isClub && (entry.status === "DRAFT" || entry.status === "RETURNED")) ||
    (canReviewEvent && entry.status === "SUBMITTED")

  const selectableIds = useMemo(
    () => entries.filter(canSelect).map((e) => e.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, canReviewEvent, isClub],
  )

  // Clear selection whenever the working set changes.
  useEffect(() => {
    setSelected(new Set())
  }, [selectedEventId, filterClubId, filterDivisionId, filterStatus, filterEntryType, searchQuery])

  // Drop any selected ids that are no longer selectable (e.g. after a refetch).
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev
      const valid = new Set(selectableIds)
      let changed = false
      const next = new Set<string>()
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id)
        else changed = true
      })
      return changed ? next : prev
    })
  }, [selectableIds])

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleMany = (ids: string[]) =>
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id))
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["entries"] })

  // --- Actions (single + bulk share these paths) ---
  const runSubmit = async (ids: string[]) => {
    if (ids.length === 0) return
    setActing(true)
    try {
      const { updatedCount } = await EntryService.bulkSubmit(selectedEventId, ids)
      invalidate()
      setSelected(new Set())
      toast.success(`${updatedCount} ${updatedCount === 1 ? "entry" : "entries"} submitted`)
    } catch (e) {
      showApiError(e, "Failed to submit entries")
    } finally {
      setActing(false)
    }
  }

  const runApprove = async (ids: string[]) => {
    if (ids.length === 0) return
    setActing(true)
    try {
      const { updatedCount } = await EntryService.bulkReview(selectedEventId, ids, "APPROVED")
      invalidate()
      setSelected(new Set())
      toast.success(`${updatedCount} ${updatedCount === 1 ? "entry" : "entries"} approved`)
    } catch (e) {
      showApiError(e, "Failed to approve entries")
    } finally {
      setActing(false)
    }
  }

  const runReturn = async (ids: string[], reason: string) => {
    if (ids.length === 0) return
    setActing(true)
    try {
      const { updatedCount } = await EntryService.bulkReview(selectedEventId, ids, "RETURNED", reason)
      invalidate()
      setSelected(new Set())
      toast.success(`${updatedCount} ${updatedCount === 1 ? "entry" : "entries"} returned`)
    } catch (e) {
      showApiError(e, "Failed to return entries")
    } finally {
      setActing(false)
    }
  }

  // 409s here carry the conflicting athlete's name from the server, so the
  // fallback message is only ever seen for unexpected failures.
  const runSetSeed = async (id: string, seed: number | null) => {
    setActing(true)
    try {
      await EntryService.setSeed(id, seed)
      invalidate()
      queryClient.invalidateQueries({ queryKey: ["category-seeds"] })
      queryClient.invalidateQueries({ queryKey: ["draw-categories"] })
    } catch (e) {
      showApiError(e, "Failed to set the seed")
    } finally {
      setActing(false)
    }
  }

  const openReturnDialog = (ids: string[]) => {
    setReturnTarget(ids)
    setReturnReason("")
  }

  const confirmReturn = async () => {
    if (!returnTarget) return
    const ids = returnTarget
    setReturnTarget(null)
    await runReturn(ids, returnReason.trim())
  }

  // Withdraw: APPROVED -> RETURNED via /review/bulk-status (not /review/bulk,
  // which only touches SUBMITTED). Does not delete the entry — RETURNED
  // already means "out of the draw-eligible pool" and keeps the audit trail.
  // If a draw already exists for the category, this does NOT touch it; the
  // dialog warns the caller to regenerate separately (see openWithdrawDialog).
  const runWithdraw = async (entry: Entry, reason: string) => {
    const hadDraw = hasDrawFor(entry.divisionId, entry.weightClassId ?? null)
    setActing(true)
    try {
      const { updatedCount } = await EntryService.withdraw(selectedEventId, entry.id, reason)
      invalidate()
      queryClient.invalidateQueries({ queryKey: ["draw-categories"] })
      if (updatedCount > 0) {
        toast.success(
          hadDraw
            ? "Entry withdrawn — regenerate the draw on the Draws page for it to take effect"
            : "Entry withdrawn",
        )
      } else {
        toast.error("Nothing to withdraw — already returned")
      }
    } catch (e) {
      showApiError(e, "Failed to withdraw entry")
    } finally {
      setActing(false)
    }
  }

  const openWithdrawDialog = (entry: Entry) => {
    setWithdrawTarget(entry)
    setWithdrawReason("")
  }

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return
    const entry = withdrawTarget
    setWithdrawTarget(null)
    await runWithdraw(entry, withdrawReason.trim())
  }

  const handleApproveAll = async () => {
    const ids = entries.filter((e) => e.status === "SUBMITTED").map((e) => e.id)
    if (ids.length === 0) return
    const ok = await confirm({
      title: `Approve ${ids.length} pending ${ids.length === 1 ? "entry" : "entries"}?`,
      description: "All currently listed pending entries will be approved.",
      confirmText: "Approve all",
    })
    if (ok) runApprove(ids)
  }

  const toggleDivision = (id: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (expandedDivisions.size === divisions.length) setExpandedDivisions(new Set())
    else setExpandedDivisions(new Set(divisions.map((d) => d.id)))
  }

  const stats = useMemo(
    () => ({
      total: entries.length,
      draft: entries.filter((e) => e.status === "DRAFT").length,
      submitted: entries.filter((e) => e.status === "SUBMITTED").length,
      approved: entries.filter((e) => e.status === "APPROVED").length,
      returned: entries.filter((e) => e.status === "RETURNED").length,
    }),
    [entries],
  )

  // Counts that drive the one-click shortcuts (from the currently listed entries).
  const submittableCount = useMemo(
    () => entries.filter((e) => e.status === "DRAFT" || e.status === "RETURNED").length,
    [entries],
  )
  const pendingCount = stats.submitted

  const groupedEntries = useMemo(() => {
    const groups: { [id: string]: { division: EntryDivision; entries: Entry[] } } = {}
    entries.forEach((entry) => {
      if (!groups[entry.divisionId]) {
        groups[entry.divisionId] = { division: entry.division, entries: [] }
      }
      groups[entry.divisionId].entries.push(entry)
    })
    return groups
  }, [entries])

  const allDivisionsWithEntries = useMemo(
    () =>
      divisions.map((division) => ({
        division,
        entries: groupedEntries[division.id]?.entries || [],
      })),
    [divisions, groupedEntries],
  )

  if (!isAdmin && !clubId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statTone: Record<keyof typeof stats, string> = {
    total: "",
    draft: "text-muted-foreground",
    submitted: "text-belt-orange",
    approved: "text-belt-green",
    returned: "text-flag-red",
  }
  const statLabel: Record<keyof typeof stats, string> = {
    total: "Total",
    draft: "Draft",
    submitted: "Pending",
    approved: "Approved",
    returned: "Returned",
  }
  const statFilter: Record<keyof typeof stats, string> = {
    total: "ALL",
    draft: "DRAFT",
    submitted: "SUBMITTED",
    approved: "APPROVED",
    returned: "RETURNED",
  }

  const selectedCount = selected.size

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-wide sm:text-2xl">Review entries</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {canReviewEvent
              ? "Review, approve or return entries across all clubs."
              : "Review and submit your club's entries for approval."}
          </p>
        </div>
        {selectedEventId && (
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <FileDown />
            Export entries
          </Button>
        )}
      </div>

      {selectedEventId && submitBlocked && reg.message && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-belt-orange/30 bg-belt-orange/10 px-3 py-2.5 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-belt-orange" />
          <div>
            <span className="font-medium">{reg.message}</span>{" "}
            <span className="text-muted-foreground">
              You can still review your entries, but submitting is disabled until the
              organizer reopens registration.
            </span>
          </div>
        </div>
      )}

      {selectedEventId && (
        <>
          {/* Stats — click to filter by that status */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {(Object.keys(stats) as Array<keyof typeof stats>).map((key) => {
              const target = statFilter[key]
              const active = filterStatus === target
              return (
                <Card
                  key={key}
                  className={cn(
                    "cursor-pointer transition-colors hover:border-primary/40",
                    active && "border-primary ring-1 ring-primary/30",
                  )}
                  onClick={() => setFilterStatus(target)}
                >
                  <CardContent className="py-3">
                    <p
                      className={cn(
                        "font-display text-2xl sm:text-3xl tracking-wide leading-none",
                        statTone[key],
                      )}
                    >
                      {stats[key]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statLabel[key]}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* One-click shortcuts */}
          {(isClub && submittableCount > 0) || (canReviewEvent && pendingCount > 0) ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {isClub && submittableCount > 0 && (
                <Button
                  size="sm"
                  onClick={() =>
                    runSubmit(
                      entries
                        .filter((e) => e.status === "DRAFT" || e.status === "RETURNED")
                        .map((e) => e.id),
                    )
                  }
                  disabled={acting || submitBlocked}
                  title={submitBlocked ? "Registration is closed" : undefined}
                >
                  <Send />
                  Submit all drafts ({submittableCount})
                </Button>
              )}
              {canReviewEvent && pendingCount > 0 && (
                <Button size="sm" onClick={handleApproveAll} disabled={acting}>
                  <Check />
                  Approve all pending ({pendingCount})
                </Button>
              )}
            </div>
          ) : null}

          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {isAdmin && (
                  <div>
                    <Label className="mb-1.5">Club</Label>
                    <Select
                      value={filterClubId || "all"}
                      onValueChange={(v) =>
                        setFilterClubId(v === "all" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All clubs</SelectItem>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="mb-1.5">Division</Label>
                  <Select
                    value={filterDivisionId || "all"}
                    onValueChange={(v) => setFilterDivisionId(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All divisions</SelectItem>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SUBMITTED">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="RETURNED">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5">Entry type</Label>
                  <Select value={filterEntryType} onValueChange={setFilterEntryType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All types</SelectItem>
                      <SelectItem value="KATA">Kata (Individual)</SelectItem>
                      <SelectItem value="KUMITE">Kumite (Individual)</SelectItem>
                      <SelectItem value="TEAM_KATA">Kata (Team)</SelectItem>
                      <SelectItem value="TEAM_KUMITE">Kumite (Team)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search athletes, teams, clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* View toggle + select-all */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grouped" | "table")}>
              <TabsList>
                <TabsTrigger value="grouped">Grouped</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {selectableIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMany(selectableIds)}
                >
                  {selectableIds.every((id) => selected.has(id))
                    ? "Deselect all"
                    : `Select all (${selectableIds.length})`}
                </Button>
              )}
              {viewMode === "grouped" && (
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {expandedDivisions.size === divisions.length ? "Collapse all" : "Expand all"}
                </Button>
              )}
            </div>
          </div>

          {/* Entries */}
          {loadingEntries && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {!loadingEntries && entries.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No entries found. Try adjusting your filters.
              </CardContent>
            </Card>
          )}

          {!loadingEntries && entries.length > 0 && viewMode === "grouped" && (
            <div className="space-y-3 pb-24">
              {allDivisionsWithEntries.map(({ division, entries: divisionEntries }) => {
                const isExpanded = expandedDivisions.has(division.id)
                const groupSelectable = divisionEntries.filter(canSelect).map((e) => e.id)
                const groupAllSelected =
                  groupSelectable.length > 0 && groupSelectable.every((id) => selected.has(id))
                return (
                  <Card key={division.id}>
                    <div className="flex items-center gap-2 p-4">
                      {groupSelectable.length > 0 && (
                        <SelectBox
                          checked={groupAllSelected}
                          onChange={() => toggleMany(groupSelectable)}
                          aria-label={`Select all in ${division.name}`}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleDivision(division.id)}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            className={cn(
                              "size-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                          <div>
                            <p className="font-medium">{division.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {division.gender} · Ages {division.minAge}-{division.maxAge}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal text-[10px]",
                              CATEGORY_STYLES[division.category],
                            )}
                          >
                            {division.category}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {divisionEntries.length}{" "}
                          {divisionEntries.length === 1 ? "entry" : "entries"}
                        </span>
                      </button>
                    </div>

                    {isExpanded && (
                      <CardContent className="space-y-2 pt-0">
                        {divisionEntries.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic py-4">
                            No entries in this division.
                          </p>
                        ) : (
                          divisionEntries.map((entry) => (
                            <EntryRow
                              key={entry.id}
                              entry={entry}
                              selectable={canSelect(entry)}
                              selected={selected.has(entry.id)}
                              onToggleSelect={() => toggleOne(entry.id)}
                              onSubmit={() => runSubmit([entry.id])}
                              onApprove={() => runApprove([entry.id])}
                              onReturn={() => openReturnDialog([entry.id])}
                              onWithdraw={() => openWithdrawDialog(entry)}
                              onSetSeed={(seed) => runSetSeed(entry.id, seed)}
                              canReviewEvent={canReviewEvent}
                              isClub={isClub}
                              busy={acting}
                              submitDisabled={submitBlocked}
                            />
                          ))
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {!loadingEntries && entries.length > 0 && viewMode === "table" && (
            <div className="rounded-md border bg-card overflow-hidden mb-24">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      {selectableIds.length > 0 && (
                        <SelectBox
                          checked={selectableIds.every((id) => selected.has(id))}
                          onChange={() => toggleMany(selectableIds)}
                          aria-label="Select all entries"
                        />
                      )}
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead className="hidden md:table-cell">Division</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden xl:table-cell">Weight</TableHead>
                    {canReviewEvent && <TableHead className="hidden lg:table-cell">Seed</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const isTeam =
                      entry.entryType === "TEAM_KATA" || entry.entryType === "TEAM_KUMITE"
                    const selectable = canSelect(entry)
                    const canSubmit =
                      isClub && (entry.status === "DRAFT" || entry.status === "RETURNED")
                    const canReview = canReviewEvent && entry.status === "SUBMITTED"
                    const canWithdraw = canReviewEvent && entry.status === "APPROVED"
                    return (
                      <TableRow
                        key={entry.id}
                        className={cn(selected.has(entry.id) && "bg-primary/5")}
                      >
                        <TableCell>
                          {selectable && (
                            <SelectBox
                              checked={selected.has(entry.id)}
                              onChange={() => toggleOne(entry.id)}
                              aria-label="Select entry"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isTeam && entry.team
                            ? entry.team.name
                            : entry.athlete
                            ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                            : "Unknown"}
                          {entry.status === "RETURNED" && entry.statusReason && (
                            <span className="block text-xs font-normal text-flag-red">
                              {entry.statusReason}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {entry.club.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {entry.division.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal text-[10px]",
                              CATEGORY_STYLES[entry.division.category],
                            )}
                          >
                            {entry.division.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {isTeam ? "Team" : "Individual"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {entry.weightClass?.name || "—"}
                        </TableCell>
                        {canReviewEvent && (
                          <TableCell className="hidden lg:table-cell">
                            {entry.status === "RETURNED" ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <SeedSelect
                                entry={entry}
                                disabled={acting}
                                onChange={(seed) => runSetSeed(entry.id, seed)}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {canSubmit && (
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => runSubmit([entry.id])}
                                disabled={acting || submitBlocked}
                                aria-label="Submit"
                                title={submitBlocked ? "Registration is closed" : "Submit for approval"}
                              >
                                <Send />
                              </Button>
                            )}
                            {canReview && (
                              <>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => runApprove([entry.id])}
                                  disabled={acting}
                                  aria-label="Approve"
                                >
                                  <Check />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => openReturnDialog([entry.id])}
                                  disabled={acting}
                                  aria-label="Return"
                                >
                                  <Undo2 />
                                </Button>
                              </>
                            )}
                            {canWithdraw && (
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => openWithdrawDialog(entry)}
                                disabled={acting}
                                aria-label="Withdraw"
                              >
                                <UserMinus />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Sticky bulk-action bar */}
      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-4">
            <span className="text-sm font-medium">
              {selectedCount} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="text-muted-foreground"
            >
              <X />
              Clear
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {isClub && (
                <Button
                  size="sm"
                  onClick={() => runSubmit([...selected])}
                  disabled={acting || submitBlocked}
                  title={submitBlocked ? "Registration is closed" : undefined}
                >
                  <Send />
                  Submit selected
                </Button>
              )}
              {canReviewEvent && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReturnDialog([...selected])}
                    disabled={acting}
                  >
                    <Undo2 />
                    Return selected…
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => runApprove([...selected])}
                    disabled={acting}
                  >
                    <Check />
                    Approve selected
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return-with-reason dialog */}
      <Dialog open={returnTarget !== null} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Return {returnTarget && returnTarget.length > 1 ? `${returnTarget.length} entries` : "entry"}
            </DialogTitle>
            <DialogDescription>
              The reason is shown to the club so they can fix and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="return-reason" className="mb-1.5">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="return-reason"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Wrong weight category, missing medical clearance…"
              rows={3}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnTarget(null)} disabled={acting}>
              Cancel
            </Button>
            <Button onClick={confirmReturn} disabled={acting || !returnReason.trim()}>
              <Undo2 />
              Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw dialog — approved entries only. Real-world trigger: athlete
          withdraws or falls sick after their entry was already approved. */}
      <Dialog open={withdrawTarget !== null} onOpenChange={(o) => !o && setWithdrawTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw this entry?</DialogTitle>
            <DialogDescription>
              The entry is marked Returned and removed from the draw-eligible pool.
              It stays on record rather than being deleted.
            </DialogDescription>
          </DialogHeader>

          {withdrawTarget && hasDrawFor(withdrawTarget.divisionId, withdrawTarget.weightClassId ?? null) && (
            <div className="flex items-start gap-2 rounded-md border border-belt-orange/30 bg-belt-orange/10 px-3 py-2.5 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-belt-orange" />
              <div>
                <span className="font-medium">A draw already exists for this division.</span>{" "}
                <span className="text-muted-foreground">
                  Withdrawing does not change the bracket by itself — the draw must be
                  regenerated afterward for this athlete to actually drop out of it.
                </span>{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2 hover:no-underline"
                  onClick={() => {
                    setWithdrawTarget(null)
                    navigate("/hub/draws")
                  }}
                >
                  Open Draws
                </button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="withdraw-reason" className="mb-1.5">
              Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="withdraw-reason"
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="e.g. Athlete injured, withdrew before check-in…"
              rows={3}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawTarget(null)} disabled={acting}>
              Cancel
            </Button>
            <Button onClick={confirmWithdraw} disabled={acting}>
              <UserMinus />
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two documents behind one button: one club's confirmation sheet (for
          clubs with no access to the system) or the whole event's entry list. */}
      <EntryExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        eventId={selectedEventId}
        defaultClubId={isAdmin ? filterClubId || undefined : clubId || undefined}
      />
    </>
  )
}

export default EntriesView
