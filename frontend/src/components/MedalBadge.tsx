import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BoutMedalType } from "@/lib/draws"

/**
 * A small, unmissable pill for a bout that decides (or feeds) a medal —
 * gold for the final, bronze for a repechage bout — reusing
 * components/scoreboard/PodiumBanner.tsx's exact medal colors so "this
 * bout matters" reads the same before it's fought as it does on the
 * podium afterward. Additive next to whatever round label a screen
 * already shows ("Round 2", "Semis") — never a replacement for it.
 */
export function MedalBadge({ type, className }: { type: NonNullable<BoutMedalType>; className?: string }) {
  return (
    <Badge
      className={cn(
        "shrink-0 px-1.5 py-0 text-[9px] font-semibold tracking-wide uppercase",
        type === "final" ? "bg-yellow-400 text-yellow-950" : "bg-orange-600 text-orange-50",
        className,
      )}
    >
      {type === "final" ? "Final" : "Bronze"}
    </Badge>
  )
}
