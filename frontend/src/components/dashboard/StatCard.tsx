import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Accent = "primary" | "belt-yellow" | "belt-orange" | "belt-green" | "belt-blue" | "belt-brown" | "belt-black" | "flag-red" | "flag-blue" | "flag-green"

const accentBar: Record<Accent, string> = {
  "primary": "bg-primary",
  "belt-yellow": "bg-belt-yellow",
  "belt-orange": "bg-belt-orange",
  "belt-green": "bg-belt-green",
  "belt-blue": "bg-belt-blue",
  "belt-brown": "bg-belt-brown",
  "belt-black": "bg-belt-black",
  "flag-red": "bg-flag-red",
  "flag-blue": "bg-flag-blue",
  "flag-green": "bg-flag-green",
}

const accentIconBg: Record<Accent, string> = {
  "primary": "bg-primary/10 text-primary",
  "belt-yellow": "bg-belt-yellow/15 text-belt-yellow",
  "belt-orange": "bg-belt-orange/15 text-belt-orange",
  "belt-green": "bg-belt-green/15 text-belt-green",
  "belt-blue": "bg-belt-blue/15 text-belt-blue",
  "belt-brown": "bg-belt-brown/20 text-belt-brown",
  "belt-black": "bg-foreground/10 text-foreground",
  "flag-red": "bg-flag-red/15 text-flag-red",
  "flag-blue": "bg-flag-blue/15 text-flag-blue",
  "flag-green": "bg-flag-green/15 text-flag-green",
}

interface StatCardProps {
  label: string
  value?: number | string
  icon: React.ComponentType<{ className?: string }>
  accent?: Accent
  href?: string
  hint?: string
  loading?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  href,
  hint,
  loading,
}: StatCardProps) {
  const inner = (
    <Card
      className={cn(
        "relative overflow-hidden p-4 sm:p-5 gap-2 transition-all",
        href && "hover:border-foreground/20 hover:shadow-md hover:-translate-y-px",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 h-full w-1", accentBar[accent])}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-20" />
          ) : (
            <p className="mt-1 font-display text-3xl sm:text-4xl tracking-wide leading-none">
              {value ?? "—"}
            </p>
          )}
          {hint && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
              {hint}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accentIconBg[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      {href && (
        <ArrowRight
          aria-hidden
          className="absolute bottom-3 right-3 size-4 text-muted-foreground"
        />
      )}
    </Card>
  )

  if (href) {
    return (
      <Link to={href} aria-label={label} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}
