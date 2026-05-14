import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Select } from "../components/Input";
import { SkeletonList } from "../components/UIState";
import { useToast, useApiErrorToast } from "../components/Toast";
import { DocumentSection } from "../components/DocumentSection";
import {
  listEvents,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  getWeightClasses,
  createWeightClass,
  updateWeightClass,
  deleteWeightClass,
  listTemplates,
  applyTemplate,
  type Event,
  type Division,
  type WeightClass,
  type EventStatus,
  type CreateEventDto,
  type CreateDivisionDto,
  type CreateWeightClassDto,
  type TemplateId,
} from "../lib/events";

type Tab = "events" | "divisions" | "weights";

const EVENT_STATUS_STYLES = {
  DRAFT: { bg: "bg-gray-600/30", text: "text-gray-300", label: "Draft" },
  ACTIVE: { bg: "bg-green-600/30", text: "text-green-300", label: "Active" },
  CLOSED: { bg: "bg-amber-600/30", text: "text-amber-300", label: "Closed" },
  ARCHIVED: { bg: "bg-gray-700/30", text: "text-gray-400", label: "Archived" },
};

const Events = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";

  const [activeTab, setActiveTab] = useState<Tab>("events");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [docsEventId, setDocsEventId] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [editingWeight, setEditingWeight] = useState<WeightClass | null>(null);

  // Template to apply after a new event is created (empty = none)
  const [templateForNewEvent, setTemplateForNewEvent] = useState<TemplateId | "">("");
  // Template selected in the standalone "Apply Template" modal
  const [templateToApply, setTemplateToApply] = useState<TemplateId | "">("");

  // Event form state
  const [eventForm, setEventForm] = useState<CreateEventDto>({
    name: "",
    venue: "",
    city: "",
    country: "",
    startDate: "",
    regOpen: "",
    regClose: "",
  });

  // Division form state
  const [divisionForm, setDivisionForm] = useState<CreateDivisionDto>({
    eventId: "",
    key: "",
    name: "",
    minAge: 0,
    maxAge: 0,
    gender: "Male",
    category: "KATA",
  });

  // Weight class form state
  const [weightForm, setWeightForm] = useState<CreateWeightClassDto>({
    eventId: "",
    gender: "Male",
    name: "",
    minKg: undefined,
    maxKg: undefined,
  });

  // Fetch events
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  // Fetch available templates (cached for the session — the list rarely changes)
  const { data: templates = [] } = useQuery({
    queryKey: ["eventTemplates"],
    queryFn: listTemplates,
    staleTime: 1000 * 60 * 60,
  });

  // Fetch divisions for selected event
  const { data: divisions = [], isLoading: loadingDivisions } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId && activeTab === "divisions",
  });

  // Fetch weight classes for selected event
  const { data: weightClasses = [], isLoading: loadingWeights } = useQuery({
    queryKey: ["weightClasses", selectedEventId],
    queryFn: () => getWeightClasses(selectedEventId),
    enabled: !!selectedEventId && activeTab === "weights",
  });

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowEventModal(false);
      resetEventForm();

      // If the user selected a template on the create form, apply it now.
      if (templateForNewEvent) {
        const chosen = templateForNewEvent;
        setTemplateForNewEvent("");
        try {
          const result = await applyTemplate(event.id, chosen);
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["divisions", event.id] });
          queryClient.invalidateQueries({ queryKey: ["weightClasses", event.id] });
          toast.success(`Event created. ${result.message}`);
        } catch (err) {
          toast.success("Event created");
          showApiError(err, "Event created, but template failed to apply");
        }
      } else {
        toast.success("Event created");
      }
    },
    onError: (error) => {
      showApiError(error, "Failed to create event");
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: ({ eventId, template }: { eventId: string; template: TemplateId }) =>
      applyTemplate(eventId, template),
    onSuccess: (result, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["divisions", eventId] });
      queryClient.invalidateQueries({ queryKey: ["weightClasses", eventId] });
      setShowTemplateModal(false);
      setTemplateToApply("");
      toast.success(result.message);
    },
    onError: (error) => {
      showApiError(error, "Failed to apply template");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventDto> }) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowEventModal(false);
      setEditingEvent(null);
      resetEventForm();
    },
    onError: (error) => {
      showApiError(error, "Failed to update event");
    },
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) => updateEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      showApiError(error, "Failed to update event status");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (selectedEventId === editingEvent?.id) {
        setSelectedEventId("");
      }
    },
    onError: (error) => {
      showApiError(error, "Failed to delete event");
    },
  });

  // Division mutations
  const createDivisionMutation = useMutation({
    mutationFn: createDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      setShowDivisionModal(false);
      resetDivisionForm();
    },
    onError: (error) => {
      showApiError(error, "Failed to create division");
    },
  });

  const updateDivisionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreateDivisionDto, "eventId">> }) =>
      updateDivision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      setShowDivisionModal(false);
      setEditingDivision(null);
      resetDivisionForm();
    },
    onError: (error) => {
      showApiError(error, "Failed to update division");
    },
  });

  const deleteDivisionMutation = useMutation({
    mutationFn: deleteDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
    onError: (error) => {
      showApiError(error, "Failed to delete division");
    },
  });

  // Weight class mutations
  const createWeightMutation = useMutation({
    mutationFn: createWeightClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightClasses"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      setShowWeightModal(false);
      resetWeightForm();
    },
    onError: (error) => {
      showApiError(error, "Failed to create weight class");
    },
  });

  const updateWeightMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreateWeightClassDto, "eventId">> }) =>
      updateWeightClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightClasses"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      setShowWeightModal(false);
      setEditingWeight(null);
      resetWeightForm();
    },
    onError: (error) => {
      showApiError(error, "Failed to update weight class");
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: deleteWeightClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightClasses"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
    onError: (error) => {
      showApiError(error, "Failed to delete weight class");
    },
  });

  // Form handlers
  const resetEventForm = () => {
    setEventForm({
      name: "",
      venue: "",
      city: "",
      country: "",
      startDate: "",
      regOpen: "",
      regClose: "",
    });
  };

  const resetDivisionForm = () => {
    setDivisionForm({
      eventId: selectedEventId,
      key: "",
      name: "",
      minAge: 0,
      maxAge: 0,
      gender: "Male",
      category: "KATA",
    });
  };

  const resetWeightForm = () => {
    setWeightForm({
      eventId: selectedEventId,
      gender: "Male",
      name: "",
      minKg: undefined,
      maxKg: undefined,
    });
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    resetEventForm();
    setTemplateForNewEvent("");
    setShowEventModal(true);
  };

  const handleApplyTemplate = () => {
    if (!selectedEventId || !templateToApply) return;
    applyTemplateMutation.mutate({ eventId: selectedEventId, template: templateToApply });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      venue: event.venue,
      city: event.city,
      country: event.country,
      startDate: event.startDate.split("T")[0],
      regOpen: event.regOpen.split("T")[0],
      regClose: event.regClose.split("T")[0],
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: eventForm });
    } else {
      createEventMutation.mutate(eventForm);
    }
  };

  const handleDeleteEvent = (event: Event) => {
    if (confirm(`Delete event "${event.name}"? This cannot be undone.`)) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const handleCreateDivision = () => {
    setEditingDivision(null);
    resetDivisionForm();
    setShowDivisionModal(true);
  };

  const handleEditDivision = (division: Division) => {
    setEditingDivision(division);
    setDivisionForm({
      eventId: division.eventId,
      key: division.key,
      name: division.name,
      minAge: division.minAge,
      maxAge: division.maxAge,
      gender: division.gender,
      category: division.category,
      notes: division.notes || undefined,
    });
    setShowDivisionModal(true);
  };

  const handleSaveDivision = () => {
    const data = { ...divisionForm, eventId: selectedEventId };
    if (editingDivision) {
      const { eventId, ...updateData } = data;
      updateDivisionMutation.mutate({ id: editingDivision.id, data: updateData });
    } else {
      createDivisionMutation.mutate(data);
    }
  };

  const handleDeleteDivision = (division: Division) => {
    if (confirm(`Delete division "${division.name}"? This cannot be undone.`)) {
      deleteDivisionMutation.mutate(division.id);
    }
  };

  const handleCreateWeight = () => {
    setEditingWeight(null);
    resetWeightForm();
    setShowWeightModal(true);
  };

  const handleEditWeight = (weight: WeightClass) => {
    setEditingWeight(weight);
    setWeightForm({
      eventId: weight.eventId,
      divisionId: weight.divisionId || undefined,
      gender: weight.gender,
      name: weight.name,
      minKg: weight.minKg || undefined,
      maxKg: weight.maxKg || undefined,
    });
    setShowWeightModal(true);
  };

  const handleSaveWeight = () => {
    const data = { ...weightForm, eventId: selectedEventId };
    if (editingWeight) {
      const { eventId, ...updateData } = data;
      updateWeightMutation.mutate({ id: editingWeight.id, data: updateData });
    } else {
      createWeightMutation.mutate(data);
    }
  };

  const handleDeleteWeight = (weight: WeightClass) => {
    if (confirm(`Delete weight class "${weight.name}"? This cannot be undone.`)) {
      deleteWeightMutation.mutate(weight.id);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Event Administration</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
          <p className="text-sm text-gray-400">You do not have permission to manage events.</p>
        </div>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Event Administration</h1>
          <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 rounded-lg mb-6">
          <div className="flex border-b border-gray-800">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "events"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Events
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "divisions"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("divisions")}
              disabled={!selectedEventId}
            >
              Divisions {selectedEvent && `(${selectedEvent.name})`}
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "weights"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("weights")}
              disabled={!selectedEventId}
            >
              Weight Classes {selectedEvent && `(${selectedEvent.name})`}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Events Tab */}
            {activeTab === "events" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Events</h2>
                  <button
                    onClick={handleCreateEvent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                  >
                    Create Event
                  </button>
                </div>

                {loadingEvents ? (
                  <SkeletonList count={3} />
                ) : events.length === 0 ? (
                  <p className="text-sm text-gray-400">No events found. Create your first event!</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded border ${
                          selectedEventId === event.id ? "border-blue-500 bg-blue-900/10" : "border-gray-700 bg-gray-800"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-lg">{event.name}</h3>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${EVENT_STATUS_STYLES[event.status].bg} ${EVENT_STATUS_STYLES[event.status].text}`}
                              >
                                {EVENT_STATUS_STYLES[event.status].label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {event.venue}, {event.city}, {event.country}
                            </p>
                            <p className="text-sm text-gray-400">
                              Start Date: {new Date(event.startDate).toLocaleDateString()}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>Divisions: {event._count?.divisions || 0}</span>
                              <span>Weight Classes: {event._count?.weightClasses || 0}</span>
                              <span>Entries: {event._count?.entries || 0}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedEventId(event.id);
                                setActiveTab("divisions");
                              }}
                              className="px-3 py-1 bg-green-600/80 hover:bg-green-600 rounded text-xs"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => setDocsEventId(docsEventId === event.id ? null : event.id)}
                              className="px-3 py-1 bg-cyan-600/80 hover:bg-cyan-600 rounded text-xs"
                            >
                              Docs
                            </button>
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              className="px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                          <label className="text-xs text-gray-400">Status:</label>
                          <Select
                            value={event.status}
                            onChange={(e) => updateEventStatusMutation.mutate({ id: event.id, status: e.target.value as EventStatus })}
                            className="text-xs py-1"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="ACTIVE">Active (Open for Entries)</option>
                            <option value="CLOSED">Closed (Entries Locked)</option>
                            <option value="ARCHIVED">Archived</option>
                          </Select>
                          <span className="text-xs text-gray-500">
                            {event.status === "ACTIVE" ? "✓ Available for entries" :
                             event.status === "DRAFT" ? "Available for entries" :
                             "Not available for entries"}
                          </span>
                        </div>
                        {docsEventId === event.id && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <DocumentSection
                              entityFilter={{ eventId: event.id }}
                              canUpload={isAdmin}
                              canDelete={isAdmin}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Divisions Tab */}
            {activeTab === "divisions" && selectedEventId && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Divisions for {selectedEvent?.name}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTemplateToApply("");
                        setShowTemplateModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium"
                    >
                      Apply Template
                    </button>
                    <button
                      onClick={handleCreateDivision}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                    >
                      Add Division
                    </button>
                  </div>
                </div>

                {loadingDivisions ? (
                  <SkeletonList count={3} />
                ) : divisions.length === 0 ? (
                  <p className="text-sm text-gray-400">No divisions found. Add your first division!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {divisions.map((division) => (
                      <div key={division.id} className="p-4 rounded border border-gray-700 bg-gray-800">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{division.name}</h3>
                            <p className="text-sm text-gray-400">
                              {division.gender} • Ages {division.minAge}-{division.maxAge}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                division.category === 'KATA' ? 'bg-purple-600/30 text-purple-300' :
                                'bg-red-600/30 text-red-300'
                              }`}>
                                {division.category === 'KATA' ? 'Kata' : 'Kumite'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Key: {division.key}</p>
                            {division._count && (
                              <p className="text-xs text-gray-500">Entries: {division._count.entries}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDivision(division)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDivision(division)}
                              className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Weight Classes Tab */}
            {activeTab === "weights" && selectedEventId && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Weight Classes for {selectedEvent?.name}</h2>
                  <button
                    onClick={handleCreateWeight}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                  >
                    Add Weight Class
                  </button>
                </div>

                {loadingWeights ? (
                  <SkeletonList count={3} />
                ) : weightClasses.length === 0 ? (
                  <p className="text-sm text-gray-400">No weight classes found. Add your first weight class!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {weightClasses.map((weight) => (
                      <div key={weight.id} className="p-4 rounded border border-gray-700 bg-gray-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{weight.name}</h3>
                            <p className="text-sm text-gray-400">{weight.gender}</p>
                            <p className="text-xs text-gray-500">
                              {weight.minKg || "0"}kg - {weight.maxKg || "∞"}kg
                            </p>
                            {weight.division && (
                              <p className="text-xs text-gray-500 mt-1">Division: {weight.division.name}</p>
                            )}
                            {weight._count && (
                              <p className="text-xs text-gray-500">Entries: {weight._count.entries}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditWeight(weight)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteWeight(weight)}
                              className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">{editingEvent ? "Edit Event" : "Create Event"}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Event Name *</label>
                  <Input
                    value={eventForm.name}
                    onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                    placeholder="e.g., National Championships 2026"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Venue *</label>
                    <Input
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                      placeholder="e.g., Sports Complex"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">City *</label>
                    <Input
                      value={eventForm.city}
                      onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                      placeholder="e.g., London"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Country *</label>
                    <Input
                      value={eventForm.country}
                      onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })}
                      placeholder="e.g., UK"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Start Date *</label>
                    <Input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Registration Opens *</label>
                    <Input
                      type="date"
                      value={eventForm.regOpen}
                      onChange={(e) => setEventForm({ ...eventForm, regOpen: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Registration Closes *</label>
                    <Input
                      type="date"
                      value={eventForm.regClose}
                      onChange={(e) => setEventForm({ ...eventForm, regClose: e.target.value })}
                    />
                  </div>
                </div>

                {!editingEvent && (
                  <div className="pt-4 border-t border-gray-800">
                    <label className="block text-sm text-gray-400 mb-1">
                      Start from Template <span className="text-gray-500">(optional)</span>
                    </label>
                    <Select
                      value={templateForNewEvent}
                      onChange={(e) => setTemplateForNewEvent(e.target.value as TemplateId | "")}
                    >
                      <option value="">None — add divisions manually</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.divisionCount} divisions, {t.weightClassCount} weight classes)
                        </option>
                      ))}
                    </Select>
                    {templateForNewEvent && (
                      <p className="text-xs text-gray-500 mt-1">
                        {templates.find((t) => t.id === templateForNewEvent)?.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {editingEvent ? "Update Event" : "Create Event"}
                </button>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    resetEventForm();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Division Modal */}
        {showDivisionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-xl">
              <h2 className="text-xl font-semibold mb-4">
                {editingDivision ? "Edit Division" : "Add Division"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Division Key *</label>
                  <Input
                    value={divisionForm.key}
                    onChange={(e) => setDivisionForm({ ...divisionForm, key: e.target.value })}
                    placeholder="e.g., CADET"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Division Name *</label>
                  <Input
                    value={divisionForm.name}
                    onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
                    placeholder="e.g., Cadet (14-15)"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category *</label>
                    <Select
                      value={divisionForm.category}
                      onChange={(e) => setDivisionForm({ ...divisionForm, category: e.target.value as "KATA" | "KUMITE" })}
                    >
                      <option value="KATA">Kata</option>
                      <option value="KUMITE">Kumite</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Gender *</label>
                    <Select
                      value={divisionForm.gender}
                      onChange={(e) => setDivisionForm({ ...divisionForm, gender: e.target.value as "Male" | "Female" })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Age *</label>
                    <Input
                      type="number"
                      value={divisionForm.minAge}
                      onChange={(e) => setDivisionForm({ ...divisionForm, minAge: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Age *</label>
                    <Input
                      type="number"
                      value={divisionForm.maxAge}
                      onChange={(e) => setDivisionForm({ ...divisionForm, maxAge: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                  <Input
                    value={divisionForm.notes || ""}
                    onChange={(e) => setDivisionForm({ ...divisionForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveDivision}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                  disabled={createDivisionMutation.isPending || updateDivisionMutation.isPending}
                >
                  {editingDivision ? "Update Division" : "Add Division"}
                </button>
                <button
                  onClick={() => {
                    setShowDivisionModal(false);
                    setEditingDivision(null);
                    resetDivisionForm();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Apply Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-xl">
              <h2 className="text-xl font-semibold mb-2">Apply Division Template</h2>
              <p className="text-sm text-gray-400 mb-4">
                Populate {selectedEvent?.name} with divisions and weight classes from a preset.
                Existing divisions with matching keys are skipped, so you can safely re-apply or layer templates.
              </p>

              <div className="space-y-3">
                {templates.map((t) => (
                  <label
                    key={t.id}
                    className={`block p-3 rounded border cursor-pointer transition ${
                      templateToApply === t.id
                        ? "border-purple-500 bg-purple-900/20"
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="template"
                        value={t.id}
                        checked={templateToApply === t.id}
                        onChange={() => setTemplateToApply(t.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-sm text-gray-400">{t.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t.divisionCount} divisions · {t.weightClassCount} weight classes
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleApplyTemplate}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium disabled:opacity-50"
                  disabled={!templateToApply || applyTemplateMutation.isPending}
                >
                  {applyTemplateMutation.isPending ? "Applying..." : "Apply Template"}
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateToApply("");
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  disabled={applyTemplateMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weight Class Modal */}
        {showWeightModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-xl">
              <h2 className="text-xl font-semibold mb-4">
                {editingWeight ? "Edit Weight Class" : "Add Weight Class"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Weight Class Name *</label>
                  <Input
                    value={weightForm.name}
                    onChange={(e) => setWeightForm({ ...weightForm, name: e.target.value })}
                    placeholder="e.g., -57kg or 57-62kg"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Gender *</label>
                  <Select
                    value={weightForm.gender}
                    onChange={(e) => setWeightForm({ ...weightForm, gender: e.target.value as "Male" | "Female" })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={weightForm.minKg || ""}
                      onChange={(e) => setWeightForm({ ...weightForm, minKg: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={weightForm.maxKg || ""}
                      onChange={(e) => setWeightForm({ ...weightForm, maxKg: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Link to Division (Optional)</label>
                  <Select
                    value={weightForm.divisionId || ""}
                    onChange={(e) => setWeightForm({ ...weightForm, divisionId: e.target.value || undefined })}
                  >
                    <option value="">Not linked to a specific division</option>
                    {divisions
                      .filter((d) => d.gender === weightForm.gender)
                      .map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.name}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveWeight}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                  disabled={createWeightMutation.isPending || updateWeightMutation.isPending}
                >
                  {editingWeight ? "Update Weight Class" : "Add Weight Class"}
                </button>
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setEditingWeight(null);
                    resetWeightForm();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
