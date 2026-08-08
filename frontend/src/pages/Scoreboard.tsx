import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  ExternalLink,
  Flag,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Undo2,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getDraw, setBoutScore, setBoutWinner, type DrawBout } from "@/lib/draws"
import {
  CHANNEL_NAME,
  DURATION_PRESETS,
  HANSOKU_LEVEL,
  PENALTY_FULL_NAMES,
  PENALTY_LABELS,
  anyPostTime,
  clearPersistedBout,
  finalizeAwardingWindow,
  formatClock,
  initialBoutState,
  isBoutOver,
  loadPersistedBout,
  loadSettings,
  persistBout,
  playAtoshiBaraku,
  playEndBuzzer,
  playScoreBlip,
  replayLog,
  resolveOutcome,
  saveSettings,
  sidePoints,
  startAwardingWindow,
  tickAward,
  type BoutAction,
  type ChannelMessage,
  type DisplayPayload,
  type Outcome,
  type ScoreKind,
  type ScoreboardSettings,
  type Side,
} from "@/lib/scoreboard"

const ATOSHI_MS = 15_000

const SCORE_BUTTONS: { kind: ScoreKind; label: string; points: string }[] = [
  { kind: "yuko", label: "Yuko", points: "+1" },
  { kind: "wazaari", label: "Waza-ari", points: "+2" },
  { kind: "ippon", label: "Ippon", points: "+3" },
]

interface SidePanelProps {
  side: Side
  name: string
  clubName: string
  points: number
  penalty: number
  senshu: boolean
  flipped?: boolean
  disabled: boolean
  onScore: (kind: ScoreKind) => void
  onMinus: () => void
  onPenalty: (level: number) => void
  onSenshu: () => void
  onKiken: () => void
}

const SidePanel = ({
  side, name, clubName, points, penalty, senshu, disabled,
  onScore, onMinus, onPenalty, onSenshu, onKiken,
}: SidePanelProps) => {
  const isAka = side === "aka"
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 p-4 sm:p-5",
        isAka ? "bg-red-700/95" : "bg-blue-800/95",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-2xl uppercase tracking-widest text-white/80">
            {isAka ? "AKA" : "AO"}
          </p>
          <p className="truncate text-xl font-semibold text-white sm:text-2xl">{name}</p>
          <p className="truncate text-sm text-white/70">{clubName}</p>
        </div>
        <button
          type="button"
          onClick={onSenshu}
          disabled={disabled}
          title="Toggle senshu (first unopposed score)"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
            senshu
              ? "border-yellow-300 bg-yellow-400 text-black"
              : "border-white/40 text-white/50 hover:border-white",
          )}
        >
          S
        </button>
      </div>

      <p
        data-testid={`points-${side}`}
        className="text-center font-mono text-[7rem] font-bold leading-none text-white sm:text-[9rem]"
      >
        {points}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {SCORE_BUTTONS.map((b) => (
          <Button
            key={b.kind}
            variant="secondary"
            disabled={disabled}
            className="h-14 flex-col gap-0 bg-white/15 text-white hover:bg-white/30"
            onClick={() => onScore(b.kind)}
          >
            <span className="text-sm font-semibold">{b.label}</span>
            <span className="text-xs opacity-75">{b.points}</span>
          </Button>
        ))}
      </div>
      <Button
        variant="secondary"
        disabled={disabled}
        className="h-9 bg-white/10 text-white hover:bg-white/25"
        onClick={onMinus}
      >
        <Minus className="h-4 w-4" /> Remove last score
      </Button>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/60">
          Penalties
        </p>
        <div className="flex gap-1.5">
          {PENALTY_LABELS.map((label, i) => {
            const level = i + 1
            const lit = penalty >= level
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                title={PENALTY_FULL_NAMES[i]}
                onClick={() => onPenalty(penalty === level ? level - 1 : level)}
                className={cn(
                  "h-11 flex-1 rounded-md border-2 text-sm font-bold transition-colors",
                  lit
                    ? level === HANSOKU_LEVEL
                      ? "border-yellow-300 bg-yellow-400 text-black"
                      : "border-white bg-white text-black"
                    : "border-white/40 text-white/70 hover:border-white",
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <Button
        variant="secondary"
        disabled={disabled}
        className="h-9 bg-black/25 text-white/90 hover:bg-black/40"
        onClick={onKiken}
      >
        Kiken (withdrawal)
      </Button>
    </div>
  )
}

export default function ScoreboardPage() {
  const { drawId, boutId } = useParams<{ drawId: string; boutId: string }>()
  const navigate = useNavigate()
  const { canManageEvent } = useAuth()
  const toast = useToast()
  const apiError = useApiErrorToast()

  const { data: draw } = useQuery({
    queryKey: ["draw", drawId],
    queryFn: () => getDraw(drawId!),
    enabled: !!drawId,
  })

  // Scored off the draw's own event, not the hub selection: this page is opened
  // by drawId from the Run tab, so a coordinator must be judged against the
  // event that draw belongs to. Mirrors requireEventManager on the score routes.
  const canManage = canManageEvent(draw?.eventId)
  const bout: DrawBout | undefined = useMemo(
    () => draw?.bouts.find((b) => b.id === boutId),
    [draw, boutId],
  )

  // -- settings ------------------------------------------------------------
  const [settings, setSettings] = useState<ScoreboardSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Which physical side AKA (red) sits on for the operator. Default: AKA on the
  // right (AO left), matching the WKF officials' table orientation. Persisted.
  const [akaOnLeft, setAkaOnLeft] = useState(
    () => localStorage.getItem("scoreboard:controlAkaOnLeft") === "1",
  )
  const toggleControlSides = () =>
    setAkaOnLeft((v) => {
      localStorage.setItem("scoreboard:controlAkaOnLeft", v ? "0" : "1")
      return !v
    })

  // Orientation of the projected spectator display, controlled from here so the
  // operator never has to reach the projected screen. Broadcast to the display.
  const [displayFlip, setDisplayFlip] = useState(
    () => localStorage.getItem("scoreboard:opDisplayFlip") === "1",
  )
  const toggleDisplaySides = () =>
    setDisplayFlip((v) => {
      localStorage.setItem("scoreboard:opDisplayFlip", v ? "0" : "1")
      return !v
    })
  const updateSettings = (patch: Partial<ScoreboardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }

  // -- bout state (action log) ----------------------------------------------
  const [log, setLog] = useState<BoutAction[]>([])
  const state = useMemo(
    () => (log.length ? replayLog(log, settings.winByGap) : initialBoutState()),
    [log, settings.winByGap],
  )

  // -- clock ----------------------------------------------------------------
  const [clockMs, setClockMs] = useState(settings.durationMs)
  const [running, setRunning] = useState(false)
  // Post-buzzer awarding window: null = not in one, a number = counting down
  // (0 = spent). See lib/scoreboard.ts for why this shape, not a named FSM.
  const [awardMs, setAwardMs] = useState<number | null>(null)
  const [resolutionOpen, setResolutionOpen] = useState(false)
  const [hanteiWinner, setHanteiWinner] = useState<Side | null>(null)
  const [saving, setSaving] = useState(false)
  const atoshiFiredRef = useRef(false)
  const endFiredRef = useRef(false)
  const awardFiredRef = useRef(false)

  const atoshiBaraku = clockMs <= ATOSHI_MS && clockMs > 0
  const awarding = awardMs !== null && awardMs > 0

  // resume persisted bout on mount
  useEffect(() => {
    if (!boutId) return
    const persisted = loadPersistedBout(boutId)
    if (persisted) {
      setLog(persisted.log)
      setClockMs(persisted.clockMs)
      setAwardMs(persisted.awardMs ?? null)
      if (persisted.clockMs <= ATOSHI_MS) atoshiFiredRef.current = true
      toast.info("Resumed bout in progress")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boutId])

  // persist on change
  useEffect(() => {
    if (!boutId) return
    if (log.length === 0 && clockMs === settings.durationMs && awardMs === null) return
    persistBout(boutId, {
      log,
      clockMs,
      durationMs: settings.durationMs,
      winByGap: settings.winByGap,
      awardMs,
    })
  }, [boutId, log, clockMs, awardMs, settings.durationMs, settings.winByGap])

  // ticking — main clock
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setClockMs((ms) => Math.max(0, ms - 100))
    }, 100)
    return () => window.clearInterval(id)
  }, [running])

  // ticking — awarding window. Unlike the main clock this isn't
  // start/pause-able: once started it runs on its own, since it's meant to
  // be a short, unambiguous grace period rather than something the operator
  // manages while also trying to score a play.
  useEffect(() => {
    if (!awarding) return
    const id = window.setInterval(() => {
      setAwardMs((ms) => tickAward(ms, 100))
    }, 100)
    return () => window.clearInterval(id)
  }, [awarding])

  // atoshi baraku signal
  useEffect(() => {
    if (atoshiBaraku && running && !atoshiFiredRef.current) {
      atoshiFiredRef.current = true
      if (settings.soundOn) playAtoshiBaraku()
    }
  }, [atoshiBaraku, running, settings.soundOn])

  // time up: buzzer fires as before, but instead of locking the bout
  // immediately this starts the awarding window (unless the bout already
  // ended decisively at the same instant — startAwardingWindow no-ops then).
  useEffect(() => {
    if (clockMs === 0 && running) {
      setRunning(false)
      if (!endFiredRef.current) {
        endFiredRef.current = true
        if (settings.soundOn) playEndBuzzer()
      }
      setAwardMs((prev) => startAwardingWindow(state.ended, prev, settings.awardWindowMs))
    }
  }, [clockMs, running, settings.soundOn, settings.awardWindowMs, state.ended])

  // awarding window closed (naturally ticked to 0, or "Finalize result"
  // clicked) — this is the moment the bout actually locks, so this is where
  // the resolution dialog opens rather than at the buzzer itself.
  useEffect(() => {
    if (awardMs === 0 && !awardFiredRef.current) {
      awardFiredRef.current = true
      setResolutionOpen(true)
    }
  }, [awardMs])

  // bout ended by state (gap / hansoku / kiken) — always locks immediately,
  // award window or not: there's nothing left to wait for once the bout is
  // decisively over.
  useEffect(() => {
    if (state.ended && !endFiredRef.current) {
      endFiredRef.current = true
      awardFiredRef.current = true // a decisive ending pre-empts the window
      setRunning(false)
      setAwardMs(0)
      if (settings.soundOn) playEndBuzzer()
      setResolutionOpen(true)
    }
    if (!state.ended && endFiredRef.current && clockMs > 0) {
      // e.g. the ending action was undone
      endFiredRef.current = false
    }
  }, [state.ended, settings.soundOn, clockMs])

  // -- broadcast to display window -------------------------------------------
  const channelRef = useRef<BroadcastChannel | null>(null)
  const payloadRef = useRef<DisplayPayload | null>(null)

  const resolution = useMemo(() => resolveOutcome(state), [state])
  const boutOver = isBoutOver({ ended: state.ended, clockMs, awardMs })

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      if (e.data?.type === "hello" && payloadRef.current) {
        channel.postMessage(payloadRef.current)
      }
    }
    return () => {
      channel.postMessage({ type: "closed" } satisfies ChannelMessage)
      channel.close()
    }
  }, [])

  useEffect(() => {
    if (!bout) return
    const winnerSide = boutOver ? (hanteiWinner ?? resolution.winner) : null
    const payload: DisplayPayload = {
      type: "state",
      boutId: bout.id!,
      categoryLabel: draw
        ? `${draw.division.name}${draw.weightClass ? ` · ${draw.weightClass.name}` : ""}`
        : "",
      roundLabel: bout.phase === "REPECHAGE" ? "Repechage" : `Round ${bout.round}`,
      aka: {
        name: bout.aka?.name ?? "",
        clubName: bout.aka?.clubName ?? "",
        points: sidePoints(state.aka),
        yuko: state.aka.yuko,
        wazaari: state.aka.wazaari,
        ippon: state.aka.ippon,
        penalty: state.aka.penalty,
        senshu: state.aka.senshu,
      },
      ao: {
        name: bout.ao?.name ?? "",
        clubName: bout.ao?.clubName ?? "",
        points: sidePoints(state.ao),
        yuko: state.ao.yuko,
        wazaari: state.ao.wazaari,
        ippon: state.ao.ippon,
        penalty: state.ao.penalty,
        senshu: state.ao.senshu,
      },
      clockMs,
      running,
      atoshiBaraku,
      ended: boutOver,
      winnerSide,
      winnerName: winnerSide ? (winnerSide === "aka" ? bout.aka?.name : bout.ao?.name) ?? null : null,
      outcome: boutOver ? resolution.outcome : null,
      soundOn: settings.soundOn,
      displayFlip,
    }
    payloadRef.current = payload
    channelRef.current?.postMessage(payload)
  }, [bout, draw, state, clockMs, running, atoshiBaraku, boutOver, resolution, hanteiWinner, settings.soundOn, displayFlip])

  // -- actions ----------------------------------------------------------------
  const now = () => Date.now()
  const dispatch = useCallback((action: BoutAction) => {
    setLog((prev) => [...prev, action])
  }, [])

  const score = (side: Side, kind: ScoreKind) => {
    dispatch({ type: "SCORE", side, kind, at: now(), postTime: awarding })
    if (settings.soundOn) playScoreBlip()
  }
  const removeLastScore = (side: Side) => {
    setLog((prev) => {
      const idx = [...prev].reverse().findIndex((a) => a.type === "SCORE" && a.side === side)
      if (idx === -1) return prev
      const cut = prev.length - 1 - idx
      return [...prev.slice(0, cut), ...prev.slice(cut + 1)]
    })
  }
  const setPenalty = (side: Side, level: number) =>
    dispatch({ type: "PENALTY", side, level, at: now(), postTime: awarding })
  const toggleSenshu = (side: Side) =>
    dispatch({ type: "SENSHU", side: state[side].senshu ? null : side, at: now(), postTime: awarding })
  const kiken = (side: Side) => dispatch({ type: "KIKEN", side, at: now(), postTime: awarding })
  const undo = () => setLog((prev) => prev.slice(0, -1))

  const resetBout = () => {
    setLog([])
    setClockMs(settings.durationMs)
    setRunning(false)
    setAwardMs(null)
    setResolutionOpen(false)
    setHanteiWinner(null)
    atoshiFiredRef.current = false
    endFiredRef.current = false
    awardFiredRef.current = false
    if (boutId) clearPersistedBout(boutId)
  }

  // Only adjusts the main clock, so it's a no-op once that clock is spent —
  // "more time" past the buzzer is what the awarding window (and Finalize
  // result) is for now, not winding the main clock back up.
  const adjustClock = (deltaMs: number) =>
    setClockMs((ms) => {
      if (ms === 0) return ms
      const next = Math.max(0, Math.min(settings.durationMs, ms + deltaMs))
      // Re-arm the signals when the timekeeper winds the clock back up
      if (next > 0) endFiredRef.current = false
      if (next > ATOSHI_MS) atoshiFiredRef.current = false
      return next
    })

  const finalizeResult = () => setAwardMs(finalizeAwardingWindow())

  const saveResult = async () => {
    if (!drawId || !boutId || !bout?.aka || !bout?.ao) return
    const winnerSide = hanteiWinner ?? resolution.winner
    if (!winnerSide) {
      toast.error("Pick the hantei winner first")
      return
    }
    setSaving(true)
    try {
      await setBoutScore(drawId, boutId, {
        winnerEntryId: winnerSide === "aka" ? bout.aka.entryId : bout.ao.entryId,
        outcome: hanteiWinner ? "HANTEI" : resolution.outcome,
        akaScore: sidePoints(state.aka),
        aoScore: sidePoints(state.ao),
        postTime: anyPostTime(state.log),
        scoreJson: JSON.stringify({
          aka: state.aka,
          ao: state.ao,
          durationMs: settings.durationMs,
          winByGap: settings.winByGap,
          log: state.log,
        }),
      })
      clearPersistedBout(boutId)
      toast.success("Result saved")
      navigate("/draws")
    } catch (e) {
      apiError(e, "Could not save the result")
    } finally {
      setSaving(false)
    }
  }

  const saveWinnerOnly = async (side: Side) => {
    if (!drawId || !boutId || !bout?.aka || !bout?.ao) return
    setSaving(true)
    try {
      await setBoutWinner(drawId, boutId, side === "aka" ? bout.aka.entryId : bout.ao.entryId)
      clearPersistedBout(boutId)
      toast.success("Winner saved")
      navigate("/draws")
    } catch (e) {
      apiError(e, "Could not save the winner")
    } finally {
      setSaving(false)
    }
  }

  // -- guards -----------------------------------------------------------------
  // The permission check needs the draw's eventId, so it waits for the load
  // rather than flashing a denial at a coordinator on the first render.
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
        <p>Only admins and this event's coordinators can operate the scoreboard.</p>
      </div>
    )
  }
  if (!bout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Bout not found in this draw.</p>
        <Button variant="secondary" onClick={() => navigate("/draws")}>
          <ArrowLeft className="h-4 w-4" /> Back to draws
        </Button>
      </div>
    )
  }
  if (!bout.aka || !bout.ao) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Both fighters must be known before this bout can be scored.</p>
        <Button variant="secondary" onClick={() => navigate("/draws")}>
          <ArrowLeft className="h-4 w-4" /> Back to draws
        </Button>
      </div>
    )
  }

  const controlsDisabled = boutOver || saving
  const winnerSide = hanteiWinner ?? resolution.winner

  const renderSide = (side: Side) => {
    const fighter = side === "aka" ? bout.aka! : bout.ao!
    const s = state[side]
    return (
      <SidePanel
        side={side}
        name={fighter.name}
        clubName={fighter.clubName}
        points={sidePoints(s)}
        penalty={s.penalty}
        senshu={s.senshu}
        disabled={controlsDisabled}
        onScore={(k) => score(side, k)}
        onMinus={() => removeLastScore(side)}
        onPenalty={(l) => setPenalty(side, l)}
        onSenshu={() => toggleSenshu(side)}
        onKiken={() => kiken(side)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* top bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Button variant="ghost" size="sm" className="text-white/80" onClick={() => navigate("/draws")}>
          <ArrowLeft className="h-4 w-4" /> Draws
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
          onClick={toggleControlSides}
          title="Swap AKA / AO sides on this control panel"
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
        <Button variant="ghost" size="sm" className="text-white/80" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      {/* panels */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
        {renderSide(akaOnLeft ? "aka" : "ao")}

        {/* centre column */}
        <div className="flex w-full flex-col items-center justify-center gap-4 bg-black px-6 py-6 md:w-72">
          <p
            data-testid="clock"
            className={cn(
              "font-mono text-6xl font-bold tabular-nums sm:text-7xl",
              atoshiBaraku ? "animate-pulse text-red-500" : "text-white",
            )}
          >
            {formatClock(clockMs)}
          </p>
          {atoshiBaraku && (
            <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
              Atoshi baraku
            </p>
          )}

          {/* Post-buzzer awarding window: real-world case is a valid technique
              landed just before the buzzer — the clock is done, but scoring
              stays open a little longer rather than locking instantly. */}
          {awarding && (
            <div
              data-testid="awarding-banner"
              className="flex w-full flex-col items-center gap-1 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-center"
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Time expired — awarding score if any
              </p>
              <p data-testid="award-clock" className="font-mono text-2xl font-bold tabular-nums text-amber-300">
                {formatClock(awardMs ?? 0)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/10 text-white hover:bg-white/25"
              disabled={saving || state.ended !== null || clockMs === 0}
              onClick={() => adjustClock(-10_000)}
              title="-10 seconds"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              className={cn(
                "h-16 w-32 text-lg",
                running ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700",
              )}
              disabled={saving || state.ended !== null || clockMs === 0}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              {running ? "Yame" : "Hajime"}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/10 text-white hover:bg-white/25"
              disabled={saving || state.ended !== null || clockMs === 0}
              onClick={() => adjustClock(10_000)}
              title="+10 seconds"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/25"
              disabled={log.length === 0 || saving}
              onClick={undo}
            >
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/25"
              disabled={saving}
              onClick={resetBout}
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>

          <p className="text-center text-[11px] text-white/40">
            Win by {settings.winByGap} points gap · {formatClock(settings.durationMs)} bout
          </p>

          {awarding ? (
            <Button
              className="bg-amber-500 text-black hover:bg-amber-600"
              disabled={saving}
              onClick={finalizeResult}
            >
              <Flag className="h-4 w-4" />
              Finalize result
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/30"
              disabled={saving}
              onClick={() => setResolutionOpen(true)}
            >
              End bout / result
            </Button>
          )}
        </div>

        {renderSide(akaOnLeft ? "ao" : "aka")}
      </div>

      {/* resolution dialog */}
      <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bout result</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-center font-mono text-4xl font-bold">
              <span className="text-flag-red">{sidePoints(state.aka)}</span>
              <span className="mx-3 text-muted-foreground">–</span>
              <span className="text-belt-blue">{sidePoints(state.ao)}</span>
            </p>
            {resolution.winner ? (
              <p className="text-center text-sm">
                Winner:{" "}
                <span className="font-semibold">
                  {resolution.winner === "aka" ? bout.aka.name : bout.ao.name}
                </span>{" "}
                <span className="text-muted-foreground">({resolution.outcome.toLowerCase()})</span>
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Tied with no senshu — hantei (judges' decision):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={hanteiWinner === "aka" ? "default" : "outline"}
                    className={cn(hanteiWinner === "aka" && "bg-red-700 hover:bg-red-800")}
                    onClick={() => setHanteiWinner("aka")}
                  >
                    {bout.aka.name}
                  </Button>
                  <Button
                    variant={hanteiWinner === "ao" ? "default" : "outline"}
                    className={cn(hanteiWinner === "ao" && "bg-blue-800 hover:bg-blue-900")}
                    onClick={() => setHanteiWinner("ao")}
                  >
                    {bout.ao.name}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setResolutionOpen(false)} disabled={saving}>
              Continue bout
            </Button>
            <Button onClick={saveResult} disabled={saving || !winnerSide}>
              {saving ? "Saving…" : "Save result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scoreboard settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Bout duration</Label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((ms) => (
                  <Button
                    key={ms}
                    size="sm"
                    variant={settings.durationMs === ms ? "default" : "outline"}
                    onClick={() => {
                      updateSettings({ durationMs: ms })
                      if (log.length === 0 && !running) setClockMs(ms)
                    }}
                  >
                    {formatClock(ms)}
                  </Button>
                ))}
                <Input
                  type="number"
                  min={10}
                  max={600}
                  className="w-24"
                  placeholder="secs"
                  value={Math.round(settings.durationMs / 1000)}
                  onChange={(e) => {
                    const secs = Number(e.target.value)
                    if (Number.isFinite(secs) && secs >= 10 && secs <= 600) {
                      updateSettings({ durationMs: secs * 1000 })
                      if (log.length === 0 && !running) setClockMs(secs * 1000)
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Win-by points gap</Label>
              <Input
                type="number"
                min={2}
                max={20}
                className="w-24"
                value={settings.winByGap}
                onChange={(e) => {
                  const gap = Number(e.target.value)
                  if (Number.isFinite(gap) && gap >= 2 && gap <= 20) updateSettings({ winByGap: gap })
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Awarding window after time expires</Label>
              <Input
                type="number"
                min={0}
                max={120}
                className="w-24"
                placeholder="secs"
                value={Math.round(settings.awardWindowMs / 1000)}
                onChange={(e) => {
                  const secs = Number(e.target.value)
                  if (Number.isFinite(secs) && secs >= 0 && secs <= 120) {
                    updateSettings({ awardWindowMs: secs * 1000 })
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How long scoring stays open after the buzzer for a technique landed
                just before time — e.g. judges awarding a score seen right at the buzzer.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Sounds (atoshi baraku + end buzzer)</Label>
              <Button
                size="sm"
                variant={settings.soundOn ? "default" : "outline"}
                onClick={() => updateSettings({ soundOn: !settings.soundOn })}
              >
                {settings.soundOn ? "On" : "Off"}
              </Button>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Projected display sides</Label>
                <Button size="sm" variant="outline" onClick={toggleDisplaySides}>
                  <ArrowLeftRight className="h-4 w-4" />
                  {displayFlip ? "AKA right" : "AKA left"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Swaps AKA/AO on the spectator screen — set this to match how the display faces the floor.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Skip scoring — record only the winner (as before):
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" disabled={saving} onClick={() => saveWinnerOnly("aka")}>
                  {bout.aka.name} won
                </Button>
                <Button variant="outline" size="sm" disabled={saving} onClick={() => saveWinnerOnly("ao")}>
                  {bout.ao.name} won
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
