import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

import { useToast } from "@/components/Toast"
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
import { PodiumBanner } from "@/components/scoreboard/PodiumBanner"
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
  type PodiumMedalist,
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
          {clubName && <p className="truncate text-sm text-white/70">{clubName}</p>}
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

export interface BoutScoreboardFighter {
  name: string
  clubName: string
}

export interface BoutScoreboardSaveResult {
  winnerSide: Side
  outcome: Outcome
  akaScore: number
  aoScore: number
  postTime: boolean
  scoreJson: string
}

export interface BoutScoreboardProps {
  aka: BoutScoreboardFighter
  ao: BoutScoreboardFighter
  categoryLabel: string
  roundLabel: string
  backLabel: string
  onBack: () => void
  /**
   * Unique per real bout, used to key the crash/refresh localStorage resume.
   * Pass null to disable persistence entirely — nothing is written or
   * resumed, so state is purely in-memory and disappears on refresh/nav.
   */
  persistKey: string | null
  saving?: boolean
  /**
   * Omit to hide the save flow entirely. When present, the resolution
   * dialog's primary action calls this with the computed result instead of
   * writing anywhere itself — the caller owns the actual persistence.
   */
  onSaveResult?: (result: BoutScoreboardSaveResult) => Promise<void>
  onSaveWinnerOnly?: (side: Side) => Promise<void>
  /**
   * Adds a "Call it a draw" option next to the hantei picker. Real bouts
   * never get this — WKF rules require a decisive winner for bracket
   * progression — but a practice bout has no bracket to progress.
   */
  allowDrawDeclaration?: boolean
  /**
   * Fired once, the first time the clock starts (Hajime), so other viewers
   * of the draw can tell this bout is underway. Best-effort status ping,
   * not a live score feed — omit for bouts with nothing to ping (practice).
   */
  onBoutStarted?: () => void
  /**
   * Both bronze medalists, present only when this bout is the tournament
   * final and both repechage bronze bouts are already decided elsewhere in
   * the bracket. Gold/silver are filled in here from this bout's own live
   * resolution (winnerSide + aka/ao identity) — not from anything saved —
   * so the podium can appear the instant a winner is known, before Save is
   * even clicked. Omit for practice bouts (no bracket to be a final of).
   */
  finalBronzeMedalists?: [PodiumMedalist, PodiumMedalist] | null
}

export function BoutScoreboard({
  aka,
  ao,
  categoryLabel,
  roundLabel,
  backLabel,
  onBack,
  persistKey,
  saving = false,
  onSaveResult,
  onSaveWinnerOnly,
  allowDrawDeclaration = false,
  onBoutStarted,
  finalBronzeMedalists,
}: BoutScoreboardProps) {
  const toast = useToast()

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
  const [declaredDraw, setDeclaredDraw] = useState(false)
  const atoshiFiredRef = useRef(false)
  const endFiredRef = useRef(false)
  const awardFiredRef = useRef(false)
  const startedFiredRef = useRef(false)

  const atoshiBaraku = clockMs <= ATOSHI_MS && clockMs > 0
  const awarding = awardMs !== null && awardMs > 0

  // resume persisted bout on mount
  useEffect(() => {
    if (!persistKey) return
    const persisted = loadPersistedBout(persistKey)
    if (persisted) {
      setLog(persisted.log)
      setClockMs(persisted.clockMs)
      setAwardMs(persisted.awardMs ?? null)
      if (persisted.clockMs <= ATOSHI_MS) atoshiFiredRef.current = true
      toast.info("Resumed bout in progress")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey])

  // persist on change
  useEffect(() => {
    if (!persistKey) return
    if (log.length === 0 && clockMs === settings.durationMs && awardMs === null) return
    persistBout(persistKey, {
      log,
      clockMs,
      durationMs: settings.durationMs,
      winByGap: settings.winByGap,
      awardMs,
    })
  }, [persistKey, log, clockMs, awardMs, settings.durationMs, settings.winByGap])

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
    const winnerSide = boutOver ? (hanteiWinner ?? resolution.winner) : null
    const podium =
      winnerSide && finalBronzeMedalists
        ? {
            gold: winnerSide === "aka" ? aka : ao,
            silver: winnerSide === "aka" ? ao : aka,
            bronze: finalBronzeMedalists,
          }
        : null
    const payload: DisplayPayload = {
      type: "state",
      boutId: persistKey ?? "practice",
      categoryLabel,
      roundLabel,
      aka: {
        name: aka.name,
        clubName: aka.clubName,
        points: sidePoints(state.aka),
        yuko: state.aka.yuko,
        wazaari: state.aka.wazaari,
        ippon: state.aka.ippon,
        penalty: state.aka.penalty,
        senshu: state.aka.senshu,
      },
      ao: {
        name: ao.name,
        clubName: ao.clubName,
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
      winnerName: winnerSide ? (winnerSide === "aka" ? aka.name : ao.name) : null,
      outcome: boutOver ? resolution.outcome : null,
      soundOn: settings.soundOn,
      displayFlip,
      podium,
    }
    payloadRef.current = payload
    channelRef.current?.postMessage(payload)
  }, [aka, ao, categoryLabel, roundLabel, persistKey, state, clockMs, running, atoshiBaraku, boutOver, resolution, hanteiWinner, settings.soundOn, displayFlip, finalBronzeMedalists])

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

  const toggleRunning = () =>
    setRunning((r) => {
      if (!r && !startedFiredRef.current) {
        startedFiredRef.current = true
        onBoutStarted?.()
      }
      return !r
    })

  const resetBout = () => {
    setLog([])
    setClockMs(settings.durationMs)
    setRunning(false)
    setAwardMs(null)
    setResolutionOpen(false)
    setHanteiWinner(null)
    setDeclaredDraw(false)
    atoshiFiredRef.current = false
    endFiredRef.current = false
    awardFiredRef.current = false
    if (persistKey) clearPersistedBout(persistKey)
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

  const handleSaveResult = async () => {
    if (!onSaveResult) return
    const winner = hanteiWinner ?? resolution.winner
    if (!winner) {
      toast.error("Pick the hantei winner first")
      return
    }
    try {
      await onSaveResult({
        winnerSide: winner,
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
      if (persistKey) clearPersistedBout(persistKey)
    } catch {
      // the caller surfaces its own error feedback (toast, etc.)
    }
  }

  const handleSaveWinnerOnly = async (side: Side) => {
    if (!onSaveWinnerOnly) return
    try {
      await onSaveWinnerOnly(side)
      if (persistKey) clearPersistedBout(persistKey)
    } catch {
      // the caller surfaces its own error feedback (toast, etc.)
    }
  }

  const controlsDisabled = boutOver || saving
  const winnerSide = hanteiWinner ?? resolution.winner
  const bannerSide: Side | "draw" | null = declaredDraw ? "draw" : winnerSide
  // Gold/silver come from this bout's own live resolution, not from
  // anything saved — the podium can complete the instant a winner is known.
  const podium =
    winnerSide && finalBronzeMedalists
      ? {
          gold: winnerSide === "aka" ? aka : ao,
          silver: winnerSide === "aka" ? ao : aka,
          bronze: finalBronzeMedalists,
        }
      : null

  const renderSide = (side: Side) => {
    const fighter = side === "aka" ? aka : ao
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
        <Button variant="ghost" size="sm" className="text-white/80" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-white/80">
          {categoryLabel}
          {roundLabel ? ` — ${roundLabel}` : ""}
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

          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30">
              Adjust clock
            </p>
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
                onClick={toggleRunning}
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
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-white/60 hover:bg-white/10 hover:text-white"
                disabled={saving || state.ended !== null || clockMs === 0}
                onClick={() => adjustClock(-1_000)}
                title="-1 second"
              >
                -1s
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-white/60 hover:bg-white/10 hover:text-white"
                disabled={saving || state.ended !== null || clockMs === 0}
                onClick={() => adjustClock(1_000)}
                title="+1 second"
              >
                +1s
              </Button>
            </div>
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
        <DialogContent className={cn("sm:max-w-md", podium && "sm:max-w-2xl")}>
          <DialogHeader>
            <DialogTitle>Bout result</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-center font-mono text-4xl font-bold">
              <span className="text-flag-red">{sidePoints(state.aka)}</span>
              <span className="mx-3 text-muted-foreground">–</span>
              <span className="text-belt-blue">{sidePoints(state.ao)}</span>
            </p>
            {bannerSide === "draw" ? (
              <div className="space-y-1 rounded-lg border-4 border-muted-foreground/30 bg-muted/40 py-3 text-center">
                <p className="text-4xl font-black uppercase tracking-wide text-muted-foreground sm:text-5xl">
                  Draw
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setDeclaredDraw(false)}>
                  Change
                </Button>
              </div>
            ) : winnerSide ? (
              <div className="space-y-2">
                {/* Big, unambiguous, readable at a glance — the yellow ring
                    mirrors the projector's winning-side highlight so both
                    screens read as "the same signal" at a distance. */}
                <div
                  className={cn(
                    "space-y-1 rounded-lg border-4 py-3 text-center ring-4 ring-yellow-400",
                    winnerSide === "aka" ? "border-flag-red bg-flag-red/10" : "border-belt-blue bg-belt-blue/10",
                  )}
                >
                  <p
                    className={cn(
                      "text-4xl font-black uppercase tracking-wide sm:text-5xl",
                      winnerSide === "aka" ? "text-flag-red" : "text-belt-blue",
                    )}
                  >
                    {winnerSide === "aka" ? "AKA" : "AO"} wins
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {winnerSide === "aka" ? aka.name : ao.name}{" "}
                    <span>({(hanteiWinner ? "HANTEI" : resolution.outcome).toLowerCase()})</span>
                  </p>
                  {!resolution.winner && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setHanteiWinner(null)}>
                      Change hantei pick
                    </Button>
                  )}
                </div>
                {podium && (
                  <div className="rounded-lg bg-zinc-950 px-3 py-4">
                    <PodiumBanner podium={podium} variant="dialog" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Tied with no senshu — hantei (judges' decision):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="hover:bg-red-700 hover:text-white"
                    onClick={() => setHanteiWinner("aka")}
                  >
                    {aka.name}
                  </Button>
                  <Button
                    variant="outline"
                    className="hover:bg-blue-800 hover:text-white"
                    onClick={() => setHanteiWinner("ao")}
                  >
                    {ao.name}
                  </Button>
                </div>
                {allowDrawDeclaration && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setDeclaredDraw(true)}>
                    Call it a draw
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setResolutionOpen(false)} disabled={saving}>
              Continue bout
            </Button>
            {onSaveResult ? (
              <Button onClick={handleSaveResult} disabled={saving || (!winnerSide && !declaredDraw)}>
                {saving ? "Saving…" : "Save result"}
              </Button>
            ) : (
              <Button onClick={resetBout}>
                <RotateCcw className="h-4 w-4" /> New bout
              </Button>
            )}
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
            {onSaveWinnerOnly && (
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Skip scoring — record only the winner (as before):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" disabled={saving} onClick={() => handleSaveWinnerOnly("aka")}>
                    {aka.name} won
                  </Button>
                  <Button variant="outline" size="sm" disabled={saving} onClick={() => handleSaveWinnerOnly("ao")}>
                    {ao.name} won
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
