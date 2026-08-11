import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, UserCog, X } from "lucide-react"

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
import { useConfirm } from "@/components/ConfirmDialog"
import { listUsers, type User } from "@/lib/users"
import { assignMatOperator, listMatOperators, removeMatOperator } from "@/lib/run"

/**
 * Who runs each tatami. Lives beside the floors on the Plan tab, because the
 * question "who is on Mat 2" only makes sense once Mat 2 exists.
 *
 * Anyone can be handed a tatami — a coach covering an hour keeps their own
 * role. The grant is what confers the power, so this does not filter the user
 * list by role and does not change anyone's role.
 */
export function MatOperators({
  eventId,
  mats,
  canManage,
}: {
  eventId: string
  mats: { id: string; name: string }[]
  canManage: boolean
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const apiError = useApiErrorToast()
  const confirm = useConfirm()
  const [dialog, setDialog] = useState<{ open: boolean; matId: string | null }>({
    open: false,
    matId: null,
  })
  const [search, setSearch] = useState("")
  const [picked, setPicked] = useState<string>("")

  const { data: operators = [], isLoading } = useQuery({
    queryKey: ["mat-operators", eventId],
    queryFn: () => listMatOperators(eventId),
    enabled: !!eventId,
  })

  const { data: users = [] } = useQuery({
    queryKey: ["users", "operator-candidates"],
    queryFn: () => listUsers(),
    enabled: dialog.open,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["mat-operators", eventId] })

  const assign = useMutation({
    mutationFn: ({ matId, userId }: { matId: string; userId: string }) =>
      assignMatOperator(matId, userId),
    onSuccess: () => {
      setDialog({ open: false, matId: null })
      setPicked("")
      setSearch("")
      invalidate()
      toast.success("Operator assigned")
    },
    onError: (e) => apiError(e, "Could not assign the operator"),
  })

  const remove = useMutation({
    mutationFn: ({ matId, userId }: { matId: string; userId: string }) =>
      removeMatOperator(matId, userId),
    onSuccess: () => {
      invalidate()
      toast.success("Operator removed")
    },
    onError: (e) => apiError(e, "Could not remove the operator"),
  })

  const byMat = new Map<string, typeof operators>()
  for (const op of operators) {
    const list = byMat.get(op.matId)
    if (list) list.push(op)
    else byMat.set(op.matId, [op])
  }

  const needle = search.trim().toLowerCase()
  const candidates = users
    .filter((u: User) => !needle || `${u.name ?? ""} ${u.email}`.toLowerCase().includes(needle))
    .slice(0, 40)

  if (isLoading) return <Skeleton className="h-32 w-full" />

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <UserCog className="size-4 text-belt-blue" />
          <h3 className="text-sm font-medium">Who runs each tatami</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          An operator sees only the bouts on the mats listed here, and can record results on them
          — nothing else. They cannot change the running order, the plan, or any athlete.
        </p>

        {mats.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            Add a floor first.
          </p>
        ) : (
          <div className="space-y-2">
            {mats.map((mat) => {
              const assigned = byMat.get(mat.id) ?? []
              return (
                <div key={mat.id} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm font-medium">{mat.name}</span>
                    {canManage && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setDialog({ open: true, matId: mat.id })}
                      >
                        <Plus />
                        Assign
                      </Button>
                    )}
                  </div>
                  {assigned.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Nobody assigned — this mat cannot be run from a tatami login yet.
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {assigned.map((op) => (
                        <Badge
                          key={op.id}
                          variant="outline"
                          className="gap-1 py-1 pr-1 pl-2 font-normal"
                        >
                          <span className="truncate">{op.user.name || op.user.email}</span>
                          {canManage && (
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Remove ${op.user.name || op.user.email} from ${mat.name}`}
                              onClick={async () => {
                                const ok = await confirm({
                                  title: `Remove ${op.user.name || op.user.email}?`,
                                  description: `They lose access to ${mat.name} immediately. Results they already recorded are kept.`,
                                  confirmText: "Remove",
                                  destructive: true,
                                })
                                if (ok) remove.mutate({ matId: mat.id, userId: op.user.id })
                              }}
                            >
                              <X />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => !open && setDialog({ open: false, matId: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign an operator to {mats.find((m) => m.id === dialog.matId)?.name}
            </DialogTitle>
            <DialogDescription>
              They will see this mat's bouts and be able to record results on them. Their own role
              is unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="op-search">Find a person</Label>
              <Input
                id="op-search"
                placeholder="Name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Person</Label>
              <Select value={picked} onValueChange={setPicked}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick someone" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((u: User) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email} · {u.role.toLowerCase().replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog({ open: false, matId: null })}
              disabled={assign.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                dialog.matId && assign.mutate({ matId: dialog.matId, userId: picked })
              }
              disabled={!picked || assign.isPending}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
