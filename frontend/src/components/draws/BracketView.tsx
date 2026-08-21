import { Check, Medal, Timer, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { roundLabel, type DrawBout, type DrawDetail, type DrawEntrySummary } from "@/lib/draws"

interface BracketViewProps {
  draw: DrawDetail
  canManage: boolean
  onSetWinner: (bout: DrawBout, winnerEntryId: string | null) => void
  /** When provided (kumite draws), ready bouts get a "score" button. */
  onOpenScoreboard?: (bout: DrawBout) => void
  busy?: boolean
}

const OUTCOME_LABEL: Record<string, string> = {
  POINTS: "points",
  GAP: "gap",
  SENSHU: "senshu",
  HANTEI: "hantei",
  HANSOKU: "hansoku",
  KIKEN: "kiken",
  FLAGS: "flags",
}

interface FighterRowProps {
  fighter: DrawEntrySummary | null
  side: "aka" | "ao"
  isBye: boolean
  isWinner: boolean
  isLoser: boolean
  clickable: boolean
  onClick: () => void
}

const FighterRow = ({ fighter, side, isBye, isWinner, isLoser, clickable, onClick }: FighterRowProps) => (
  <button
    type="button"
    disabled={!clickable}
    onClick={onClick}
    title={clickable ? (isWinner ? "Click to clear this result" : "Click to mark as winner") : undefined}
    className={cn(
      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors",
      "border-l-[3px]",
      side === "aka" ? "border-l-flag-red" : "border-l-belt-blue",
      isWinner && "bg-belt-green/10",
      isLoser && "opacity-45",
      clickable && "cursor-pointer hover:bg-accent",
      !clickable && "cursor-default",
    )}
  >
    {/* Seed sits outside the truncating block so long names still clip cleanly */}
    {fighter?.seed != null && (
      <span
        className="w-3 shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground"
        title={`Seed ${fighter.seed}`}
      >
        {fighter.seed}
      </span>
    )}
    <div className="min-w-0 flex-1">
      {fighter ? (
        <>
          <p className={cn("truncate text-xs leading-tight", isWinner ? "font-semibold" : "font-medium")}>
            {fighter.name}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{fighter.clubName}</p>
        </>
      ) : (
        <p className="text-[11px] italic text-muted-foreground">{isBye ? "Bye" : "TBD"}</p>
      )}
    </div>
    {isWinner && <Check className="h-3.5 w-3.5 shrink-0 text-belt-green" />}
  </button>
)

interface BoutCardProps {
  bout: DrawBout
  isRound1: boolean
  canManage: boolean
  busy?: boolean
  onSetWinner: (bout: DrawBout, winnerEntryId: string | null) => void
  onOpenScoreboard?: (bout: DrawBout) => void
}

const BoutCard = ({ bout, isRound1, canManage, busy, onSetWinner, onOpenScoreboard }: BoutCardProps) => {
  const decided = bout.isUserResult
  const bothPresent = !!bout.aka && !!bout.ao
  const clickableFor = (fighter: DrawEntrySummary | null) =>
    canManage && !busy && bothPresent && !!bout.id && !!fighter
  const hasScore = bout.akaScore !== null && bout.aoScore !== null
  const scoreable = canManage && !busy && bothPresent && !!bout.id && !!onOpenScoreboard
  // The mat's scoreboard keeps its score entirely client-side until the
  // final save, so this is a "someone has this open" status ping, not a
  // live score feed — see docs/state.md for why.
  const inProgress = !decided && !!bout.startedAt

  const handleClick = (fighter: DrawEntrySummary | null) => {
    if (!fighter || !bout.id) return
    // Clicking the current winner clears the result; anything else sets it
    onSetWinner(bout, bout.winnerEntryId === fighter.entryId ? null : fighter.entryId)
  }

  return (
    <div
      className={cn(
        "w-48 shrink-0 divide-y overflow-hidden rounded-md border bg-card shadow-sm sm:w-56",
        decided && "border-belt-green/40",
        inProgress && "border-belt-orange/40",
      )}
    >
      {inProgress && (
        <div
          className="flex items-center gap-1 bg-belt-orange/10 px-2 py-0.5"
          title={`Started ${new Date(bout.startedAt!).toLocaleTimeString()}`}
        >
          <Timer className="h-3 w-3 shrink-0 animate-pulse text-belt-orange" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-belt-orange">
            In progress
          </span>
        </div>
      )}
      <FighterRow
        fighter={bout.aka}
        side="aka"
        isBye={isRound1 && !bout.aka}
        isWinner={decided && bout.winnerEntryId === bout.aka?.entryId}
        isLoser={decided && bout.winnerEntryId !== bout.aka?.entryId}
        clickable={clickableFor(bout.aka)}
        onClick={() => handleClick(bout.aka)}
      />
      <FighterRow
        fighter={bout.ao}
        side="ao"
        isBye={isRound1 && !bout.ao}
        isWinner={decided && bout.winnerEntryId === bout.ao?.entryId}
        isLoser={decided && bout.winnerEntryId !== bout.ao?.entryId}
        clickable={clickableFor(bout.ao)}
        onClick={() => handleClick(bout.ao)}
      />
      {/* What was performed, for a kata bout. Sits above the score line
          because on a kata bracket it is the more informative of the two —
          "3 – 1 flags" says who won, the katas say what happened. */}
      {(bout.akaKata || bout.aoKata) && (
        <div className="flex flex-col gap-0.5 bg-muted/25 px-2 py-0.5 text-[10px] text-muted-foreground">
          {bout.akaKata && (
            <span className="truncate">
              <span className="text-flag-red">AKA</span> {bout.akaKata.name}
            </span>
          )}
          {bout.aoKata && (
            <span className="truncate">
              <span className="text-belt-blue">AO</span> {bout.aoKata.name}
            </span>
          )}
        </div>
      )}
      {(hasScore || scoreable) && (
        <div className="flex items-center justify-between gap-1 bg-muted/40 px-2 py-0.5">
          {hasScore ? (
            <p className="text-[10px] font-medium tabular-nums text-muted-foreground">
              <span className="text-flag-red">{bout.akaScore}</span>
              {" – "}
              <span className="text-belt-blue">{bout.aoScore}</span>
              {bout.outcome && (
                <span className="ml-1 opacity-70">· {OUTCOME_LABEL[bout.outcome] ?? bout.outcome}</span>
              )}
            </p>
          ) : (
            <span />
          )}
          {scoreable && (
            <button
              type="button"
              title={decided ? "Re-score this bout" : "Score this bout"}
              onClick={() => onOpenScoreboard!(bout)}
              className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium text-primary hover:bg-accent"
            >
              <Timer className="h-3 w-3" />
              Score
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Connector column between two rounds, one bracket shape per next-round bout. */
const Connectors = ({ count }: { count: number }) => (
  <div className="flex w-4 flex-col self-stretch sm:w-7">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="relative flex-1">
        <div className="absolute left-0 top-1/4 w-1/2 border-t border-border" />
        <div className="absolute bottom-1/4 left-0 w-1/2 border-t border-border" />
        <div className="absolute left-1/2 top-1/4 h-1/2 border-l border-border" />
        <div className="absolute left-1/2 top-1/2 w-1/2 border-t border-border" />
      </div>
    ))}
  </div>
)

export const BracketView = ({ draw, canManage, onSetWinner, onOpenScoreboard, busy }: BracketViewProps) => {
  const totalRounds = Math.log2(draw.size)
  const mainBouts = draw.bouts.filter((b) => b.phase === "MAIN")
  const rounds = Array.from({ length: totalRounds }, (_, i) =>
    mainBouts
      .filter((b) => b.round === i + 1)
      .sort((a, b) => a.position - b.position),
  )
  // Enough vertical room for the first-round column
  const minHeight = (draw.size / 2) * 92

  return (
    <div className="overflow-x-auto pb-2">
      {/* Round headers */}
      <div className="flex">
        {rounds.map((_, i) => (
          <div key={i} className="flex">
            <p className="w-48 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground sm:w-56">
              {roundLabel(i + 1, totalRounds, draw.size)}
            </p>
            {i < rounds.length - 1 && <div className="w-4 sm:w-7" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-stretch" style={{ minHeight }}>
        {rounds.map((roundBouts, i) => (
          <div key={i} className="flex items-stretch">
            <div className="flex flex-col justify-around">
              {roundBouts.map((bout) => (
                <div key={`${bout.round}-${bout.position}`} className="flex flex-1 items-center py-1">
                  <BoutCard
                    bout={bout}
                    isRound1={bout.round === 1}
                    canManage={canManage}
                    busy={busy}
                    onSetWinner={onSetWinner}
                    onOpenScoreboard={onOpenScoreboard}
                  />
                </div>
              ))}
            </div>
            {i < rounds.length - 1 && <Connectors count={rounds[i + 1].length} />}
          </div>
        ))}
      </div>
    </div>
  )
}

const REPECHAGE_SIDE_LABEL = ["Top half", "Bottom half"]

export const RepechageView = ({ draw, canManage, onSetWinner, onOpenScoreboard, busy }: BracketViewProps) => {
  const repBouts = draw.bouts.filter((b) => b.phase === "REPECHAGE")
  if (repBouts.length === 0) return null

  const sides = [0, 1]
    .map((side) => ({
      side,
      bouts: repBouts.filter((b) => b.position === side).sort((a, b) => a.round - b.round),
    }))
    .filter((s) => s.bouts.length > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Medal className="h-4 w-4 text-belt-orange" />
          Repechage — Bronze medal bouts
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Athletes beaten by a finalist fight for 3rd place, one bronze per bracket half.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sides.map(({ side, bouts }) => (
          <div key={side}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {REPECHAGE_SIDE_LABEL[side]}
            </p>
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              {bouts.map((bout, i) => (
                <div key={`${bout.round}-${bout.position}`} className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted-foreground">→</span>}
                  <BoutCard
                    bout={bout}
                    isRound1={false}
                    canManage={canManage}
                    busy={busy}
                    onSetWinner={onSetWinner}
                    onOpenScoreboard={onOpenScoreboard}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const PODIUM_STYLES = [
  { label: "1st", ring: "border-belt-yellow/60 bg-belt-yellow/10", icon: "text-belt-yellow" },
  { label: "2nd", ring: "border-border bg-muted/40", icon: "text-muted-foreground" },
  { label: "3rd", ring: "border-belt-orange/50 bg-belt-orange/10", icon: "text-belt-orange" },
]

export const PodiumView = ({ draw }: { draw: DrawDetail }) => {
  const { first, second, thirds } = draw.placements
  if (!first && !second && thirds.length === 0) return null

  const rows: { style: (typeof PODIUM_STYLES)[number]; entry: DrawEntrySummary | null }[] = [
    { style: PODIUM_STYLES[0], entry: first },
    { style: PODIUM_STYLES[1], entry: second },
    ...thirds.map((t) => ({ style: PODIUM_STYLES[2], entry: t })),
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-belt-yellow" />
          Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(({ style, entry }, i) => (
            <div
              key={i}
              className={cn("flex items-center gap-3 rounded-md border px-3 py-2.5", style.ring)}
            >
              <Badge variant="outline" className={cn("shrink-0 font-display text-sm", style.icon)}>
                {style.label}
              </Badge>
              <div className="min-w-0">
                {entry ? (
                  <>
                    <p className="truncate text-sm font-semibold">{entry.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.clubName}</p>
                  </>
                ) : (
                  <p className="text-xs italic text-muted-foreground">To be decided</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
