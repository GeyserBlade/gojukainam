import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Copy, Power, Radio, RefreshCw } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { setPublicAccess, type Event } from "@/lib/events"

// Admin control to enable/disable and share the read-only public board link.
export function PublicBoardShare({ event }: { event: Event }) {
  const qc = useQueryClient()
  const toast = useToast()
  const apiError = useApiErrorToast()
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => setPublicAccess(event.id, enabled),
    onSuccess: (_e, enabled) => {
      qc.invalidateQueries({ queryKey: ["events"] })
      qc.invalidateQueries({ queryKey: ["event", event.id] })
      toast.success(enabled ? "Public board link is live" : "Public board turned off")
    },
    onError: (e) => apiError(e, "Could not update the public board"),
  })

  const url = event.publicToken ? `${window.location.origin}/board/${event.publicToken}` : ""

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Copy failed — select the link and copy manually")
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Radio className="size-4 text-belt-green" /> Public board
        </div>

        {event.publicToken ? (
          <>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can follow the live mats and medal results — no login needed.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutation.mutate(true)}
                disabled={mutation.isPending}
                title="Generate a new link and revoke the old one"
              >
                <RefreshCw />
                Rotate link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutation.mutate(false)}
                disabled={mutation.isPending}
              >
                <Power />
                Turn off
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Turn on a read-only spectator link so coaches and families can follow live mats and
              results.
            </p>
            <Button size="sm" onClick={() => mutation.mutate(true)} disabled={mutation.isPending}>
              <Radio />
              Enable public board
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
