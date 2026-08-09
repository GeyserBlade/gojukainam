import { useEffect, useRef, useState } from "react"
import { ArrowLeftRight, Maximize, Minimize } from "lucide-react"

import { cn } from "@/lib/utils"
import { PodiumBanner } from "@/components/scoreboard/PodiumBanner"
import {
  CHANNEL_NAME,
  PENALTY_LABELS,
  formatClock,
  playAtoshiBaraku,
  playEndBuzzer,
  type ChannelMessage,
  type DisplayPayload,
  type DisplaySide,
} from "@/lib/scoreboard"

const FLIP_KEY = "scoreboard:displayFlip"

const SideBoard = ({ side, data, winner }: { side: "aka" | "ao"; data: DisplaySide; winner: boolean }) => {
  const isAka = side === "aka"
  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col items-center justify-between p-[2vmin]",
        isAka ? "bg-red-700" : "bg-blue-800",
        winner && "ring-8 ring-inset ring-yellow-400",
      )}
    >
      <div className="w-full text-center">
        <p className="font-display text-[4.5vmin] uppercase tracking-widest text-white/80">
          {isAka ? "AKA" : "AO"}
        </p>
        <p className="truncate text-[5.5vmin] font-bold leading-tight text-white">{data.name}</p>
        <p className="truncate text-[3vmin] text-white/70">{data.clubName}</p>
      </div>

      <div className="flex items-center gap-[2vmin]">
        <p className="font-mono text-[28vmin] font-bold leading-none text-white tabular-nums">
          {data.points}
        </p>
        {data.senshu && (
          <span className="flex h-[6vmin] w-[6vmin] items-center justify-center rounded-full bg-yellow-400 text-[3.5vmin] font-bold text-black">
            S
          </span>
        )}
      </div>

      <div className="flex gap-[1.2vmin]">
        {PENALTY_LABELS.map((label, i) => {
          const lit = data.penalty >= i + 1
          return (
            <span
              key={label}
              className={cn(
                "flex h-[7.5vmin] min-w-[10vmin] items-center justify-center rounded-md border-[0.4vmin] px-[1vmin] text-[3.8vmin] font-bold",
                lit
                  ? i + 1 === 5
                    ? "border-yellow-300 bg-yellow-400 text-black"
                    : "border-white bg-white text-black"
                  : "border-white/30 text-white/40",
              )}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** One fighter's final score, colour-coded, on the result screen. */
const FinalScore = ({ side, data, dim }: { side: "aka" | "ao"; data: DisplaySide; dim: boolean }) => (
  <div
    className={cn(
      "flex min-w-0 flex-1 flex-col items-center rounded-lg px-[2vmin] py-[1.5vmin] transition-opacity",
      side === "aka" ? "bg-red-700" : "bg-blue-800",
      dim && "opacity-40",
    )}
  >
    <p className="font-display text-[2.4vmin] uppercase tracking-widest text-white/80">
      {side === "aka" ? "AKA" : "AO"}
    </p>
    <p className="w-full truncate text-center text-[3.4vmin] font-bold leading-tight text-white">
      {data.name}
    </p>
    <p className="w-full truncate text-center text-[2vmin] text-white/70">{data.clubName}</p>
    <p className="font-mono text-[9vmin] font-bold leading-none text-white tabular-nums">
      {data.points}
    </p>
  </div>
)

/**
 * What the mats see once the operator calls a result: the final score, a
 * winner announcement big enough to read from the floor, and the podium when
 * this bout decided the category.
 *
 * Replaces the live board rather than sitting beside it — at this moment there
 * is no live bout to show, and everyone in the hall is looking up.
 */
const ResultScreen = ({
  payload,
  left,
  right,
  leftSide,
  rightSide,
}: {
  payload: DisplayPayload
  left: DisplaySide
  right: DisplaySide
  leftSide: "aka" | "ao"
  rightSide: "aka" | "ao"
}) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.5vmin] px-[3vmin] py-[2vmin]">
    <div className="flex w-full max-w-[150vmin] items-stretch justify-center gap-[2vmin]">
      <FinalScore side={leftSide} data={left} dim={!payload.isDraw && payload.winnerSide !== leftSide} />
      <FinalScore side={rightSide} data={right} dim={!payload.isDraw && payload.winnerSide !== rightSide} />
    </div>

    {payload.isDraw ? (
      <div className="rounded-xl border-[0.6vmin] border-white/30 bg-white/10 px-[6vmin] py-[2vmin] text-center">
        <p className="text-[9vmin] font-black uppercase leading-none tracking-wide text-white">Draw</p>
      </div>
    ) : (
      payload.winnerSide && (
        <div className="rounded-xl bg-yellow-400 px-[6vmin] py-[2vmin] text-center ring-[0.8vmin] ring-yellow-200">
          <p className="text-[9vmin] font-black uppercase leading-none tracking-wide text-black">
            {payload.winnerSide === "aka" ? "AKA" : "AO"} wins
          </p>
          <p className="mt-[0.8vmin] truncate text-[3.4vmin] font-bold leading-tight text-black">
            {payload.winnerName}
          </p>
          <p className="truncate text-[2.2vmin] leading-tight text-black/70">
            {payload.winnerClubName}
            {payload.outcome ? ` · ${payload.outcome.toLowerCase()}` : ""}
          </p>
        </div>
      )
    )}

    {/* Only once this bout is the final and both bronze bouts are already
        decided — see lib/draws.ts (isFinalBout / bronze gathering). */}
    {payload.podium && (
      <div className="w-full max-w-[150vmin] shrink">
        <PodiumBanner podium={payload.podium} variant="display" />
      </div>
    )}
  </div>
)

export default function ScoreboardDisplayPage() {
  const [payload, setPayload] = useState<DisplayPayload | null>(null)
  const [flipped, setFlipped] = useState(() => localStorage.getItem(FLIP_KEY) === "1")
  const [fullscreen, setFullscreen] = useState(false)
  const prevAtoshiRef = useRef(false)
  const prevEndedRef = useRef(false)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      const msg = e.data
      if (msg?.type === "state") setPayload(msg)
      else if (msg?.type === "closed") setPayload(null)
    }
    channel.postMessage({ type: "hello" } satisfies ChannelMessage)
    return () => channel.close()
  }, [])

  // sounds on transitions (mirrors the control page so the projector speaks)
  useEffect(() => {
    if (!payload) return
    if (payload.soundOn) {
      if (payload.atoshiBaraku && !prevAtoshiRef.current) playAtoshiBaraku()
      if (payload.ended && !prevEndedRef.current) playEndBuzzer()
    }
    prevAtoshiRef.current = payload.atoshiBaraku
    prevEndedRef.current = payload.ended
  }, [payload])

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }
  const toggleFlip = () => {
    setFlipped((f) => {
      localStorage.setItem(FLIP_KEY, f ? "0" : "1")
      return !f
    })
  }

  // Effective orientation = operator's broadcast choice, further toggled by this
  // window's own button (so a reachable monitor can still be flipped locally).
  const effFlip = (payload?.displayFlip ?? false) !== flipped
  const left = effFlip ? payload?.ao : payload?.aka
  const right = effFlip ? payload?.aka : payload?.ao
  const leftSide: "aka" | "ao" = effFlip ? "ao" : "aka"
  const rightSide: "aka" | "ao" = effFlip ? "aka" : "ao"

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-black">
      {!payload || !left || !right ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-white/60">
          <p className="text-2xl">Waiting for the scoreboard…</p>
          <p className="text-sm">Open a bout's scoreboard in another window to start.</p>
        </div>
      ) : (
        <>
          {/* header */}
          <div className="flex items-center justify-center gap-[2vmin] bg-black px-4 py-[1vmin]">
            <p className="truncate text-[2.6vmin] font-semibold text-white/80">
              {payload.categoryLabel} — {payload.roundLabel}
            </p>
          </div>

          {payload.resultShown && (payload.winnerSide || payload.isDraw) ? (
            <ResultScreen
              payload={payload}
              left={left}
              right={right}
              leftSide={leftSide}
              rightSide={rightSide}
            />
          ) : (
            /* live boards */
            <div className="flex min-h-0 flex-1">
              <SideBoard side={leftSide} data={left} winner={false} />

              <div className="flex w-[56vmin] shrink-0 flex-col items-center justify-center gap-[2vmin] bg-black px-[1vmin]">
                <p
                  className={cn(
                    "font-mono text-[20vmin] font-bold leading-none tabular-nums",
                    payload.atoshiBaraku && !payload.ended ? "animate-pulse text-red-500" : "text-white",
                  )}
                >
                  {formatClock(payload.clockMs)}
                </p>
                {payload.atoshiBaraku && !payload.ended && (
                  <p className="text-center text-[2.6vmin] font-bold uppercase tracking-widest text-red-400">
                    Atoshi baraku
                  </p>
                )}
                {/* Time is up but the operator has not called it yet — say so
                    rather than leaving the floor staring at a frozen 00:00. */}
                {payload.ended && (
                  <p className="text-center text-[2.6vmin] font-bold uppercase tracking-widest text-white/70">
                    Time
                  </p>
                )}
              </div>

              <SideBoard side={rightSide} data={right} winner={false} />
            </div>
          )}
        </>
      )}

      {/* hover controls */}
      <div className="absolute bottom-3 right-3 flex gap-2 opacity-20 transition-opacity hover:opacity-100">
        <button
          type="button"
          onClick={toggleFlip}
          title="Flip red/blue sides"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/25"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/25"
        >
          {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
