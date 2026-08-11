import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ArrowLeftRight, ExternalLink, Eye, EyeOff, RotateCcw } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useApiErrorToast, useToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PodiumBanner } from "@/components/scoreboard/PodiumBanner"
import { cn } from "@/lib/utils"
import {
  finalBronzeMedalists,
  getDraw,
  isFinalBout,
  setBoutScore,
  type DrawBout,
  type DrawDetail,
} from "@/lib/draws"
import {
  CHANNEL_NAME,
  type ChannelMessage,
  type KataDisplayPayload,
  type Side,
} from "@/lib/scoreboard"
import { listKatas, type Kata } from "@/lib/kata"
import {
  clearPersistedKata,
  decideFlags,
  emptyPanel,
  JUDGE_COUNT,
  MAJORITY,
  kataScoreJson,
  loadPersistedKata,
  persistKata,
  setFlag,
  type FlagPanel,
} from "@/lib/kata-scoring"

const SIDE_STYLE = {
  aka: {
    label: "AKA",
    panel: "bg-red-900/40 border-red-500/40",
    accent: "text-red-300",
    flag: "bg-red-600 hover:bg-red-500",
    flagOn: "bg-red-500 ring-4 ring-red-300",
  },
  ao: {
    label: "AO",
    panel: "bg-blue-900/40 border-blue-500/40",
    accent: "text-blue-300",
    flag: "bg-blue-700 hover:bg-blue-600",
    flagOn: "bg-blue-600 ring-4 ring-blue-300",
  },
} as const

/**
 * One judge's flag pole: the two flags they could raise, stacked the way the
 * panel is read from the referee's position. Tapping the flag a judge already
 * shows clears it, so a mis-tap costs one tap to undo rather than a reset.
 */
function JudgeFlag({
  index,
  value,
  disabled,
  onPick,
}: {
  index: number
  value: Side | null
  disabled: boolean
  onPick: (side: Side) => void
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
        Judge {index + 1}
      </p>
      {(["aka", "ao"] as const).map((side) => {
        const s = SIDE_STYLE[side]
        const on = value === side
        return (
          <button
            key={side}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            aria-label={`Judge ${index + 1}: ${s.label}`}
            onClick={() => onPick(side)}
            className={cn(
              "flex h-16 w-full items-center justify-center rounded-lg font-display text-lg tracking-widest text-white transition-all disabled:opacity-40 sm:h-20",
              on ? s.flagOn : cn(s.flag, "opacity-35 hover:opacity-70"),
            )}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

/** A competitor's corner: who they are and which kata they are performing. */
function CompetitorPanel({
  side,
  name,
  clubName,
  katas,
  value,
  alreadyPerformed,
  disabled,
  onChange,
}: {
  side: Side
  name: string
  clubName: string
  katas: Kata[]
  value: string | null
  alreadyPerformed: Set<string>
  disabled: boolean
  onChange: (kataId: string) => void
}) {
  const s = SIDE_STYLE[side]
  // Grouped by style so a 21-kata list reads as a syllabus rather than a wall.
  const groups = useMemo(() => {
    const byStyle = new Map<string, Kata[]>()
    for (const k of katas) {
      const g = k.style ?? "Other"
      const list = byStyle.get(g)
      if (list) list.push(k)
      else byStyle.set(g, [k])
    }
    return [...byStyle.entries()]
  }, [katas])

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4", s.panel)}>
      <div>
        <p className={cn("font-display text-sm tracking-widest", s.accent)}>{s.label}</p>
        <p className="truncate text-2xl font-bold text-white">{name}</p>
        <p className="truncate text-sm text-white/60">{clubName}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Kata performed
        </label>
        <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-11 w-full border-white/20 bg-black/40 text-white">
            <SelectValue placeholder="Choose a kata" />
          </SelectTrigger>
          <SelectContent>
            {groups.map(([style, list]) => (
              <SelectGroup key={style}>
                <SelectLabel>{style}</SelectLabel>
                {list.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.name}
                    {/* Not a rule yet — the rules that will read
                        KataPerformance are the next piece of work — but the
                        judge needs to know, because a repeat is the thing they
                        would otherwise catch too late. */}
                    {alreadyPerformed.has(k.id) && (
                      <span className="ml-2 text-xs text-muted-foreground">· already performed</span>
                    )}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * Kata scoring: five judges, one flag each, majority takes the bout.
 *
 * Two phases, because that is how the decision actually happens on the floor.
 * While the competitors perform, the projector shows who is on and what they
 * are doing. The referee then calls for flags, the operator enters the five
 * they can see, and only when they press "Show flags" does any of it reach the
 * mats — otherwise the projector would count the decision out loud as the
 * operator typed it.
 */
export default function KataScoreboardPage() {
  const { drawId, boutId } = useParams<{ drawId: string; boutId: string }>()
  const navigate = useNavigate()
  const { canManageEvent, role } = useAuth()
  const toast = useToast()
  const apiError = useApiErrorToast()

  const [panel, setPanel] = useState<FlagPanel>(emptyPanel)
  const [akaKataId, setAkaKataId] = useState<string | null>(null)
  const [aoKataId, setAoKataId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [displayFlip, setDisplayFlip] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const resumedRef = useRef(false)

  const { data: draw } = useQuery({
    queryKey: ["draw", drawId],
    queryFn: () => getDraw(drawId!),
    enabled: !!drawId,
  })
  const { data: katas = [] } = useQuery({ queryKey: ["katas"], queryFn: () => listKatas() })

  const bout: DrawBout | undefined = useMemo(
    () => draw?.bouts.find((b) => b.id === boutId),
    [draw, boutId],
  )

  // Resume a decision interrupted by a refresh or a dead tablet. Runs once,
  // and only after the bout is known so it cannot resurrect state onto the
  // wrong matchup.
  useEffect(() => {
    if (!boutId || !bout || resumedRef.current) return
    resumedRef.current = true
    const saved = loadPersistedKata(boutId)
    if (saved) {
      setPanel(saved.panel)
      setAkaKataId(saved.akaKataId)
      setAoKataId(saved.aoKataId)
      setRevealed(saved.revealed)
    } else {
      // Nothing persisted, but the bout may already carry a recorded kata
      // (a result being corrected) — start from what is on the bout.
      setAkaKataId(bout.akaKata?.id ?? null)
      setAoKataId(bout.aoKata?.id ?? null)
    }
  }, [boutId, bout])

  useEffect(() => {
    if (!boutId || !resumedRef.current) return
    persistKata(boutId, { panel, akaKataId, aoKataId, revealed })
  }, [boutId, panel, akaKataId, aoKataId, revealed])

  const decision = decideFlags(panel)

  // -- broadcast to the projector ---------------------------------------------
  const channelRef = useRef<BroadcastChannel | null>(null)
  const payloadRef = useRef<KataDisplayPayload | null>(null)
  const revealedRef = useRef(false)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      if (e.data?.type === "hello" && payloadRef.current) channel.postMessage(payloadRef.current)
    }
    return () => {
      // Same rule as the kumite board: a revealed result stays up while the
      // operator navigates away to save it. Only an abandoned bout clears.
      if (!revealedRef.current) channel.postMessage({ type: "closed" } satisfies ChannelMessage)
      channel.close()
    }
  }, [])

  const kataName = (id: string | null) => katas.find((k) => k.id === id)?.name ?? null
  const akaName = bout?.aka?.name ?? ""
  const aoName = bout?.ao?.name ?? ""
  const akaClub = bout?.aka?.clubName ?? ""
  const aoClub = bout?.ao?.clubName ?? ""

  // Memoised because it goes on the broadcast payload: a fresh object every
  // render would re-post the whole payload to the projector on every render.
  const podium = useMemo(() => {
    if (!draw || !bout || !revealed || !decision.winner || !isFinalBout(draw, bout)) return null
    const bronze = finalBronzeMedalists(draw)
    if (!bronze) return null
    const goldIsAka = decision.winner === "aka"
    const akaMedalist = { name: akaName, clubName: akaClub }
    const aoMedalist = { name: aoName, clubName: aoClub }
    return {
      gold: goldIsAka ? akaMedalist : aoMedalist,
      silver: goldIsAka ? aoMedalist : akaMedalist,
      bronze,
    }
  }, [draw, bout, revealed, decision.winner, akaName, akaClub, aoName, aoClub])

  useEffect(() => {
    if (!bout) return
    const payload: KataDisplayPayload = {
      type: "kata",
      boutId: boutId ?? "kata",
      categoryLabel: draw
        ? `${draw.division.name}${draw.weightClass ? ` · ${draw.weightClass.name}` : ""}`
        : "",
      roundLabel: bout.phase === "REPECHAGE" ? "Repechage" : `Round ${bout.round}`,
      aka: { name: akaName, clubName: akaClub, kataName: kataName(akaKataId) },
      ao: { name: aoName, clubName: aoClub, kataName: kataName(aoKataId) },
      panel,
      revealed,
      akaFlags: decision.aka,
      aoFlags: decision.ao,
      winnerSide: revealed ? decision.winner : null,
      winnerName: revealed && decision.winner ? (decision.winner === "aka" ? akaName : aoName) : null,
      winnerClubName:
        revealed && decision.winner ? (decision.winner === "aka" ? akaClub : aoClub) : null,
      displayFlip,
      podium,
    }
    payloadRef.current = payload
    revealedRef.current = revealed
    channelRef.current?.postMessage(payload)
    // `katas` is in the deps because the kata *names* on the payload are
    // resolved through it, and it arrives after the first render.
  }, [bout, draw, boutId, panel, revealed, akaKataId, aoKataId, displayFlip, katas, podium, akaName, aoName, akaClub, aoClub, decision.aka, decision.ao, decision.winner])

  // -- guards -----------------------------------------------------------------
  // Same shape and same reasoning as the kumite scoreboard: the permission
  // check needs the draw's own eventId, so it waits for the load.
  const canManage = canManageEvent(draw?.eventId) || role === "TATAMI_OPERATOR"
  const back = () => navigate(role === "TATAMI_OPERATOR" ? "/mat" : "/draws")

  if (!draw) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/70">
        Loading bout…
      </div>
    )
  }
  if (!canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p>Only admins, this event's coordinators, and this tatami's operator can score a kata.</p>
      </div>
    )
  }
  if (!bout || !bout.aka || !bout.ao) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>{bout ? "Both competitors must be known before this bout can be scored." : "Bout not found in this draw."}</p>
        <Button variant="secondary" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    )
  }
  if (draw.division.category !== "KATA") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>This is a kumite category — score it on the kumite scoreboard.</p>
        <Button variant="secondary" onClick={() => navigate(`/scoreboard/${drawId}/${boutId}`)}>
          Open the scoreboard
        </Button>
      </div>
    )
  }

  const akaEntryId = bout.aka.entryId
  const aoEntryId = bout.ao.entryId

  const save = async () => {
    if (!decision.winner) return
    setSaving(true)
    try {
      await setBoutScore(drawId!, boutId!, {
        winnerEntryId: decision.winner === "aka" ? akaEntryId : aoEntryId,
        outcome: "FLAGS",
        akaScore: decision.aka,
        aoScore: decision.ao,
        scoreJson: kataScoreJson(
          panel,
          { kataId: akaKataId, kataName: kataName(akaKataId) },
          { kataId: aoKataId, kataName: kataName(aoKataId) },
        ),
        akaKataId,
        aoKataId,
      })
      if (boutId) clearPersistedKata(boutId)
      toast.success("Kata result saved")
      setConfirmOpen(false)
      back()
    } catch (e) {
      apiError(e, "Could not save the kata result")
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setPanel(emptyPanel())
    setRevealed(false)
  }

  const akaOnLeft = !displayFlip
  const leftSide: Side = akaOnLeft ? "aka" : "ao"
  const rightSide: Side = akaOnLeft ? "ao" : "aka"
  const renderCompetitor = (side: Side) => (
    <CompetitorPanel
      side={side}
      name={side === "aka" ? akaName : aoName}
      clubName={side === "aka" ? akaClub : aoClub}
      katas={katas}
      value={side === "aka" ? akaKataId : aoKataId}
      alreadyPerformed={alreadyPerformedByEntry(draw, side === "aka" ? akaEntryId : aoEntryId, boutId)}
      disabled={saving}
      onChange={side === "aka" ? setAkaKataId : setAoKataId}
    />
  )

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Button variant="ghost" size="sm" className="text-white/80" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-white/80">
          {draw.division.name}
          {draw.weightClass ? ` · ${draw.weightClass.name}` : ""} —{" "}
          {bout.phase === "REPECHAGE" ? "Repechage" : `Round ${bout.round}`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80"
          onClick={() => setDisplayFlip((f) => !f)}
          title="Swap AKA / AO sides"
        >
          <ArrowLeftRight className="h-4 w-4" /> Swap
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80"
          onClick={() => window.open("/scoreboard/display", "_blank", "noopener")}
        >
          <ExternalLink className="h-4 w-4" /> Display
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-3 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {renderCompetitor(leftSide)}
          {renderCompetitor(rightSide)}
        </div>

        {/* the panel */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Judges' flags
            </p>
            <p className="text-xs text-white/40">
              {decision.pending > 0
                ? `${decision.pending} of ${JUDGE_COUNT} still to enter`
                : "All flags entered"}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {panel.map((value, i) => (
              <JudgeFlag
                key={i}
                index={i}
                value={value}
                disabled={saving}
                onPick={(side) => setPanel((p) => setFlag(p, i, side))}
              />
            ))}
          </div>

          {/* tally */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <Tally side={leftSide} count={leftSide === "aka" ? decision.aka : decision.ao} won={decision.winner === leftSide} />
            <span className="font-display text-2xl text-white/25">vs</span>
            <Tally side={rightSide} count={rightSide === "aka" ? decision.aka : decision.ao} won={decision.winner === rightSide} />
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={reset}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4" /> Clear flags
          </Button>
          <Button
            size="lg"
            className={cn("h-14 px-8 text-base", revealed ? "bg-zinc-600 hover:bg-zinc-500" : "bg-amber-500 hover:bg-amber-600")}
            disabled={saving || (!revealed && !decision.decided)}
            onClick={() => setRevealed((r) => !r)}
            title={decision.decided ? undefined : `A majority is ${MAJORITY} flags — enter at least that many`}
          >
            {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            {revealed ? "Hide flags" : "Show flags"}
          </Button>
          <Button
            size="lg"
            className="h-14 bg-emerald-600 px-8 text-base hover:bg-emerald-700"
            disabled={saving || !decision.winner}
            onClick={() => setConfirmOpen(true)}
          >
            Save result
          </Button>
        </div>

        {!decision.decided && (
          <p className="text-center text-sm text-white/40">
            Enter each judge's flag as it goes up. {MAJORITY_TEXT}
          </p>
        )}

        {podium && (
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <PodiumBanner podium={podium} />
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this kata result?</DialogTitle>
            <DialogDescription>
              {decision.winner && (
                <>
                  <span className="font-medium text-foreground">
                    {decision.winner === "aka" ? akaName : aoName}
                  </span>{" "}
                  wins by {decision.winner === "aka" ? decision.aka : decision.ao} flags to{" "}
                  {decision.winner === "aka" ? decision.ao : decision.aka}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 text-sm">
            <KataLine label="AKA" name={akaName} kata={kataName(akaKataId)} />
            <KataLine label="AO" name={aoName} kata={kataName(aoKataId)} />
            {decision.pending > 0 && (
              <p className="pt-1 text-xs text-amber-600">
                {decision.pending} judge{decision.pending === 1 ? "" : "s"} not entered — the
                majority already decides it, so this saves as{" "}
                {decision.aka}–{decision.ao}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const MAJORITY_TEXT = `${MAJORITY} flags decides it — you can save before the last flags are in.`

function Tally({ side, count, won }: { side: Side; count: number; won: boolean }) {
  const s = SIDE_STYLE[side]
  return (
    <div className="flex flex-col items-center">
      <p className={cn("font-display text-xs tracking-widest", s.accent)}>{s.label}</p>
      <p
        className={cn(
          "font-mono text-6xl font-bold tabular-nums text-white",
          won && "text-yellow-300",
        )}
      >
        {count}
      </p>
    </div>
  )
}

function KataLine({ label, name, kata }: { label: string; name: string; kata: string | null }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="w-9 shrink-0 font-display text-xs tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className={cn("shrink-0 text-xs", kata ? "text-muted-foreground" : "text-amber-600")}>
        {kata ?? "no kata recorded"}
      </span>
    </p>
  )
}

/**
 * Katas this competitor has already performed elsewhere in this category.
 * Read straight off the bracket the page already has — no extra request, and
 * no rule attached to it yet: it is shown so the judges can see a repeat, which
 * is the thing they would otherwise catch only after it happened.
 */
function alreadyPerformedByEntry(
  draw: DrawDetail,
  entryId: string,
  exceptBoutId: string | undefined,
): Set<string> {
  const ids = new Set<string>()
  for (const b of draw.bouts) {
    if (b.id === exceptBoutId) continue
    if (b.aka?.entryId === entryId && b.akaKata) ids.add(b.akaKata.id)
    if (b.ao?.entryId === entryId && b.aoKata) ids.add(b.aoKata.id)
  }
  return ids
}
