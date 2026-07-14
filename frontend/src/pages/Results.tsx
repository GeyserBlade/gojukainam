import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, Medal, Printer, Trophy } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { listEvents } from "@/lib/events"
import { getEventResults, type ResultCategory, type ResultEntry } from "@/lib/results"

const categoryTitle = (c: ResultCategory) =>
  c.weightClassName ? `${c.divisionName} · ${c.weightClassName}` : c.divisionName

const PLACE_STYLES = [
  { label: "1st", ring: "border-belt-yellow/60 bg-belt-yellow/10", icon: "text-belt-yellow" },
  { label: "2nd", ring: "border-border bg-muted/40", icon: "text-muted-foreground" },
  { label: "3rd", ring: "border-belt-orange/50 bg-belt-orange/10", icon: "text-belt-orange" },
]

const PlaceRow = ({ style, entry }: { style: (typeof PLACE_STYLES)[number]; entry: ResultEntry }) => (
  <div className={cn("flex items-center gap-3 rounded-md border px-3 py-2", style.ring)}>
    <Badge variant="outline" className={cn("shrink-0 font-display text-sm", style.icon)}>
      {style.label}
    </Badge>
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{entry.name}</p>
      <p className="truncate text-xs text-muted-foreground">{entry.clubName}</p>
    </div>
  </div>
)

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

export default function ResultsPage() {
  const [eventId, setEventId] = useState<string>("")

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  })

  useEffect(() => {
    if (!eventId && events?.length) {
      const preferred = events.find((e) => e.status === "ACTIVE" || e.status === "CLOSED")
      setEventId((preferred ?? events[0]).id)
    }
  }, [events, eventId])

  const { data: results, isLoading } = useQuery({
    queryKey: ["event-results", eventId],
    queryFn: () => getEventResults(eventId),
    enabled: !!eventId,
  })

  const selectedEvent = events?.find((e) => e.id === eventId)

  const decidedCategories = useMemo(
    () => results?.categories.filter((c) => c.first || c.second || c.thirds.length > 0) ?? [],
    [results],
  )

  const handleExportCsv = () => {
    if (!results) return
    const header = ["Category", "Gender", "Place", "Name", "Club"]
    const rows: (string | number)[][] = []
    for (const c of results.categories) {
      const title = categoryTitle(c)
      if (c.first) rows.push([title, c.gender, "1st", c.first.name, c.first.clubName])
      if (c.second) rows.push([title, c.gender, "2nd", c.second.name, c.second.clubName])
      for (const t of c.thirds) rows.push([title, c.gender, "3rd", t.name, t.clubName])
    }
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const stamp = (selectedEvent?.name ?? "event").replace(/[^\w]+/g, "-").toLowerCase()
    a.download = `results-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell title="Results">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">RESULTS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedEvent?.name ?? "Event"} — medal tally and podiums across every category.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!results}>
            <Printer />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!results}>
            <Download />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-4 max-w-md print:hidden">
        <Label className="mb-1.5 block text-xs text-muted-foreground">Event</Label>
        {eventsLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !results || results.categories.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No draws for this event yet — results appear once draws are generated and bouts are scored.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Medal tally */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Medal className="h-4 w-4 text-belt-yellow" />
                Medal tally
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.clubTally.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No medals awarded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Club</TableHead>
                        <TableHead className="text-center">🥇</TableHead>
                        <TableHead className="text-center">🥈</TableHead>
                        <TableHead className="text-center">🥉</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.clubTally.map((row) => (
                        <TableRow key={row.clubId}>
                          <TableCell className="font-medium">{row.clubName}</TableCell>
                          <TableCell className="text-center tabular-nums">{row.gold}</TableCell>
                          <TableCell className="text-center tabular-nums">{row.silver}</TableCell>
                          <TableCell className="text-center tabular-nums">{row.bronze}</TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">{row.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results by category */}
          <div>
            <h2 className="mb-3 font-display text-xl tracking-wide">
              Results by category
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {decidedCategories.length} of {results.categories.length} decided
              </span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {results.categories.map((c) => {
                const decided = c.first || c.second || c.thirds.length > 0
                return (
                  <Card key={c.drawId} className="break-inside-avoid">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate">{categoryTitle(c)}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {c.category} · {c.gender}
                          </span>
                        </span>
                        {!decided && (
                          <Badge variant="outline" className="shrink-0 text-[10px] text-belt-orange border-belt-orange/30">
                            Pending
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {decided ? (
                        <>
                          {c.first && <PlaceRow style={PLACE_STYLES[0]} entry={c.first} />}
                          {c.second && <PlaceRow style={PLACE_STYLES[1]} entry={c.second} />}
                          {c.thirds.map((t) => (
                            <PlaceRow key={t.entryId} style={PLACE_STYLES[2]} entry={t} />
                          ))}
                        </>
                      ) : (
                        <p className="py-2 text-xs italic text-muted-foreground">
                          Not yet decided.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
