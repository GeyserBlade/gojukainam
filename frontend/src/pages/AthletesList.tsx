import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input, Select } from "../components/Input";
import { Athlete, deleteAthlete, listAllAthletes, listAthletes } from "../lib/athletes";
import { listClubs, type Club } from "../lib/clubs";

const AthletesListPage = () => {
  const { role, clubId } = useAuth();
  const nav = useNavigate();
  const canManage = role === "CLUB_MANAGER" || role === "ADMIN" || role === "SUPERADMIN";

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterClub, setFilterClub] = useState<string>(clubId || "");

  useEffect(() => {
    if (!canManage) return;
    setLoading(true); setError(null);
    const fetch = async () => {
      if (role === "SUPERADMIN" && !filterClub) {
        const [rows, cls] = await Promise.all([listAllAthletes(), listClubs()]);
        setAthletes(rows); setClubs(cls);
      } else {
        let cid = filterClub || clubId || "";
        if (role !== "CLUB_MANAGER") {
          const cls = await listClubs();
          setClubs(cls);
          cid = cid || cls[0]?.id || "";
        }
        if (!cid) { setAthletes([]); return; }
        const rows = await listAthletes(cid);
        setAthletes(rows);
        if (role !== "CLUB_MANAGER" && !filterClub && !clubId) setFilterClub(cid);
      }
    };
    fetch().catch((e:any)=> setError(e?.response?.data?.error || e.message || "Failed to load athletes")).finally(()=> setLoading(false));
  }, [canManage, role, clubId, filterClub]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return athletes;
    return athletes.filter(a => {
      const nm = `${a.firstName} ${a.lastName}`.toLowerCase();
      const clubName = a.club?.name?.toLowerCase() || "";
      const beltName = a.belt?.name?.toLowerCase() || "";
      return nm.includes(s) || clubName.includes(s) || beltName.includes(s) || (a.nationality||"").toLowerCase().includes(s);
    });
  }, [athletes, q]);

  async function onDelete(id: string, a: Athlete) {
    if (!confirm(`Delete ${a.firstName} ${a.lastName}? This cannot be undone.`)) return;
    const prev = athletes;
    setAthletes(list => list.filter(x => x.id !== id));
    try { await deleteAthlete(id); }
    catch (e:any) { alert(e?.response?.data?.error || e.message || "Failed to delete athlete"); setAthletes(prev); }
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Athletes</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => nav("/dashboard")}>Back</button>
          </div>
          <p className="text-sm text-gray-400">You do not have permission to manage athletes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Athletes</h1>
          <div className="flex items-center gap-2">
            {(role === "SUPERADMIN" || role === "ADMIN") && (
              <Select value={filterClub} onChange={(e)=>setFilterClub(e.target.value)}>
                <option value="">All clubs</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            <button onClick={()=> nav("/athletes/new")}
              className="text-sm px-4 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold">
              New Athlete
            </button>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => nav("/dashboard")}>Back</button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 max-w-lg">
            <Input placeholder="Search name, club, belt, nationality" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
        </div>
        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && (
          <div className="rounded-2xl border border-gray-800 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900/60 text-gray-300">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">DOB</th>
                  <th className="text-left px-4 py-2">Gender</th>
                  <th className="text-left px-4 py-2">Club</th>
                  <th className="text-left px-4 py-2">Belt</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-900/40">
                    <td className="px-4 py-2 text-gray-100">{a.firstName} {a.lastName}</td>
                    <td className="px-4 py-2 text-gray-300">{new Date(a.dob).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-gray-300">{a.gender}</td>
                    <td className="px-4 py-2 text-gray-300">{a.club?.name ?? a.clubId}</td>
                    <td className="px-4 py-2 text-gray-300">{a.belt?.name ?? a.beltId}</td>
                    <td className="px-4 py-2">
                      <div className="text-right space-x-2">
                        <button onClick={()=> nav(`/athletes/${a.id}/edit`)} className="text-xs px-3 py-1 rounded bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold">Edit</button>
                        <button onClick={()=> onDelete(a.id, a)} className="text-xs px-3 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white">Delete</button>
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

export default AthletesListPage;
