import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Tiny pill that renders a belt with a colour swatch.
 *
 * Matches common belt names/colours to the belt-rank ramp tokens defined in
 * `index.css`. Unknown colours fall back to a neutral chip.
 */

type BeltRank =
  | "white"
  | "yellow"
  | "orange"
  | "green"
  | "blue"
  | "purple"
  | "brown"
  | "black"
  | "red"

const SWATCH: Record<BeltRank, string> = {
  white: "bg-belt-white border border-foreground/20",
  yellow: "bg-belt-yellow",
  orange: "bg-belt-orange",
  green: "bg-belt-green",
  blue: "bg-belt-blue",
  purple: "bg-belt-purple",
  brown: "bg-belt-brown",
  black: "bg-belt-black border border-foreground/20",
  red: "bg-flag-red",
}

function parseRank(value?: string | null): BeltRank | null {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes("white")) return "white"
  if (v.includes("yellow")) return "yellow"
  if (v.includes("orange")) return "orange"
  if (v.includes("green")) return "green"
  if (v.includes("purple") || v.includes("violet")) return "purple"
  if (v.includes("blue")) return "blue"
  if (v.includes("brown")) return "brown"
  if (v.includes("black")) return "black"
  if (v.includes("red")) return "red"
  return null
}

interface BeltBadgeProps {
  name?: string | null
  colour?: string | null
  className?: string
  /** Hide the text label; render the swatch only. */
  iconOnly?: boolean
}

export function BeltBadge({ name, colour, className, iconOnly }: BeltBadgeProps) {
  const rank = parseRank(colour) ?? parseRank(name)
  const swatch = rank ? SWATCH[rank] : "bg-muted"
  const label = name ?? colour ?? "—"

  if (iconOnly) {
    return (
      <span
        aria-label={label}
        title={label}
        className={cn("inline-block size-3 rounded-full", swatch, className)}
      />
    )
  }
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", className)}>
      <span aria-hidden className={cn("inline-block size-2.5 rounded-full", swatch)} />
      <span className="truncate">{label}</span>
    </Badge>
  )
}
