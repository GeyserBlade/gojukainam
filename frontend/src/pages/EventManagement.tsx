// Entry management — the athlete pool, division boards, drag-drop and bulk
// actions for one event. Replaces the previous "pick one division, add athletes
// one at a time" workflow with a single screen that shows every division at
// once and uses live eligibility to guide enrolment.
//
// Renders inside EventHubLayout, which owns the page chrome and the event
// picker — this screen reads the current event from useSelectedEvent() and must
// not wrap itself in AppShell.
//
// Auth: SUPERADMIN / ADMIN can target any club; CLUB_MANAGER / COACH are scoped
// to their own club, enforced server-side by the pool endpoint.

import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { AlertTriangle, ArrowRight } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { useApiErrorToast, useToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { EntryService, type Entry } from "@/lib/entries"
import { listClubs } from "@/lib/clubs"
import { getAthletePool, getDivisions, registrationState, type Division } from "@/lib/events"

import { AthletePool } from "./event-management/AthletePool"
import type { EnrichedAthlete } from "./event-management/AthleteRow"
import { BulkActionBar } from "./event-management/BulkActionBar"
import { DivisionBoard } from "./event-management/DivisionBoard"
import {
  groupDivisionsByAge,
  groupDivisionsByCategory,
  individualEntryCount,
  isEligible,
  parseEventConfig,
} from "./event-management/eligibility"

// Shared fallbacks for boards with nothing to show. Module-level constants so
// every such board gets the *same* reference and DivisionBoard's memo holds.
const NO_ENTRIES: Entry[] = []
const NEUTRAL_ELIGIBILITY = { kind: "neutral" as const, count: 0, total: 0 }

// ─────────────────────────────────────────────────────────────────────────────
// Top-level page
// ─────────────────────────────────────────────────────────────────────────────

const EventManagement = () => {
  const { role, clubId } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"

  // ── Top-level selections ───────────────────────────────────────────────────
  // The event comes from the hub's picker, not from this screen.
  const { eventId: selectedEventId, event: selectedEvent } = useSelectedEvent()
  const [filterClubId, setFilterClubId] = useState<string>(clubId ?? "")

  // ── Pool state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [poolClubFilter, setPoolClubFilter] = useState<string>("")
  const [filterBelt, setFilterBelt] = useState("")
  const [filterEnteredMode, setFilterEnteredMode] = useState<"all" | "entered" | "unentered">(
    "all",
  )
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(() => new Set())
  const [hoveredAthleteId, setHoveredAthleteId] = useState<string | null>(null)
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null)

  // ── Board state ────────────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState<"all" | "KATA" | "KUMITE">("all")
  const [showEmptyBoards, setShowEmptyBoards] = useState(true)
  const [groupBy, setGroupBy] = useState<"age" | "category">("age")
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable")
  const [showFees, setShowFees] = useState(true)
  const [ghostingEnabled, setGhostingEnabled] = useState(true)

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [draggedAthleteId, setDraggedAthleteId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  // ── Queries ────────────────────────────────────────────────────────────────
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

  // The event's whole athlete pool in one request, with age already resolved
  // against the event date. Eligibility per division is computed client-side
  // from age/gender, so no per-division fetching is needed.
  //
  // This must stay on the pool endpoint rather than the general athlete list:
  // /athletes/all is SUPERADMIN-only, and both athlete-list endpoints return
  // full rows including idNumber, medicalNotes and guardian contacts.
  const { data: athletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ["athlete-pool", selectedEventId, filterClubId],
    queryFn: () => getAthletePool(selectedEventId, filterClubId || undefined),
    enabled: !!selectedEventId && (isAdmin || !!clubId),
  })

  // All entries for the event (we filter by club/division client-side).
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["entries", "event", selectedEventId, filterClubId],
    queryFn: () =>
      EntryService.list({
        eventId: selectedEventId,
        ...(filterClubId ? { clubId: filterClubId } : {}),
      }),
    enabled: !!selectedEventId && (isAdmin || !!clubId),
  })

  // ── Derived data ───────────────────────────────────────────────────────────
  const eventDate = selectedEvent?.startDate ?? new Date().toISOString()
  const eventConfig = useMemo(
    () => parseEventConfig(selectedEvent?.configJson),
    [selectedEvent?.configJson],
  )

  // Clubs can only change entries while registration is open; admins bypass it.
  // The backend enforces this too — this is the UI half, and it matters most on
  // the bulk actions, which create many entries per click.
  const reg = registrationState(selectedEvent)
  const addBlocked = !isAdmin && !reg.open

  // The pool endpoint resolves age server-side against the event date, so the
  // rows are already in the shape the boards and rows want.
  const enrichedAthletes: EnrichedAthlete[] = athletes

  // Pool filtering (search + club + belt + entered mode)
  const visibleAthletes = useMemo(() => {
    let list = enrichedAthletes
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q),
      )
    }
    if (poolClubFilter) list = list.filter((a) => a.clubId === poolClubFilter)
    if (filterBelt) {
      list = list.filter((a) => {
        const c = (a.belt?.colour ?? a.belt?.name ?? "").toLowerCase()
        return c.includes(filterBelt)
      })
    }
    if (filterEnteredMode !== "all") {
      const isEntered = (id: string) => entries.some((e) => e.athleteId === id)
      list = list.filter((a) =>
        filterEnteredMode === "entered" ? isEntered(a.id) : !isEntered(a.id),
      )
    }
    return list
  }, [enrichedAthletes, search, poolClubFilter, filterBelt, filterEnteredMode, entries])

  // Boards filtering
  const groupedDivisions = useMemo(() => {
    let list = divisions
    if (categoryFilter !== "all") list = list.filter((d) => d.category === categoryFilter)
    if (!showEmptyBoards) {
      list = list.filter((d) => entries.some((e) => e.divisionId === d.id))
    }
    return groupBy === "age" ? groupDivisionsByAge(list) : groupDivisionsByCategory(list)
  }, [divisions, entries, categoryFilter, showEmptyBoards, groupBy])

  // Entries bucketed by division, so each board gets a stable array reference
  // instead of a fresh entries.filter(...) on every parent render. Boards with
  // no entries all share one frozen empty array for the same reason.
  const entriesByDivision = useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of entries) {
      const bucket = m.get(e.divisionId)
      if (bucket) bucket.push(e)
      else m.set(e.divisionId, [e])
    }
    return m
  }, [entries])

  // ── Eligibility focus (which athletes drive board ghosting) ────────────────
  const focusAthleteIds = useMemo(() => {
    if (selectedAthleteIds.size > 0) return Array.from(selectedAthleteIds)
    if (hoveredAthleteId) return [hoveredAthleteId]
    if (expandedAthleteId) return [expandedAthleteId]
    if (draggedAthleteId) return [draggedAthleteId]
    return [] as string[]
  }, [selectedAthleteIds, hoveredAthleteId, expandedAthleteId, draggedAthleteId])

  const eligibilityForDivision = (d: Division) => {
    if (focusAthleteIds.length === 0) {
      return { kind: "neutral" as const, count: 0, total: 0 }
    }
    const focused = focusAthleteIds
      .map((id) => enrichedAthletes.find((a) => a.id === id))
      .filter((x): x is EnrichedAthlete => !!x)
    const eligible = focused.filter((a) => isEligible(a, d, eventDate))
    if (eligible.length === 0) {
      return { kind: "ineligible" as const, count: 0, total: focused.length }
    }
    if (eligible.length === focused.length) {
      return { kind: "eligible" as const, count: eligible.length, total: focused.length }
    }
    return { kind: "partial" as const, count: eligible.length, total: focused.length }
  }

  // Resolved once per focus change rather than per board per render. The board
  // takes the three fields as primitives, so a board only re-renders when its
  // own verdict changes — hovering a second athlete with the same age and
  // gender re-renders no boards at all.
  const eligibilityByDivision = useMemo(() => {
    const m = new Map<string, ReturnType<typeof eligibilityForDivision>>()
    for (const d of divisions) m.set(d.id, eligibilityForDivision(d))
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisions, focusAthleteIds, enrichedAthletes, eventDate])

  // Which athlete, if any, this board should highlight. Passing the raw hovered
  // id to all 48 boards made every one of them re-render on every hover; at
  // most one board can actually show a highlight.
  const highlightForDivision = (divisionId: string) =>
    hoveredAthleteId &&
    entriesByDivision.get(divisionId)?.some((e) => e.athleteId === hoveredAthleteId)
      ? hoveredAthleteId
      : null

  // ── Stats strip ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = entries.length
    const draft = entries.filter((e) => e.status === "DRAFT").length
    const submitted = entries.filter((e) => e.status === "SUBMITTED").length
    const approved = entries.filter((e) => e.status === "APPROVED").length
    const returned = entries.filter((e) => e.status === "RETURNED").length
    const athletesEntered = new Set(entries.map((e) => e.athleteId)).size
    const fees = entries.reduce((s, e) => {
      switch (e.entryType) {
        case "KATA":
          return s + eventConfig.fees.kataIndividual
        case "KUMITE":
          return s + eventConfig.fees.kumiteIndividual
        case "TEAM_KATA":
          return s + eventConfig.fees.teamKata
        case "TEAM_KUMITE":
          return s + eventConfig.fees.teamKumite
        default:
          return s
      }
    }, 0)
    const overLimit = enrichedAthletes.filter(
      (a) => individualEntryCount(a.id, entries) > eventConfig.limits.maxIndividualEventsPerAthlete,
    ).length
    return { total, draft, submitted, approved, returned, athletesEntered, fees, overLimit }
  }, [entries, enrichedAthletes, eventConfig])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createEntryMutation = useMutation({
    mutationFn: async ({
      athleteId,
      divisionId,
    }: {
      athleteId: string
      divisionId: string
    }) => {
      const div = divisions.find((d) => d.id === divisionId)
      if (!div) throw new Error("Division not found")
      const athlete = athletes.find((a) => a.id === athleteId)
      if (!athlete) throw new Error("Athlete not found")
      const effectiveClubId = filterClubId || athlete.clubId || clubId
      if (!effectiveClubId) throw new Error("Club ID is required")
      return EntryService.create({
        eventId: selectedEventId,
        clubId: effectiveClubId,
        divisionId,
        entryType: div.category,
        athleteId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] })
    },
    onError: (e) => showApiError(e, "Failed to create entry"),
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => EntryService.delete(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] })
    },
    onError: (e) => showApiError(e, "Failed to remove entry"),
  })

  // ── Action helpers ─────────────────────────────────────────────────────────
  const handleAddEntry = (athleteId: string, divisionId: string) => {
    if (addBlocked) return
    const exists = entries.find(
      (e) => e.athleteId === athleteId && e.divisionId === divisionId,
    )
    if (exists) return
    const div = divisions.find((d) => d.id === divisionId)
    const athlete = athletes.find((a) => a.id === athleteId)
    if (!div || !athlete || !isEligible(athlete, div, eventDate)) {
      toast.error("Athlete is not eligible for this division")
      return
    }
    createEntryMutation.mutate({ athleteId, divisionId })
  }

  // Stable across renders so it does not defeat DivisionBoard's memo. `mutate`
  // is stable in TanStack Query, so this only changes when entries do.
  //
  // DRAFT-only: DivisionBoard no longer offers the remove control past DRAFT
  // (the backend has always rejected it — this used to show a confirm dialog
  // then fail). Withdrawing a submitted/approved entry is EntriesView's job
  // now, which keeps the RETURNED record instead of trying to delete it.
  const removeEntryMutate = deleteEntryMutation.mutate
  const handleRemoveEntry = useCallback(
    (athleteId: string, divisionId: string) => {
      const entry = entries.find(
        (e) => e.athleteId === athleteId && e.divisionId === divisionId,
      )
      if (!entry || entry.status !== "DRAFT") return
      removeEntryMutate(entry.id)
    },
    [entries, removeEntryMutate],
  )

  const handleBulkAdd = async (category: "KATA" | "KUMITE" | "BOTH") => {
    if (addBlocked) return
    const ids = Array.from(selectedAthleteIds)
    const tasks: Array<{ athleteId: string; divisionId: string }> = []
    ids.forEach((athleteId) => {
      const a = athletes.find((x) => x.id === athleteId)
      if (!a) return
      divisions.forEach((d) => {
        if (!isEligible(a, d, eventDate)) return
        if (category !== "BOTH" && d.category !== category) return
        const exists = entries.find(
          (e) => e.athleteId === athleteId && e.divisionId === d.id,
        )
        if (exists) return
        tasks.push({ athleteId, divisionId: d.id })
      })
    })
    if (tasks.length === 0) return

    // Fire in parallel; refresh once at the end.
    const results = await Promise.allSettled(
      tasks.map((t) =>
        EntryService.create({
          eventId: selectedEventId,
          clubId:
            filterClubId ||
            athletes.find((a) => a.id === t.athleteId)?.clubId ||
            clubId ||
            "",
          divisionId: t.divisionId,
          entryType: divisions.find((d) => d.id === t.divisionId)!.category,
          athleteId: t.athleteId,
        }),
      ),
    )
    const failed = results.filter((r) => r.status === "rejected").length
    queryClient.invalidateQueries({ queryKey: ["entries"] })
    setSelectedAthleteIds(new Set())
    if (failed > 0) {
      toast.error(`Created ${tasks.length - failed} entries · ${failed} failed`)
    } else {
      toast.success(`Created ${tasks.length} entries`)
    }
  }

  const handleSubmitAllDrafts = async () => {
    if (addBlocked) return
    const drafts = entries.filter((e) => e.status === "DRAFT")
    if (drafts.length === 0) return
    const ok = await confirm({
      title: `Submit ${drafts.length} draft entr${drafts.length === 1 ? "y" : "ies"} for approval?`,
      description: "Submitted entries can only be changed by event admins.",
      confirmText: "Submit all",
    })
    if (!ok) return
    // One batched call instead of one request per draft: it's what the
    // backend already exposes for this (`entry.service.ts` bulkSubmit, a
    // single updateMany), and firing up to dozens of individual PUTs in
    // parallel needlessly multiplied how many requests a large club's submit
    // could throw at the API rate limiter in one burst.
    try {
      const { updatedCount } = await EntryService.bulkSubmit(
        selectedEventId,
        drafts.map((e) => e.id),
      )
      queryClient.invalidateQueries({ queryKey: ["entries"] })
      const failed = drafts.length - updatedCount
      if (failed > 0) toast.error(`Submitted ${updatedCount} · ${failed} failed`)
      else toast.success(`Submitted ${updatedCount} entries`)
    } catch (err) {
      showApiError(err)
    }
  }

  // Reset event-scoped state when event changes
  useEffect(() => {
    setSelectedAthleteIds(new Set())
    setExpandedAthleteId(null)
    setHoveredAthleteId(null)
  }, [selectedEventId])

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const clearSelection = () => setSelectedAthleteIds(new Set())
  const selectAllVisible = () =>
    setSelectedAthleteIds(new Set(visibleAthletes.map((a) => a.id)))

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { athleteId?: string } | undefined
    setDraggedAthleteId(data?.athleteId ?? null)
  }
  const handleDragEnd = (e: DragEndEvent) => {
    const dragged = draggedAthleteId
    setDraggedAthleteId(null)
    if (addBlocked) return
    if (!dragged || !e.over) return
    const overData = e.over.data.current as { divisionId?: string } | undefined
    if (!overData?.divisionId) return
    // If the dragged athlete is part of the multi-selection, add ALL of them.
    const ids = selectedAthleteIds.has(dragged)
      ? Array.from(selectedAthleteIds)
      : [dragged]
    ids.forEach((id) => handleAddEntry(id, overData.divisionId!))
  }

  // ── Permission gate ────────────────────────────────────────────────────────
  if (!isAdmin && !clubId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const draggedAthlete = draggedAthleteId
    ? enrichedAthletes.find((a) => a.id === draggedAthleteId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <>
        {/* Page header. The hub supplies the event picker and status badge. */}
        <div className="mb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-wide sm:text-2xl">Entries</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pool athletes into divisions. Drag, click, or bulk-enrol — eligibility is live.
              </p>
            </div>
            {selectedEventId && (
              <Button
                size="sm"
                onClick={handleSubmitAllDrafts}
                disabled={stats.draft === 0 || addBlocked}
                title={
                  addBlocked
                    ? "Registration is closed"
                    : "Submit all draft entries for approval"
                }
              >
                <ArrowRight />
                Submit {stats.draft} draft{stats.draft === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </div>

        {selectedEventId && addBlocked && reg.message && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-belt-orange/30 bg-belt-orange/10 px-3 py-2.5 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-belt-orange" />
            <div>
              <span className="font-medium">{reg.message}</span>{" "}
              <span className="text-muted-foreground">
                Adding entries is disabled until the organizer reopens registration.
              </span>
            </div>
          </div>
        )}

        {/* Stats + club filter */}
        <Card className="mb-4">
          <CardContent className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Stats strip */}
              {selectedEventId && (
                <div className="flex items-stretch divide-x border rounded-md">
                  <Stat label="Athletes" value={stats.athletesEntered} />
                  <Stat label="Entries" value={stats.total} />
                  <Stat label="Pending" value={stats.submitted} tone="orange" />
                  <Stat label="Approved" value={stats.approved} tone="green" />
                  {stats.overLimit > 0 && (
                    <Stat label="Over limit" value={stats.overLimit} tone="red" />
                  )}
                  {showFees && (
                    <Stat
                      label={`Fees (${eventConfig.currency})`}
                      value={`${eventConfig.currency === "NAD" ? "N$" : ""}${stats.fees.toLocaleString()}`}
                      mono
                    />
                  )}
                </div>
              )}
            </div>

            {/* Admin club filter */}
            {isAdmin && selectedEventId && clubs.length > 0 && (
              <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                  Club filter
                </span>
                <ChipButton
                  active={!filterClubId}
                  onClick={() => setFilterClubId("")}
                >
                  All clubs
                </ChipButton>
                {clubs.map((c) => (
                  <ChipButton
                    key={c.id}
                    active={filterClubId === c.id}
                    onClick={() =>
                      setFilterClubId(filterClubId === c.id ? "" : c.id)
                    }
                  >
                    {c.name}
                  </ChipButton>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedEventId ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Select an event to begin managing entries.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Board controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Tabs
                  value={categoryFilter}
                  onValueChange={(v) =>
                    setCategoryFilter(v as "all" | "KATA" | "KUMITE")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="KATA">Kata</TabsTrigger>
                    <TabsTrigger value="KUMITE">Kumite</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="hidden md:flex items-center gap-1 ml-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Group by
                  </span>
                  <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as "age" | "category")}>
                    <TabsList className="h-7">
                      <TabsTrigger value="age" className="text-xs">Age</TabsTrigger>
                      <TabsTrigger value="category" className="text-xs">Category</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showEmptyBoards}
                    onChange={(e) => setShowEmptyBoards(e.target.checked)}
                    className="accent-primary"
                  />
                  Empty boards
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ghostingEnabled}
                    onChange={(e) => setGhostingEnabled(e.target.checked)}
                    className="accent-primary"
                  />
                  Ghost ineligible
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={density === "compact"}
                    onChange={(e) => setDensity(e.target.checked ? "compact" : "comfortable")}
                    className="accent-primary"
                  />
                  Compact
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
              {/* Pool */}
              {loadingAthletes ? (
                <Skeleton className="h-[600px] w-full" />
              ) : (
                <AthletePool
                  athletes={visibleAthletes}
                  totalCount={enrichedAthletes.length}
                  divisions={divisions}
                  entries={entries}
                  clubs={clubs}
                  eventDate={eventDate}
                  isAdmin={isAdmin}
                  search={search}
                  setSearch={setSearch}
                  filterClubId={poolClubFilter}
                  setFilterClubId={setPoolClubFilter}
                  filterBelt={filterBelt}
                  setFilterBelt={setFilterBelt}
                  filterEnteredMode={filterEnteredMode}
                  setFilterEnteredMode={setFilterEnteredMode}
                  selectedAthleteIds={selectedAthleteIds}
                  toggleSelect={toggleSelect}
                  clearSelection={clearSelection}
                  selectAllVisible={selectAllVisible}
                  hoveredAthleteId={hoveredAthleteId}
                  setHoveredAthleteId={setHoveredAthleteId}
                  expandedAthleteId={expandedAthleteId}
                  setExpandedAthleteId={setExpandedAthleteId}
                  onAddEntry={handleAddEntry}
                  onRemoveEntry={handleRemoveEntry}
                  addDisabled={addBlocked}
                  density={density}
                  showFees={showFees}
                  maxIndividualEvents={eventConfig.limits.maxIndividualEventsPerAthlete}
                />
              )}

              {/* Boards */}
              <div>
                {loadingEntries && (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))}
                  </div>
                )}
                {!loadingEntries && groupedDivisions.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                      No divisions match the current filter.
                    </CardContent>
                  </Card>
                )}
                {!loadingEntries && (
                  <div className="space-y-6">
                    {groupedDivisions.map((group) => {
                      const groupEntries = entries.filter((e) =>
                        group.divisions.some((d) => d.id === e.divisionId),
                      )
                      return (
                        <section key={group.key}>
                          <div className="flex items-baseline justify-between gap-2 mb-2">
                            <h3 className="font-display text-lg tracking-wider whitespace-nowrap">
                              {group.label.toUpperCase()}
                            </h3>
                            <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                              {group.divisions.length} div · {groupEntries.length}{" "}
                              {groupEntries.length === 1 ? "entry" : "entries"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.divisions.map((d) => {
                              const el = eligibilityByDivision.get(d.id) ?? NEUTRAL_ELIGIBILITY
                              return (
                                <DivisionBoard
                                  key={d.id}
                                  division={d}
                                  entries={entriesByDivision.get(d.id) ?? NO_ENTRIES}
                                  athletes={enrichedAthletes}
                                  eligibilityKind={el.kind}
                                  eligibleCount={el.count}
                                  eligibleTotal={el.total}
                                  hasFocus={focusAthleteIds.length > 0}
                                  highlightAthleteId={highlightForDivision(d.id)}
                                  onRemoveEntry={handleRemoveEntry}
                                  density={density}
                                  showFees={showFees}
                                  config={eventConfig}
                                  ghostingEnabled={ghostingEnabled}
                                />
                              )
                            })}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </>

      {selectedAthleteIds.size > 0 && selectedEventId && (
        <BulkActionBar
          selectedAthleteIds={selectedAthleteIds}
          athletes={enrichedAthletes}
          divisions={divisions}
          entries={entries}
          eventDate={eventDate}
          onClear={clearSelection}
          onBulkAdd={handleBulkAdd}
          isPending={createEntryMutation.isPending || addBlocked}
        />
      )}

      {/* Drag ghost */}
      <DragOverlay>
        {draggedAthlete ? (
          <div className="rounded-md border bg-card px-3 py-2 shadow-2xl rotate-2">
            <div className="flex items-center gap-2">
              <BeltBadge
                name={draggedAthlete.belt?.name}
                colour={draggedAthlete.belt?.colour}
                iconOnly
              />
              <div>
                <p className="text-sm font-medium">
                  {draggedAthlete.firstName} {draggedAthlete.lastName}
                </p>
                {selectedAthleteIds.has(draggedAthlete.id) &&
                  selectedAthleteIds.size > 1 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{selectedAthleteIds.size - 1} more
                    </p>
                  )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny presentational atoms
// ─────────────────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  tone,
  mono,
}: {
  label: string
  value: number | string
  tone?: "orange" | "green" | "red"
  mono?: boolean
}) {
  const toneClass =
    tone === "orange"
      ? "text-belt-orange"
      : tone === "green"
        ? "text-belt-green"
        : tone === "red"
          ? "text-flag-red"
          : ""
  return (
    <div className="px-3 py-1.5 min-w-[72px]">
      <p
        className={cn(
          "font-display text-2xl md:text-3xl leading-none tabular-nums",
          mono && "font-sans text-base md:text-lg",
          toneClass,
        )}
      >
        {value}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  )
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/60 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
      )}
    >
      {children}
    </button>
  )
}

export default EventManagement
