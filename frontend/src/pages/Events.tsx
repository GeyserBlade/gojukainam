import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  FileText,
  Layers,
  MoreHorizontal,
  PlusCircle,
  Scale,
  Sparkles,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { DocumentSection } from "@/components/DocumentSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
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
} from "@/lib/events"

type Tab = "events" | "divisions" | "weights"

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-belt-green/15 text-belt-green border-belt-green/30",
  CLOSED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  ARCHIVED: "bg-muted/60 text-muted-foreground/70 border-border",
}

const CATEGORY_STYLES = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
}

const EventsAdmin = () => {
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"

  const [activeTab, setActiveTab] = useState<Tab>("events")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [docsEvent, setDocsEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showDivisionModal, setShowDivisionModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [editingWeight, setEditingWeight] = useState<WeightClass | null>(null)

  const [templateForNewEvent, setTemplateForNewEvent] = useState<TemplateId | "">("")
  const [templateToApply, setTemplateToApply] = useState<TemplateId | "">("")

  const [eventForm, setEventForm] = useState<CreateEventDto>({
    name: "",
    venue: "",
    city: "",
    country: "",
    startDate: "",
    regOpen: "",
    regClose: "",
  })

  const [divisionForm, setDivisionForm] = useState<CreateDivisionDto>({
    eventId: "",
    key: "",
    name: "",
    minAge: 0,
    maxAge: 0,
    gender: "Male",
    category: "KATA",
  })

  const [weightForm, setWeightForm] = useState<CreateWeightClassDto>({
    eventId: "",
    gender: "Male",
    name: "",
    minKg: undefined,
    maxKg: undefined,
  })

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  })

  const { data: templates = [] } = useQuery({
    queryKey: ["eventTemplates"],
    queryFn: listTemplates,
    staleTime: 1000 * 60 * 60,
  })

  const { data: divisions = [], isLoading: loadingDivisions } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId && activeTab === "divisions",
  })

  const { data: weightClasses = [], isLoading: loadingWeights } = useQuery({
    queryKey: ["weightClasses", selectedEventId],
    queryFn: () => getWeightClasses(selectedEventId),
    enabled: !!selectedEventId && activeTab === "weights",
  })

  const resetEventForm = () =>
    setEventForm({
      name: "",
      venue: "",
      city: "",
      country: "",
      startDate: "",
      regOpen: "",
      regClose: "",
    })

  const resetDivisionForm = () =>
    setDivisionForm({
      eventId: selectedEventId,
      key: "",
      name: "",
      minAge: 0,
      maxAge: 0,
      gender: "Male",
      category: "KATA",
    })

  const resetWeightForm = () =>
    setWeightForm({
      eventId: selectedEventId,
      gender: "Male",
      name: "",
      minKg: undefined,
      maxKg: undefined,
    })

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      setShowEventModal(false)
      resetEventForm()
      if (templateForNewEvent) {
        const chosen = templateForNewEvent
        setTemplateForNewEvent("")
        try {
          const result = await applyTemplate(event.id, chosen)
          queryClient.invalidateQueries({ queryKey: ["events"] })
          queryClient.invalidateQueries({ queryKey: ["divisions", event.id] })
          queryClient.invalidateQueries({ queryKey: ["weightClasses", event.id] })
          toast.success(`Event created. ${result.message}`)
        } catch (err) {
          toast.success("Event created")
          showApiError(err, "Event created, but template failed to apply")
        }
      } else {
        toast.success("Event created")
      }
    },
    onError: (e) => showApiError(e, "Failed to create event"),
  })

  const applyTemplateMutation = useMutation({
    mutationFn: ({ eventId, template }: { eventId: string; template: TemplateId }) =>
      applyTemplate(eventId, template),
    onSuccess: (result, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["divisions", eventId] })
      queryClient.invalidateQueries({ queryKey: ["weightClasses", eventId] })
      setShowTemplateModal(false)
      setTemplateToApply("")
      toast.success(result.message)
    },
    onError: (e) => showApiError(e, "Failed to apply template"),
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventDto> }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      setShowEventModal(false)
      setEditingEvent(null)
      resetEventForm()
      toast.success("Event updated")
    },
    onError: (e) => showApiError(e, "Failed to update event"),
  })

  const updateEventStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      updateEventStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    onError: (e) => showApiError(e, "Failed to update event status"),
  })

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      if (selectedEventId === editingEvent?.id) setSelectedEventId("")
      toast.success("Event deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete event"),
  })

  const createDivisionMutation = useMutation({
    mutationFn: createDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] })
      setShowDivisionModal(false)
      resetDivisionForm()
      toast.success("Division created")
    },
    onError: (e) => showApiError(e, "Failed to create division"),
  })

  const updateDivisionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<CreateDivisionDto, "eventId">>
    }) => updateDivision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] })
      setShowDivisionModal(false)
      setEditingDivision(null)
      resetDivisionForm()
      toast.success("Division updated")
    },
    onError: (e) => showApiError(e, "Failed to update division"),
  })

  const deleteDivisionMutation = useMutation({
    mutationFn: deleteDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] })
      toast.success("Division deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete division"),
  })

  const createWeightMutation = useMutation({
    mutationFn: createWeightClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightClasses"] })
      setShowWeightModal(false)
      resetWeightForm()
      toast.success("Weight class created")
    },
    onError: (e) => showApiError(e, "Failed to create weight class"),
  })

  const updateWeightMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<CreateWeightClassDto, "eventId">>
    }) => updateWeightClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightClasses"] })
      setShowWeightModal(false)
      setEditingWeight(null)
      resetWeightForm()
      toast.success("Weight class updated")
    },
    onError: (e) => showApiError(e, "Failed to update weight class"),
  })

  const deleteWeightMutation = useMutation({
    mutationFn: deleteWeightClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightClasses"] })
      toast.success("Weight class deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete weight class"),
  })

  const handleCreateEvent = () => {
    setEditingEvent(null)
    resetEventForm()
    setTemplateForNewEvent("")
    setShowEventModal(true)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      name: event.name,
      venue: event.venue,
      city: event.city,
      country: event.country,
      startDate: event.startDate.split("T")[0],
      regOpen: event.regOpen.split("T")[0],
      regClose: event.regClose.split("T")[0],
    })
    setShowEventModal(true)
  }

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: eventForm })
    } else {
      createEventMutation.mutate(eventForm)
    }
  }

  const handleDeleteEvent = async (event: Event) => {
    const ok = await confirm({
      title: `Delete event "${event.name}"?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) deleteEventMutation.mutate(event.id)
  }

  const handleCreateDivision = () => {
    setEditingDivision(null)
    resetDivisionForm()
    setShowDivisionModal(true)
  }

  const handleEditDivision = (division: Division) => {
    setEditingDivision(division)
    setDivisionForm({
      eventId: division.eventId,
      key: division.key,
      name: division.name,
      minAge: division.minAge,
      maxAge: division.maxAge,
      gender: division.gender,
      category: division.category,
      notes: division.notes || undefined,
    })
    setShowDivisionModal(true)
  }

  const handleSaveDivision = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...divisionForm, eventId: selectedEventId }
    if (editingDivision) {
      const { eventId: _ignored, ...updateData } = data
      void _ignored
      updateDivisionMutation.mutate({ id: editingDivision.id, data: updateData })
    } else {
      createDivisionMutation.mutate(data)
    }
  }

  const handleDeleteDivision = async (division: Division) => {
    const ok = await confirm({
      title: `Delete division "${division.name}"?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) deleteDivisionMutation.mutate(division.id)
  }

  const handleCreateWeight = () => {
    setEditingWeight(null)
    resetWeightForm()
    setShowWeightModal(true)
  }

  const handleEditWeight = (weight: WeightClass) => {
    setEditingWeight(weight)
    setWeightForm({
      eventId: weight.eventId,
      divisionId: weight.divisionId || undefined,
      gender: weight.gender,
      name: weight.name,
      minKg: weight.minKg || undefined,
      maxKg: weight.maxKg || undefined,
    })
    setShowWeightModal(true)
  }

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...weightForm, eventId: selectedEventId }
    if (editingWeight) {
      const { eventId: _ignored, ...updateData } = data
      void _ignored
      updateWeightMutation.mutate({ id: editingWeight.id, data: updateData })
    } else {
      createWeightMutation.mutate(data)
    }
  }

  const handleDeleteWeight = async (weight: WeightClass) => {
    const ok = await confirm({
      title: `Delete weight class "${weight.name}"?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) deleteWeightMutation.mutate(weight.id)
  }

  if (!isAdmin) {
    return (
      <AppShell title="Event admin">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage events.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <AppShell title="Event admin">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
          EVENT ADMIN
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {events.length} event{events.length === 1 ? "" : "s"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="events">
            <CalendarDays className="size-4 sm:hidden" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="divisions" disabled={!selectedEventId}>
            <Layers className="size-4 sm:hidden" />
            <span className="hidden sm:inline">
              Divisions{selectedEvent ? ` (${selectedEvent.name})` : ""}
            </span>
          </TabsTrigger>
          <TabsTrigger value="weights" disabled={!selectedEventId}>
            <Scale className="size-4 sm:hidden" />
            <span className="hidden sm:inline">
              Weights{selectedEvent ? ` (${selectedEvent.name})` : ""}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Events tab */}
        <TabsContent value="events" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={handleCreateEvent}>
              <PlusCircle />
              Create event
            </Button>
          </div>

          {loadingEvents && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}

          {!loadingEvents && events.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No events yet. Create your first event.
              </CardContent>
            </Card>
          )}

          {!loadingEvents &&
            events.map((event) => (
              <Card
                key={event.id}
                className={cn(
                  selectedEventId === event.id && "border-primary/40",
                )}
              >
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lg">{event.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn("font-normal text-[10px]", STATUS_STYLES[event.status])}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Starts {new Date(event.startDate).toLocaleDateString()}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Divisions: {event._count?.divisions ?? 0}</span>
                        <span>Weights: {event._count?.weightClasses ?? 0}</span>
                        <span>Entries: {event._count?.entries ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEventId(event.id)
                          setActiveTab("divisions")
                        }}
                      >
                        Manage
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Actions">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditEvent(event)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDocsEvent(event)}>
                            <FileText />
                            Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => handleDeleteEvent(event)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground shrink-0">Status:</Label>
                    <Select
                      value={event.status}
                      onValueChange={(v) =>
                        updateEventStatusMutation.mutate({
                          id: event.id,
                          status: v as EventStatus,
                        })
                      }
                    >
                      <SelectTrigger size="sm" className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* Divisions tab */}
        <TabsContent value="divisions" className="space-y-3">
          {selectedEventId && (
            <>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Divisions for {selectedEvent?.name}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTemplateToApply("")
                      setShowTemplateModal(true)
                    }}
                  >
                    <Sparkles />
                    Apply template
                  </Button>
                  <Button onClick={handleCreateDivision}>
                    <PlusCircle />
                    Add division
                  </Button>
                </div>
              </div>

              {loadingDivisions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              )}

              {!loadingDivisions && divisions.length === 0 && (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No divisions yet. Add one or apply a template.
                  </CardContent>
                </Card>
              )}

              {!loadingDivisions && divisions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {divisions.map((division) => (
                    <Card key={division.id}>
                      <CardContent>
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium">{division.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {division.gender} · Ages {division.minAge}-{division.maxAge}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-normal text-[10px]",
                                  CATEGORY_STYLES[division.category],
                                )}
                              >
                                {division.category}
                              </Badge>
                              <Badge variant="outline" className="font-normal text-[10px]">
                                {division.key}
                              </Badge>
                            </div>
                            {division._count && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Entries: {division._count.entries}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEditDivision(division)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => handleDeleteDivision(division)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Weights tab */}
        <TabsContent value="weights" className="space-y-3">
          {selectedEventId && (
            <>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Weight classes for {selectedEvent?.name}
                </h2>
                <Button onClick={handleCreateWeight}>
                  <PlusCircle />
                  Add weight class
                </Button>
              </div>

              {loadingWeights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              )}

              {!loadingWeights && weightClasses.length === 0 && (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No weight classes yet.
                  </CardContent>
                </Card>
              )}

              {!loadingWeights && weightClasses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {weightClasses.map((weight) => (
                    <Card key={weight.id}>
                      <CardContent>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium">{weight.name}</h3>
                            <p className="text-sm text-muted-foreground">{weight.gender}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {weight.minKg ?? "0"}kg – {weight.maxKg ?? "∞"}kg
                            </p>
                            {weight.division && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Division: {weight.division.name}
                              </p>
                            )}
                            {weight._count && (
                              <p className="text-xs text-muted-foreground">
                                Entries: {weight._count.entries}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEditWeight(weight)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => handleDeleteWeight(weight)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Event modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit event" : "Create event"}</DialogTitle>
            <DialogDescription>
              Set the event details. All fields with * are required.
            </DialogDescription>
          </DialogHeader>
          <form id="event-form" onSubmit={handleSaveEvent} className="space-y-4">
            <div>
              <Label htmlFor="ev-name" className="mb-1.5">
                Event name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ev-name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                placeholder="National Championships 2026"
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ev-venue" className="mb-1.5">
                  Venue <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-venue"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ev-city" className="mb-1.5">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-city"
                  value={eventForm.city}
                  onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ev-country" className="mb-1.5">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-country"
                  value={eventForm.country}
                  onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ev-start" className="mb-1.5">
                  Start date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-start"
                  type="date"
                  value={eventForm.startDate as string}
                  onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ev-regopen" className="mb-1.5">
                  Registration opens <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-regopen"
                  type="date"
                  value={eventForm.regOpen as string}
                  onChange={(e) => setEventForm({ ...eventForm, regOpen: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ev-regclose" className="mb-1.5">
                  Registration closes <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-regclose"
                  type="date"
                  value={eventForm.regClose as string}
                  onChange={(e) => setEventForm({ ...eventForm, regClose: e.target.value })}
                  required
                />
              </div>
            </div>
            {!editingEvent && (
              <div className="pt-3 border-t">
                <Label className="mb-1.5">Start from template (optional)</Label>
                <Select
                  value={templateForNewEvent || "none"}
                  onValueChange={(v) =>
                    setTemplateForNewEvent(v === "none" ? "" : (v as TemplateId))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — add divisions manually</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.divisionCount} divisions, {t.weightClassCount} weights)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateForNewEvent && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {templates.find((t) => t.id === templateForNewEvent)?.description}
                  </p>
                )}
              </div>
            )}
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEventModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="event-form"
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {editingEvent ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Division modal */}
      <Dialog open={showDivisionModal} onOpenChange={setShowDivisionModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingDivision ? "Edit division" : "Add division"}
            </DialogTitle>
          </DialogHeader>
          <form id="div-form" onSubmit={handleSaveDivision} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="div-key" className="mb-1.5">
                  Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="div-key"
                  value={divisionForm.key}
                  onChange={(e) => setDivisionForm({ ...divisionForm, key: e.target.value })}
                  placeholder="CADET"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="div-name" className="mb-1.5">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="div-name"
                  value={divisionForm.name}
                  onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
                  placeholder="Cadet (14-15)"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="div-category" className="mb-1.5">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={divisionForm.category}
                  onValueChange={(v) =>
                    setDivisionForm({ ...divisionForm, category: v as "KATA" | "KUMITE" })
                  }
                >
                  <SelectTrigger id="div-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KATA">Kata</SelectItem>
                    <SelectItem value="KUMITE">Kumite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="div-gender" className="mb-1.5">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={divisionForm.gender}
                  onValueChange={(v) =>
                    setDivisionForm({ ...divisionForm, gender: v as "Male" | "Female" })
                  }
                >
                  <SelectTrigger id="div-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="div-min" className="mb-1.5">
                  Min age <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="div-min"
                  type="number"
                  value={divisionForm.minAge}
                  onChange={(e) =>
                    setDivisionForm({ ...divisionForm, minAge: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="div-max" className="mb-1.5">
                  Max age <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="div-max"
                  type="number"
                  value={divisionForm.maxAge}
                  onChange={(e) =>
                    setDivisionForm({ ...divisionForm, maxAge: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="div-notes" className="mb-1.5">Notes</Label>
              <Input
                id="div-notes"
                value={divisionForm.notes || ""}
                onChange={(e) => setDivisionForm({ ...divisionForm, notes: e.target.value })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDivisionModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="div-form"
              disabled={createDivisionMutation.isPending || updateDivisionMutation.isPending}
            >
              {editingDivision ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply division template</DialogTitle>
            <DialogDescription>
              Populate {selectedEvent?.name} with divisions and weight classes from a preset.
              Existing divisions with matching keys are skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "block rounded-md border p-3 cursor-pointer transition-colors",
                  templateToApply === t.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-foreground/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={templateToApply === t.id}
                    onChange={() => setTemplateToApply(t.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight">{t.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.divisionCount} divisions · {t.weightClassCount} weights
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
              disabled={applyTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedEventId || !templateToApply) return
                applyTemplateMutation.mutate({
                  eventId: selectedEventId,
                  template: templateToApply,
                })
              }}
              disabled={!templateToApply || applyTemplateMutation.isPending}
            >
              {applyTemplateMutation.isPending ? "Applying..." : "Apply template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weight class modal */}
      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingWeight ? "Edit weight class" : "Add weight class"}
            </DialogTitle>
          </DialogHeader>
          <form id="wt-form" onSubmit={handleSaveWeight} className="space-y-4">
            <div>
              <Label htmlFor="wt-name" className="mb-1.5">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wt-name"
                value={weightForm.name}
                onChange={(e) => setWeightForm({ ...weightForm, name: e.target.value })}
                placeholder="e.g. -57kg or 57-62kg"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="wt-gender" className="mb-1.5">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={weightForm.gender}
                onValueChange={(v) =>
                  setWeightForm({ ...weightForm, gender: v as "Male" | "Female" })
                }
              >
                <SelectTrigger id="wt-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="wt-min" className="mb-1.5">Min (kg)</Label>
                <Input
                  id="wt-min"
                  type="number"
                  step="0.1"
                  value={weightForm.minKg ?? ""}
                  onChange={(e) =>
                    setWeightForm({
                      ...weightForm,
                      minKg: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="wt-max" className="mb-1.5">Max (kg)</Label>
                <Input
                  id="wt-max"
                  type="number"
                  step="0.1"
                  value={weightForm.maxKg ?? ""}
                  onChange={(e) =>
                    setWeightForm({
                      ...weightForm,
                      maxKg: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="wt-division" className="mb-1.5">Link to division (optional)</Label>
              <Select
                value={weightForm.divisionId || "none"}
                onValueChange={(v) =>
                  setWeightForm({ ...weightForm, divisionId: v === "none" ? undefined : v })
                }
              >
                <SelectTrigger id="wt-division" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked to a specific division</SelectItem>
                  {divisions
                    .filter((d) => d.gender === weightForm.gender)
                    .map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        {div.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowWeightModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="wt-form"
              disabled={createWeightMutation.isPending || updateWeightMutation.isPending}
            >
              {editingWeight ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents sheet */}
      <Sheet open={docsEvent !== null} onOpenChange={(o) => !o && setDocsEvent(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg gap-0">
          <SheetHeader>
            <SheetTitle>{docsEvent?.name} — Documents</SheetTitle>
            <SheetDescription>
              Upload and manage event documents.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {docsEvent && (
              <DocumentSection
                entityFilter={{ eventId: docsEvent.id }}
                canUpload={isAdmin}
                canDelete={isAdmin}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

export default EventsAdmin
