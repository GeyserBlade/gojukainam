import { Link, Outlet, useLocation } from "react-router-dom"

import { useAuth, type Role } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import type { EventStatus } from "@/lib/events"

const ALL: Role[] = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE"]
const MANAGE: Role[] = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER"]
const CLUB: Role[] = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH"]
const ADMIN: Role[] = ["SUPERADMIN", "ADMIN"]

type HubTab = {
  to: string
  label: string
  end?: boolean
  roles: Role[]
  /** Also visible to a coordinator of the *selected* event, whatever their role. */
  coordinator?: boolean
}

const TABS: HubTab[] = [
  { to: "/hub", label: "Overview", end: true, roles: ALL },
  { to: "/hub/setup", label: "Setup", roles: ADMIN, coordinator: true },
  { to: "/hub/entries", label: "Entries", roles: MANAGE, coordinator: true },
  { to: "/hub/review", label: "Review", roles: CLUB, coordinator: true },
  { to: "/hub/draws", label: "Draws", roles: ALL },
  { to: "/hub/estimator", label: "Estimator", roles: ADMIN, coordinator: true },
  // Visible to everyone: the plan is also the schedule, and a coach wants to
  // know which floor their athletes are on and roughly when. The board itself
  // is read-only unless the user can manage the event.
  { to: "/hub/plan", label: "Plan", roles: ALL },
  { to: "/hub/practice", label: "Practice", roles: ALL },
  { to: "/hub/run", label: "Run", roles: ALL },
  { to: "/hub/results", label: "Results", roles: ALL },
  // Results read the other way round: not "who won this category" but "how is
  // this one athlete doing", across every category they entered. Same audience
  // as Draws and Results, out of the same brackets.
  { to: "/hub/athletes", label: "Athletes", roles: ALL },
]

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-belt-green/15 text-belt-green border-belt-green/30",
  CLOSED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  ARCHIVED: "bg-muted/60 text-muted-foreground/70 border-border",
}

export function EventHubLayout() {
  const { role, canManageEvent } = useAuth()
  const { eventId, setEventId, events, event, loading } = useSelectedEvent()
  const location = useLocation()

  // Tab visibility is per-event now: a coordinator's extra tabs appear only
  // while the event they coordinate is the one selected.
  const canManageSelected = canManageEvent(eventId)
  const tabs = TABS.filter(
    (t) => !role || t.roles.includes(role) || (t.coordinator && canManageSelected),
  )
  const isActive = (t: HubTab) =>
    t.end ? location.pathname === t.to : location.pathname.startsWith(t.to)

  return (
    <AppShell title="Event Hub">
      {/* Event picker + status */}
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        {/* min-w-0 so the picker can actually shrink: a flex item's floor is its
            content, and a long tournament name would otherwise push it wider
            than max-w-xs and out under the status badge. */}
        <div className="w-full min-w-0 max-w-sm">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Event</Label>
          {loading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={eventId} onValueChange={setEventId}>
              {/* SelectTrigger is w-fit by default, which for a long event name
                  means "wider than the box you put me in". The name truncates
                  instead — the full one is in the open list. */}
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {event && (
          <Badge
            variant="outline"
            className={cn("mb-1.5 shrink-0 font-normal", STATUS_STYLES[event.status])}
          >
            {event.status}
          </Badge>
        )}
      </div>

      {/* Tab strip */}
      <div className="mb-4 overflow-x-auto border-b print:hidden">
        <nav className="flex min-w-max gap-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive(t)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {!eventId && !loading ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No events yet. Create one under Event Admin to get started.
          </CardContent>
        </Card>
      ) : (
        <Outlet />
      )}
    </AppShell>
  )
}
