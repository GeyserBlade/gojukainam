import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Label, Select, Textarea } from "../components/Input";
import { Belt, createBelt, deleteBelt, listBelts, updateBelt } from "../lib/belts";

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "");

const BeltsPage = () => {
  const { role } = useAuth();
  const nav = useNavigate();
  const canManage = role === "ADMIN" || role === "SUPERADMIN";

  const [belts, setBelts] = useState<Belt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Create form
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name?: string | null;
    colour?: string | null;
    notes?: string | null;
    gradingRequirements?: string | null;
    order: number;
  }>({ order: 0 });

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<{
    name: string | null;
    colour: string | null;
    notes: string | null;
    gradingRequirements: string | null;
    order: number;
  }>>({});

  useEffect(() => {
    if (!canManage) return;
    setLoading(true); setError(null);
    listBelts()
      .then(setBelts)
      .catch((e: any) => setError(e?.response?.data?.error || e.message || "Failed to load belts"))
      .finally(() => setLoading(false));
  }, [canManage]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return belts;
    return belts.filter(b =>
      (b.name || "").toLowerCase().includes(query) ||
      (b.colour || "").toLowerCase().includes(query) ||
      (b.notes || "").toLowerCase().includes(query)
    );
  }, [belts, q]);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Belts</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => nav("/dashboard")}>Back</button>
          </div>
          <p className="text-sm text-gray-400">You do not have permission to manage belts.</p>
        </div>
      </div>
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...createForm } as any;
      const created = await createBelt(payload);
      setBelts((list) => [...list, created].sort((a,b)=> a.order - b.order || (a.name||"").localeCompare(b.name||"")));
      setCreateForm({ order: 0 });
      setCreating(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to create belt");
    }
  }

  function startEdit(b: Belt) {
    setEditingId(b.id);
    setEditForm({
      name: b.name ?? null,
      colour: b.colour ?? null,
      notes: b.notes ?? null,
      gradingRequirements: b.gradingRequirements ?? null,
      order: b.order,
    });
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    try {
      const updated = await updateBelt(editingId, editForm as any);
      setBelts((list) => list.map((x) => (x.id === editingId ? updated : x)).sort((a,b)=> a.order - b.order || (a.name||"").localeCompare(b.name||"")));
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to update belt");
    }
  }

  async function onDelete(id: string, b: Belt) {
    const refCount = b._count?.Athlete ?? 0;
    if (!confirm(refCount > 0 ? `Belt is used by ${refCount} athlete(s). Delete anyway?` : `Delete belt ${b.name || id}?`)) return;
    const prev = belts;
    setBelts((list) => list.filter((x) => x.id !== id));
    try {
      await deleteBelt(id);
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to delete belt");
      setBelts(prev);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Belts</h1>
          <button className="text-sm text-gray-400 hover:text-white" onClick={() => nav("/dashboard")}>Back</button>
        </div>

        <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search name, colour, notes" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <div>
              <button
                onClick={() => setCreating((v)=>!v)}
                className="ml-3 text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
              >
                {creating ? "Cancel" : "New Belt"}
              </button>
            </div>
          </div>
          {creating && (
            <form onSubmit={onCreate} className="mt-3 grid md:grid-cols-5 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={createForm.name ?? ""} onChange={(e)=>setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Colour</Label>
                <Input value={createForm.colour ?? ""} onChange={(e)=>setCreateForm({ ...createForm, colour: e.target.value })} />
              </div>
              <div>
                <Label required>Order</Label>
                <Input required type="number" value={createForm.order} onChange={(e)=>setCreateForm({ ...createForm, order: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Input value={createForm.notes ?? ""} onChange={(e)=>setCreateForm({ ...createForm, notes: e.target.value })} />
              </div>
              <div className="md:col-span-5">
                <Label>Grading Requirements</Label>
                <Textarea rows={4} value={createForm.gradingRequirements ?? ""} onChange={(e)=>setCreateForm({ ...createForm, gradingRequirements: e.target.value })} />
              </div>
              <div className="md:col-span-5">
                <Button type="submit">Create</Button>
              </div>
            </form>
          )}
        </div>

        {editingId && (
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
            <h3 className="font-semibold mb-2">Edit Belt</h3>
            <form onSubmit={onSaveEdit} className="mt-1 grid md:grid-cols-5 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={editForm.name ?? ""} onChange={(e)=>setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Colour</Label>
                <Input value={editForm.colour ?? ""} onChange={(e)=>setEditForm({ ...editForm, colour: e.target.value })} />
              </div>
              <div>
                <Label required>Order</Label>
                <Input required type="number" value={editForm.order ?? 0} onChange={(e)=>setEditForm({ ...editForm, order: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Input value={editForm.notes ?? ""} onChange={(e)=>setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="md:col-span-5">
                <Label>Grading Requirements</Label>
                <Textarea rows={4} value={editForm.gradingRequirements ?? ""} onChange={(e)=>setEditForm({ ...editForm, gradingRequirements: e.target.value })} />
              </div>
              <div className="md:col-span-5 flex gap-2">
                <Button type="submit">Save</Button>
                <button type="button" onClick={()=>{ setEditingId(null); setEditForm({}); }} className="rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading && <p className="text-sm text-gray-400">Loading belts…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-900/60 text-gray-300">
                <tr>
                  <th className="text-left px-3 py-2">Order</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Colour</th>
                  <th className="text-left px-3 py-2">Notes</th>
                  <th className="text-left px-3 py-2">Requirements</th>
                  <th className="text-right px-3 py-2 hidden lg:table-cell">Athletes</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Updated</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 text-gray-100">{b.order}</td>
                    <td className="px-3 py-2 text-gray-200">{b.name ?? ""}</td>
                    <td className="px-3 py-2 text-gray-300">{b.colour ?? ""}</td>
                    <td className="px-3 py-2 text-gray-400 truncate max-w-[16rem]">{b.notes ?? ""}</td>
                    <td className="px-3 py-2 text-gray-500 truncate max-w-[16rem]">{b.gradingRequirements ?? ""}</td>
                    <td className="px-3 py-2 text-right text-gray-400 hidden lg:table-cell">{b._count?.Athlete ?? 0}</td>
                    <td className="px-3 py-2 text-gray-400 hidden lg:table-cell">{formatDate(b.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <div className="text-right space-x-2">
                        {editingId === b.id ? (
                          <button disabled className="text-xs px-3 py-1 rounded bg-gray-700 text-white opacity-70 cursor-not-allowed">Editing…</button>
                        ) : (
                          <button onClick={()=>startEdit(b)} disabled={!!editingId} className="text-xs px-3 py-1 rounded bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50">Edit</button>
                        )}
                        <button onClick={()=>onDelete(b.id, b)} disabled={!!editingId} className="text-xs px-3 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeltsPage;
