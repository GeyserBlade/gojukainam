import { useCallback, useMemo, type ReactNode } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Theme provider — backed by `next-themes` since Phase 2.
 *
 * Preserves the legacy `useTheme()` API (`theme`, `setTheme`, `toggle`) and the
 * `ThemeToggle` export so existing consumers keep working unchanged.
 *
 * Strategy: next-themes writes `light` / `dark` to <html class>. We also keep
 * the legacy `.light` overrides in index.css. The app defaults to dark.
 */

export type Theme = "dark" | "light"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    storageKey="theme"
    disableTransitionOnChange
  >
    {children}
  </NextThemesProvider>
)

export const useTheme = (): ThemeContextValue => {
  const { resolvedTheme, setTheme } = useNextTheme()
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark"

  const set = useCallback(
    (t: Theme) => setTheme(t),
    [setTheme],
  )
  const toggle = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [setTheme, theme],
  )

  return useMemo(
    () => ({ theme, setTheme: set, toggle }),
    [theme, set, toggle],
  )
}

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={className}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
