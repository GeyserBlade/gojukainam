import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { listAthletes, listAllAthletes, deleteAthlete, type Athlete } from "../lib/athletes";
import { Input, Select, ActionButton } from "../components/Input";
import { SkeletonList, EmptyState, ErrorState } from "../components/UIState";
import { useToast, useApiErrorToast } from "../components/Toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/***************************************
 * src/pages/Dashboard.tsx (mobile-optimized)
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

// Mobile navigation menu item
const NavMenuItem = ({ onClick, icon, label, color = "cyan" }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: "cyan" | "purple" | "green" | "blue";
}) => {
  const colorClasses = {
    cyan: "bg-cyan-600/20 text-cyan-400 border-cyan-600/30",
    purple: "bg-purple-600/20 text-purple-400 border-purple-600/30",
    green: "bg-green-600/20 text-green-400 border-green-600/30",
    blue: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-4 rounded-xl border ${colorClasses[color]} active:opacity-70 transition-all`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

const Dashboard = () => {
  const { role, clubId, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const showApiError = useApiErrorToast();

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name"|"dob"|"gender"|"belt"|"club">("name");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");
  const [showMenu, setShowMenu] = useState(false);

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
    error: errorAthletes,
    refetch: refetchAthletes,
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
      toast.success("Athlete deleted");
    },
    onError: (error) => {
      showApiError(error, "Failed to delete athlete");
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

  const canManage = role === "ADMIN" || role === "SUPERADMIN" || role === "CLUB_MANAGER";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile-friendly header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="md:hidden p-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
            <button
              onClick={logout}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white active:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {showMenu && canManage && (
        <div className="md:hidden fixed inset-0 top-[57px] z-40 bg-gray-950/95 backdrop-blur overflow-y-auto">
          <div className="p-4 space-y-3">
            <NavMenuItem onClick={() => { navigate("/athletes"); setShowMenu(false); }} icon="👥" label="Manage Athletes" />
            <NavMenuItem onClick={() => { navigate("/athletes/extract"); setShowMenu(false); }} icon="📋" label="Athlete Extract" />
            <NavMenuItem onClick={() => { navigate("/events/manage"); setShowMenu(false); }} icon="📅" label="Event Admin" color="purple" />
            <NavMenuItem onClick={() => { navigate("/events"); setShowMenu(false); }} icon="✅" label="Entry Management" color="green" />
            <NavMenuItem onClick={() => { navigate("/entries/view"); setShowMenu(false); }} icon="👁️" label="View All Entries" color="blue" />
            {role === "SUPERADMIN" && (
              <NavMenuItem onClick={() => { navigate("/athletes/import"); setShowMenu(false); }} icon="📥" label="Import Athletes" />
            )}
            <NavMenuItem onClick={() => { navigate("/users"); setShowMenu(false); }} icon="👤" label="Manage Users" />
            <NavMenuItem onClick={() => { navigate("/clubs"); setShowMenu(false); }} icon="🏛️" label="Manage Clubs" />
            <NavMenuItem onClick={() => { navigate("/belts"); setShowMenu(false); }} icon="🥋" label="Manage Belts" />
          </div>
        </div>
      )}

      <main className="p-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Session Card */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="font-semibold mb-3 text-base">Session</h2>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Role: <span className="text-gray-200">{role ?? "(none)"}</span></p>
                <p>
                  Club:&nbsp;
                  <span className="text-gray-200">{club ? `${club.name ?? "(no name)"}` : (clubId ?? "(none)")}</span>
                </p>
                {club?.region && <p>Region: <span className="text-gray-200">{club.region}</span></p>}
                {club?.contactName && <p>Contact: <span className="text-gray-200">{club.contactName}</span></p>}
                {club?.email && <p>Email: <span className="text-gray-200 break-all">{club.email}</span></p>}
              </div>
            </div>

            {/* Events Card */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="font-semibold mb-3 text-base">Events</h2>
              <p className="text-sm text-gray-500 mb-3">Total: {events.length}</p>
              <ul className="text-sm text-gray-300 space-y-2">
                {events.map((ev: any) => (
                  <li key={ev.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0"></span>
                    <span className="truncate">{ev.name}</span>
                    <span className="text-gray-500 text-xs ml-auto flex-shrink-0">{new Date(ev.startDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop-only Administration Card */}
            {canManage && (
              <div className="hidden md:block p-4 rounded-xl border border-gray-800 bg-gray-900/50">
                <h2 className="font-semibold mb-3 text-base">Administration</h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigate("/athletes")}
                    className="text-sm px-3 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Manage Athletes
                  </button>
                  <button
                    onClick={() => navigate("/athletes/extract")}
                    className="text-sm px-3 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Athlete Extract
                  </button>
                  <button
                    onClick={() => navigate("/events/manage")}
                    className="text-sm px-3 py-2 rounded-md bg-purple-600/80 hover:bg-purple-600 text-black font-semibold"
                  >
                    Event Admin
                  </button>
                  <button
                    onClick={() => navigate("/events")}
                    className="text-sm px-3 py-2 rounded-md bg-green-600/80 hover:bg-green-600 text-black font-semibold"
                  >
                    Entry Management
                  </button>
                  <button
                    onClick={() => navigate("/entries/view")}
                    className="text-sm px-3 py-2 rounded-md bg-blue-600/80 hover:bg-blue-600 text-black font-semibold"
                  >
                    View All Entries
                  </button>
                  {role === "SUPERADMIN" && (
                    <button
                      onClick={() => navigate("/athletes/import")}
                      className="text-sm px-3 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                    >
                      Import Athletes
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/users")}
                    className="text-sm px-3 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => navigate("/clubs")}
                    className="text-sm px-3 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Manage Clubs
                  </button>
                  <button
                    onClick={() => navigate("/belts")}
                    className="text-sm px-3 py-2 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Manage Belts
                  </button>
                </div>
              </div>
            )}

            {/* Athletes Section - Full width */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base">Athletes</h2>
                {!clubId && role !== "SUPERADMIN" && (
                  <span className="text-sm text-gray-400">Set a club to view athletes</span>
                )}
              </div>
              {(clubId || role === "SUPERADMIN") && (
                <p className="text-sm text-gray-500 mb-3">Total: {athletes.length} | Showing: {filteredSorted.length}</p>
              )}

              {/* Search and filters */}
              <div className="space-y-3 mb-4">
                <Input placeholder="Search name, club, nationality, belt..." value={query} onChange={(e)=>setQuery(e.target.value)} />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)}>
                      <option value="name">Sort: Name</option>
                      <option value="dob">Sort: DOB</option>
                      <option value="gender">Sort: Gender</option>
                      <option value="belt">Sort: Belt</option>
                      <option value="club">Sort: Club</option>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Select value={sortDir} onChange={(e)=>setSortDir(e.target.value as any)}>
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </Select>
                  </div>
                </div>
              </div>

              {loadingAthletes && <SkeletonList count={5} />}
              {errorAthletes && !loadingAthletes && (
                <ErrorState
                  title="Couldn't load athletes"
                  message={errorAthletes instanceof Error ? errorAthletes.message : "Please try again."}
                  onRetry={() => refetchAthletes()}
                />
              )}

              {/* Mobile-friendly athlete list */}
              {!loadingAthletes && !errorAthletes && !!filteredSorted.length && (
                <ul className="divide-y divide-gray-800 -mx-4 md:mx-0">
                  {filteredSorted.map((a) => (
                    <li key={a.id} className="py-3 px-4 md:px-0 flex items-start justify-between gap-3 active:bg-gray-800/50 md:active:bg-transparent transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-base md:text-sm text-gray-200">
                          {a.firstName} {a.lastName}
                          <span className="text-sm md:text-xs text-gray-500 ml-2">({a.gender})</span>
                        </p>
                        <p className="text-sm md:text-xs text-gray-500 mt-1">
                          {[
                            new Date(a.dob).toLocaleDateString(),
                            (() => {
                              const age = calculateAge(a.dob);
                              return age !== null ? `${age} yrs` : null;
                            })(),
                            a.belt?.name || null,
                          ].filter(Boolean).join(" • ")}
                        </p>
                        <p className="text-sm md:text-xs text-gray-600 mt-0.5 truncate">
                          {[
                            a.nationality || null,
                            a.weightKg ? `${a.weightKg}kg` : null,
                            a.club?.name || null,
                          ].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <ActionButton
                        variant="danger"
                        onClick={() => onDeleteAthlete(a.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "..." : "Delete"}
                      </ActionButton>
                    </li>
                  ))}
                </ul>
              )}
              {!loadingAthletes && !errorAthletes && (clubId || role === "SUPERADMIN") && filteredSorted.length === 0 && (
                query.trim() ? (
                  <EmptyState
                    icon="🔍"
                    title="No matches"
                    description={`No athletes match "${query}". Try a different search.`}
                  />
                ) : (
                  <EmptyState
                    icon="👥"
                    title="No athletes yet"
                    description={canManage ? "Add your first athlete to get started." : "Your club has no athletes registered yet."}
                    action={canManage ? (
                      <ActionButton onClick={() => navigate("/athletes/new")}>Add athlete</ActionButton>
                    ) : undefined}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export { Dashboard };

