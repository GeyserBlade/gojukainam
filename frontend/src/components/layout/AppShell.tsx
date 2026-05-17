import { Outlet } from "react-router-dom"

import { AppHeader } from "@/components/layout/AppHeader"
import { cn } from "@/lib/utils"

interface AppShellProps {
  title?: string
  /** Tighter padding for data-dense pages; default is comfortable. */
  density?: "comfortable" | "compact"
  /** Render children directly (page-driven shell) or use <Outlet/> (route-driven shell). */
  children?: React.ReactNode
}

/**
 * App-frame for authenticated pages. Provides the sticky header, safe-area
 * padding, and a centered max-width container.
 *
 * Phase-3 pages should drop their inline headers and render their content as
 * children of <AppShell title="..."> (or place AppShell in the route tree and
 * use <Outlet/>).
 */
export function AppShell({ title, density = "comfortable", children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader title={title} />
      <main
        className={cn(
          "flex-1 mx-auto w-full max-w-7xl",
          density === "comfortable" ? "px-3 sm:px-4 py-4 sm:py-6" : "px-2 sm:px-3 py-3",
        )}
      >
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
