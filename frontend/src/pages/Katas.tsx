import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, PlusCircle, Search } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useApiErrorToast, useToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { ErrorState } from "@/components/UIState"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createKata, deleteKata, listKatas, updateKata, type Kata } from "@/lib/kata"

type KataForm = {
  name: string
  style: string
  order: number
  active: boolean
  notes: string
}

const emptyForm: KataForm = { name: "", style: "", order: 0, active: true, notes: "" }

/**
 * The allowable kata list — what a competitor may declare on the mat-side kata
 * board. Seeded with the Goju Kai / Goju-ryu syllabus; this screen exists
 * because a syllabus is an association's decision, not the app's.
 */
const KatasPage = () => {
  const { role } = useAuth()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const canManage = role === "ADMIN" || role === "SUPERADMIN"

  const [q, setQ] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Kata | null>(null)
  const [form, setForm] = useState<KataForm>(emptyForm)

  const {
    data: katas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    // Retired katas included: this is the screen where you un-retire one.
    queryKey: ["katas", "all"],
    queryFn: () => listKatas(true),
    enabled: canManage,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["katas"] })

  const save = useMutation({
    mutationFn: (f: KataForm) => {
      const payload = {
        name: f.name.trim(),
        style: f.style.trim() || null,
        order: f.order,
        active: f.active,
        notes: f.notes.trim() || null,
      }
      return editing ? updateKata(editing.id, payload) : createKata(payload)
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
      toast.success(editing ? "Kata updated" : "Kata added")
    },
    onError: (e) => showApiError(e, editing ? "Could not update the kata" : "Could not add the kata"),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteKata(id),
    onSuccess: () => {
      invalidate()
      toast.success("Kata deleted")
    },
    onError: (e) => showApiError(e, "Could not delete the kata"),
  })

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return katas
    return katas.filter((k) =>
      `${k.name} ${k.style ?? ""} ${k.notes ?? ""}`.toLowerCase().includes(needle),
    )
  }, [katas, q])

  const openCreate = () => {
    setEditing(null)
    // Ten past the last one, matching how the seeded list is spaced.
    setForm({ ...emptyForm, order: (katas.length ? katas[katas.length - 1].order : 0) + 10 })
    setModalOpen(true)
  }

  const openEdit = (k: Kata) => {
    setEditing(k)
    setForm({
      name: k.name,
      style: k.style ?? "",
      order: k.order,
      active: k.active,
      notes: k.notes ?? "",
    })
    setModalOpen(true)
  }

  const onDelete = async (k: Kata) => {
    const used = k._count?.performances ?? 0
    const ok = await confirm({
      title: `Delete ${k.name}?`,
      description:
        used > 0
          ? `${k.name} has been performed in ${used} recorded bout(s), so it cannot be deleted — untick “In use” instead to take it out of circulation.`
          : "This cannot be undone. To take a kata out of circulation without losing it, untick “In use” instead.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) remove.mutate(k.id)
  }

  if (!canManage) {
    return (
      <AppShell title="Katas">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage the kata list.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  const activeCount = katas.filter((k) => k.active).length

  return (
    <AppShell title="Katas">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">KATAS</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeCount} allowable
            {katas.length !== activeCount ? ` · ${katas.length - activeCount} retired` : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle />
          <span className="hidden sm:inline">New kata</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        These are the katas a competitor can be recorded as performing on the mat-side kata board.
        A kata that has already been performed cannot be deleted — untick “In use” to retire it, so
        results already recorded against it still read correctly.
      </p>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, style, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <ErrorState
          title="Couldn't load the kata list"
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Kata</TableHead>
                <TableHead className="hidden sm:table-cell">Style</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Performed</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {q.trim() ? `No katas match "${q}".` : "No katas yet."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((k) => (
                <TableRow key={k.id} className={k.active ? undefined : "opacity-55"}>
                  <TableCell className="tabular-nums">{k.order}</TableCell>
                  <TableCell className="font-medium">
                    {k.name}
                    {!k.active && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Retired
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {k.style ?? "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-[20rem] truncate text-muted-foreground md:table-cell">
                    {k.notes ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                    {k._count?.performances ?? 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${k.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(k)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            updateKata(k.id, { active: !k.active })
                              .then(() => {
                                invalidate()
                                toast.success(k.active ? "Kata retired" : "Kata back in use")
                              })
                              .catch((e) => showApiError(e, "Could not change the kata"))
                          }
                        >
                          {k.active ? "Retire" : "Put back in use"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(k)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "New kata"}</DialogTitle>
            <DialogDescription>
              Order controls where it sits in the list the mat sees, beginner to advanced.
            </DialogDescription>
          </DialogHeader>
          <form
            id="kata-form"
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(form)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="kata-name" className="mb-1.5">Name</Label>
                <Input
                  id="kata-name"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Seiyunchin"
                />
              </div>
              <div>
                <Label htmlFor="kata-style" className="mb-1.5">Style</Label>
                <Input
                  id="kata-style"
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  placeholder="e.g. Goju-ryu"
                />
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <Label htmlFor="kata-order" className="mb-1.5">Order</Label>
                <Input
                  id="kata-order"
                  type="number"
                  required
                  className="max-w-32"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                In use
              </label>
            </div>
            <div>
              <Label htmlFor="kata-notes" className="mb-1.5">Notes</Label>
              <Textarea
                id="kata-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything the judges should know about when this kata may be used."
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="kata-form" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default KatasPage
