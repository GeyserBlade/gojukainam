/**
 * The five-judge kata flag decision, and what gets stored for it.
 *
 * A kata bout is head-to-head like a kumite bout — two competitors, one bracket
 * slot each — but it is decided by five judges raising a red or blue flag
 * simultaneously on the referee's call. Three flags is a majority and therefore
 * the whole decision: with an odd panel there is no tie to break, which is why
 * nothing here has a hantei or draw path the way `scoreboard.ts` does.
 *
 * Pure (bar the localStorage resume at the bottom, which mirrors the kumite
 * board's) and covered by `scripts/test-kata.ts`.
 */
import type { Side } from "./scoreboard"

// ---------------------------------------------------------------------------
// The flag panel

/** WKF kata flag panel: five judges, so a majority is always reachable. */
export const JUDGE_COUNT = 5
export const MAJORITY = Math.floor(JUDGE_COUNT / 2) + 1

/** One judge's flag. `null` = not yet entered by the operator. */
export type Flag = Side | null
export type FlagPanel = Flag[]

export const emptyPanel = (): FlagPanel => Array.from({ length: JUDGE_COUNT }, () => null)

/**
 * Tolerates a panel of the wrong length — a persisted panel from an older
 * session, or one hand-edited in localStorage, is padded or trimmed rather
 * than crashing the screen an operator is standing in front of.
 */
export function normalizePanel(panel: unknown): FlagPanel {
  const raw = Array.isArray(panel) ? panel : []
  return Array.from({ length: JUDGE_COUNT }, (_, i) =>
    raw[i] === "aka" || raw[i] === "ao" ? (raw[i] as Side) : null,
  )
}

export interface FlagTally {
  aka: number
  ao: number
  /** Judges whose flag has not been entered yet. */
  pending: number
}

export function tallyFlags(panel: FlagPanel): FlagTally {
  let aka = 0
  let ao = 0
  for (const f of panel) {
    if (f === "aka") aka++
    else if (f === "ao") ao++
  }
  return { aka, ao, pending: JUDGE_COUNT - aka - ao }
}

export interface KataDecision extends FlagTally {
  /** The side holding a majority, or null while none does. */
  winner: Side | null
  /** Every judge's flag is in. */
  complete: boolean
  /**
   * A majority is already held, so the remaining flags cannot change the
   * result. The operator can save on this, which matters: judges' flags come
   * down at slightly different moments and the third one settles it.
   */
  decided: boolean
}

export function decideFlags(panel: FlagPanel): KataDecision {
  const t = tallyFlags(panel)
  const winner: Side | null = t.aka >= MAJORITY ? "aka" : t.ao >= MAJORITY ? "ao" : null
  return { ...t, winner, complete: t.pending === 0, decided: winner !== null }
}

/** Set judge `index`'s flag, or clear it by passing the flag it already holds. */
export function setFlag(panel: FlagPanel, index: number, side: Side): FlagPanel {
  if (index < 0 || index >= JUDGE_COUNT) return panel
  const next = [...panel]
  next[index] = next[index] === side ? null : side
  return next
}

export const clearPanel = emptyPanel

// ---------------------------------------------------------------------------
// What gets stored on the bout

/** `Bout.scoreJson` for a kata result. Mirrors the kumite board's own blob. */
export interface KataScoreDetail {
  kind: "kata"
  panel: FlagPanel
  aka: { kataId: string | null; kataName: string | null }
  ao: { kataId: string | null; kataName: string | null }
}

export function kataScoreJson(
  panel: FlagPanel,
  aka: { kataId: string | null; kataName: string | null },
  ao: { kataId: string | null; kataName: string | null },
): string {
  return JSON.stringify({ kind: "kata", panel, aka, ao } satisfies KataScoreDetail)
}

// ---------------------------------------------------------------------------
// Crash/refresh resume, keyed per bout — same shape and reasoning as the
// kumite board's `PersistedBout`.

export interface PersistedKataBout {
  panel: FlagPanel
  akaKataId: string | null
  aoKataId: string | null
  revealed: boolean
}

const key = (boutId: string) => `kata:bout:${boutId}`

export function loadPersistedKata(boutId: string): PersistedKataBout | null {
  try {
    const raw = localStorage.getItem(key(boutId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedKataBout
    return { ...parsed, panel: normalizePanel(parsed.panel) }
  } catch {
    return null
  }
}

export function persistKata(boutId: string, data: PersistedKataBout) {
  localStorage.setItem(key(boutId), JSON.stringify(data))
}

export function clearPersistedKata(boutId: string) {
  localStorage.removeItem(key(boutId))
}
