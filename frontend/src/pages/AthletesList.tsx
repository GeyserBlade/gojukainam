import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input, Select } from "../components/Input";
import { Athlete, deleteAthlete, listAllAthletes, listAthletes } from "../lib/athletes";
import { listClubs, type Club } from "../lib/clubs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "");

const calculateAge = (dob?: string | null) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
};

const AthletesListPage = () => {
  const { role, clubId } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const canManage = role === "CLUB_MANAGER" || role === "ADMIN" || role === "SUPERADMIN";

  const [q, setQ] = useState("");
  const [filterClub, setFilterClub] = useState<string>(clubId || "");

  // Fetch clubs for filtering (if user can view multiple clubs)
  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: listClubs,
    enabled: canManage && (role === "SUPERADMIN" || role === "ADMIN"),
  });

  // Fetch athletes based on filter
  const {
    data: athletes = [],
    isLoading: loading,
    error: queryError
  } = useQuery({
    queryKey: ['athletes', filterClub, role],
    queryFn: async () => {
      if (role === "SUPERADMIN" && !filterClub) {
        return listAllAthletes();
      } else {
        const cid = filterClub || clubId || "";
        if (!cid) return [];
        return listAthletes(cid);
      }
    },
    enabled: canManage,
  });

  const error = queryError ? (queryError as any)?.response?.data?.error || (queryError as Error).message || "Failed to load athletes" : null;

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.error || error.message || "Failed to delete athlete");
    }
  });

  async function onDelete(id: string, a: Athlete) {
    if (!confirm(`Delete ${a.firstName} ${a.lastName}? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
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
              className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold">
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
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-900/60 text-gray-300">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">DOB</th>
                  <th className="text-left px-3 py-2">Age</th>
                  <th className="text-left px-3 py-2">Gender</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Nationality</th>
                  <th className="text-left px-3 py-2">Club</th>
                  <th className="text-left px-3 py-2">Belt</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Weight</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Joined</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 text-gray-100">{a.firstName} {a.lastName}</td>
                    <td className="px-3 py-2 text-gray-300">{formatDate(a.dob)}</td>
                    <td className="px-3 py-2 text-gray-300">{calculateAge(a.dob) ?? ""}</td>
                    <td className="px-3 py-2 text-gray-300">{a.gender}</td>
                    <td className="px-3 py-2 text-gray-300 hidden lg:table-cell">{a.nationality}</td>
                    <td className="px-3 py-2 text-gray-300">{a.club?.name ?? a.clubId}</td>
                    <td className="px-3 py-2 text-gray-300">{a.belt?.name ?? a.beltId}</td>
                    <td className="px-3 py-2 text-gray-300 hidden lg:table-cell">{a.weightKg ? `${a.weightKg}kg` : ""}</td>
                    <td className="px-3 py-2 text-gray-300 hidden lg:table-cell">{formatDate(a.joinDate ?? undefined)}</td>
                    <td className="px-3 py-2">
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
