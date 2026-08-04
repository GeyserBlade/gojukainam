import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { DivisionsWeights } from "@/components/events/DivisionsWeights"
import { EventCoordinators } from "@/components/events/EventCoordinators"

export default function Setup() {
  const { eventId } = useSelectedEvent()
  const { role } = useAuth()
  if (!eventId) return null

  // Only admins appoint. A coordinator reaching this screen sees the roster
  // read-only — the server refuses the mutations either way.
  const canAppoint = role === "SUPERADMIN" || role === "ADMIN"

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl tracking-wide sm:text-2xl">Setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Divisions and weight classes for this event. Create events under Event Admin.
        </p>
      </div>
      <DivisionsWeights eventId={eventId} />
      <EventCoordinators eventId={eventId} canAppoint={canAppoint} />
    </div>
  )
}
