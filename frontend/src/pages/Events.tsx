import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  FileText,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
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
import { cn } from "@/lib/utils"
import {
  listEvents,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  listTemplates,
  applyTemplate,
  type Event,
  type EventStatus,
  type CreateEventDto,
  type TemplateId,
} from "@/lib/events"

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-belt-green/15 text-belt-green border-belt-green/30",
  CLOSED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  ARCHIVED: "bg-muted/60 text-muted-foreground/70 border-border",
}

const EventsAdmin = () => {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { setEventId } = useSelectedEvent()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"

  const [docsEvent, setDocsEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [templateForNewEvent, setTemplateForNewEvent] = useState<TemplateId | "">("")

  const [eventForm, setEventForm] = useState<CreateEventDto>({
    name: "",
    venue: "",
    city: "",
    country: "",
    startDate: "",
    regOpen: "",
    regClose: "",
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
      toast.success("Event deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete event"),
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

      <div className="space-y-3">
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
              <Card key={event.id}>
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
                          setEventId(event.id)
                          navigate("/hub/setup")
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
      </div>

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
