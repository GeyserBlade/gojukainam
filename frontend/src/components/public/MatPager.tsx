import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface MatPage {
  id: string
  /** Short label for the chip strip — "Tatami 1". */
  name: string
  /** Optional count shown under the chip label. */
  meta?: string
  content: React.ReactNode
}

/**
 * Tatamis, one per page: a horizontally swipeable pager with a chip strip on a
 * phone, and all floors side by side from `md` up.
 *
 * The pager is built on CSS scroll snapping rather than a carousel library —
 * the browser already does momentum, rubber-banding and touch handoff better
 * than JavaScript can, and it costs no dependency. The chips scroll the
 * container; the container tells the chips which page won. That two-way
 * binding is the only real logic here.
 *
 * The active page is read from scrollLeft rather than tracked as the source of
 * truth, so a half-swipe that snaps back doesn't leave the chips lying about
 * which floor you are looking at.
 *
 * Above `md` the whole thing is replaced (in CSS, not in JS — no measuring, no
 * hydration mismatch) by a plain grid. A laptop or the hall's projector has
 * room for every floor at once, and making somebody swipe past what already
 * fits on their screen would be a step backwards from the board this replaced.
 */
export function MatPager({ pages, className }: { pages: MatPage[]; className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const syncFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    // Round rather than floor: the nearest page is the one snapping into view,
    // which is what the chips should highlight mid-flick.
    const index = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    setActive(Math.min(pages.length - 1, Math.max(0, index)))
  }, [pages.length])

  // A page count that shrinks (a floor finishing its day) can leave the
  // scroller parked past the end, showing blank space with no chip selected.
  useEffect(() => {
    syncFromScroll()
  }, [pages.length, syncFromScroll])

  const goTo = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    // "instant", not "smooth": a smooth programmatic scroll is silently
    // dropped on a `scroll-snap-type: mandatory` container — the chip would
    // light up and the pages would never move. Verified in the browser, not
    // assumed. Swiping is untouched by this; the browser drives that.
    el.scrollTo({ left: index * el.clientWidth, behavior: "instant" })
    setActive(index)
  }

  if (pages.length === 0) return null

  return (
    <div className={className}>
      {/* Wide screens: every floor at once, no swiping. */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => (
          <div key={page.id} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg tracking-wide">{page.name}</h2>
              {page.meta && <span className="text-xs text-muted-foreground">{page.meta}</span>}
            </div>
            {page.content}
          </div>
        ))}
      </div>

      {/* Phones: one floor per page, chips and swipe. */}
      <div className="space-y-3 md:hidden">
      {pages.length > 1 && (
        <div
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Tatami"
        >
          {pages.map((page, i) => (
            <button
              key={page.id}
              role="tab"
              aria-selected={i === active}
              onClick={() => goTo(i)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-left transition-colors",
                i === active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-display text-sm tracking-wide">{page.name}</span>
              {page.meta && <span className="ml-1.5 text-[11px] text-muted-foreground">{page.meta}</span>}
            </button>
          ))}
        </div>
      )}

      <div
        ref={scrollerRef}
        onScroll={syncFromScroll}
        // No horizontal padding here on purpose: each page must be exactly
        // clientWidth wide for the scrollLeft maths above to land on snap
        // points. The chip strip bleeds to the edges; the pages align with the
        // rest of the page's gutter.
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((page, i) => (
          <div
            key={page.id}
            // `basis-full shrink-0` makes each page exactly one viewport wide,
            // which is what the scrollLeft/clientWidth maths above assumes.
            className="w-full shrink-0 basis-full snap-start"
            aria-hidden={i !== active}
          >
            {page.content}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-1">
          {pages.map((page, i) => (
            <span
              key={page.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
