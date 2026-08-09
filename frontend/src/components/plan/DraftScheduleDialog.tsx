import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Sparkles, Users2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatClock, formatSpan } from "@/lib/schedule"
import {
  STRATEGY_HINTS,
  STRATEGY_LABELS,
  draftPlan,
  type DraftInput,
  type DraftOptions,
  type DraftStrategy,
} from "@/lib/autoschedule"
import { BLOCK_LABELS } from "./plan-visuals"

/**
 * Draft a running order, show what it would do, and only then apply it.
 *
 * The preview is the point. An auto-scheduler that silently rearranged an
 * organizer's floors would be worse than no auto-scheduler — this one has to
 * say how long the day gets, which categories it could not place, and where it
 * has put two categories that share athletes on two floors at once.
 */
export function DraftScheduleDialog({
  open,
  onOpenChange,
  input,
  applying,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Everything except the options, which this dialog owns. */
  input: Omit<DraftInput, "options">
  applying: boolean
  onApply: (options: DraftOptions) => void
}) {
  const [strategy, setStrategy] = useState<DraftStrategy>("AGE_GROUP_PER_FLOOR")
  const [includeBlocks, setIncludeBlocks] = useState(true)

  const options = useMemo<DraftOptions>(
    () => ({ strategy, includeBlocks }),
    [strategy, includeBlocks],
  )
  // Re-drafted on every option change, so the numbers below always describe
  // the plan the button would actually apply.
  const draft = useMemo(
    () => (open ? draftPlan({ ...input, options }) : null),
    [open, input, options],
  )

  const nothingToDo = draft !== null && draft.placedCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Draft the running order
          </DialogTitle>
          <DialogDescription>
            Youngest categories first, and each age group's kata before its kumite. Nothing
            is saved until you apply it, and you can still drag anything afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Strategy */}
          <div className="space-y-2">
            <Label className="text-xs">How to use the floors</Label>
            <div className="grid gap-2">
              {(Object.keys(STRATEGY_LABELS) as DraftStrategy[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrategy(s)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    strategy === s
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/40",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={cn(
                        "size-3 shrink-0 rounded-full border",
                        strategy === s ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                    {STRATEGY_LABELS[s]}
                  </span>
                  <span className="mt-0.5 block pl-5 text-[11px] text-muted-foreground">
                    {STRATEGY_HINTS[s]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2">
            <input
              type="checkbox"
              className="mt-0.5 accent-primary"
              checked={includeBlocks}
              onChange={(e) => setIncludeBlocks(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium">Place the ceremonies and lunch</span>
              <span className="block text-[11px] text-muted-foreground">
                Taken from the event's timing settings. Anything already on the plan is left
                alone rather than duplicated.
              </span>
            </span>
          </label>

          {/* Result */}
          {draft && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              {nothingToDo ? (
                <p className="text-sm text-muted-foreground">
                  Nothing to schedule — every category with a draw is either already fought or
                  has no bouts to run.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-lg tracking-wide tabular-nums">
                      {formatClock(draft.finishMin)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      finish · last bout {formatClock(draft.competitionEndMin)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {draft.placedCount} placed
                      {draft.pinnedCount > 0 && ` · ${draft.pinnedCount} left where they were`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {draft.floors.map((f) => (
                      <div key={f.matId} className="flex items-center gap-2 text-xs">
                        <span className="w-28 shrink-0 truncate font-medium">{f.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {f.categories} categories · {f.bouts} bouts
                        </span>
                        <span className="ml-auto tabular-nums text-muted-foreground">
                          ends {formatClock(f.endMin)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {draft.blocks.length > 0 && (
                    <p className="flex flex-wrap items-center gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="size-3 text-belt-green" />
                      Adding:
                      {/* A per-floor lunch is one block per floor; listing all
                          three identically is noise, so they collapse to a count. */}
                      {[
                        ...new Map(
                          draft.blocks.map((b) => [
                            `${b.kind}:${b.matId === null}`,
                            {
                              kind: b.kind,
                              startTime: b.startTime,
                              perFloor: b.matId !== null,
                              count: draft.blocks.filter(
                                (o) => o.kind === b.kind && (o.matId === null) === (b.matId === null),
                              ).length,
                            },
                          ]),
                        ).values(),
                      ].map((b, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] font-normal">
                          {BLOCK_LABELS[b.kind]}
                          {b.startTime ? ` ${b.startTime}` : ""}
                          {b.perFloor ? ` — one on each of ${b.count} floors` : ""}
                        </Badge>
                      ))}
                    </p>
                  )}

                  {draft.conflicts.length > 0 && (
                    <div className="space-y-1 border-t pt-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-belt-orange">
                        <Users2 className="size-3" />
                        {draft.conflicts.length} clash
                        {draft.conflicts.length === 1 ? "" : "es"} where the same athletes could be
                        called to two floors at once
                      </p>
                      {draft.conflicts.slice(0, 3).map((c, i) => (
                        <p key={i} className="pl-4 text-[11px] text-muted-foreground">
                          {c.kataTitle} and {c.kumiteTitle} overlap {formatClock(c.fromMin)}–
                          {formatClock(c.toMin)} on {c.matNames[0]} and {c.matNames[1]}.
                        </p>
                      ))}
                      {draft.conflicts.length > 3 && (
                        <p className="pl-4 text-[11px] text-muted-foreground">
                          …and {draft.conflicts.length - 3} more.
                        </p>
                      )}
                      <p className="pl-4 text-[11px] text-muted-foreground">
                        "{STRATEGY_LABELS.AGE_GROUP_PER_FLOOR}" avoids most of these.
                      </p>
                    </div>
                  )}

                  {draft.skipped.length > 0 && (
                    <p className="flex items-start gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                      <AlertTriangle className="mt-px size-3 shrink-0" />
                      <span>
                        {draft.skipped.length} left in the pool:{" "}
                        {draft.skipped
                          .slice(0, 3)
                          .map((s) => `${s.title} (${s.reason})`)
                          .join(", ")}
                        {draft.skipped.length > 3 && `, and ${draft.skipped.length - 3} more`}.
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Categories that have already been fought keep their floor and position — the draft
            works around them.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={applying}>
            Cancel
          </Button>
          <Button onClick={() => onApply(options)} disabled={applying || nothingToDo}>
            {applying ? "Applying…" : "Apply this draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
