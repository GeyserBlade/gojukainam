import { useEffect, useMemo, useState, type FormEvent } from "react"
import { FileText, MoreHorizontal, PlusCircle, Search } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { DocumentSection } from "@/components/DocumentSection"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  createClub,
  deleteClub,
  listClubs,
  updateClub,
  type Club,
} from "@/lib/clubs"

type ClubForm = {
  name: string
  region: string
  contactName: string
  email: string
  phone: string
  notes: string
}

const defaultForm: ClubForm = {
  name: "",
  region: "",
  contactName: "",
  email: "",
  phone: "",
  notes: "",
}

function sanitize(form: ClubForm) {
  const trimOrNull = (value: string) => {
    const t = value.trim()
    return t.length ? t : null
  }
  return {
    name: form.name.trim(),
    region: trimOrNull(form.region),
    contactName: form.contactName.trim(),
    email: form.email.trim(),
    phone: trimOrNull(form.phone),
    notes: trimOrNull(form.notes),
  }
}

const ClubsPage = () => {
  const { role } = useAuth()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const canManage = role === "ADMIN" || role === "SUPERADMIN"

  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Club | null>(null)
  const [form, setForm] = useState<ClubForm>(defaultForm)
  const [saving, setSaving] = useState(false)

  const [docsClub, setDocsClub] = useState<Club | null>(null)

  const loadClubs = () => {
    setLoading(true)
    setError(null)
    return listClubs()
      .then(setClubs)
      .catch((e) => {
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          (e as Error)?.message ??
          "Failed to load clubs"
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (canManage) loadClubs()
  }, [canManage])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return clubs
    return clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(query) ||
        (club.region ?? "").toLowerCase().includes(query) ||
        club.contactName.toLowerCase().includes(query) ||
        club.email.toLowerCase().includes(query) ||
        (club.phone ?? "").toLowerCase().includes(query),
    )
  }, [clubs, q])

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(club: Club) {
    setEditing(club)
    setForm({
      name: club.name ?? "",
      region: club.region ?? "",
      contactName: club.contactName ?? "",
      email: club.email ?? "",
      phone: club.phone ?? "",
      notes: club.notes ?? "",
    })
    setModalOpen(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = sanitize(form)
      if (!payload.name || !payload.contactName || !payload.email) {
        throw new Error("Name, contact name and email are required")
      }
      if (editing) {
        const updated = await updateClub(editing.id, payload)
        setClubs((list) =>
          list
            .map((c) => (c.id === editing.id ? updated : c))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
        toast.success("Club updated")
      } else {
        const created = await createClub(payload)
        setClubs((list) =>
          [created, ...list].sort((a, b) => a.name.localeCompare(b.name)),
        )
        toast.success("Club created")
      }
      setModalOpen(false)
      setEditing(null)
      setForm(defaultForm)
    } catch (err) {
      showApiError(err, editing ? "Failed to update club" : "Failed to create club")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(club: Club) {
    const counts = club._count ?? { athletes: 0, users: 0, teams: 0, entries: 0 }
    const totalRefs = counts.athletes + counts.users + counts.teams + counts.entries
    const ok = await confirm({
      title: `Delete club ${club.name}?`,
      description:
        totalRefs > 0
          ? `This club has ${counts.athletes} athletes, ${counts.users} users, ${counts.teams} teams, and ${counts.entries} entries. Delete anyway?`
          : "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    const previous = clubs
    setClubs((list) => list.filter((c) => c.id !== club.id))
    try {
      await deleteClub(club.id)
      toast.success("Club deleted")
    } catch (err) {
      showApiError(err, "Failed to delete club")
      setClubs(previous)
    }
  }

  if (!canManage) {
    return (
      <AppShell title="Clubs">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage clubs.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title="Clubs">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">CLUBS</h1>
          <p className="text-xs text-muted-foreground mt-1">{clubs.length} total</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle />
          <span className="hidden sm:inline">New club</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search name, region, contact, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <ErrorState title="Couldn't load clubs" message={error} onRetry={loadClubs} />
      )}

      {!loading && !error && (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Region</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden xl:table-cell text-right">Athletes</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {q.trim() ? `No clubs match "${q}".` : "No clubs yet."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((club) => (
                <TableRow key={club.id}>
                  <TableCell className="font-medium">
                    <div>
                      {club.name}
                      <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                        {[club.region, club.contactName].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {club.region ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {club.contactName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground truncate max-w-[14rem]">
                    {club.email}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-right">
                    <Badge variant="outline" className="font-normal tabular-nums">
                      {club._count?.athletes ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(club)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setDocsClub(club)}>
                          <FileText />
                          Documents
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => onDelete(club)}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit club" : "New club"}</DialogTitle>
            <DialogDescription>
              Name, contact name and email are required.
            </DialogDescription>
          </DialogHeader>
          <form id="club-form" onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="club-name" className="mb-1.5">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="club-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="club-region" className="mb-1.5">Region</Label>
                <Input
                  id="club-region"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="club-contact" className="mb-1.5">
                  Contact name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="club-contact"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="club-email" className="mb-1.5">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="club-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="club-phone" className="mb-1.5">Phone</Label>
                <Input
                  id="club-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="club-notes" className="mb-1.5">Notes</Label>
              <Textarea
                id="club-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            <Button type="submit" form="club-form" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={docsClub !== null}
        onOpenChange={(o) => !o && setDocsClub(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg gap-0"
        >
          <SheetHeader>
            <SheetTitle>{docsClub?.name} — Documents</SheetTitle>
            <SheetDescription>
              Upload and manage club documents.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {docsClub && (
              <DocumentSection
                entityFilter={{ clubId: docsClub.id }}
                canUpload={canManage}
                canDelete={canManage}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

export default ClubsPage
