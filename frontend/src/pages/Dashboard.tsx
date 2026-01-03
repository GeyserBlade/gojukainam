import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { listAthletes, listAllAthletes, deleteAthlete, type Athlete } from "../lib/athletes";
import { Input, Select } from "../components/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/***************************************
 * src/pages/Dashboard.tsx (placeholder)
 ***************************************/
function calculateAge(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

const Dashboard = () => {
  const { role, clubId, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name"|"dob"|"gender"|"belt"|"club">("name");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");

  // 1. Fetch Events
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data;
    }
  });

  // 2. Fetch Club (if clubId exists)
  const { data: club } = useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      const res = await api.get(`/clubs/${clubId}`);
      return res.data;
    },
    enabled: !!clubId
  });

  // 3. Fetch Athletes
  const { 
    data: athletes = [], 
    isLoading: loadingAthletes, 
    error: errorAthletes 
  } = useQuery({
    queryKey: ['athletes', clubId, role],
    queryFn: async () => {
      // SUPERADMIN/ADMIN without clubId -> list all
      const canListAll = role === "SUPERADMIN";
      if (!clubId && !canListAll) return [];
      
      if (clubId) {
        return listAthletes(clubId);
      } else {
        return listAllAthletes();
      }
    },
    enabled: !!clubId || role === "SUPERADMIN"
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.error || error.message || "Failed to delete athlete");
    }
  });

  async function onDeleteAthlete(id: string) {
    if (!confirm("Delete this athlete? This cannot be undone.")) return;
    deleteMutation.mutate(id);
  }

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows: Athlete[] = athletes;
    if (q) {
      rows = rows.filter(a => {
        const name = `${a.firstName} ${a.lastName}`.toLowerCase();
        const clubName = a.club?.name?.toLowerCase() || "";
        return (
          name.includes(q) ||
          (a.nationality?.toLowerCase?.() || "").includes(q) ||
          (a.belt?.name?.toLowerCase?.() || "").includes(q) ||
          clubName.includes(q)
        );
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    const cmp = (a: Athlete, b: Athlete) => {
      if (sortBy === "name") {
        const an = `${a.lastName} ${a.firstName}`.toLowerCase();
        const bn = `${b.lastName} ${b.firstName}`.toLowerCase();
        return an < bn ? -1*dir : an > bn ? 1*dir : 0;
      }
      if (sortBy === "dob") {
        const ad = new Date(a.dob).getTime();
        const bd = new Date(b.dob).getTime();
        return (ad - bd) * dir;
      }
      if (sortBy === "gender") {
        return (a.gender || "").localeCompare(b.gender || "") * dir;
      }
      if (sortBy === "belt") {
        return ((a.belt?.name || "").localeCompare(b.belt?.name || "")) * dir;
      }
      if (sortBy === "club") {
        return (a.club?.name || "").localeCompare(b.club?.name || "") * dir;
      }
      return 0;
    };
    return [...rows].sort(cmp);
  }, [athletes, query, sortBy, sortDir]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign out</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold mb-2">Session</h2>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Role: <span className="text-gray-200">{role ?? "(none)"}</span></p>
              <p>
                Club:&nbsp;
                <span className="text-gray-200">{club ? `${club.name ?? "(no name)"} (${club.id})` : (clubId ?? "(none)")}</span>
              </p>
              {club?.region && <p>Region: <span className="text-gray-200">{club.region}</span></p>}
              {club?.contactName && <p>Contact: <span className="text-gray-200">{club.contactName}</span></p>}
              {club?.email && <p>Email: <span className="text-gray-200">{club.email}</span></p>}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold mb-2">Events</h2>
            <p className="text-xs text-gray-500 mb-2">Total: {events.length}</p>
            <ul className="text-xs text-gray-300 list-disc pl-5">
              {events.map((ev: any) => (
                <li key={ev.id}>{ev.name} - {new Date(ev.startDate).toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
          {(role === "ADMIN" || role === "SUPERADMIN" || role === "CLUB_MANAGER") && (
            <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="font-semibold mb-2">Administration</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate("/athletes")}
                  className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                >
                  Manage Athletes
                </button>
                <button
                  onClick={() => navigate("/athletes/extract")}
                  className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                >
                  Athlete Extract
                </button>
                <button
                  onClick={() => navigate("/events/manage")}
                  className="text-xs px-3 py-1.5 rounded-md bg-purple-600/80 hover:bg-purple-600 text-black font-semibold"
                >
                  Event Admin
                </button>
                <button
                  onClick={() => navigate("/events")}
                  className="text-xs px-3 py-1.5 rounded-md bg-green-600/80 hover:bg-green-600 text-black font-semibold"
                >
                  Entry Management
                </button>
                <button
                  onClick={() => navigate("/entries/view")}
                  className="text-xs px-3 py-1.5 rounded-md bg-blue-600/80 hover:bg-blue-600 text-black font-semibold"
                >
                  View All Entries
                </button>
                {role === "SUPERADMIN" && (
                  <button
                    onClick={() => navigate("/athletes/import")}
                    className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Import Athletes
                  </button>
                )}
                <button
                  onClick={() => navigate("/users")}
                  className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => navigate("/clubs")}
                  className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                >
                  Manage Clubs
                </button>
                <button
                  onClick={() => navigate("/belts")}
                  className="text-xs px-3 py-1.5 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                >
                  Manage Belts
                </button>
              </div>
            </div>
          )}
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Athletes</h2>
              {!clubId && role !== "SUPERADMIN" && (
                <span className="text-xs text-gray-400">Set a club to view athletes</span>
              )}
            </div>
            {(clubId || role === "SUPERADMIN") && (
              <p className="text-xs text-gray-500 mb-2">Total: {athletes.length} | Showing: {filteredSorted.length}</p>
            )}
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
              <div className="flex-1">
                <Input placeholder="Search name, club, nationality, belt..." value={query} onChange={(e)=>setQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 md:min-w-[300px]">
                <Select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)}>
                  <option value="name">Sort: Name</option>
                  <option value="dob">Sort: DOB</option>
                  <option value="gender">Sort: Gender</option>
                  <option value="belt">Sort: Belt</option>
                  <option value="club">Sort: Club</option>
                </Select>
                <Select value={sortDir} onChange={(e)=>setSortDir(e.target.value as any)}>
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </Select>
              </div>
            </div>
            {loadingAthletes && <p className="text-sm text-gray-400">Loading athletes...</p>}
            {errorAthletes && <p className="text-sm text-red-400">{errorAthletes instanceof Error ? errorAthletes.message : "Error loading athletes"}</p>}
            {!!filteredSorted.length && (
              <ul className="divide-y divide-gray-800">
                {filteredSorted.map((a) => (
                  <li key={a.id} className="py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">{a.firstName} {a.lastName} <span className="text-xs text-gray-500">({a.gender})</span></p>
                      <p className="text-xs text-gray-500 truncate">
                        {[
                          new Date(a.dob).toLocaleDateString(),
                          (() => {
                            const age = calculateAge(a.dob);
                            return age !== null ? `${age} yrs` : null;
                          })(),
                          a.nationality || null,
                          a.belt?.name || null,
                          a.weightKg ? `${a.weightKg}kg` : null,
                          a.club?.name || null,
                          a.idNumber ? `ID ${a.idNumber}` : null
                        ].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteAthlete(a.id)}
                      className="text-xs px-3 py-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "..." : "Delete"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!loadingAthletes && !errorAthletes && (clubId || role === "SUPERADMIN") && filteredSorted.length === 0 && (
              <p className="text-sm text-gray-400">No athletes yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export { Dashboard };

