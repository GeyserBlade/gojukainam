import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Clock, Flag, MonitorPlay, RefreshCw, Swords, Users } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiErrorToast, useToast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import { setBoutScore, setBoutWinner } from "@/lib/draws"
import { getMyMats, type OperatorMat, type RunEntry, type RunQueueItem } from "@/lib/run"

const roundLabel = (i: RunQueueItem) =>
  i.phase === "REPECHAGE" ? "Repechage" : `Round ${i.round}`

const PresenceDot = ({ checkedIn }: { checkedIn: boolean }) => (
  <span
    title={checkedIn ? "Checked in" : "Not checked in"}
    className={cn(
      "inline-block size-2.5 shrink-0 rounded-full",
      checkedIn ? "bg-belt-green" : "bg-belt-orange/60 ring-1 ring-belt-orange",
    )}
  />
)

/**
 * The bout the mat is on right now — the whole point of the screen, so it is
 * the only thing sized to be read while standing up.
 */
function CurrentBout({
  item,
  busy,
  onScore,
  onWinner,
  onKiken,
}: {
  item: RunQueueItem
  busy: boolean
  onScore: () => void
  onWinner: (side: "aka" | "ao") => void
  onKiken: (absent: "aka" | "ao") => void
}) {
  const Side = ({ side, entry }: { side: "aka" | "ao"; entry: RunEntry }) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => onWinner(side)}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border-2 px-3 py-5 text-center transition-colors disabled:opacity-50",
        side === "aka"
          ? "border-flag-red/40 bg-flag-red/10 hover:bg-flag-red/20"
          : "border-belt-blue/40 bg-belt-blue/10 hover:bg-belt-blue/20",
      )}
    >
      <span
        className={cn(
          "font-display text-sm tracking-widest",
          side === "aka" ? "text-flag-red" : "text-belt-blue",
        )}
      >
        {side === "aka" ? "AKA" : "AO"}
      </span>
      <span className="flex items-center gap-1.5">
        <PresenceDot checkedIn={entry.checkedIn} />
        <span className="truncate text-lg font-semibold">{entry.name}</span>
      </span>
      <span className="truncate text-xs text-muted-foreground">{entry.clubName}</span>
      <span className="mt-1 text-[11px] font-medium text-muted-foreground">Tap to declare winner</span>
    </button>
  )

  return (
    <Card className="border-primary/40 ring-1 ring-primary/20">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className="bg-primary text-primary-foreground">On now</Badge>
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {item.category} · {roundLabel(item)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              item.isKumite ? "border-flag-red/30 text-flag-red" : "border-belt-blue/30 text-belt-blue",
            )}
          >
            {item.isKumite ? "Kumite" : "Kata"}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Side side="aka" entry={item.aka} />
          <Side side="ao" entry={item.ao} />
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-3">
          {/* Both disciplines have a board now: points for kumite, the
              five-judge flag panel for kata. The straight winner tap below
              stays for either — a category can still be called on the mat. */}
          <Button onClick={onScore} disabled={busy}>
            <MonitorPlay />
            {item.isKumite ? "Open scoreboard" : "Score the kata"}
          </Button>
          <Button variant="outline" onClick={() => onKiken("aka")} disabled={busy}>
            <Flag />
            AKA absent
          </Button>
          <Button variant="outline" onClick={() => onKiken("ao")} disabled={busy}>
            <Flag />
            AO absent
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MatPanel({ mat }: { mat: OperatorMat }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const apiError = useApiErrorToast()
  const [confirm, setConfirm] = useState<
    | { kind: "winner"; item: RunQueueItem; side: "aka" | "ao" }
    | { kind: "kiken"; item: RunQueueItem; absent: "aka" | "ao" }
    | null
  >(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-mats"] })

  const winnerMutation = useMutation({
    mutationFn: ({ item, side }: { item: RunQueueItem; side: "aka" | "ao" }) =>
      setBoutWinner(item.drawId, item.boutId!, side === "aka" ? item.aka.entryId : item.ao.entryId),
    onSuccess: () => {
      setConfirm(null)
      invalidate()
      toast.success("Result recorded")
    },
    onError: (e) => apiError(e, "Could not record the result"),
  })

  const kikenMutation = useMutation({
    mutationFn: ({ item, absent }: { item: RunQueueItem; absent: "aka" | "ao" }) =>
      setBoutScore(item.drawId, item.boutId!, {
        winnerEntryId: absent === "aka" ? item.ao.entryId : item.aka.entryId,
        outcome: "KIKEN",
        akaScore: 0,
        aoScore: 0,
      }),
    onSuccess: () => {
      setConfirm(null)
      invalidate()
      toast.success("Walkover recorded")
    },
    onError: (e) => apiError(e, "Could not record the walkover"),
  })

  const busy = winnerMutation.isPending || kikenMutation.isPending
  const [current, ...upcoming] = mat.queue

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl tracking-wide">{mat.matName}</h2>
          <p className="text-sm text-muted-foreground">{mat.event.name}</p>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {mat.queue.length} {mat.queue.length === 1 ? "bout" : "bouts"} to run
        </Badge>
      </div>

      {!current ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <CheckCircle2 className="size-8 text-belt-green" />
            <p className="font-medium">Nothing to run right now</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Either this tatami is finished, or the next category is still waiting on results
              elsewhere. This list refreshes on its own.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CurrentBout
          item={current}
          busy={busy}
          onScore={() =>
            navigate(
              `${current.isKumite ? "/scoreboard" : "/kata"}/${current.drawId}/${current.boutId}`,
            )
          }
          onWinner={(side) => setConfirm({ kind: "winner", item: current, side })}
          onKiken={(absent) => setConfirm({ kind: "kiken", item: current, absent })}
        />
      )}

      {upcoming.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 px-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Clock className="size-3.5" />
            Coming up on this tatami
          </p>
          {/* Read-only on purpose: the running order is the coordinator's, and
              an operator who could reorder it would be planning, not running. */}
          {upcoming.map((item, i) => (
            <div
              key={`${item.drawId}:${item.phase}:${item.round}:${item.position}`}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <span className="w-5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {i + 2}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="text-flag-red">{item.aka.name}</span>
                  <span className="mx-1.5 text-muted-foreground">v</span>
                  <span className="text-belt-blue">{item.ao.name}</span>
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {item.category} · {roundLabel(item)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="size-3" />
                <PresenceDot checkedIn={item.aka.checkedIn} />
                <PresenceDot checkedIn={item.ao.checkedIn} />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* One confirm step between a tap and a recorded result — the buttons are
          large and side by side, and a mis-tap on the wrong athlete is the
          single most likely mistake on a busy mat. */}
      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "kiken" ? "Record a walkover?" : "Record this result?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "winner" && (
                <>
                  <span className="font-medium text-foreground">
                    {confirm.side === "aka" ? confirm.item.aka.name : confirm.item.ao.name}
                  </span>{" "}
                  wins {confirm.item.category} · {roundLabel(confirm.item)}.
                </>
              )}
              {confirm?.kind === "kiken" && (
                <>
                  <span className="font-medium text-foreground">
                    {confirm.absent === "aka" ? confirm.item.aka.name : confirm.item.ao.name}
                  </span>{" "}
                  did not appear, so{" "}
                  <span className="font-medium text-foreground">
                    {confirm.absent === "aka" ? confirm.item.ao.name : confirm.item.aka.name}
                  </span>{" "}
                  advances.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!confirm) return
                if (confirm.kind === "winner")
                  winnerMutation.mutate({ item: confirm.item, side: confirm.side })
                else kikenMutation.mutate({ item: confirm.item, absent: confirm.absent })
              }}
              disabled={busy}
            >
              {busy ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/**
 * A tatami operator's whole application: the mats they have been given, the
 * bout in front of them, and what is coming next. No event picker — the server
 * answers from their own grants, so there is nothing to choose and nothing to
 * choose wrongly.
 */
export default function MatOperatorPage() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-mats"],
    queryFn: getMyMats,
    // A mat's queue changes when other mats finish feeding it, so it has to
    // come to the operator rather than wait to be asked.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })

  return (
    <AppShell title="My Tatami">
      <div className="mb-3 flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn(isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data?.mats.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Swords className="size-8 text-muted-foreground" />
            <p className="font-medium">You are not on a tatami yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask the tournament coordinator to assign you to one. Your bouts appear here as soon
              as they do.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {data!.mats.map((mat) => (
            <MatPanel key={mat.matId} mat={mat} />
          ))}
        </div>
      )}
    </AppShell>
  )
}
