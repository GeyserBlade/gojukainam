import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Label, Select } from "../components/Input";
import { SkeletonList, EmptyState, ErrorState } from "../components/UIState";
import { useToast, useApiErrorToast } from "../components/Toast";
import { createUser, deleteUser, listUsers, updateUser, setUserPassword, requestPasswordReset, type User, type Role } from "../lib/users";
import { listClubs, type Club } from "../lib/clubs";

const roleOptions: Role[] = ["ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE"]; // exclude SUPERADMIN create/edit
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "");

const UsersPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{ name?: string; email: string; role: Role; clubId?: string | null }>({ email: "", role: "ATHLETE" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<{ name: string; email: string; role: Role; clubId: string | null }>>({});
  const [clubs, setClubs] = useState<Club[]>([]);

  // Password management state
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [settingPassword, setSettingPassword] = useState(false);

  const canManage = role === "ADMIN" || role === "SUPERADMIN";
  const canCreateAdmin = role === "SUPERADMIN";

  const loadUsers = () => {
    setLoading(true); setError(null);
    return Promise.all([listUsers(), listClubs()])
      .then(([u, c]) => { setUsers(u); setClubs(c); })
      .catch((e: any) => setError(e?.response?.data?.error || e.message || "Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canManage) return;
    loadUsers();
  }, [canManage]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter(u =>
      (u.email?.toLowerCase?.() || "").includes(query) ||
      (u.name?.toLowerCase?.() || "").includes(query) ||
      (u.role || "").toLowerCase().includes(query) ||
      (u.clubId || "").toLowerCase().includes(query)
    );
  }, [users, q]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...createForm } as any;
      if (payload.clubId === "") payload.clubId = null;
      const created = await createUser(payload);
      setUsers((u) => [created, ...u]);
      setCreateForm({ email: "", role: "ATHLETE" });
      setCreating(false);
      toast.success("User created");
    } catch (err) {
      showApiError(err, "Failed to create user");
    }
  }

  function startEdit(u: User) {
    if (u.role === "SUPERADMIN") return;
    setEditingId(u.id);
    setEditForm({ name: u.name ?? undefined, email: u.email, role: u.role, clubId: u.clubId ?? null });
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    try {
      const payload = { ...editForm } as any;
      if (payload.clubId === "") payload.clubId = null;
      const updated = await updateUser(editingId, payload);
      setUsers((list) => list.map((u) => (u.id === editingId ? updated : u)));
      setEditingId(null);
      setEditForm({});
      toast.success("User updated");
    } catch (err) {
      showApiError(err, "Failed to update user");
    }
  }

  async function onDelete(id: string, u: User) {
    if (u.role === "SUPERADMIN") return;
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    const prev = users;
    setUsers((list) => list.filter((x) => x.id !== id));
    try {
      await deleteUser(id);
      toast.success("User deleted");
    } catch (err) {
      showApiError(err, "Failed to delete user");
      setUsers(prev);
    }
  }

  function openPasswordModal(userId: string) {
    setPasswordUserId(userId);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  }

  function closePasswordModal() {
    setPasswordUserId(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  }

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordUserId) return;

    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setSettingPassword(true);

    try {
      await setUserPassword(passwordUserId, newPassword);
      toast.success("Password set successfully");
      closePasswordModal();
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error || err.message || "Failed to set password");
    } finally {
      setSettingPassword(false);
    }
  }

  async function onResetPassword(id: string) {
    if (!confirm("Generate password reset link for this user?")) return;

    try {
      const result = await requestPasswordReset(id);
      if (result.devToken) {
        const link = `${window.location.origin}/reset-password?token=${result.devToken}`;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(link).catch(() => {});
          toast.info("Dev reset link copied to clipboard");
        } else {
          toast.info(`Dev reset link: ${link}`);
        }
      } else {
        toast.success(result.message || "Password reset link sent");
      }
    } catch (err) {
      showApiError(err, "Failed to request password reset");
    }
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Users</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          </div>
          <p className="text-sm text-gray-400">You do not have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Users</h1>
          <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>Back</button>
        </div>

        <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search name, email, role, clubId" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <div>
              <button
                onClick={() => setCreating((v)=>!v)}
                className="ml-3 text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
              >
                {creating ? "Cancel" : "New User"}
              </button>
            </div>
          </div>
          {creating && (
            <form onSubmit={onCreate} className="mt-3 grid md:grid-cols-4 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={createForm.name ?? ""} onChange={(e)=>setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div>
                <Label required>Email</Label>
                <Input required type="email" value={createForm.email}
                  onChange={(e)=>setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div>
                <Label required>Role</Label>
                <Select required value={createForm.role}
                  onChange={(e)=>setCreateForm({ ...createForm, role: e.target.value as Role })}
                >
                  {roleOptions.filter(r => (r === "ADMIN" ? canCreateAdmin : true)).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Club</Label>
                <Select value={createForm.clubId ?? ""} onChange={(e)=>setCreateForm({ ...createForm, clubId: e.target.value || null })}>
                  <option value="">No club</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-4">
                <Button type="submit">Create</Button>
              </div>
            </form>
          )}
        </div>

        {editingId && (
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
            <h3 className="font-semibold mb-2">Edit User</h3>
            <form onSubmit={onSaveEdit} className="mt-1 grid md:grid-cols-4 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={editForm.name ?? ""} onChange={(e)=>setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <Label required>Email</Label>
                <Input required type="email" value={editForm.email ?? ""} onChange={(e)=>setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label required>Role</Label>
                <Select required value={editForm.role as Role}
                  onChange={(e)=>setEditForm({ ...editForm, role: e.target.value as Role })}
                >
                  {roleOptions.filter(r => (r === "ADMIN" ? canCreateAdmin : true)).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Club</Label>
                <Select value={(editForm.clubId as any) ?? ""} onChange={(e)=>setEditForm({ ...editForm, clubId: (e.target.value || null) as any })}>
                  <option value="">No club</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-4 flex gap-2">
                <Button type="submit">Save</Button>
                <button type="button" onClick={()=>{ setEditingId(null); setEditForm({}); }}
                  className="rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && <SkeletonList count={5} />}
        {error && !loading && (
          <ErrorState title="Couldn't load users" message={error} onRetry={loadUsers} />
        )}
        {!loading && !error && (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-900/60 text-gray-300">
                <tr>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Club</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Created</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Updated</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6">
                      <EmptyState
                        icon={q.trim() ? "🔍" : "👤"}
                        title={q.trim() ? "No matches" : "No users yet"}
                        description={q.trim() ? `No users match "${q}".` : "Add your first user to get started."}
                      />
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 text-gray-100">{u.email}</td>
                    <td className="px-3 py-2 text-gray-300">{u.name ?? ""}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200">{u.role}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-400">{clubs.find(c => c.id === u.clubId)?.name ?? (u.clubId ?? "")}</td>
                    <td className="px-3 py-2 text-gray-400 hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-400 hidden lg:table-cell">{formatDate(u.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <div className="text-right space-x-2">
                        {u.role !== "SUPERADMIN" && (
                          <>
                            {editingId === u.id ? (
                              <button disabled className="text-xs px-3 py-1 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed">Editing…</button>
                            ) : (
                              <button onClick={()=>startEdit(u)} disabled={!!editingId} className="text-xs px-3 py-1 rounded bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50">Edit</button>
                            )}
                            <button onClick={()=>openPasswordModal(u.id)} disabled={!!editingId} className="text-xs px-3 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white disabled:opacity-50">Set Password</button>
                            <button onClick={()=>onResetPassword(u.id)} disabled={!!editingId} className="text-xs px-3 py-1 rounded bg-yellow-600/80 hover:bg-yellow-600 text-black font-semibold disabled:opacity-50">Reset Link</button>
                            <button onClick={()=>onDelete(u.id, u)} disabled={!!editingId} className="text-xs px-3 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50">Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Password Management Modal */}
        {passwordUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closePasswordModal}>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Set Password</h2>
                <button onClick={closePasswordModal} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={onSetPassword} className="space-y-4">
                <div>
                  <Label required>New Password</Label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div>
                  <Label required>Confirm Password</Label>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                {passwordError && (
                  <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20">
                    <p className="text-sm text-red-400">{passwordError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={settingPassword} className="flex-1">
                    {settingPassword ? "Setting..." : "Set Password"}
                  </Button>
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="flex-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
