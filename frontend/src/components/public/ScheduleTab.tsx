import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Clock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toScheduleCategory } from "@/lib/plan"
import {
  buildSchedule,
  formatClock,
  formatSpan,
  interleaveMatOrder,
  type ScheduledItem,
  type ScheduleInput,
} from "@/lib/schedule"
import { getPublicSchedule } from "@/lib/public"
import { MatPager, type MatPage } from "./MatPager"

/**
 * A category or ceremony on a floor's timeline. Times are the planned ones,
 * not live — a schedule that quietly claimed to be live would have every
 * parent in the hall late.
 */
function ScheduleRow({ item }: { item: ScheduledItem }) {
  const isBlock = item.kind === "BLOCK"
  return (
    <li className="flex gap-3 border-b py-2.5 last:border-0">
      <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
        {formatClock(item.startMin)}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", isBlock && "text-muted-foreground italic")}>
          {item.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatSpan(item.minutes)}
          {!isBlock && item.bouts > 0 && ` · ${item.bouts} bouts`}
          {item.category && ` · ${item.category.isKata ? "Kata" : "Kumite"}`}
        </p>
      </div>
    </li>
  )
}

/**
 * The day's running order per tatami, swipeable like the live mats.
 *
 * Built with the very same `buildSchedule` walk as the Plan tab and the
 * printed schedule, off the same plan payload — so what a parent reads on
 * their phone is what is pinned to the wall, down to the minute.
 */
export function ScheduleTab({ token }: { token: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-schedule", token],
    queryFn: () => getPublicSchedule(token),
    // The plan barely moves once the day starts, so this is refetched on a
    // slow beat rather than with the live board.
    refetchInterval: 120_000,
    staleTime: 60_000,
  })

  const schedule = useMemo(() => {
    if (!data) return null
    const plan = data.plan
    const drawn = plan.categories.filter((c) => c.hasDraw && c.drawId)
    const input: ScheduleInput = {
      timing: plan.timing,
      mats: plan.mats.map((mat) => ({
        id: mat.id,
        name: mat.name,
        categories: drawn.filter((c) => c.matId === mat.id).map(toScheduleCategory),
        blocks: plan.blocks.filter((b) => b.matId === mat.id),
      })),
      venueBlocks: plan.blocks.filter((b) => b.matId === null),
      unassignedCount: drawn.filter((c) => !c.matId).length,
      order: new Map(
        plan.mats.map((mat) => [
          mat.id,
          interleaveMatOrder(
            drawn
              .filter((c) => c.matId === mat.id)
              .map((c) => ({ drawId: c.drawId!, matOrder: c.matOrder })),
            plan.blocks.filter((b) => b.matId === mat.id).map((b) => ({ id: b.id, matOrder: b.matOrder })),
          ),
        ]),
      ),
    }
    return buildSchedule(input)
  }, [data])

  if (isLoading) return <Skeleton className="h-72 w-full" />

  if (isError || !schedule) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          The schedule is not available for this event.
        </CardContent>
      </Card>
    )
  }

  const withItems = schedule.mats.filter((m) => m.items.length > 0)

  if (withItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          The running order has not been planned yet.
        </CardContent>
      </Card>
    )
  }

  const pages: MatPage[] = withItems.map((mat) => ({
    id: mat.id,
    name: mat.name,
    meta: `${formatClock(mat.startMin)}–${formatClock(mat.endMin)}`,
    content: (
      <Card>
        <CardContent className="p-3">
          <ul>
            {mat.items.map((item) => (
              <ScheduleRow key={`${item.kind}:${item.id}`} item={item} />
            ))}
          </ul>
        </CardContent>
      </Card>
    ),
  }))

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4" />
        Planned times · {formatClock(schedule.matStartMin)} to{" "}
        {formatClock(schedule.competitionEndMin)}
      </p>
      {schedule.bands.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="pb-1 text-xs font-medium text-muted-foreground">Whole venue</p>
            <ul>
              {schedule.bands.map((band) => (
                <li key={band.id} className="flex gap-3 border-b py-2 last:border-0">
                  <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatClock(band.startMin)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{band.label}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatSpan(band.minutes)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <MatPager pages={pages} />
      <p className="pt-1 text-center text-xs text-muted-foreground">
        Estimated from the running order — a tournament runs early or late, so treat these as a
        guide, not a promise.
      </p>
    </div>
  )
}
