import { useEffect, useMemo, useState } from "react"
import { MoreHorizontal, PlusCircle, Search } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { ErrorState } from "@/components/UIState"
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
import { Belt, createBelt, deleteBelt, listBelts, updateBelt } from "@/lib/belts"

type BeltForm = {
  name?: string | null
  colour?: string | null
  notes?: string | null
  gradingRequirements?: string | null
  order: number
}

const emptyForm: BeltForm = { order: 0 }

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : ""

const BeltsPage = () => {
  const { role } = useAuth()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const canManage = role === "ADMIN" || role === "SUPERADMIN"

  const [belts, setBelts] = useState<Belt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Belt | null>(null)
  const [form, setForm] = useState<BeltForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadBelts = () => {
    setLoading(true)
    setError(null)
    return listBelts()
      .then(setBelts)
      .catch((e) => {
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          (e as Error)?.message ??
          "Failed to load belts"
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (canManage) loadBelts()
  }, [canManage])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return belts
    return belts.filter(
      (b) =>
        (b.name || "").toLowerCase().includes(query) ||
        (b.colour || "").toLowerCase().includes(query) ||
        (b.notes || "").toLowerCase().includes(query),
    )
  }, [belts, q])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, order: belts.length })
    setModalOpen(true)
  }

  function openEdit(b: Belt) {
    setEditing(b)
    setForm({
      name: b.name ?? null,
      colour: b.colour ?? null,
      notes: b.notes ?? null,
      gradingRequirements: b.gradingRequirements ?? null,
      order: b.order,
    })
    setModalOpen(true)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateBelt(editing.id, form as Partial<Belt>)
        setBelts((list) =>
          list
            .map((x) => (x.id === editing.id ? updated : x))
            .sort((a, b) => a.order - b.order || (a.name || "").localeCompare(b.name || "")),
        )
        toast.success("Belt updated")
      } else {
        const created = await createBelt(form as Parameters<typeof createBelt>[0])
        setBelts((list) =>
          [...list, created].sort(
            (a, b) => a.order - b.order || (a.name || "").localeCompare(b.name || ""),
          ),
        )
        toast.success("Belt created")
      }
      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
    } catch (err) {
      showApiError(err, editing ? "Failed to update belt" : "Failed to create belt")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(b: Belt) {
    const refCount = b._count?.Athlete ?? 0
    const ok = await confirm({
      title: `Delete belt ${b.name || ""}?`,
      description:
        refCount > 0
          ? `This belt is used by ${refCount} athlete(s). Delete anyway?`
          : "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    const prev = belts
    setBelts((list) => list.filter((x) => x.id !== b.id))
    try {
      await deleteBelt(b.id)
      toast.success("Belt deleted")
    } catch (err) {
      showApiError(err, "Failed to delete belt")
      setBelts(prev)
    }
  }

  if (!canManage) {
    return (
      <AppShell title="Belts">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage belts.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title="Belts">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">BELTS</h1>
          <p className="text-xs text-muted-foreground mt-1">{belts.length} ranks</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle />
          <span className="hidden sm:inline">New belt</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search name, colour, notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <ErrorState title="Couldn't load belts" message={error} onRetry={loadBelts} />
      )}

      {!loading && !error && (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Belt</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Athletes</TableHead>
                <TableHead className="hidden xl:table-cell">Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {q.trim() ? `No belts match "${q}".` : "No belts yet."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="tabular-nums">{b.order}</TableCell>
                  <TableCell>
                    <BeltBadge name={b.name} colour={b.colour} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[20rem] truncate">
                    {b.notes ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right tabular-nums text-muted-foreground">
                    {b._count?.Athlete ?? 0}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {formatDate(b.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(b)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => onDelete(b)}
                        >
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
            <DialogTitle>{editing ? "Edit belt" : "New belt"}</DialogTitle>
            <DialogDescription>
              Define a belt rank. Order controls list position.
            </DialogDescription>
          </DialogHeader>
          <form id="belt-form" onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="belt-name" className="mb-1.5">Name</Label>
                <Input
                  id="belt-name"
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Yellow"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="belt-colour" className="mb-1.5">Colour</Label>
                <Input
                  id="belt-colour"
                  value={form.colour ?? ""}
                  onChange={(e) => setForm({ ...form, colour: e.target.value })}
                  placeholder="e.g. yellow"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="belt-order" className="mb-1.5">Order</Label>
              <Input
                id="belt-order"
                type="number"
                required
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="max-w-32"
              />
            </div>
            <div>
              <Label htmlFor="belt-notes" className="mb-1.5">Notes</Label>
              <Input
                id="belt-notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="belt-req" className="mb-1.5">Grading requirements</Label>
              <Textarea
                id="belt-req"
                rows={4}
                value={form.gradingRequirements ?? ""}
                onChange={(e) =>
                  setForm({ ...form, gradingRequirements: e.target.value })
                }
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="belt-form" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default BeltsPage
