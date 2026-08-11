import { useEffect, useMemo, useState } from "react"
import { AlertCircle, KeyRound, Mail, MoreHorizontal, PlusCircle, Search } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  setUserPassword,
  requestPasswordReset,
  type User,
  type Role,
} from "@/lib/users"
import { listClubs, type Club } from "@/lib/clubs"

const ROLE_OPTIONS: Role[] = ["ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE", "TATAMI_OPERATOR"]

const roleStyles: Record<Role, string> = {
  SUPERADMIN: "bg-flag-red/15 text-flag-red border-flag-red/30",
  ADMIN: "bg-primary/15 text-primary border-primary/30",
  CLUB_MANAGER: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  COACH: "bg-belt-orange/15 text-belt-orange border-belt-orange/30",
  ATHLETE: "bg-muted text-muted-foreground border-border",
  TATAMI_OPERATOR: "bg-flag-green/15 text-flag-green border-flag-green/30",
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : ""

type UserForm = {
  name?: string
  email: string
  role: Role
  clubId?: string | null
}

const emptyForm: UserForm = { email: "", role: "ATHLETE", clubId: null }

const UsersPage = () => {
  const { role } = useAuth()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const canManage = role === "ADMIN" || role === "SUPERADMIN"
  const canCreateAdmin = role === "SUPERADMIN"

  const [users, setUsers] = useState<User[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Password dialog
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [settingPassword, setSettingPassword] = useState(false)

  const loadUsers = () => {
    setLoading(true)
    setError(null)
    return Promise.all([listUsers(), listClubs()])
      .then(([u, c]) => {
        setUsers(u)
        setClubs(c)
      })
      .catch((e) => {
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          (e as Error)?.message ??
          "Failed to load users"
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (canManage) loadUsers()
  }, [canManage])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (u) =>
        (u.email?.toLowerCase?.() ?? "").includes(query) ||
        (u.name?.toLowerCase?.() ?? "").includes(query) ||
        (u.role ?? "").toLowerCase().includes(query) ||
        (clubs.find((c) => c.id === u.clubId)?.name ?? "").toLowerCase().includes(query),
    )
  }, [users, clubs, q])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(u: User) {
    if (u.role === "SUPERADMIN") return
    setEditing(u)
    setForm({
      name: u.name ?? undefined,
      email: u.email,
      role: u.role,
      clubId: u.clubId ?? null,
    })
    setModalOpen(true)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: UserForm = { ...form }
      if (payload.clubId === "") payload.clubId = null
      if (editing) {
        const updated = await updateUser(editing.id, payload as Parameters<typeof updateUser>[1])
        setUsers((list) => list.map((u) => (u.id === editing.id ? updated : u)))
        toast.success("User updated")
      } else {
        const created = await createUser(payload as Parameters<typeof createUser>[0])
        setUsers((u) => [created, ...u])
        toast.success("User created")
      }
      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
    } catch (err) {
      showApiError(err, editing ? "Failed to update user" : "Failed to create user")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(u: User) {
    if (u.role === "SUPERADMIN") return
    const ok = await confirm({
      title: `Delete user ${u.email}?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    const prev = users
    setUsers((list) => list.filter((x) => x.id !== u.id))
    try {
      await deleteUser(u.id)
      toast.success("User deleted")
    } catch (err) {
      showApiError(err, "Failed to delete user")
      setUsers(prev)
    }
  }

  async function onResetPassword(u: User) {
    const ok = await confirm({
      title: "Generate password reset link?",
      description: "An email will be sent to the user with a reset link.",
      confirmText: "Generate link",
    })
    if (!ok) return
    try {
      const result = await requestPasswordReset(u.id)
      if (result.devToken) {
        const link = `${window.location.origin}/reset-password?token=${result.devToken}`
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(link).catch(() => {})
          toast.info("Dev reset link copied to clipboard")
        } else {
          toast.info(`Dev reset link: ${link}`)
        }
      } else {
        toast.success(result.message ?? "Password reset link sent")
      }
    } catch (err) {
      showApiError(err, "Failed to request password reset")
    }
  }

  function openPasswordModal(u: User) {
    setPasswordUser(u)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError(null)
  }

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordUser) return
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }
    setSettingPassword(true)
    try {
      await setUserPassword(passwordUser.id, newPassword)
      toast.success("Password set")
      setPasswordUser(null)
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        "Failed to set password"
      setPasswordError(msg)
    } finally {
      setSettingPassword(false)
    }
  }

  if (!canManage) {
    return (
      <AppShell title="Users">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage users.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title="Users">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">USERS</h1>
          <p className="text-xs text-muted-foreground mt-1">{users.length} total</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle />
          <span className="hidden sm:inline">New user</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search email, name, role, club..."
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
        <ErrorState title="Couldn't load users" message={error} onRetry={loadUsers} />
      )}

      {!loading && !error && (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Club</TableHead>
                <TableHead className="hidden xl:table-cell">Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {q.trim() ? `No users match "${q}".` : "No users yet."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div>
                      {u.email}
                      <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                        {u.name ?? "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {u.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-normal text-[10px]", roleStyles[u.role])}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {clubs.find((c) => c.id === u.clubId)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground tabular-nums">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    {u.role !== "SUPERADMIN" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Actions">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(u)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openPasswordModal(u)}>
                            <KeyRound />
                            Set password
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onResetPassword(u)}>
                            <Mail />
                            Send reset link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(u)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
            <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the user's profile and role."
                : "Create a user account. They'll need a password set separately."}
            </DialogDescription>
          </DialogHeader>
          <form id="user-form" onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="u-name" className="mb-1.5">Name</Label>
                <Input
                  id="u-name"
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="u-email" className="mb-1.5">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="u-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoCapitalize="none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="u-role" className="mb-1.5">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as Role })}
                >
                  <SelectTrigger id="u-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.filter((r) => (r === "ADMIN" ? canCreateAdmin : true)).map(
                      (r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="u-club" className="mb-1.5">Club</Label>
                <Select
                  value={form.clubId ?? "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, clubId: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger id="u-club" className="w-full">
                    <SelectValue placeholder="No club" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No club</SelectItem>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <Button type="submit" form="user-form" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordUser !== null} onOpenChange={(o) => !o && setPasswordUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set password</DialogTitle>
            <DialogDescription>
              Set a new password for <span className="text-foreground">{passwordUser?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form id="pw-form" onSubmit={onSetPassword} className="space-y-4">
            <div>
              <Label htmlFor="pw-new" className="mb-1.5">New password</Label>
              <Input
                id="pw-new"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min 8 chars: uppercase, lowercase, number, special.
              </p>
            </div>
            <div>
              <Label htmlFor="pw-confirm" className="mb-1.5">Confirm</Label>
              <Input
                id="pw-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
              >
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{passwordError}</p>
              </div>
            )}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPasswordUser(null)}>
              Cancel
            </Button>
            <Button type="submit" form="pw-form" disabled={settingPassword}>
              {settingPassword ? "Setting..." : "Set password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default UsersPage
