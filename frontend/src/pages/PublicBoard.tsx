import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CalendarClock, Radio, Search, Swords, Trophy, Users } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublicAthletes, getPublicBoard } from "@/lib/public"
import { AthleteSearch } from "@/components/public/AthleteSearch"
import { AthleteSheet } from "@/components/public/AthleteSheet"
import { ClubsTab } from "@/components/public/ClubsTab"
import { MatsTab } from "@/components/public/MatsTab"
import { ResultsTab } from "@/components/public/ResultsTab"
import { ScheduleTab } from "@/components/public/ScheduleTab"

/**
 * The spectator board — a public, read-only link handed to parents and coaches
 * at the venue, which means it is a phone screen first and a laptop second.
 *
 * Four tabs rather than one long column, because the previous single-column
 * board put every ready bout on every mat above the medals: at a real event
 * that was a hundred cards of scrolling before a parent reached the result
 * they opened the link for. Results now lead; the mats are a swipe away.
 */
export default function PublicBoard() {
  const { token = "" } = useParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const [athleteId, setAthleteId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-board", token],
    queryFn: () => getPublicBoard(token),
    enabled: !!token,
    refetchInterval: 15000,
    retry: false,
  })

  // The whole athlete index, fetched once so search filters locally. Kept out
  // of the 15s poll: it only changes when a result lands, and it is the
  // biggest of the four payloads.
  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ["public-athletes", token],
    queryFn: () => getPublicAthletes(token),
    enabled: !!token,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6 text-center">
        <div>
          <Swords className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h1 className="font-display text-xl tracking-wide">Board not available</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This link is invalid or the organizer has turned the public board off.
          </p>
        </div>
      </div>
    )
  }

  const { event, board, results } = data
  const liveBouts = board.mats.reduce((n, m) => n + m.queue.length, 0) + board.unassigned.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header + search: sticky, so search is one thumb-reach away from any
          tab without scrolling back to the top of a long results list. */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pb-2 pt-3 xl:max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg leading-tight tracking-wide sm:text-2xl">
                {event.name}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {event.venue} · {event.city}
              </p>
            </div>
            <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Radio className="size-3 text-belt-green" />
              Live
            </span>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="mt-2.5 flex w-full items-center gap-2 rounded-md border bg-input/30 px-3 py-2 text-left text-sm text-muted-foreground"
          >
            <Search className="size-4 shrink-0" />
            Find an athlete
          </button>
        </div>
      </header>

      {/* max-w-3xl keeps results and schedules a comfortable reading column on a
          laptop; xl widens it because that is where the mats tab puts three
          tatami side by side, and three floors do not fit in 768px without
          truncating every name. */}
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-3 xl:max-w-6xl">
        <Tabs defaultValue="results">
          {/* Sticky under the header so switching tabs never needs a scroll
              back to the top. */}
          <TabsList className="sticky top-[104px] z-20 grid w-full grid-cols-4">
            <TabsTrigger value="results">
              <Trophy /> Results
            </TabsTrigger>
            <TabsTrigger value="mats">
              <Swords /> Mats
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <CalendarClock /> Times
            </TabsTrigger>
            <TabsTrigger value="clubs">
              <Users /> Clubs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="pt-3">
            <ResultsTab results={results} />
          </TabsContent>

          <TabsContent value="mats" className="pt-3">
            <p className="pb-2 text-sm text-muted-foreground">
              {liveBouts === 0
                ? "Nothing waiting on the mats."
                : `${liveBouts} ${liveBouts === 1 ? "bout" : "bouts"} ready`}
              {/* Only a phone gets the pager, so only a phone is told to swipe. */}
              {liveBouts > 0 && board.mats.length > 1 && (
                <span className="md:hidden"> · swipe between floors</span>
              )}
            </p>
            <MatsTab board={board} />
          </TabsContent>

          <TabsContent value="schedule" className="pt-3">
            <ScheduleTab token={token} />
          </TabsContent>

          <TabsContent value="clubs" className="pt-3">
            <ClubsTab results={results} />
          </TabsContent>
        </Tabs>

        <footer className="pt-8 text-center text-xs text-muted-foreground">
          Read-only spectator view · Gojukai Namibia
        </footer>
      </div>

      <AthleteSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        athletes={athletes}
        isLoading={athletesLoading}
        onSelect={(id) => {
          setAthleteId(id)
          setSearchOpen(false)
        }}
      />
      <AthleteSheet token={token} athleteId={athleteId} onClose={() => setAthleteId(null)} />
    </div>
  )
}
