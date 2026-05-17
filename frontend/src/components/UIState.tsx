import { AlertTriangle, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton as ShadSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <ShadSkeleton className={className} />
)

export const SkeletonLine = ({ width = "w-full" }: { width?: string }) => (
  <Skeleton className={`h-4 ${width}`} />
)

export const SkeletonListItem = () => (
  <div className="py-3 flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1 space-y-2">
      <SkeletonLine width="w-1/3" />
      <SkeletonLine width="w-1/2" />
      <SkeletonLine width="w-2/5" />
    </div>
    <Skeleton className="h-9 w-20 rounded-md" />
  </div>
)

export const SkeletonList = ({ count = 5 }: { count?: number }) => (
  <ul className="divide-y" aria-label="Loading">
    {Array.from({ length: count }).map((_, i) => (
      <li key={i}>
        <SkeletonListItem />
      </li>
    ))}
  </ul>
)

export const Spinner = ({ size = 20, label = "Loading" }: { size?: number; label?: string }) => (
  <span role="status" aria-label={label} className="inline-flex items-center">
    <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} aria-hidden />
    <span className="sr-only">{label}</span>
  </span>
)

export const PageSpinner = ({ label = "Loading" }: { label?: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex items-center gap-3 text-muted-foreground">
      <Spinner size={24} label={label} />
      <span className="text-sm">{label}…</span>
    </div>
  </div>
)

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4 rounded-lg border border-dashed",
      className,
    )}
  >
    {icon && (
      <div
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3 [&_svg]:size-6"
        aria-hidden
      >
        {typeof icon === "string" ? <span className="text-2xl">{icon}</span> : icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState = ({
  title = "Couldn't load data",
  message = "Please try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) => (
  <div
    role="alert"
    className={cn(
      "rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center",
      className,
    )}
  >
    <div className="flex justify-center mb-2 text-destructive" aria-hidden>
      <AlertTriangle className="size-6" />
    </div>
    <p className="font-semibold text-foreground">{title}</p>
    <p className="text-sm text-muted-foreground mt-1">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm" className="mt-3">
        Retry
      </Button>
    )}
  </div>
)
