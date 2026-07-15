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

type HubTab = { to: string; label: string; end?: boolean; roles: Role[] }

const TABS: HubTab[] = [
  { to: "/hub", label: "Overview", end: true, roles: ALL },
  { to: "/hub/setup", label: "Setup", roles: ADMIN },
  { to: "/hub/entries", label: "Entries", roles: MANAGE },
  { to: "/hub/review", label: "Review", roles: CLUB },
  { to: "/hub/draws", label: "Draws", roles: ALL },
  { to: "/hub/run", label: "Run", roles: ALL },
  { to: "/hub/results", label: "Results", roles: ALL },
]

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-belt-green/15 text-belt-green border-belt-green/30",
  CLOSED: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  ARCHIVED: "bg-muted/60 text-muted-foreground/70 border-border",
}

export function EventHubLayout() {
  const { role } = useAuth()
  const { eventId, setEventId, events, event, loading } = useSelectedEvent()
  const location = useLocation()

  const tabs = TABS.filter((t) => !role || t.roles.includes(role))
  const isActive = (t: HubTab) =>
    t.end ? location.pathname === t.to : location.pathname.startsWith(t.to)

  return (
    <AppShell title="Event Hub">
      {/* Event picker + status */}
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <div className="w-full max-w-xs">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Event</Label>
          {loading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
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
          <Badge variant="outline" className={cn("mb-1.5 font-normal", STATUS_STYLES[event.status])}>
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
