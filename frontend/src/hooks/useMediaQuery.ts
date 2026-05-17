import { useEffect, useState } from "react"

/**
 * Track a media-query match reactively.
 *
 * Example:
 *   const isDesktop = useMediaQuery("(min-width: 768px)")
 */
export function useMediaQuery(query: string): boolean {
  const getMatch = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false

  const [matches, setMatches] = useState<boolean>(getMatch)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}
