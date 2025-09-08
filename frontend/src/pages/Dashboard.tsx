import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
// import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth, Role } from "../contexts/AuthContext";
import { api } from "../lib/api"; // Make sure this path matches your project structure
import { listAthletes, listAllAthletes, deleteAthlete, type Athlete } from "../lib/athletes";
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
            {loadingAthletes && <p className="text-sm text-gray-400">Loading athletes…</p>}
            {errorAthletes && <p className="text-sm text-red-400">{errorAthletes}</p>}
            {!!athletes.length && (
              <ul className="divide-y divide-gray-800">
                {athletes.map((a) => (
                  <li key={a.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-200">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-gray-500">{new Date(a.dob).toLocaleDateString()} • {a.gender}</p>
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
            {!loadingAthletes && !errorAthletes && (clubId || role === "SUPERADMIN") && athletes.length === 0 && (
              <p className="text-sm text-gray-400">No athletes yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export { Dashboard };
