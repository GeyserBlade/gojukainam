import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock, Info, RotateCcw, Save, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiErrorToast, useToast } from "@/components/Toast"
import { getEventTiming, updateEventTiming } from "@/lib/events"
import {
  DEFAULT_EVENT_TIMING,
  KATA_MODE_HINTS,
  KATA_MODE_LABELS,
  KATA_PERFORMANCES_PER_BOUT,
  LUNCH_MODE_HINTS,
  LUNCH_MODE_LABELS,
  formatBoutDuration,
  type EventTiming,
  type KataMode,
  type LunchMode,
  type TimedBlock,
} from "@/lib/timing"

const NumberField = ({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  min = 0,
  step = 1,
  suffix,
}: {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  min?: number
  step?: number
  suffix?: string
}) => (
  <div>
    <Label htmlFor={id} className="mb-1.5">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={suffix ? "pr-12" : undefined}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
  </div>
)

const BlockField = ({
  id,
  label,
  block,
  onChange,
  disabled,
  children,
}: {
  id: string
  label: string
  block: TimedBlock
  onChange: (b: TimedBlock) => void
  disabled?: boolean
  children?: React.ReactNode
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="flex flex-1 cursor-pointer select-none items-center gap-2 text-sm"
      >
        <input
          id={id}
          type="checkbox"
          checked={block.enabled}
          disabled={disabled}
          onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
          className="accent-primary"
        />
        {label}
      </label>
      <div className="w-24">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          aria-label={`${label} minutes`}
          disabled={disabled || !block.enabled}
          value={block.minutes}
          onChange={(e) => onChange({ ...block, minutes: Number(e.target.value) })}
          className="h-8 text-sm"
        />
      </div>
      <span className="w-8 text-xs text-muted-foreground">min</span>
    </div>
    {children}
  </div>
)

/**
 * The tournament's default timing variables, stored on the event and edited
 * from the hub's Overview tab. Captured only — nothing consumes these yet; the
 * duration estimator still runs on its own session-only inputs.
 *
 * Read is open to everyone with hub access (a coach may want to know when
 * lunch and the ceremonies fall), so a non-manager sees the same values with
 * the controls disabled rather than a hidden card.
 */
export function EventTimingCard({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const qc = useQueryClient()
  const toast = useToast()
  const apiError = useApiErrorToast()

  const { data, isLoading } = useQuery({
    queryKey: ["event-timing", eventId],
    queryFn: () => getEventTiming(eventId),
    enabled: !!eventId,
  })

  const [draft, setDraft] = useState<EventTiming>(DEFAULT_EVENT_TIMING)

  // Adopt server state only when it actually differs from what we last synced,
  // so a background refetch returning identical data can't wipe out edits
  // mid-typing (the controlled-input-clobbered-by-refetch trap that bit the
  // Run → Plan mat order — see docs/state.md).
  const serverJson = data ? JSON.stringify(data) : null
  const syncedRef = useRef<string | null>(null)
  useEffect(() => {
    if (serverJson === null || syncedRef.current === serverJson) return
    syncedRef.current = serverJson
    setDraft(JSON.parse(serverJson) as EventTiming)
  }, [serverJson])

  const dirty = serverJson !== null && JSON.stringify(draft) !== serverJson

  const mutation = useMutation({
    mutationFn: (timing: EventTiming) => updateEventTiming(eventId, timing),
    onSuccess: (saved) => {
      // Seed the cache with the normalized config the server actually stored,
      // so the sync effect above adopts it instead of treating it as a change.
      syncedRef.current = JSON.stringify(saved)
      setDraft(saved)
      qc.setQueryData(["event-timing", eventId], saved)
      toast.success("Tournament timing saved")
    },
    onError: (e) => apiError(e, "Could not save the tournament timing"),
  })

  const set = <K extends keyof EventTiming>(key: K, value: EventTiming[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  if (isLoading) return <Skeleton className="h-72 w-full" />

  const disabled = !canManage || mutation.isPending

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4 text-belt-blue" /> Tournament timing
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_EVENT_TIMING)}
              disabled={mutation.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className="size-3" />
              Reset to defaults
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Default timing variables for this tournament. Categories inherit the bout duration and
          injury/stoppage buffer from here unless they override them under Setup.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Read-only: the Plan tab owns the floors now — adding or removing
              one there writes this number back. Leaving it editable here would
              let the two disagree, with nothing to say which was right. */}
          <NumberField
            id="timing-mats"
            label="Mats / floors"
            hint="Set by adding or removing floors on the Plan tab."
            value={draft.mats}
            min={1}
            disabled
            onChange={(v) => set("mats", v)}
          />
          <NumberField
            id="timing-bout"
            label="Kumite bout duration"
            hint={`Match clock — ${formatBoutDuration(draft.defaultBoutDurationSec)}.`}
            value={draft.defaultBoutDurationSec}
            min={10}
            step={10}
            suffix="sec"
            disabled={disabled}
            onChange={(v) => set("defaultBoutDurationSec", v)}
          />
          <NumberField
            id="timing-transition"
            label="Transition between bouts"
            hint="Mat time between bouts, on top of the match clock."
            value={draft.transitionSecondsPerBout}
            min={0}
            step={10}
            suffix="sec"
            disabled={disabled}
            onChange={(v) => set("transitionSecondsPerBout", v)}
          />
          <NumberField
            id="timing-buffer"
            label="Injury / stoppage buffer"
            hint="Added on top of total bout time to absorb delays."
            value={draft.defaultBufferPct}
            min={0}
            suffix="%"
            disabled={disabled}
            onChange={(v) => set("defaultBufferPct", v)}
          />
          <NumberField
            id="timing-changeover"
            label="Changeover per category"
            hint="Time a mat loses moving to the next category."
            value={draft.changeoverMinutes}
            min={0}
            suffix="min"
            disabled={disabled}
            onChange={(v) => set("changeoverMinutes", v)}
          />
        </div>

        {/* Kata is timed on its own terms: a performance is not a match, and
            whether the pair performs one after the other or side by side is
            worth roughly a factor of two on every kata category in the event. */}
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">Kata</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              id="timing-kata-bout"
              label="Kata performance length"
              hint={`One performance — ${formatBoutDuration(draft.kataBoutDurationSec)}.`}
              value={draft.kataBoutDurationSec}
              min={10}
              step={10}
              suffix="sec"
              disabled={disabled}
              onChange={(v) => set("kataBoutDurationSec", v)}
            />
            <div className="sm:col-span-1 lg:col-span-2">
              <Label className="mb-1.5 block text-xs">How competitors take the floor</Label>
              <Select
                value={draft.kataMode}
                onValueChange={(v) => set("kataMode", v as KataMode)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KATA_MODE_LABELS) as KataMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {KATA_MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {KATA_MODE_HINTS[draft.kataMode]}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                A kata bout therefore costs the mat{" "}
                <span className="font-medium text-foreground">
                  {formatBoutDuration(
                    draft.kataBoutDurationSec * KATA_PERFORMANCES_PER_BOUT[draft.kataMode],
                  )}
                </span>{" "}
                of performance time, before the transition and buffer.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">Ceremonies and breaks</p>
          <BlockField
            id="timing-opening"
            label="Opening ceremony"
            block={draft.opening}
            disabled={disabled}
            onChange={(b) => set("opening", b)}
          />
          <BlockField
            id="timing-closing"
            label="Closing ceremony"
            block={draft.closing}
            disabled={disabled}
            onChange={(b) => set("closing", b)}
          />
          <BlockField
            id="timing-lunch"
            label="Lunch break"
            block={draft.lunch}
            disabled={disabled}
            onChange={(b) => set("lunch", { ...draft.lunch, ...b })}
          >
            <div className="pl-6">
              <Label htmlFor="timing-lunch-mode" className="mb-1.5 text-xs text-muted-foreground">
                How the mats break
              </Label>
              <Select
                value={draft.lunch.mode}
                disabled={disabled || !draft.lunch.enabled}
                onValueChange={(v) => set("lunch", { ...draft.lunch, mode: v as LunchMode })}
              >
                <SelectTrigger id="timing-lunch-mode" className="w-full sm:max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_MATS">{LUNCH_MODE_LABELS.ALL_MATS}</SelectItem>
                  <SelectItem value="PER_FLOOR">{LUNCH_MODE_LABELS.PER_FLOOR}</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {LUNCH_MODE_HINTS[draft.lunch.mode]}
              </p>
            </div>
          </BlockField>
          <BlockField
            id="timing-checkin"
            label="Athlete check-in / warm-up"
            block={draft.checkin}
            disabled={disabled}
            onChange={(b) => set("checkin", b)}
          />
        </div>

        {canManage ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button
              size="sm"
              onClick={() => mutation.mutate(draft)}
              disabled={!dirty || mutation.isPending}
            >
              <Save />
              {mutation.isPending ? "Saving…" : "Save timing"}
            </Button>
            {dirty && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => serverJson && setDraft(JSON.parse(serverJson) as EventTiming)}
                disabled={mutation.isPending}
              >
                <Undo2 />
                Discard changes
              </Button>
            )}
            {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        ) : (
          <p className="flex items-start gap-1.5 border-t pt-3 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" />
            Only admins and this event's coordinator can change these.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
