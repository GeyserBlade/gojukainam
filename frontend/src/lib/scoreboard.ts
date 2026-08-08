/**
 * WKF kumite scoreboard state: pure action-log reducer, cross-window
 * broadcast, persistence and sounds. The control page owns the state; the
 * display window renders broadcast snapshots.
 *
 * Rules implemented (latest WKF ruleset):
 * - Points: Yuko 1, Waza-ari 2, Ippon 3
 * - Penalties: Chui 1 -> Chui 2 -> Chui 3 -> Hansoku-chui -> Hansoku (DQ)
 * - Senshu: first unopposed score; operator can override
 * - Win: gap (default 8), points at time, senshu on tie, hantei otherwise
 */

export type Side = "aka" | "ao"

export const PENALTY_LABELS = ["C1", "C2", "C3", "HC", "H"] as const
export const PENALTY_FULL_NAMES = [
  "Chui 1",
  "Chui 2",
  "Chui 3",
  "Hansoku-chui",
  "Hansoku",
] as const
export const HANSOKU_LEVEL = 5 // penalty value when H is reached (1-based)

export type ScoreKind = "yuko" | "wazaari" | "ippon"
export const SCORE_POINTS: Record<ScoreKind, number> = { yuko: 1, wazaari: 2, ippon: 3 }

// `postTime` marks an action entered during the post-buzzer awarding window
// (see BoutClockState below) — optional and defaulting to falsy everywhere
// it's read, so existing persisted logs from before this field existed
// replay identically.
export type BoutAction =
  | { type: "SCORE"; side: Side; kind: ScoreKind; at: number; postTime?: boolean }
  | { type: "PENALTY"; side: Side; level: number; at: number; postTime?: boolean } // set ladder level 0..5
  | { type: "SENSHU"; side: Side | null; at: number; postTime?: boolean } // manual override / clear
  | { type: "KIKEN"; side: Side; at: number; postTime?: boolean } // side withdraws -> opponent wins

/** True if any action in the log was entered after the clock expired. */
export function anyPostTime(log: BoutAction[]): boolean {
  return log.some((a) => a.postTime === true)
}

export interface SideScore {
  yuko: number
  wazaari: number
  ippon: number
  penalty: number // 0 = clean, 1..5 = C1..H
  senshu: boolean
}

export interface BoutScoreState {
  aka: SideScore
  ao: SideScore
  /** Side whose senshu came from a manual override (freezes auto-award) */
  senshuManual: boolean
  ended: null | "GAP" | "HANSOKU" | "KIKEN"
  log: BoutAction[]
}

export const emptySide = (): SideScore => ({
  yuko: 0,
  wazaari: 0,
  ippon: 0,
  penalty: 0,
  senshu: false,
})

export const initialBoutState = (): BoutScoreState => ({
  aka: emptySide(),
  ao: emptySide(),
  senshuManual: false,
  ended: null,
  log: [],
})

export const sidePoints = (s: SideScore): number =>
  s.yuko * SCORE_POINTS.yuko + s.wazaari * SCORE_POINTS.wazaari + s.ippon * SCORE_POINTS.ippon

const other = (side: Side): Side => (side === "aka" ? "ao" : "aka")

/** Replay the whole action log into a state (undo = pop log + replay). */
export function replayLog(log: BoutAction[], winByGap: number): BoutScoreState {
  const state = initialBoutState()

  for (const action of log) {
    if (state.ended) break // no scoring after the bout ended

    switch (action.type) {
      case "SCORE": {
        const me = state[action.side]
        me[action.kind]++
        // Senshu: first unopposed score, unless manually overridden
        if (
          !state.senshuManual &&
          !state.aka.senshu &&
          !state.ao.senshu &&
          sidePoints(state[other(action.side)]) === 0
        ) {
          me.senshu = true
        }
        break
      }
      case "PENALTY": {
        const level = Math.max(0, Math.min(HANSOKU_LEVEL, action.level))
        state[action.side].penalty = level
        if (level === HANSOKU_LEVEL) state.ended = "HANSOKU"
        break
      }
      case "SENSHU": {
        state.senshuManual = true
        state.aka.senshu = action.side === "aka"
        state.ao.senshu = action.side === "ao"
        break
      }
      case "KIKEN": {
        state.ended = "KIKEN"
        break
      }
    }

    if (!state.ended && Math.abs(sidePoints(state.aka) - sidePoints(state.ao)) >= winByGap) {
      state.ended = "GAP"
    }
  }

  state.log = log
  return state
}

/** The side that loses by hansoku/kiken, when the bout ended that way. */
export function endedLoser(state: BoutScoreState): Side | null {
  if (state.ended === "HANSOKU")
    return state.aka.penalty === HANSOKU_LEVEL ? "aka" : "ao"
  if (state.ended === "KIKEN") {
    const kiken = [...state.log].reverse().find((a) => a.type === "KIKEN")
    return kiken && kiken.type === "KIKEN" ? kiken.side : null
  }
  return null
}

export type Outcome = "POINTS" | "GAP" | "SENSHU" | "HANTEI" | "HANSOKU" | "KIKEN"

export interface Resolution {
  winner: Side | null // null -> hantei required, operator must pick
  outcome: Outcome
}

/** Decide the winner per WKF once the bout is over (clock done or ended). */
export function resolveOutcome(state: BoutScoreState): Resolution {
  const loser = endedLoser(state)
  if (state.ended === "HANSOKU" && loser)
    return { winner: other(loser), outcome: "HANSOKU" }
  if (state.ended === "KIKEN" && loser)
    return { winner: other(loser), outcome: "KIKEN" }

  const pa = sidePoints(state.aka)
  const po = sidePoints(state.ao)
  if (pa !== po)
    return { winner: pa > po ? "aka" : "ao", outcome: state.ended === "GAP" ? "GAP" : "POINTS" }
  if (state.aka.senshu) return { winner: "aka", outcome: "SENSHU" }
  if (state.ao.senshu) return { winner: "ao", outcome: "SENSHU" }
  return { winner: null, outcome: "HANTEI" }
}

// ---------------------------------------------------------------------------
// Post-buzzer awarding window
//
// The bout clock (clockMs, tracked in the page, not here) is unaffected: it
// still runs down to 0 and buzzes exactly as before. What changes is what
// happens next. Previously hitting 0 disabled scoring immediately. Now:
// hitting 0 starts a short second countdown (`awardMs`) during which
// scoring stays open — real-world case: judges saw a valid technique just
// before the buzzer and need a moment to award it. Modelled as
// `number | null` rather than a named-state machine because the rest of
// this page is already written in that reactive/derived style (`boutOver`,
// `resolution` etc. are plain computed values, not stored state) — null
// means "not in a window", a number means "counting down (or spent, at 0)".
//
// Deliberately kept separate from `BoutScoreState.ended`: a decisive
// in-bout ending (gap win / hansoku / kiken) always locks the bout
// immediately regardless of the award window, exactly as it did before this
// feature existed — see `isBoutOver`.

export const DEFAULT_AWARD_WINDOW_MS = 30_000

/**
 * One tick of the awarding countdown. No-op if not currently in a window
 * (null) or already exhausted (0) — mirrors how the main clock's own
 * `Math.max(0, ms - delta)` ticking is written in Scoreboard.tsx.
 */
export function tickAward(awardMs: number | null, deltaMs: number): number | null {
  if (awardMs === null || awardMs <= 0) return awardMs
  return Math.max(0, awardMs - deltaMs)
}

/**
 * Called when the main clock reaches zero. Starts the window unless the
 * bout is already decisively over (no window needed — there's nothing left
 * to award) or a window has already been started (idempotent, so this is
 * safe to call from an effect that might re-fire).
 */
export function startAwardingWindow(
  ended: BoutScoreState["ended"],
  awardMs: number | null,
  awardWindowMs: number,
): number | null {
  if (ended !== null) return awardMs
  if (awardMs !== null) return awardMs
  return awardWindowMs
}

/** Operator clicks "Finalize result" — closes the window immediately. */
export function finalizeAwardingWindow(): number {
  return 0
}

/**
 * Whether the bout is locked (no more scoring, resolution stands). A
 * decisive ending always locks it. Otherwise it's locked once the clock has
 * hit zero *and* there is no active awarding window still counting down —
 * i.e. the window was never entered, has been spent, or was finalized early.
 */
export function isBoutOver(params: {
  ended: BoutScoreState["ended"]
  clockMs: number
  awardMs: number | null
}): boolean {
  const inAwardingWindow = params.awardMs !== null && params.awardMs > 0
  return params.ended !== null || (params.clockMs === 0 && !inAwardingWindow)
}

// ---------------------------------------------------------------------------
// Settings (persisted globally)

export interface ScoreboardSettings {
  durationMs: number
  winByGap: number
  soundOn: boolean
  /** Post-buzzer awarding window length. Configurable, unlike the v1 brief's
   *  "say 30 seconds, configurable later" — it's the exact same settings
   *  pattern as durationMs/winByGap, so there was no reason to hardcode it. */
  awardWindowMs: number
}

export const DEFAULT_SETTINGS: ScoreboardSettings = {
  durationMs: 120_000, // 2:00
  winByGap: 8,
  soundOn: true,
  awardWindowMs: DEFAULT_AWARD_WINDOW_MS,
}

export const DURATION_PRESETS = [60_000, 90_000, 120_000, 180_000]

const SETTINGS_KEY = "scoreboard:settings"

export function loadSettings(): ScoreboardSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* corrupted -> defaults */
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: ScoreboardSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ---------------------------------------------------------------------------
// In-progress bout persistence (crash/refresh resume)

export interface PersistedBout {
  log: BoutAction[]
  clockMs: number
  durationMs: number
  winByGap: number
  /** null = not in the awarding window; persisted so a refresh mid-window
   *  resumes where it left off instead of granting a fresh window. */
  awardMs: number | null
}

const boutKey = (boutId: string) => `scoreboard:bout:${boutId}`

export function loadPersistedBout(boutId: string): PersistedBout | null {
  try {
    const raw = localStorage.getItem(boutKey(boutId))
    return raw ? (JSON.parse(raw) as PersistedBout) : null
  } catch {
    return null
  }
}

export function persistBout(boutId: string, data: PersistedBout) {
  localStorage.setItem(boutKey(boutId), JSON.stringify(data))
}

export function clearPersistedBout(boutId: string) {
  localStorage.removeItem(boutKey(boutId))
}

// ---------------------------------------------------------------------------
// Cross-window broadcast (control -> display)

export const CHANNEL_NAME = "gojukai-scoreboard"

export interface DisplaySide {
  name: string
  clubName: string
  points: number
  yuko: number
  wazaari: number
  ippon: number
  penalty: number
  senshu: boolean
}

export interface DisplayPayload {
  type: "state"
  boutId: string
  categoryLabel: string
  roundLabel: string
  aka: DisplaySide
  ao: DisplaySide
  clockMs: number
  running: boolean
  atoshiBaraku: boolean
  ended: boolean
  winnerSide: Side | null
  winnerName: string | null
  outcome: Outcome | null
  soundOn: boolean
  /** Operator's requested display orientation: true = AKA on right (swapped). */
  displayFlip: boolean
}

export type ChannelMessage = DisplayPayload | { type: "hello" } | { type: "closed" }

// ---------------------------------------------------------------------------
// Sounds (Web Audio, no assets)

let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === "suspended") void audioCtx.resume()
  return audioCtx
}

function tone(frequency: number, startAt: number, duration: number, volume: number, type: OscillatorType) {
  const ac = ctx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, ac.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime + startAt)
  osc.stop(ac.currentTime + startAt + duration)
}

/** Three short beeps: 15 seconds remaining (atoshi baraku). */
export function playAtoshiBaraku() {
  for (let i = 0; i < 3; i++) tone(880, i * 0.25, 0.15, 0.6, "square")
}

/** Long loud buzzer: end of bout / gap win. */
export function playEndBuzzer() {
  tone(220, 0, 1.6, 1.0, "sawtooth")
  tone(180, 0, 1.6, 0.8, "square")
}

/** Short click for scoring feedback. */
export function playScoreBlip() {
  tone(660, 0, 0.08, 0.25, "sine")
}

// ---------------------------------------------------------------------------

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
