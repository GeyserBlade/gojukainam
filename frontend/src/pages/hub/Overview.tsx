import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Layers,
  ListChecks,
  Swords,
  Trophy,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useSelectedEvent } from "@/contexts/SelectedEventContext"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicBoardShare } from "@/components/events/PublicBoardShare"
import { EventTimingCard } from "@/components/events/EventTimingCard"
import { cn } from "@/lib/utils"
import { getReadiness } from "@/lib/events"

const Stat = ({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: string
}) => (
  <Card>
    <CardContent className="py-3">
      <p className={cn("font-display text-2xl sm:text-3xl leading-none tracking-wide", tone)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
    </CardContent>
  </Card>
)

export default function Overview() {
  const { eventId, event } = useSelectedEvent()
  const { canManageEvent } = useAuth()
  // Admin, or coordinator of this event — the public-board token route is
  // requireEventManager, so a coordinator may turn their own board on and off.
  const canManage = canManageEvent(eventId)

  const { data: r, isLoading } = useQuery({
    queryKey: ["event-readiness", eventId],
    queryFn: () => getReadiness(eventId),
    enabled: !!eventId,
  })

  if (isLoading || !r) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  // Actionable nudges toward the next step.
  const nudges: { icon: typeof Layers; text: string; to: string }[] = []
  if (r.divisions === 0)
    nudges.push({ icon: Layers, text: "No divisions yet — set up the event", to: "/hub/setup" })
  if (r.entries.submitted > 0)
    nudges.push({ icon: ClipboardList, text: `${r.entries.submitted} pending review`, to: "/hub/review" })
  if (r.entries.approved >= 2 && r.draws.generated === 0)
    nudges.push({ icon: Swords, text: "Approved entries ready — generate draws", to: "/hub/draws" })
  if (r.draws.generated > 0 && r.mats === 0)
    nudges.push({ icon: CalendarDays, text: "Draws ready — set up mats to run", to: "/hub/run" })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl tracking-wide sm:text-2xl">{event?.name ?? "Overview"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Readiness across the event.</p>
      </div>

      {nudges.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {nudges.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm transition-colors hover:bg-primary/10"
            >
              <n.icon className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{n.text}</span>
              <span className="text-xs text-primary">Go →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Entries */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ListChecks className="size-4" /> Entries
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Total" value={r.entries.total} />
          <Stat label="Draft" value={r.entries.draft} tone="text-muted-foreground" />
          <Stat label="Pending" value={r.entries.submitted} tone="text-belt-orange" />
          <Stat label="Approved" value={r.entries.approved} tone="text-belt-green" />
          <Stat label="Returned" value={r.entries.returned} tone="text-flag-red" />
        </div>
      </section>

      {/* Draws / Run / Results */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Trophy className="size-4" /> Competition
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Draws generated" value={r.draws.generated} />
          <Stat
            label="Draws completed"
            value={r.draws.completed}
            tone="text-belt-green"
            hint={r.draws.generated > 0 ? `of ${r.draws.generated}` : undefined}
          />
          <Stat label="Draws locked" value={r.draws.locked} tone="text-belt-blue" />
          <Stat
            label="Checked in"
            value={`${r.checkin.done}/${r.checkin.total}`}
            hint="of approved"
          />
          <Stat label="Mats" value={r.mats} />
        </div>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5" />
        {r.divisions} division{r.divisions === 1 ? "" : "s"} configured.
      </p>

      <EventTimingCard eventId={eventId} canManage={canManage} />

      {canManage && event && <PublicBoardShare event={event} />}
    </div>
  )
}
