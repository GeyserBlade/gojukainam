import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Label, Textarea } from "../components/Input";
import { SkeletonList, EmptyState, ErrorState } from "../components/UIState";
import { useToast, useApiErrorToast } from "../components/Toast";
import { createClub, deleteClub, listClubs, updateClub, type Club } from "../lib/clubs";

type ClubForm = {
  name: string;
  region: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "");

function sanitizePayload(form: ClubForm) {
  const trimOrNull = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };
  return {
    name: form.name.trim(),
    region: trimOrNull(form.region),
    contactName: form.contactName.trim(),
    email: form.email.trim(),
    phone: trimOrNull(form.phone),
    notes: trimOrNull(form.notes),
  };
}

const defaultForm: ClubForm = {
  name: "",
  region: "",
  contactName: "",
  email: "",
  phone: "",
  notes: "",
};

const ClubsPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const canManage = role === "ADMIN" || role === "SUPERADMIN";

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ClubForm>(defaultForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ClubForm>(defaultForm);

  const loadClubs = () => {
    setLoading(true);
    setError(null);
    return listClubs()
      .then(setClubs)
      .catch((e: any) => setError(e?.response?.data?.error || e.message || "Failed to load clubs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canManage) return;
    loadClubs();
  }, [canManage]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clubs;
    return clubs.filter((club) => {
      return (
        club.name.toLowerCase().includes(query) ||
        (club.region ?? "").toLowerCase().includes(query) ||
        club.contactName.toLowerCase().includes(query) ||
        club.email.toLowerCase().includes(query) ||
        (club.phone ?? "").toLowerCase().includes(query)
      );
    });
  }, [clubs, q]);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Clubs</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
          <p className="text-sm text-gray-400">You do not have permission to manage clubs.</p>
        </div>
      </div>
    );
  }

  async function onCreateClub(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = sanitizePayload(createForm);
      if (!payload.name || !payload.contactName || !payload.email) {
        throw new Error("Name, contact name and email are required");
      }
      const created = await createClub(payload);
      setClubs((list) => [created, ...list].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateForm(defaultForm);
      setCreating(false);
      toast.success("Club created");
    } catch (err) {
      showApiError(err, "Failed to create club");
    }
  }

  function startEdit(club: Club) {
    setEditingId(club.id);
    setEditForm({
      name: club.name ?? "",
      region: club.region ?? "",
      contactName: club.contactName ?? "",
      email: club.email ?? "",
      phone: club.phone ?? "",
      notes: club.notes ?? "",
    });
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    try {
      const payload = sanitizePayload(editForm);
      if (!payload.name || !payload.contactName || !payload.email) {
        throw new Error("Name, contact name and email are required");
      }
      const updated = await updateClub(editingId, payload);
      setClubs((list) =>
        list
          .map((club) => (club.id === editingId ? updated : club))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      setEditForm(defaultForm);
      toast.success("Club updated");
    } catch (err) {
      showApiError(err, "Failed to update club");
    }
  }

  async function onDeleteClub(id: string, club: Club) {
    const counts = club._count ?? { athletes: 0, users: 0, teams: 0, entries: 0 };
    const totalRefs = counts.athletes + counts.users + counts.teams + counts.entries;
    const warning =
      totalRefs > 0
        ? `Club has ${counts.athletes} athletes, ${counts.users} users, ${counts.teams} teams, ${counts.entries} entries. Delete anyway?`
        : `Delete club ${club.name}?`;
    if (!confirm(warning)) return;

    const previous = clubs;
    setClubs((list) => list.filter((c) => c.id !== id));
    try {
      await deleteClub(id);
      toast.success("Club deleted");
    } catch (err) {
      showApiError(err, "Failed to delete club");
      setClubs(previous);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Clubs</h1>
          <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            Back
          </button>
        </div>

        <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 max-w-lg">
              <Input placeholder="Search name, region, contact, email" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <button
                onClick={() => {
                  setCreating((c) => !c);
                  setCreateForm(defaultForm);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
              >
                {creating ? "Close" : "New Club"}
              </button>
            </div>
          </div>

          {creating && (
            <form onSubmit={onCreateClub} className="mt-4 grid md:grid-cols-2 gap-3">
              <div>
                <Label required>Name</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div>
                <Label>Region</Label>
                <Input value={createForm.region} onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })} />
              </div>
              <div>
                <Label required>Contact Name</Label>
                <Input value={createForm.contactName} onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })} required />
              </div>
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create</Button>
              </div>
            </form>
          )}
        </div>

        {editingId && (
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
            <h3 className="font-semibold mb-2">Edit Club</h3>
            <form onSubmit={onSaveEdit} className="grid md:grid-cols-2 gap-3">
              <div>
                <Label required>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Region</Label>
                <Input value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
              </div>
              <div>
                <Label required>Contact Name</Label>
                <Input
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Save</Button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditForm(defaultForm);
                  }}
                  className="rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && <SkeletonList count={4} />}
        {error && !loading && (
          <ErrorState title="Couldn't load clubs" message={error} onRetry={loadClubs} />
        )}

        {!loading && !error && (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-900/60 text-gray-300">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Region</th>
                  <th className="text-left px-3 py-2">Contact</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Phone</th>
                  <th className="text-right px-3 py-2">Athletes</th>
                  <th className="text-right px-3 py-2 hidden lg:table-cell">Users</th>
                  <th className="text-right px-3 py-2 hidden lg:table-cell">Entries</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Updated</th>
                  <th className="text-left px-3 py-2 hidden xl:table-cell">Notes</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 text-gray-100">{club.name}</td>
                    <td className="px-3 py-2 text-gray-300">{club.region ?? ""}</td>
                    <td className="px-3 py-2 text-gray-300">{club.contactName}</td>
                    <td className="px-3 py-2 text-gray-300">{club.email}</td>
                    <td className="px-3 py-2 text-gray-300">{club.phone ?? ""}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{club._count?.athletes ?? 0}</td>
                    <td className="px-3 py-2 text-right text-gray-400 hidden lg:table-cell">{club._count?.users ?? 0}</td>
                    <td className="px-3 py-2 text-right text-gray-400 hidden lg:table-cell">{club._count?.entries ?? 0}</td>
                    <td className="px-3 py-2 text-gray-400 hidden lg:table-cell">{formatDate(club.updatedAt)}</td>
                    <td className="px-3 py-2 text-gray-400 hidden xl:table-cell truncate max-w-[16rem]">{club.notes ?? ""}</td>
                    <td className="px-3 py-2">
                      <div className="text-right space-x-2">
                        {editingId === club.id ? (
                          <button
                            disabled
                            className="text-xs px-3 py-1 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed"
                          >
                            Editing…
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(club)}
                            disabled={!!editingId}
                            className="text-xs px-3 py-1 rounded bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteClub(club.id, club)}
                          disabled={!!editingId}
                          className="text-xs px-3 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td className="px-4 py-6" colSpan={11}>
                      <EmptyState
                        icon={q.trim() ? "🔍" : "🏛️"}
                        title={q.trim() ? "No matches" : "No clubs yet"}
                        description={q.trim() ? `No clubs match "${q}".` : "Create your first club to get started."}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsPage;
