import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { DivisionsWeights } from "@/components/events/DivisionsWeights"

export default function Setup() {
  const { eventId } = useSelectedEvent()
  if (!eventId) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl tracking-wide sm:text-2xl">Setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Divisions and weight classes for this event. Create events under Event Admin.
        </p>
      </div>
      <DivisionsWeights eventId={eventId} />
    </div>
  )
}
