import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronRight,
  Search,
  Undo2,
  Users as UsersIcon,
  Weight as WeightIcon,
  User as UserIcon,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import {
  EntryService,
  type Entry,
  type EntryFilters,
  type Division as EntryDivision,
} from "@/lib/entries"
import { listEvents, getDivisions, type Division } from "@/lib/events"
import { listClubs } from "@/lib/clubs"

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

const EntryRow = ({
  entry,
  onStatusChange,
  isAdmin,
}: {
  entry: Entry
  onStatusChange?: (id: string, next: StatusKey) => void
  isAdmin: boolean
}) => {
  const isTeam = entry.entryType === "TEAM_KATA" || entry.entryType === "TEAM_KUMITE"
  const cat = entry.division.category

  return (
    <Card>
      <CardContent className="space-y-2 px-4 py-3">
        <div className="flex justify-between items-start gap-3">
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
              {!isTeam && entry.athlete?.belt && (
                <span>{entry.athlete.belt.name}</span>
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
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={entry.status} />
            {isAdmin && entry.status === "SUBMITTED" && onStatusChange && (
              <div className="flex gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onStatusChange(entry.id, "APPROVED")}
                >
                  <Check />
                  Approve
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onStatusChange(entry.id, "RETURNED")}
                >
                  <Undo2 />
                  Return
                </Button>
              </div>
            )}
          </div>
        </div>
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
  const { role, clubId } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"

  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [filterClubId, setFilterClubId] = useState<string>(clubId || "")
  const [filterDivisionId, setFilterDivisionId] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [filterEntryType, setFilterEntryType] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped")
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set())

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  })

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

  const filters: EntryFilters = {
    eventId: selectedEventId,
    clubId: isAdmin ? filterClubId || undefined : clubId || undefined,
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

  const handleStatusChange = async (entryId: string, newStatus: StatusKey) => {
    try {
      await EntryService.updateStatus(entryId, newStatus)
      queryClient.invalidateQueries({ queryKey: ["entries"] })
      toast.success("Entry status updated")
    } catch (e) {
      showApiError(e, "Failed to update status")
    }
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
      <AppShell title="Entries">
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

  return (
    <AppShell title="Entries">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
          ALL ENTRIES
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage competition entries across all events.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent>
          <Label htmlFor="event-select" className="mb-1.5">Select event</Label>
          <Select
            value={selectedEventId || "none"}
            onValueChange={(v) => {
              setSelectedEventId(v === "none" ? "" : v)
              setFilterDivisionId("")
            }}
          >
            <SelectTrigger id="event-select" className="w-full">
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
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {(Object.keys(stats) as Array<keyof typeof stats>).map((key) => (
              <Card key={key}>
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
            ))}
          </div>

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

          {/* View toggle */}
          <div className="flex items-center justify-between mb-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grouped" | "table")}>
              <TabsList>
                <TabsTrigger value="grouped">Grouped</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
            {viewMode === "grouped" && (
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {expandedDivisions.size === divisions.length ? "Collapse all" : "Expand all"}
              </Button>
            )}
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
            <div className="space-y-3">
              {allDivisionsWithEntries.map(({ division, entries: divisionEntries }) => {
                const isExpanded = expandedDivisions.has(division.id)
                return (
                  <Card key={division.id}>
                    <button
                      type="button"
                      onClick={() => toggleDivision(division.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/40 transition-colors"
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
                              onStatusChange={handleStatusChange}
                              isAdmin={isAdmin}
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
            <div className="rounded-md border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead className="hidden md:table-cell">Division</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden xl:table-cell">Weight</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const isTeam =
                      entry.entryType === "TEAM_KATA" || entry.entryType === "TEAM_KUMITE"
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {isTeam && entry.team
                            ? entry.team.name
                            : entry.athlete
                            ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                            : "Unknown"}
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
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {entry.status === "SUBMITTED" && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(entry.id, "APPROVED")}
                                  aria-label="Approve"
                                >
                                  <Check />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(entry.id, "RETURNED")}
                                  aria-label="Return"
                                >
                                  <Undo2 />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

export default EntriesView
