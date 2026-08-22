import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PublicQueueItem, PublicRunBoard } from "@/lib/public"
import { MatPager, type MatPage } from "./MatPager"

/**
 * How many queued bouts a floor shows before collapsing the rest behind a
 * "Show more" button. A tatami can hold thirty-odd ready bouts at the start
 * of a day; a spectator wants the next few at a glance. This only ever
 * shortens the *initial* view — every bout, including a division's final,
 * stays one tap away rather than being dropped from the page, since a
 * spectator has no other way to confirm a specific bout (their own child's
 * final, say) is really coming up.
 */
const QUEUE_LIMIT = 8

const boutRound = (item: PublicQueueItem) =>
  item.phase === "REPECHAGE" ? "Repechage" : `Round ${item.round}`

/** The bout at the head of a floor's queue — the one being fought or called. */
function OnNowCard({ item }: { item: PublicQueueItem }) {
  return (
    <Card className="border-primary ring-1 ring-primary/40">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className="bg-primary text-primary-foreground text-[10px]">On now</Badge>
          <span className="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">
            {item.category} · {boutRound(item)}
          </span>
        </div>
        <div className="space-y-1.5 border-t pt-2">
          {[item.aka, item.ao].map((f, i) => (
            <div key={f.entryId} className="flex items-baseline gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  i === 0 ? "bg-flag-red" : "bg-flag-blue",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
              <span className="shrink-0 truncate text-xs text-muted-foreground">{f.clubName}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * A queued bout as one line rather than a card. This is the summarising the
 * old board needed most: thirty-six bouts as thirty-six three-line cards is
 * ten screens of scrolling on a phone.
 */
function QueueRow({ item, index }: { item: PublicQueueItem; index: number }) {
  return (
    <li className="flex items-center gap-2.5 border-b py-2 last:border-0">
      <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {item.aka.name} <span className="text-xs text-muted-foreground">v</span> {item.ao.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {item.category} · {boutRound(item)}
        </p>
      </div>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          item.isKumite ? "bg-flag-red" : "bg-belt-blue",
        )}
        aria-hidden
        title={item.isKumite ? "Kumite" : "Kata"}
      />
    </li>
  )
}

function MatColumn({ queue, isLiveFloor }: { queue: PublicQueueItem[]; isLiveFloor: boolean }) {
  // Collapsed by default (the whole point of QUEUE_LIMIT), but never a dead
  // end: every bout a mat has queued — including a division's final, which
  // is exactly as real a bout as any other and has no other page that lists
  // it — is one tap away rather than dropped from the page entirely.
  const [expanded, setExpanded] = useState(false)

  if (queue.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nothing waiting on this floor.
        </CardContent>
      </Card>
    )
  }

  // Only a real floor has a bout "on now" — the unassigned pool is a to-do
  // list, not a mat, and calling its first row "on now" would be a lie.
  const [head, ...rest] = queue
  const full = isLiveFloor ? rest : queue
  const shown = expanded ? full : full.slice(0, QUEUE_LIMIT)
  const hidden = full.length - shown.length

  return (
    <div className="space-y-3">
      {isLiveFloor && <OnNowCard item={head} />}
      {shown.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="pb-1 text-xs font-medium text-muted-foreground">
              {isLiveFloor ? "Up next" : "Waiting for a floor"}
            </p>
            <ul>
              {shown.map((item, i) => (
                <QueueRow
                  key={`${item.drawId}:${item.phase}:${item.round}:${item.position}`}
                  item={item}
                  index={isLiveFloor ? i + 2 : i + 1}
                />
              ))}
            </ul>
            {hidden > 0 && (
              <div className="pt-2 text-center">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(true)}>
                  Show {hidden} more
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/** Live per-tatami queues, one swipeable page per floor. */
export function MatsTab({ board }: { board: PublicRunBoard }) {
  const pages: MatPage[] = [
    ...board.mats.map((mat) => ({
      id: mat.id,
      name: mat.name,
      meta: `${mat.queue.length}`,
      content: <MatColumn queue={mat.queue} isLiveFloor />,
    })),
    ...(board.unassigned.length > 0
      ? [
          {
            id: "unassigned",
            name: "Not on a floor",
            meta: `${board.unassigned.length}`,
            content: <MatColumn queue={board.unassigned} isLiveFloor={false} />,
          },
        ]
      : []),
  ]

  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          No bouts are running right now. Check back soon.
        </CardContent>
      </Card>
    )
  }

  return <MatPager pages={pages} />
}
