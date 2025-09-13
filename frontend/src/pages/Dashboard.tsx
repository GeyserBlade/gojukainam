import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
// import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth, Role } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { listAthletes, listAllAthletes, deleteAthlete, type Athlete } from "../lib/athletes";
import { Input, Select } from "../components/Input";
// import { Button } from "../components/Input";
// import { Input } from "../components/Input";
// import { Label } from "../components/Input";
// import { Select } from "../components/Input";

/***************************************
 * src/pages/Dashboard.tsx (placeholder)
 ***************************************/
const Dashboard: React.FC = () => {
  const { role, clubId, logout } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [errorAthletes, setErrorAthletes] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name"|"dob"|"gender"|"belt"|"club">("name");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");

  // added state for club record (so we can show name)
  const [club, setClub] = useState<{ id: string; name?: string } | null>(null);

  useEffect(() => { api.get("/events").then(r => setEvents(r.data)); }, []);

  // fetch club details when clubId changes
  useEffect(() => {
    if (!clubId) {
      setClub(null);
      return;
    }
    let cancelled = false;
    api.get(`/clubs/${clubId}`)
      .then((r) => { if (!cancelled) setClub(r.data); })
      .catch(() => { if (!cancelled) setClub(null); });
    return () => { cancelled = true; };
  }, [clubId]);

  useEffect(() => {
    setAthletes([]);
    // SUPERADMIN/ADMIN without clubId -> list all
    const canListAll = role === "SUPERADMIN";
    if (!clubId && !canListAll) return;
    setLoadingAthletes(true);
    setErrorAthletes(null);
    const p = clubId ? listAthletes(clubId) : listAllAthletes();
    p.then(setAthletes)
      .catch((e) => setErrorAthletes(e?.response?.data?.error || e.message))
      .finally(() => setLoadingAthletes(false));
  }, [clubId, role]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = athletes;
    if (q) {
      rows = rows.filter(a => {
        const name = `${a.firstName} ${a.lastName}`.toLowerCase();
        const clubName = a.club?.name?.toLowerCase() || "";
        return (
          name.includes(q) ||
          (a.nationality?.toLowerCase?.() || "").includes(q) ||
          (a.beltRank?.toLowerCase?.() || "").includes(q) ||
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
        return (a.beltRank || "").localeCompare(b.beltRank || "") * dir;
      }
      if (sortBy === "club") {
        return (a.club?.name || "").localeCompare(b.club?.name || "") * dir;
      }
      return 0;
    };
    return [...rows].sort(cmp);
  }, [athletes, query, sortBy, sortDir]);

  async function onDeleteAthlete(id: string) {
    if (!confirm("Delete this athlete? This cannot be undone.")) return;
    const prev = athletes;
    setAthletes((list) => list.filter((a) => a.id !== id));
    try {
      await deleteAthlete(id);
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || "Failed to delete athlete");
      setAthletes(prev);
    }
  }
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign out</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold mb-2">Session</h2>
            <p className="text-sm text-gray-400">Role: <span className="text-gray-200">{role ?? "(none)"}</span></p>
            <p className="text-sm text-gray-400">
              Club:&nbsp;
              <span className="text-gray-200">{club ? `${club.name ?? "(no name)"} (${club.id})` : (clubId ?? "(none)")}</span>
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold mb-2">Events</h2>
            <ul className="text-sm text-gray-300 list-disc pl-5">
              {events.map(ev => (
                <li key={ev.id}>{ev.name} — {new Date(ev.startDate).toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Athletes</h2>
              {!clubId && role !== "SUPERADMIN" && (
                <span className="text-xs text-gray-400">Set a club to view athletes</span>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
              <div className="flex-1">
                <Input placeholder="Search name, club, nationality, belt..." value={query} onChange={(e)=>setQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
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
            {loadingAthletes && <p className="text-sm text-gray-400">Loading athletes…</p>}
            {errorAthletes && <p className="text-sm text-red-400">{errorAthletes}</p>}
            {!!filteredSorted.length && (
              <ul className="divide-y divide-gray-800">
                {filteredSorted.map((a) => (
                  <li key={a.id} className="py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">{a.firstName} {a.lastName} <span className="text-xs text-gray-500">({a.gender})</span></p>
                      <p className="text-xs text-gray-500 truncate">
                        {new Date(a.dob).toLocaleDateString()} • {a.nationality}
                        {a.beltRank ? <> • {a.beltRank}</> : null}
                        {a.weightKg ? <> • {a.weightKg}kg</> : null}
                        {a.club?.name ? <> • {a.club.name}</> : null}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteAthlete(a.id)}
                      className="text-xs px-3 py-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white"
                    >
                      Delete
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
