import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Inbox,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import {
  listEvents,
  getEvent,
  getDivisions,
  getEligibleAthletes,
  type EligibleAthlete,
} from "@/lib/events"
import { EntryService, type Entry } from "@/lib/entries"
import { listClubs } from "@/lib/clubs"

const ENTRY_STATUS_STYLES = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  APPROVED: "bg-belt-green/15 text-belt-green border-belt-green/30",
  RETURNED: "bg-flag-red/15 text-flag-red border-flag-red/30",
} as const

interface AthleteCardSurfaceProps {
  athlete: EligibleAthlete
  isDragging?: boolean
}

const AthleteCardSurface: React.FC<AthleteCardSurfaceProps> = ({ athlete, isDragging }) => (
  <div
    className={cn(
      "rounded-md border bg-card p-3 transition-colors",
      isDragging && "border-primary/40 bg-primary/5",
      athlete.isEntered && "opacity-50",
    )}
  >
    <div className="flex justify-between items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">
          {athlete.firstName} {athlete.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">{athlete.club.name}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <BeltBadge name={athlete.belt.name} colour={athlete.belt?.colour} />
          <span className="text-xs text-muted-foreground">
            {athlete.age}y
            {athlete.weightKg ? ` · ${athlete.weightKg}kg` : ""}
          </span>
        </div>
      </div>
      {athlete.isEntered && (
        <Badge
          variant="outline"
          className="font-normal text-[10px] bg-belt-green/15 text-belt-green border-belt-green/30 shrink-0"
        >
          Entered
        </Badge>
      )}
    </div>
  </div>
)

interface DraggableAthleteCardProps {
  athlete: EligibleAthlete
  onAdd: () => void
  isAdding: boolean
}

const DraggableAthleteCard: React.FC<DraggableAthleteCardProps> = ({ athlete, onAdd, isAdding }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: athlete.id,
    disabled: athlete.isEntered,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-stretch gap-2", athlete.isEntered && "opacity-60")}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn("flex-1 min-w-0", !athlete.isEntered && "cursor-move")}
      >
        <AthleteCardSurface athlete={athlete} />
      </div>
      {!athlete.isEntered && (
        <Button
          size="sm"
          onClick={onAdd}
          disabled={isAdding}
          className="shrink-0 self-stretch h-auto"
          aria-label={`Add ${athlete.firstName} ${athlete.lastName}`}
        >
          <PlusCircle />
          Add
        </Button>
      )}
    </div>
  )
}

interface MobileAthleteCardProps {
  athlete: EligibleAthlete
  onAdd: () => void
  isAdding: boolean
}

const MobileAthleteCard: React.FC<MobileAthleteCardProps> = ({ athlete, onAdd, isAdding }) => (
  <div
    className={cn(
      "rounded-md border bg-card p-3",
      athlete.isEntered && "opacity-50",
    )}
  >
    <div className="flex justify-between items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">
          {athlete.firstName} {athlete.lastName}
        </p>
        <p className="text-sm text-muted-foreground truncate">{athlete.club.name}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <BeltBadge name={athlete.belt.name} colour={athlete.belt?.colour} />
          <span className="text-xs text-muted-foreground">
            {athlete.age}y
            {athlete.weightKg ? ` · ${athlete.weightKg}kg` : ""}
          </span>
        </div>
      </div>
      {athlete.isEntered ? (
        <Badge
          variant="outline"
          className="font-normal text-[10px] bg-belt-green/15 text-belt-green border-belt-green/30 shrink-0"
        >
          Entered
        </Badge>
      ) : (
        <Button size="sm" onClick={onAdd} disabled={isAdding} className="shrink-0">
          <PlusCircle />
          Add
        </Button>
      )}
    </div>
  </div>
)

interface EnteredEntryCardProps {
  entry: Entry
  onDelete?: () => void
  isDeleting?: boolean
}

const EnteredEntryCard: React.FC<EnteredEntryCardProps> = ({ entry, onDelete, isDeleting }) => {
  const name = entry.athlete
    ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
    : entry.team?.name || "—"
  const clubName = entry.athlete?.club.name || entry.club.name
  const beltName = entry.athlete?.belt?.name
  const canDelete = entry.status === "DRAFT" && !!onDelete

  return (
    <div className="rounded-md border border-belt-green/30 bg-belt-green/5 p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {clubName}
            {beltName && ` · ${beltName}`}
            {entry.weightClass && ` · ${entry.weightClass.name}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "font-normal text-[10px]",
              ENTRY_STATUS_STYLES[entry.status] || ENTRY_STATUS_STYLES.DRAFT,
            )}
          >
            {entry.status}
          </Badge>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label={`Remove ${name}`}
              title="Remove this draft entry"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const DroppableZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNodeRef } = useDroppable({ id: "drop-zone" })
  return <div ref={setNodeRef}>{children}</div>
}

const EventManagement = () => {
  const { role, clubId } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"

  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("")
  const [filterClubId, setFilterClubId] = useState<string>(clubId || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [entryType, setEntryType] = useState<"KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE">("KATA")
  const [selectedWeightClassId, setSelectedWeightClassId] = useState<string>("")
  const [draggedAthlete, setDraggedAthlete] = useState<EligibleAthlete | null>(null)

  const { data: events = [] } = useQuery({
    queryKey: ["events", "active"],
    queryFn: () => listEvents(true),
  })

  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: listClubs,
    enabled: isAdmin,
  })

  const { data: selectedEvent } = useQuery({
    queryKey: ["event", selectedEventId],
    queryFn: () => getEvent(selectedEventId),
    enabled: !!selectedEventId,
  })

  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId,
  })

  const { data: eligibleAthletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ["eligibleAthletes", selectedEventId, selectedDivisionId, filterClubId],
    queryFn: () => getEligibleAthletes(selectedEventId, selectedDivisionId, filterClubId),
    enabled: !!selectedEventId && !!selectedDivisionId,
  })

  const { data: currentEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["entries", selectedEventId, selectedDivisionId, filterClubId],
    queryFn: () =>
      EntryService.list({
        eventId: selectedEventId,
        divisionId: selectedDivisionId,
        ...(filterClubId ? { clubId: filterClubId } : {}),
      }),
    enabled: !!selectedEventId && !!selectedDivisionId,
  })

  const createEntryMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      // The entry belongs to the athlete's own club; the club filter is
      // only a view filter and admins may have no club at all.
      const athlete = eligibleAthletes.find((a) => a.id === athleteId)
      const effectiveClubId = athlete?.clubId || filterClubId || clubId
      if (!effectiveClubId) throw new Error("Could not determine the athlete's club")
      const entryData: Parameters<typeof EntryService.create>[0] = {
        eventId: selectedEventId,
        clubId: effectiveClubId,
        divisionId: selectedDivisionId,
        entryType,
        athleteId,
      }
      if (entryType === "KUMITE" && selectedWeightClassId) {
        entryData.weightClassId = selectedWeightClassId
      }
      return EntryService.create(entryData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eligibleAthletes"] })
      queryClient.invalidateQueries({ queryKey: ["entries"] })
      toast.success("Entry created")
    },
    onError: (e) => showApiError(e, "Failed to create entry"),
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => EntryService.delete(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] })
      queryClient.invalidateQueries({ queryKey: ["eligibleAthletes"] })
      toast.success("Entry removed")
    },
    onError: (e) => showApiError(e, "Failed to remove entry"),
  })

  const filteredAthletes = eligibleAthletes.filter((athlete) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase()
    return (
      fullName.includes(query) ||
      athlete.club.name.toLowerCase().includes(query) ||
      (athlete.belt.name || "").toLowerCase().includes(query)
    )
  })

  const selectedDivision = divisions.find((d) => d.id === selectedDivisionId)

  const handleDragStart = (event: DragStartEvent) => {
    const athlete = eligibleAthletes.find((a) => a.id === event.active.id)
    setDraggedAthlete(athlete || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedAthlete(null)
    if (event.over?.id === "drop-zone") {
      const athleteId = event.active.id as string
      const athlete = eligibleAthletes.find((a) => a.id === athleteId)
      if (athlete && !athlete.isEntered) {
        createEntryMutation.mutate(athleteId)
      }
    }
  }

  const handleAddEntry = (athleteId: string) => {
    const athlete = eligibleAthletes.find((a) => a.id === athleteId)
    if (athlete && !athlete.isEntered) createEntryMutation.mutate(athleteId)
  }

  const handleDeleteEntry = async (entry: Entry) => {
    const label = entry.athlete
      ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
      : entry.team?.name || "this entry"
    const ok = await confirm({
      title: `Remove ${label}?`,
      description: "They will be removed from this division.",
      confirmText: "Remove",
      destructive: true,
    })
    if (ok) deleteEntryMutation.mutate(entry.id)
  }

  if (!isAdmin && !clubId) {
    return (
      <AppShell title="Entry management">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AppShell title="Entry management">
        <div className="mb-4 sm:mb-6">
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
            ENTRY MANAGEMENT
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add and manage athlete entries into event divisions.
          </p>
        </div>

        {/* Event selection */}
        <Card className="mb-4">
          <CardContent className="space-y-3">
            <div>
              <Label className="mb-1.5">Event</Label>
              <Select
                value={selectedEventId || "none"}
                onValueChange={(v) => {
                  setSelectedEventId(v === "none" ? "" : v)
                  setSelectedDivisionId("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Select event --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Select event --</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} — {new Date(event.startDate).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div>
                <Label className="mb-1.5">Filter by club (optional)</Label>
                <Select
                  value={filterClubId || "all"}
                  onValueChange={(v) => setFilterClubId(v === "all" ? "" : v)}
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
          </CardContent>
        </Card>

        {selectedEventId && (
          <Card className="mb-4">
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1.5">Division</Label>
                  <Select
                    value={selectedDivisionId || "none"}
                    onValueChange={(v) => {
                      const value = v === "none" ? "" : v
                      setSelectedDivisionId(value)
                      setSelectedWeightClassId("")
                      const div = divisions.find((d) => d.id === value)
                      if (div) {
                        if (div.category === "KATA") setEntryType("KATA")
                        else if (div.category === "KUMITE") setEntryType("KUMITE")
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Select division --</SelectItem>
                      {divisions.map((division) => {
                        const categoryLabel =
                          division.category === "KATA" ? "Kata" : "Kumite"
                        return (
                          <SelectItem key={division.id} value={division.id}>
                            {division.name} ({categoryLabel})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5">Entry type</Label>
                  <Select
                    value={entryType}
                    onValueChange={(v) =>
                      setEntryType(v as typeof entryType)
                    }
                    disabled={!selectedDivisionId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDivision?.category === "KATA" && (
                        <>
                          <SelectItem value="KATA">Kata (Individual)</SelectItem>
                          <SelectItem value="TEAM_KATA">Kata (Team)</SelectItem>
                        </>
                      )}
                      {selectedDivision?.category === "KUMITE" && (
                        <>
                          <SelectItem value="KUMITE">Kumite (Individual)</SelectItem>
                          <SelectItem value="TEAM_KUMITE">Kumite (Team)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {entryType === "KUMITE" && selectedEvent && (
                  <div>
                    <Label className="mb-1.5">Weight class</Label>
                    <Select
                      value={selectedWeightClassId || "none"}
                      onValueChange={(v) =>
                        setSelectedWeightClassId(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Select --</SelectItem>
                        {(selectedEvent.weightClasses || [])
                          .filter(
                            (wc) =>
                              wc.gender === selectedDivision?.gender &&
                              (!wc.divisionId || wc.divisionId === selectedDivisionId),
                          )
                          .map((wc) => (
                            <SelectItem key={wc.id} value={wc.id}>
                              {wc.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {selectedDivisionId && (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Adding to:</span>{" "}
                  <span className="font-medium">{selectedDivision?.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ·{" "}
                    {entryType === "KATA"
                      ? "Kata (Individual)"
                      : entryType === "KUMITE"
                      ? "Kumite (Individual)"
                      : entryType === "TEAM_KATA"
                      ? "Kata (Team)"
                      : "Kumite (Team)"}
                    {entryType === "KUMITE" && selectedWeightClassId && (
                      <>
                        {" "}
                        ·{" "}
                        {
                          selectedEvent?.weightClasses?.find(
                            (wc) => wc.id === selectedWeightClassId,
                          )?.name
                        }
                      </>
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedEventId && selectedDivisionId && (
          <>
            {/* Mobile (no dnd) */}
            <div className="lg:hidden space-y-6">
              <section>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-medium">Eligible athletes</h2>
                  <span className="text-xs text-muted-foreground">
                    {filteredAthletes.filter((a) => !a.isEntered).length} available
                  </span>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search athletes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {loadingAthletes && (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                )}
                {!loadingAthletes && filteredAthletes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No eligible athletes found.
                  </p>
                )}
                {!loadingAthletes && filteredAthletes.length > 0 && (
                  <div className="space-y-2">
                    {filteredAthletes.map((athlete) => (
                      <MobileAthleteCard
                        key={athlete.id}
                        athlete={athlete}
                        onAdd={() => handleAddEntry(athlete.id)}
                        isAdding={createEntryMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-medium">Current entries</h2>
                  <span className="text-xs text-muted-foreground">
                    {currentEntries.length}
                  </span>
                </div>
                {loadingEntries && (
                  <div className="space-y-2">
                    {[0, 1].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                )}
                {!loadingEntries && currentEntries.length === 0 && (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No entries yet. Tap{" "}
                    <span className="text-primary font-medium">Add</span> on an eligible
                    athlete.
                  </div>
                )}
                {!loadingEntries && currentEntries.length > 0 && (
                  <div className="space-y-2">
                    {currentEntries.map((entry) => (
                      <EnteredEntryCard
                        key={entry.id}
                        entry={entry}
                        onDelete={() => handleDeleteEntry(entry)}
                        isDeleting={
                          deleteEntryMutation.isPending &&
                          deleteEntryMutation.variables === entry.id
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Desktop with drag-and-drop */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">Eligible athletes</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {filteredAthletes.filter((a) => !a.isEntered).length} available
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search athletes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {loadingAthletes && (
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  )}
                  {!loadingAthletes && filteredAthletes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No eligible athletes found.</p>
                  )}
                  {!loadingAthletes && filteredAthletes.length > 0 && (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      <SortableContext
                        items={filteredAthletes.map((a) => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredAthletes.map((athlete) => (
                          <DraggableAthleteCard
                            key={athlete.id}
                            athlete={athlete}
                            onAdd={() => handleAddEntry(athlete.id)}
                            isAdding={createEntryMutation.isPending}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Click <span className="text-primary font-medium">Add</span> or drag a
                    card onto the entries panel.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">Current entries</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {currentEntries.length} entered
                  </span>
                </CardHeader>
                <CardContent>
                  <DroppableZone>
                    <div
                      id="drop-zone"
                      className={cn(
                        "rounded-md p-4 min-h-[400px] border-2 border-dashed transition-colors",
                        draggedAthlete
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/30",
                      )}
                    >
                      {draggedAthlete && (
                        <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/30">
                          <p className="text-sm text-primary mb-2 font-medium">
                            Drop to enter:
                          </p>
                          <AthleteCardSurface athlete={draggedAthlete} isDragging />
                        </div>
                      )}

                      {loadingEntries && (
                        <div className="space-y-2">
                          {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      )}
                      {!loadingEntries && currentEntries.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-12">
                          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                            <Inbox className="size-6" />
                          </div>
                          <p className="text-foreground">No entries yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Drag an athlete here or click{" "}
                            <span className="text-primary font-medium">Add</span>.
                          </p>
                        </div>
                      )}
                      {!loadingEntries && currentEntries.length > 0 && (
                        <div className="space-y-2">
                          {currentEntries.map((entry) => (
                            <EnteredEntryCard
                              key={entry.id}
                              entry={entry}
                              onDelete={() => handleDeleteEntry(entry)}
                              isDeleting={
                                deleteEntryMutation.isPending &&
                                deleteEntryMutation.variables === entry.id
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </DroppableZone>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </AppShell>

      <DragOverlay>
        {draggedAthlete ? (
          <div className="rotate-3 scale-105">
            <AthleteCardSurface athlete={draggedAthlete} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default EventManagement
