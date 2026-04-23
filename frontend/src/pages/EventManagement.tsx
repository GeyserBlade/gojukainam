import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input, Select, ActionButton } from "../components/Input";
import { SkeletonList } from "../components/UIState";
import { useToast, useApiErrorToast } from "../components/Toast";
import {
  listEvents,
  getEvent,
  getDivisions,
  getEligibleAthletes,
  type Event,
  type Division,
  type EligibleAthlete,
} from "../lib/events";
import { EntryService, type Entry } from "../lib/entries";
import { listClubs, type Club } from "../lib/clubs";

// ============ Mobile Athlete Card with Add Button ============

interface MobileAthleteCardProps {
  athlete: EligibleAthlete;
  onAdd: () => void;
  isAdding: boolean;
}

const MobileAthleteCard: React.FC<MobileAthleteCardProps> = ({ athlete, onAdd, isAdding }) => (
  <div className={`p-4 rounded-xl border border-gray-700 bg-gray-800/80 ${athlete.isEntered ? "opacity-50" : ""}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base text-gray-100">
          {athlete.firstName} {athlete.lastName}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {athlete.club.name}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
          <span>Age: {athlete.age}</span>
          <span>{athlete.belt.name || "No Belt"}</span>
          {athlete.weightKg && <span>{athlete.weightKg}kg</span>}
        </div>
      </div>
      <div className="flex-shrink-0">
        {athlete.isEntered ? (
          <span className="inline-flex items-center text-xs bg-green-900/30 text-green-400 px-3 py-2 rounded-lg">
            Entered
          </span>
        ) : (
          <ActionButton
            variant="primary"
            onClick={onAdd}
            disabled={isAdding}
          >
            {isAdding ? "..." : "+ Add"}
          </ActionButton>
        )}
      </div>
    </div>
  </div>
);

// ============ Desktop Draggable Athlete Card ============

interface AthleteCardProps {
  athlete: EligibleAthlete;
  isDragging?: boolean;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, isDragging = false }) => (
  <div
    className={`p-3 rounded border ${
      isDragging ? "border-blue-400 bg-blue-900/20" : "border-gray-700 bg-gray-800"
    } ${athlete.isEntered ? "opacity-50" : ""}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium text-sm">
          {athlete.firstName} {athlete.lastName}
        </p>
        <p className="text-xs text-gray-400">
          {athlete.club.name} • {athlete.belt.name || "No Belt"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">Age: {athlete.age}</p>
        {athlete.weightKg && (
          <p className="text-xs text-gray-400">{athlete.weightKg}kg</p>
        )}
      </div>
    </div>
    {athlete.isEntered && (
      <span className="inline-block mt-1 text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
        Already Entered
      </span>
    )}
  </div>
);

interface DraggableAthleteCardProps {
  athlete: EligibleAthlete;
  onAdd: () => void;
  isAdding: boolean;
}

const DraggableAthleteCard: React.FC<DraggableAthleteCardProps> = ({ athlete, onAdd, isAdding }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: athlete.id,
    disabled: athlete.isEntered,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-2 ${athlete.isEntered ? "opacity-60" : ""}`}
    >
      {/* Drag handle — listeners attached here only so the Add button stays clickable */}
      <div
        {...attributes}
        {...listeners}
        className={`flex-1 min-w-0 ${athlete.isEntered ? "" : "cursor-move"}`}
      >
        <AthleteCard athlete={athlete} />
      </div>
      {!athlete.isEntered && (
        <button
          type="button"
          onClick={onAdd}
          disabled={isAdding}
          className="flex-shrink-0 px-3 rounded-md text-sm font-semibold bg-cyan-600/80 hover:bg-cyan-600 text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={`Add ${athlete.firstName} ${athlete.lastName}`}
        >
          {isAdding ? "…" : "+ Add"}
        </button>
      )}
    </div>
  );
};

// ============ Entered Entry Card ============

interface EnteredEntryCardProps {
  entry: Entry;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const EnteredEntryCard: React.FC<EnteredEntryCardProps> = ({ entry, onDelete, isDeleting }) => {
  const name = entry.athlete
    ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
    : entry.team?.name || "—";
  const clubName = entry.athlete?.club.name || entry.club.name;
  const beltName = entry.athlete?.belt?.name;

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-gray-600/30 text-gray-300",
    SUBMITTED: "bg-blue-600/30 text-blue-300",
    APPROVED: "bg-green-600/30 text-green-300",
    RETURNED: "bg-amber-600/30 text-amber-300",
  };

  const canDelete = entry.status === "DRAFT" && !!onDelete;

  return (
    <div className="p-3 rounded-lg border border-green-800/40 bg-green-900/10">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-100 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">
            {clubName}
            {beltName && ` • ${beltName}`}
            {entry.weightClass && ` • ${entry.weightClass.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded ${statusStyles[entry.status] || statusStyles.DRAFT}`}>
            {entry.status}
          </span>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-800/40 text-red-300 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={`Remove ${name}`}
              title="Remove this draft entry"
            >
              {isDeleting ? "…" : "Remove"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ Droppable Zone Component ============

const DroppableZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNodeRef } = useDroppable({
    id: "drop-zone",
  });

  return <div ref={setNodeRef}>{children}</div>;
};

// ============ Main Event Management Component ============

const EventManagement = () => {
  const { role, clubId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
  const [filterClubId, setFilterClubId] = useState<string>(clubId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [entryType, setEntryType] = useState<"KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE">("KATA");
  const [selectedWeightClassId, setSelectedWeightClassId] = useState<string>("");
  const [draggedAthlete, setDraggedAthlete] = useState<EligibleAthlete | null>(null);

  // Fetch only active events for entry creation
  const { data: events = [] } = useQuery({
    queryKey: ["events", "active"],
    queryFn: () => listEvents(true),
  });

  // Fetch clubs for filtering
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: listClubs,
    enabled: isAdmin,
  });

  // Fetch selected event details
  const { data: selectedEvent } = useQuery({
    queryKey: ["event", selectedEventId],
    queryFn: () => getEvent(selectedEventId),
    enabled: !!selectedEventId,
  });

  // Fetch divisions for selected event
  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId,
  });

  // Fetch eligible athletes for selected division
  const { data: eligibleAthletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ["eligibleAthletes", selectedEventId, selectedDivisionId, filterClubId],
    queryFn: () => getEligibleAthletes(selectedEventId, selectedDivisionId, filterClubId),
    enabled: !!selectedEventId && !!selectedDivisionId,
  });

  // Fetch current entries for the selected event + division (scoped to club if filtered).
  // Non-admins get auto-scoped to their own club by the backend.
  const { data: currentEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["entries", selectedEventId, selectedDivisionId, filterClubId],
    queryFn: () =>
      EntryService.list({
        eventId: selectedEventId,
        divisionId: selectedDivisionId,
        ...(filterClubId ? { clubId: filterClubId } : {}),
      }),
    enabled: !!selectedEventId && !!selectedDivisionId,
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      const effectiveClubId = filterClubId || clubId;
      if (!effectiveClubId) {
        throw new Error("Club ID is required");
      }

      const entryData: any = {
        eventId: selectedEventId,
        clubId: effectiveClubId,
        divisionId: selectedDivisionId,
        entryType,
        athleteId,
      };

      // Only individual kumite requires a weight class
      if (entryType === "KUMITE" && selectedWeightClassId) {
        entryData.weightClassId = selectedWeightClassId;
      }

      return EntryService.create(entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eligibleAthletes"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry created");
    },
    onError: (error) => {
      showApiError(error, "Failed to create entry");
    },
  });

  // Filter athletes by search query
  const filteredAthletes = eligibleAthletes.filter((athlete) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      athlete.club.name.toLowerCase().includes(query) ||
      (athlete.belt.name || "").toLowerCase().includes(query)
    );
  });

  const selectedDivision = divisions.find((d) => d.id === selectedDivisionId);

  const handleDragStart = (event: DragStartEvent) => {
    const athlete = eligibleAthletes.find((a) => a.id === event.active.id);
    setDraggedAthlete(athlete || null);
  };

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => EntryService.delete(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["eligibleAthletes"] });
      toast.success("Entry removed");
    },
    onError: (error) => {
      showApiError(error, "Failed to remove entry");
    },
  });

  const handleDeleteEntry = (entry: Entry) => {
    const label = entry.athlete
      ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
      : entry.team?.name || "this entry";
    if (confirm(`Remove ${label} from this division?`)) {
      deleteEntryMutation.mutate(entry.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedAthlete(null);

    if (event.over?.id === "drop-zone") {
      const athleteId = event.active.id as string;
      const athlete = eligibleAthletes.find((a) => a.id === athleteId);
      if (athlete && !athlete.isEntered) {
        createEntryMutation.mutate(athleteId);
      }
    }
  };

  const handleAddEntry = (athleteId: string) => {
    const athlete = eligibleAthletes.find((a) => a.id === athleteId);
    if (athlete && !athlete.isEntered) {
      createEntryMutation.mutate(athleteId);
    }
  };

  if (!isAdmin && !clubId) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold">Entry Management</h1>
            <button className="px-3 py-2 text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          </div>
        </header>
        <main className="p-4">
          <p className="text-sm text-gray-400">You do not have permission to access this page.</p>
        </main>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold">Entry Management</h1>
            <button className="px-3 py-2 text-sm text-gray-400 hover:text-white active:text-gray-300" onClick={() => navigate("/dashboard")}>
              Back
            </button>
          </div>
        </header>

        <main className="p-4 pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Event Selection */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Event</label>
                  <Select value={selectedEventId} onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setSelectedDivisionId("");
                  }}>
                    <option value="">-- Select Event --</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {new Date(event.startDate).toLocaleDateString()}
                      </option>
                    ))}
                  </Select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Filter by Club (Optional)</label>
                    <Select value={filterClubId} onChange={(e) => setFilterClubId(e.target.value)}>
                      <option value="">All Clubs</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {selectedEventId && (
              <>
                {/* Division and Entry Type Selection */}
                <div className="bg-gray-900 rounded-xl p-4 mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Select Division</label>
                      <Select
                        value={selectedDivisionId}
                        onChange={(e) => {
                          setSelectedDivisionId(e.target.value);
                          setSelectedWeightClassId("");
                          const div = divisions.find(d => d.id === e.target.value);
                          if (div) {
                            if (div.category === 'KATA') {
                              setEntryType('KATA');
                            } else if (div.category === 'KUMITE') {
                              setEntryType('KUMITE');
                            }
                          }
                        }}
                      >
                        <option value="">-- Select Division --</option>
                        {divisions.map((division) => {
                          const categoryLabel = division.category === 'KATA' ? 'Kata' : 'Kumite';
                          return (
                            <option key={division.id} value={division.id}>
                              {division.name} ({categoryLabel})
                            </option>
                          );
                        })}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Entry Type</label>
                      <Select
                        value={entryType}
                        onChange={(e) => setEntryType(e.target.value as "KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE")}
                        disabled={!selectedDivisionId}
                      >
                        {!selectedDivision ? (
                          <option value="">Select division first</option>
                        ) : (
                          <>
                            {selectedDivision.category === 'KATA' && (
                              <>
                                <option value="KATA">Kata (Individual)</option>
                                <option value="TEAM_KATA">Kata (Team)</option>
                              </>
                            )}
                            {selectedDivision.category === 'KUMITE' && (
                              <>
                                <option value="KUMITE">Kumite (Individual)</option>
                                <option value="TEAM_KUMITE">Kumite (Team)</option>
                              </>
                            )}
                          </>
                        )}
                      </Select>
                    </div>

                    {entryType === "KUMITE" && selectedEvent && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Weight Class</label>
                        <Select value={selectedWeightClassId} onChange={(e) => setSelectedWeightClassId(e.target.value)}>
                          <option value="">-- Select Weight Class --</option>
                          {(selectedEvent.weightClasses || [])
                            .filter(
                              (wc) =>
                                wc.gender === selectedDivision?.gender &&
                                (!wc.divisionId || wc.divisionId === selectedDivisionId)
                            )
                            .map((wc) => (
                              <option key={wc.id} value={wc.id}>
                                {wc.name}
                              </option>
                            ))}
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile: Simple list with add buttons */}
                {selectedDivisionId && (
                  <>
                    {/* Current selection summary */}
                    <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-cyan-300">
                        <strong>Adding entries to:</strong> {selectedDivision?.name} •{' '}
                        {entryType === 'KATA' ? 'Kata (Individual)' :
                         entryType === 'KUMITE' ? 'Kumite (Individual)' :
                         entryType === 'TEAM_KATA' ? 'Kata (Team)' :
                         'Kumite (Team)'}
                        {entryType === "KUMITE" && selectedWeightClassId && (
                          <> • {selectedEvent?.weightClasses?.find((wc) => wc.id === selectedWeightClassId)?.name}</>
                        )}
                      </p>
                    </div>

                    {/* Mobile View: Stacked lists with Add buttons */}
                    <div className="lg:hidden space-y-6">
                      <section>
                        <div className="flex items-baseline justify-between mb-3">
                          <h2 className="text-lg font-semibold">Eligible Athletes</h2>
                          <span className="text-xs text-gray-500">
                            {filteredAthletes.filter(a => !a.isEntered).length} available
                          </span>
                        </div>
                        <div className="mb-3">
                          <Input
                            type="text"
                            placeholder="Search athletes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        {loadingAthletes ? (
                          <SkeletonList count={4} />
                        ) : filteredAthletes.length === 0 ? (
                          <p className="text-sm text-gray-400 py-8 text-center">No eligible athletes found</p>
                        ) : (
                          <div className="space-y-3">
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
                          <h2 className="text-lg font-semibold">Current Entries</h2>
                          <span className="text-xs text-gray-500">{currentEntries.length}</span>
                        </div>
                        {loadingEntries ? (
                          <SkeletonList count={2} />
                        ) : currentEntries.length === 0 ? (
                          <p className="text-sm text-gray-500 py-6 text-center border border-dashed border-gray-700 rounded-lg">
                            No entries yet. Tap <span className="text-cyan-400 font-medium">+ Add</span> on an eligible athlete above.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {currentEntries.map((entry) => (
                              <EnteredEntryCard
                                key={entry.id}
                                entry={entry}
                                onDelete={() => handleDeleteEntry(entry)}
                                isDeleting={deleteEntryMutation.isPending && deleteEntryMutation.variables === entry.id}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    </div>

                    {/* Desktop View: Two-panel with drag-and-drop AND Add buttons */}
                    <div className="hidden lg:grid grid-cols-2 gap-6">
                      {/* Left Panel: Eligible Athletes */}
                      <div className="bg-gray-900 rounded-xl p-4">
                        <div className="mb-4">
                          <div className="flex items-baseline justify-between mb-3">
                            <h2 className="text-lg font-semibold">
                              Eligible Athletes
                              {(entryType === 'TEAM_KATA' || entryType === 'TEAM_KUMITE') && (
                                <span className="ml-2 text-xs text-yellow-400">(Individual entries for team division)</span>
                              )}
                            </h2>
                            <span className="text-xs text-gray-500">
                              {filteredAthletes.filter(a => !a.isEntered).length} available
                            </span>
                          </div>
                          <Input
                            type="text"
                            placeholder="Search athletes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        {loadingAthletes ? (
                          <SkeletonList count={4} />
                        ) : filteredAthletes.length === 0 ? (
                          <p className="text-sm text-gray-400">No eligible athletes found</p>
                        ) : (
                          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                            <SortableContext items={filteredAthletes.map((a) => a.id)} strategy={verticalListSortingStrategy}>
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
                        <p className="mt-3 text-xs text-gray-500">
                          Click <span className="text-cyan-400 font-medium">+ Add</span> or drag a card onto the entries panel.
                        </p>
                      </div>

                      {/* Right Panel: Current Entries (also the drop target) */}
                      <div className="bg-gray-900 rounded-xl p-4">
                        <div className="flex items-baseline justify-between mb-4">
                          <h2 className="text-lg font-semibold">Current Entries</h2>
                          <span className="text-xs text-gray-500">{currentEntries.length} entered</span>
                        </div>

                        <DroppableZone>
                          <div
                            id="drop-zone"
                            className={`rounded-lg p-4 min-h-[400px] transition-colors ${
                              draggedAthlete
                                ? "border-2 border-dashed border-cyan-500 bg-cyan-900/10"
                                : "border-2 border-dashed border-gray-700 bg-gray-800/30"
                            }`}
                          >
                            {draggedAthlete && (
                              <div className="mb-4 p-3 rounded-md bg-cyan-900/20 border border-cyan-700/50">
                                <p className="text-sm text-cyan-300 mb-2">Drop to enter:</p>
                                <AthleteCard athlete={draggedAthlete} isDragging={true} />
                              </div>
                            )}

                            {loadingEntries ? (
                              <SkeletonList count={3} />
                            ) : currentEntries.length === 0 ? (
                              <div className="flex flex-col items-center justify-center text-center py-12">
                                <svg
                                  className="w-14 h-14 text-gray-600 mb-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <p className="text-gray-400">No entries yet</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Drag an athlete here or click <span className="text-cyan-400 font-medium">+ Add</span>
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {currentEntries.map((entry) => (
                                  <EnteredEntryCard key={entry.id} entry={entry} />
                                ))}
                              </div>
                            )}
                          </div>
                        </DroppableZone>

                        <p className="mt-3 text-xs text-gray-500">
                          Showing entries for this division{filterClubId ? " (filtered by club)" : ""}.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <DragOverlay>
        {draggedAthlete ? (
          <div className="rotate-3 scale-105">
            <AthleteCard athlete={draggedAthlete} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default EventManagement;
