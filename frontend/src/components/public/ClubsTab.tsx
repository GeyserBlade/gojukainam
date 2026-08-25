import { Fragment, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { EventResults } from "@/lib/results"

/**
 * The club medal table, plus — on tap — which of that club's athletes won
 * what. The tally alone answers "are we winning"; the breakdown answers the
 * question a coach asks straight afterwards.
 *
 * Both come from the same `results` payload the board already holds, so
 * expanding a row costs no request.
 */
export function ClubsTab({ results }: { results: EventResults }) {
  const [openClubId, setOpenClubId] = useState<string | null>(null)

  if (results.clubTally.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          No medals have been decided yet.
        </CardContent>
      </Card>
    )
  }

  const medalsFor = (clubId: string) =>
    results.categories.flatMap((c) =>
      [
        c.first && c.first.clubId === clubId ? { medal: "🥇", entry: c.first, category: c } : null,
        c.second && c.second.clubId === clubId ? { medal: "🥈", entry: c.second, category: c } : null,
        ...c.thirds
          .filter((t) => t.clubId === clubId)
          .map((t) => ({ medal: "🥉", entry: t, category: c })),
      ].filter((row): row is NonNullable<typeof row> => row !== null),
    )

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pl-3 pr-2 font-medium">Club</th>
              <th className="w-9 px-1 py-2 text-center font-medium">🥇</th>
              <th className="w-9 px-1 py-2 text-center font-medium">🥈</th>
              <th className="w-9 px-1 py-2 text-center font-medium">🥉</th>
              <th className="w-11 py-2 pl-1 pr-3 text-center font-medium">All</th>
            </tr>
          </thead>
          <tbody>
            {results.clubTally.map((row, i) => {
              const open = openClubId === row.clubId
              return (
                <Fragment key={row.clubId}>
                  <tr
                    onClick={() => setOpenClubId(open ? null : row.clubId)}
                    className={cn(
                      "cursor-pointer border-b last:border-0",
                      open ? "bg-muted/50" : "hover:bg-muted/30",
                    )}
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <span className="mr-1.5 text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      {row.clubName}
                    </td>
                    <td className="px-1 py-2.5 text-center tabular-nums">{row.gold}</td>
                    <td className="px-1 py-2.5 text-center tabular-nums">{row.silver}</td>
                    <td className="px-1 py-2.5 text-center tabular-nums">{row.bronze}</td>
                    <td className="py-2.5 pl-1 pr-3 text-center font-medium tabular-nums">
                      {row.total}
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b last:border-0">
                      <td colSpan={5} className="bg-muted/30 px-3 py-2">
                        <ul className="space-y-1">
                          {medalsFor(row.clubId).map((m) => (
                            <li
                              key={`${m.category.drawId}:${m.entry.entryId}`}
                              className="flex items-baseline gap-2"
                            >
                              <span aria-hidden>{m.medal}</span>
                              <span className="min-w-0 flex-1 truncate">{m.entry.name}</span>
                              <span className="shrink-0 truncate text-xs text-muted-foreground">
                                {m.category.divisionName}
                                {m.category.weightClassName ? ` · ${m.category.weightClassName}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
