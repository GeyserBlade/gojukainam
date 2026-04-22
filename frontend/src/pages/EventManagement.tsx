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
import { EntryService } from "../lib/entries";
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

const DraggableAthleteCard: React.FC<{ athlete: EligibleAthlete }> = ({ athlete }) => {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={athlete.isEntered ? "" : "cursor-move"}>
      <AthleteCard athlete={athlete} />
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
    queryFn: async () => {
      console.log('=== FRONTEND: Fetching eligible athletes ===');
      console.log('Event ID:', selectedEventId);
      console.log('Division ID:', selectedDivisionId);
      console.log('Club ID:', filterClubId || 'none');
      const result = await getEligibleAthletes(selectedEventId, selectedDivisionId, filterClubId);
      console.log('Received athletes:', result.length);
      console.log('Athletes:', result);
      return result;
    },
    enabled: !!selectedEventId && !!selectedDivisionId,
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      console.log('=== CREATE ENTRY ===');
      console.log('filterClubId:', filterClubId);
      console.log('clubId:', clubId);

      const effectiveClubId = filterClubId || clubId;
      console.log('effectiveClubId:', effectiveClubId);

      if (!effectiveClubId) {
        console.error('No club ID available!');
        throw new Error("Club ID is required");
      }

      const entryData: any = {
        eventId: selectedEventId,
        clubId: effectiveClubId,
        divisionId: selectedDivisionId,
        entryType: entryType,
        athleteId: athleteId,
      };

      // Only individual kumite requires weight class
      if (entryType === "KUMITE" && selectedWeightClassId) {
        entryData.weightClassId = selectedWeightClassId;
      }

      console.log('Entry data:', entryData);
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

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('=== DRAG END ===');
    console.log('event.over:', event.over);
    console.log('event.over?.id:', event.over?.id);
    console.log('event.active.id:', event.active.id);

    setDraggedAthlete(null);

    if (event.over && event.over.id === "drop-zone") {
      const athleteId = event.active.id as string;
      const athlete = eligibleAthletes.find((a) => a.id === athleteId);

      console.log('Dropping athlete:', athlete);
      console.log('Is entered:', athlete?.isEntered);

      if (athlete && !athlete.isEntered) {
        console.log('Creating entry for athlete:', athleteId);
        createEntryMutation.mutate(athleteId);
      }
    } else {
      console.log('Drop zone not detected or wrong ID');
    }
  };

  // Handle mobile add entry
  const handleMobileAddEntry = (athleteId: string) => {
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

                    {/* Mobile View: Simple List */}
                    <div className="lg:hidden">
                      <div className="mb-4">
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
                          <p className="text-sm text-gray-500">
                            {filteredAthletes.filter(a => !a.isEntered).length} available • {filteredAthletes.filter(a => a.isEntered).length} already entered
                          </p>
                          {filteredAthletes.map((athlete) => (
                            <MobileAthleteCard
                              key={athlete.id}
                              athlete={athlete}
                              onAdd={() => handleMobileAddEntry(athlete.id)}
                              isAdding={createEntryMutation.isPending}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Desktop View: Drag and Drop Interface */}
                    <div className="hidden lg:grid grid-cols-2 gap-6">
                      {/* Left Panel: Eligible Athletes */}
                      <div className="bg-gray-900 rounded-xl p-4">
                        <div className="mb-4">
                          <h2 className="text-lg font-semibold mb-3">
                            Eligible Athletes
                            {(entryType === 'TEAM_KATA' || entryType === 'TEAM_KUMITE') && (
                              <span className="ml-2 text-xs text-yellow-400">(Individual entries for team division)</span>
                            )}
                          </h2>
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
                                <DraggableAthleteCard key={athlete.id} athlete={athlete} />
                              ))}
                            </SortableContext>
                          </div>
                        )}
                      </div>

                      {/* Right Panel: Drop Zone */}
                      <div className="bg-gray-900 rounded-xl p-4">
                        <h2 className="text-lg font-semibold mb-4">
                          Drop Athletes Here to Create Entry
                        </h2>

                        <DroppableZone>
                          <div
                            id="drop-zone"
                            className="border-2 border-dashed border-gray-700 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center text-center bg-gray-800/30"
                          >
                            {draggedAthlete ? (
                              <>
                                <p className="text-blue-400 mb-2">Drop to create entry for:</p>
                                <div className="w-full max-w-sm">
                                  <AthleteCard athlete={draggedAthlete} isDragging={true} />
                                </div>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-16 h-16 text-gray-600 mb-4"
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
                                <p className="text-gray-400">Drag and drop athletes here</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  Division: {selectedDivision?.name} • Type: {entryType}
                                  {entryType === "KUMITE" && selectedWeightClassId && (
                                    <span> • Weight: {selectedEvent?.weightClasses?.find((wc) => wc.id === selectedWeightClassId)?.name}</span>
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </DroppableZone>

                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300">
                          <p className="font-medium mb-1">How to use:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Athletes shown on the left are eligible for the selected division</li>
                            <li>Drag an athlete card and drop it here to create an entry</li>
                            <li>Already entered athletes are grayed out</li>
                          </ul>
                        </div>
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
