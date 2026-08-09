import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { PlanBlock } from "@/lib/plan"
import { CLOCK_TIME_RE } from "@/lib/timing"
import type { ScheduleBlockKind } from "@/lib/schedule"
import { BLOCK_LABELS } from "./plan-visuals"

export interface BlockDraft {
  kind: ScheduleBlockKind
  label: string
  minutes: number
  /** null = spans every floor. */
  matId: string | null
  /** "HH:MM", or null when the block is anchored to the start/end of the day. */
  startTime: string | null
}

const KIND_HINTS: Record<ScheduleBlockKind, string> = {
  OPENING: "Runs before the first bout on every floor.",
  CLOSING: "Runs after the last floor finishes.",
  LUNCH: "The midday break.",
  BREAK: "Any other stoppage — awards, a demonstration, a floor reset.",
}

/**
 * Add or edit a ceremony or break.
 *
 * The scope picker is the substantive choice here: a venue-wide block stops
 * every floor at one clock time, while a block on a floor sits in that floor's
 * running order and the other floors keep competing. Those are genuinely
 * different plans, so the dialog makes it an explicit decision rather than
 * inferring it from which column the user happened to click.
 */
export function BlockDialog({
  open,
  onOpenChange,
  mats,
  initial,
  editing,
  defaultLunchMinutes,
  saving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mats: { id: string; name: string }[]
  initial?: Partial<BlockDraft>
  /** The block being edited; absent when creating. Scope is fixed once created. */
  editing?: PlanBlock | null
  defaultLunchMinutes: number
  saving: boolean
  onSubmit: (draft: BlockDraft) => void
}) {
  const [kind, setKind] = useState<ScheduleBlockKind>("BREAK")
  const [label, setLabel] = useState("")
  const [minutes, setMinutes] = useState("15")
  const [matId, setMatId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState("")

  // Reset from the trigger's intent each time the dialog opens, not on every
  // render — otherwise typing in the label box fights the initial value.
  useEffect(() => {
    if (!open) return
    const seed: Partial<BlockDraft> = editing
      ? {
          kind: editing.kind,
          label: editing.label,
          minutes: editing.minutes,
          matId: editing.matId,
          startTime: editing.startTime,
        }
      : (initial ?? {})
    const k = seed.kind ?? "BREAK"
    setKind(k)
    setLabel(seed.label ?? BLOCK_LABELS[k])
    setMinutes(String(seed.minutes ?? (k === "LUNCH" ? defaultLunchMinutes : 15)))
    setMatId(seed.matId ?? null)
    setStartTime(seed.startTime ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isVenueWide = matId === null
  // OPENING and CLOSING already know where they sit; a time is optional there
  // and pins them to the clock instead. Anything else venue-wide needs one, or
  // the schedule has nowhere to put it.
  const timeOptional = kind === "OPENING" || kind === "CLOSING"
  const needsTime = isVenueWide && !timeOptional
  const timeValid = startTime === "" ? !needsTime : CLOCK_TIME_RE.test(startTime)
  const minutesNum = Number(minutes)
  const minutesValid = Number.isFinite(minutesNum) && minutesNum >= 0 && minutesNum <= 600
  const valid = label.trim().length > 0 && minutesValid && timeValid

  const submit = () => {
    if (!valid) return
    onSubmit({
      kind,
      label: label.trim(),
      minutes: Math.round(minutesNum),
      matId,
      startTime: isVenueWide && startTime !== "" ? startTime : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit break" : "Add to the schedule"}</DialogTitle>
          <DialogDescription>
            Ceremonies and breaks sit in the plan alongside the categories, and the
            schedule works around them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!editing && (
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={kind}
                onValueChange={(v) => {
                  const next = v as ScheduleBlockKind
                  setKind(next)
                  // Keep the label in step while it is still the untouched
                  // default, so switching type doesn't leave "Break" on a lunch.
                  setLabel((current) =>
                    Object.values(BLOCK_LABELS).includes(current) ? BLOCK_LABELS[next] : current,
                  )
                  if (next === "LUNCH") setMinutes(String(defaultLunchMinutes))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BLOCK_LABELS) as ScheduleBlockKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {BLOCK_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{KIND_HINTS[kind]}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="block-label">Name</Label>
            <Input id="block-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-minutes">Length (minutes)</Label>
              <Input
                id="block-minutes"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                aria-invalid={!minutesValid}
              />
            </div>
            {isVenueWide && (
              <div className="space-y-1.5">
                <Label htmlFor="block-time">
                  Start time{timeOptional && <span className="text-muted-foreground"> (optional)</span>}
                </Label>
                <Input
                  id="block-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  aria-invalid={!timeValid}
                />
              </div>
            )}
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label>Applies to</Label>
              <Select
                value={matId ?? "all"}
                onValueChange={(v) => setMatId(v === "all" ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Every floor — the whole venue stops</SelectItem>
                  {mats.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} only
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {isVenueWide
                  ? "Drawn as a band across the whole plan. Every floor pauses at the same time."
                  : "Sits in that floor's running order — drag it into position. The other floors keep going."}
              </p>
            </div>
          )}

          {isVenueWide && timeOptional && startTime === "" && (
            <p className="rounded-md border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
              {kind === "OPENING"
                ? "No time set, so this runs at the start of the day and pushes the first bout back."
                : "No time set, so this runs once the last floor has finished."}
            </p>
          )}
          {needsTime && startTime === "" && (
            <p className={cn("text-[11px]", "text-belt-orange")}>
              A venue-wide break needs a start time — that is when every floor stops.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {editing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
