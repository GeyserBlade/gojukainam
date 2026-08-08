import { cn } from "@/lib/utils"
import type { PodiumPlacements, PodiumMedalist } from "@/lib/scoreboard"

const RANK_STYLE = {
  gold: { label: "1ST", bg: "bg-yellow-400", text: "text-yellow-950", ring: "ring-yellow-300" },
  silver: { label: "2ND", bg: "bg-slate-300", text: "text-slate-900", ring: "ring-slate-300/70" },
  bronze: { label: "3RD", bg: "bg-orange-600", text: "text-orange-50", ring: "ring-orange-400/70" },
} as const

type Rank = keyof typeof RANK_STYLE

const HEIGHT = {
  dialog: { gold: "h-24", silver: "h-16", bronze: "h-12" },
  display: { gold: "h-[16vmin]", silver: "h-[12vmin]", bronze: "h-[9vmin]" },
} as const

/**
 * Four-block WKF-style podium (2nd, 1st — taller, centred, 3rd, 3rd), shown
 * once a final's winner is known and both bronze bouts are already decided.
 * Two size variants sharing one layout: "dialog" for the mat scoreboard's
 * rem-scaled resolution popup, "display" for the projector's viewport-scaled
 * fullscreen page.
 */
export function PodiumBanner({
  podium,
  variant = "dialog",
}: {
  podium: PodiumPlacements
  variant?: "dialog" | "display"
}) {
  const blocks: { medalist: PodiumMedalist; rank: Rank }[] = [
    { medalist: podium.silver, rank: "silver" },
    { medalist: podium.gold, rank: "gold" },
    { medalist: podium.bronze[0], rank: "bronze" },
    { medalist: podium.bronze[1], rank: "bronze" },
  ]
  const isDisplay = variant === "display"

  return (
    <div className="w-full">
      <p
        className={cn(
          "mb-2 text-center font-semibold uppercase tracking-[0.25em] text-white/50",
          isDisplay ? "text-[2vmin]" : "text-[10px]",
        )}
      >
        Final results
      </p>
      <div className={cn("flex items-end justify-center", isDisplay ? "gap-[1.5vmin]" : "gap-2 sm:gap-3")}>
        {blocks.map((b, i) => {
          const style = RANK_STYLE[b.rank]
          return (
            <div
              key={i}
              className={cn("flex flex-col items-center", isDisplay ? "w-[16vmin] gap-[0.8vmin]" : "w-20 gap-1.5 sm:w-24")}
            >
              <div className={cn("text-center", isDisplay ? "min-h-[5vmin]" : "min-h-[2.5rem]")}>
                <p
                  className={cn(
                    "truncate font-semibold leading-tight text-white",
                    isDisplay ? "text-[2.2vmin]" : "text-[11px] sm:text-xs",
                  )}
                >
                  {b.medalist.name}
                </p>
                <p className={cn("truncate text-white/60", isDisplay ? "text-[1.7vmin]" : "text-[9px] sm:text-[10px]")}>
                  {b.medalist.clubName}
                </p>
              </div>
              <div
                className={cn(
                  "flex w-full items-start justify-center rounded-t-md pt-1.5 ring-2",
                  HEIGHT[variant][b.rank],
                  style.bg,
                  style.ring,
                )}
              >
                <span className={cn("font-display font-bold", style.text, isDisplay ? "text-[3vmin]" : "text-lg sm:text-xl")}>
                  {style.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
