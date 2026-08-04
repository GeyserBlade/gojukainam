import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, UserPlus, X } from "lucide-react"

import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  listCoordinators,
  listCoordinatorCandidates,
  addCoordinator,
  removeCoordinator,
  type CoordinatorUser,
} from "@/lib/events"

const displayName = (u: { name: string | null; email: string }) => u.name?.trim() || u.email

/**
 * Who may run this tournament on the organiser's behalf.
 *
 * `canAppoint` is admin-only: a coordinator can see who else is running the day
 * with them, but cannot appoint or revoke — that mirrors the server, where the
 * coordinator routes stay on requireRoles("SUPERADMIN", "ADMIN").
 */
export function EventCoordinators({
  eventId,
  canAppoint,
}: {
  eventId: string
  canAppoint: boolean
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()

  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState("")

  const { data: coordinators = [], isLoading } = useQuery({
    queryKey: ["eventCoordinators", eventId],
    queryFn: () => listCoordinators(eventId),
  })

  const { data: candidates = [], isFetching: loadingCandidates } = useQuery({
    queryKey: ["coordinatorCandidates", eventId, search],
    queryFn: () => listCoordinatorCandidates(eventId, search || undefined),
    enabled: showPicker && canAppoint,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["eventCoordinators", eventId] })
    qc.invalidateQueries({ queryKey: ["coordinatorCandidates", eventId] })
  }

  const addMutation = useMutation({
    mutationFn: (userId: string) => addCoordinator(eventId, userId),
    onSuccess: (_rows, userId) => {
      const who = candidates.find((c) => c.id === userId)
      invalidate()
      setShowPicker(false)
      setSearch("")
      toast.success(
        who ? `${displayName(who)} can now manage this event` : "Coordinator appointed",
      )
    },
    onError: (e) => showApiError(e, "Failed to appoint coordinator"),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeCoordinator(eventId, userId),
    onSuccess: () => {
      invalidate()
      toast.success("Coordinator removed")
    },
    onError: (e) => showApiError(e, "Failed to remove coordinator"),
  })

  const handleRemove = async (user: CoordinatorUser) => {
    const ok = await confirm({
      title: `Remove ${displayName(user)} as coordinator?`,
      description:
        "They lose access to this event's entries, draws and run-day controls immediately. Their own club access is unaffected.",
      confirmText: "Remove",
      destructive: true,
    })
    if (ok) removeMutation.mutate(user.id)
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base tracking-wide">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Coordinators
            </h3>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              Coordinators manage this event on your behalf — entries, divisions, draws and
              run-day. They cannot see billing, manage users, or delete the event.
            </p>
          </div>
          {canAppoint && (
            <Button
              size="sm"
              onClick={() => {
                setSearch("")
                setShowPicker(true)
              }}
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              Appoint
            </Button>
          )}
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : coordinators.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No coordinators. You are managing this event yourself.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {coordinators.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{displayName(c.user)}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {c.user.role === "CLUB_MANAGER" ? "Club manager" : "Coach"}
                      </Badge>
                      {c.user.club && (
                        <span className="truncate text-xs text-muted-foreground">
                          {c.user.club.name}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.user.email}</p>
                  </div>
                  {canAppoint && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(c.user)}
                      disabled={removeMutation.isPending}
                      aria-label={`Remove ${displayName(c.user)}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      {/* Appointment picker */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appoint a coordinator</DialogTitle>
            <DialogDescription>
              Club managers and coaches only. They keep their own club access and gain management
              of this event alone.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-72 space-y-1 overflow-y-auto">
            {loadingCandidates ? (
              <Skeleton className="h-10 w-full" />
            ) : candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {search ? "No matching users." : "No eligible users."}
              </p>
            ) : (
              candidates.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate(u.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left",
                    "hover:border-foreground/20 disabled:opacity-50",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{displayName(u)}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.email}
                      {u.club ? ` · ${u.club.name}` : ""}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {u.role === "CLUB_MANAGER" ? "Club manager" : "Coach"}
                  </Badge>
                </button>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPicker(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
