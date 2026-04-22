import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input, Select, ActionButton } from "../components/Input";
import { SkeletonList, EmptyState, ErrorState } from "../components/UIState";
import { useToast, useApiErrorToast } from "../components/Toast";
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

// Mobile athlete card component
const AthleteCard = ({
  athlete,
  onEdit,
  onDelete,
  isDeleting
}: {
  athlete: Athlete;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) => (
  <div className={`p-4 rounded-xl border border-gray-800 bg-gray-900/50 ${athlete.isActive === false ? "opacity-60" : ""}`}>
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-gray-100">
            {athlete.firstName} {athlete.lastName}
          </h3>
          {athlete.isActive === false && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Inactive</span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1">{athlete.club?.name ?? "No club"}</p>
      </div>
      <span className="text-sm font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded">
        {athlete.gender}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
      <div>
        <span className="text-gray-500">Age:</span>
        <span className="text-gray-300 ml-2">{calculateAge(athlete.dob) ?? "-"} yrs</span>
      </div>
      <div>
        <span className="text-gray-500">DOB:</span>
        <span className="text-gray-300 ml-2">{formatDate(athlete.dob)}</span>
      </div>
      <div>
        <span className="text-gray-500">Belt:</span>
        <span className="text-gray-300 ml-2">{athlete.belt?.name ?? "-"}</span>
      </div>
      <div>
        <span className="text-gray-500">Weight:</span>
        <span className="text-gray-300 ml-2">{athlete.weightKg ? `${athlete.weightKg}kg` : "-"}</span>
      </div>
      {athlete.nationality && (
        <div className="col-span-2">
          <span className="text-gray-500">Nationality:</span>
          <span className="text-gray-300 ml-2">{athlete.nationality}</span>
        </div>
      )}
    </div>

    <div className="flex gap-2">
      <ActionButton variant="primary" onClick={onEdit} className="flex-1">
        Edit
      </ActionButton>
      <ActionButton variant="danger" onClick={onDelete} disabled={isDeleting} className="flex-1">
        {isDeleting ? "..." : "Delete"}
      </ActionButton>
    </div>
  </div>
);

const AthletesListPage = () => {
  const { role, clubId } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const canManage = role === "CLUB_MANAGER" || role === "ADMIN" || role === "SUPERADMIN";

  const [q, setQ] = useState("");
  const [filterClub, setFilterClub] = useState<string>(clubId || "");
  const [showInactive, setShowInactive] = useState(false);

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
    error: queryError,
    refetch: refetchAthletes,
  } = useQuery({
    queryKey: ['athletes', filterClub, role, showInactive],
    queryFn: async () => {
      if (role === "SUPERADMIN" && !filterClub) {
        return listAllAthletes(showInactive);
      } else {
        const cid = filterClub || clubId || "";
        if (!cid) return [];
        return listAthletes(cid, showInactive);
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
      toast.success("Athlete deleted");
    },
    onError: (error) => {
      showApiError(error, "Failed to delete athlete");
    }
  });

  async function onDelete(id: string, a: Athlete) {
    if (!confirm(`Delete ${a.firstName} ${a.lastName}? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold">Athletes</h1>
            <button className="px-3 py-2 text-sm text-gray-400 hover:text-white" onClick={() => nav("/dashboard")}>Back to Dashboard</button>
          </div>
        </header>
        <main className="p-4">
          <p className="text-sm text-gray-400">You do not have permission to manage athletes.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl md:text-2xl font-semibold">Athletes</h1>
            <div className="flex items-center gap-2">
              <ActionButton variant="primary" onClick={() => nav("/athletes/new")}>
                + New
              </ActionButton>
              <button className="px-3 py-2 text-sm text-gray-400 hover:text-white active:text-gray-300" onClick={() => nav("/dashboard")}>
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="space-y-3 mb-4">
            <Input placeholder="Search name, club, belt, nationality" value={q} onChange={(e)=>setQ(e.target.value)} />

            <div className="flex flex-col sm:flex-row gap-3">
              {(role === "SUPERADMIN" || role === "ADMIN") && (
                <div className="flex-1">
                  <Select value={filterClub} onChange={(e)=>setFilterClub(e.target.value)}>
                    <option value="">All clubs</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
              )}
              <label className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/60 border border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  id="showInactive"
                  checked={showInactive}
                  onChange={(e)=> setShowInactive(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Show inactive</span>
              </label>
            </div>
          </div>

          {/* Results count */}
          {!loading && !error && (
            <p className="text-sm text-gray-500 mb-4">
              Showing {filtered.length} of {athletes.length} athletes
            </p>
          )}

          {loading && <SkeletonList count={6} />}
          {error && !loading && (
            <ErrorState
              title="Couldn't load athletes"
              message={error}
              onRetry={() => refetchAthletes()}
            />
          )}

          {!loading && !error && (
            <>
              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {filtered.map((a) => (
                  <AthleteCard
                    key={a.id}
                    athlete={a}
                    onEdit={() => nav(`/athletes/${a.id}/edit`)}
                    onDelete={() => onDelete(a.id, a)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
                {filtered.length === 0 && (
                  <EmptyState
                    icon={q.trim() ? "🔍" : "👥"}
                    title={q.trim() ? "No matches" : "No athletes yet"}
                    description={q.trim() ? `No athletes match "${q}".` : "Add your first athlete to get started."}
                    action={!q.trim() ? <ActionButton onClick={() => nav("/athletes/new")}>Add athlete</ActionButton> : undefined}
                  />
                )}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-900/60 text-gray-300">
                      <tr>
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">DOB</th>
                        <th className="text-left px-4 py-3">Age</th>
                        <th className="text-left px-4 py-3">Gender</th>
                        <th className="text-left px-4 py-3 hidden lg:table-cell">Nationality</th>
                        <th className="text-left px-4 py-3">Club</th>
                        <th className="text-left px-4 py-3">Belt</th>
                        <th className="text-left px-4 py-3 hidden lg:table-cell">Weight</th>
                        <th className="text-left px-4 py-3 hidden xl:table-cell">Joined</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filtered.map((a) => (
                        <tr key={a.id} className={`hover:bg-gray-900/40 ${a.isActive === false ? "opacity-50" : ""}`}>
                          <td className="px-4 py-3 text-gray-100">
                            {a.firstName} {a.lastName}
                            {a.isActive === false && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Inactive</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{formatDate(a.dob)}</td>
                          <td className="px-4 py-3 text-gray-300">{calculateAge(a.dob) ?? ""}</td>
                          <td className="px-4 py-3 text-gray-300">{a.gender}</td>
                          <td className="px-4 py-3 text-gray-300 hidden lg:table-cell">{a.nationality}</td>
                          <td className="px-4 py-3 text-gray-300">{a.club?.name ?? a.clubId}</td>
                          <td className="px-4 py-3 text-gray-300">{a.belt?.name ?? a.beltId}</td>
                          <td className="px-4 py-3 text-gray-300 hidden lg:table-cell">{a.weightKg ? `${a.weightKg}kg` : ""}</td>
                          <td className="px-4 py-3 text-gray-300 hidden xl:table-cell">{formatDate(a.joinDate ?? undefined)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button onClick={()=> nav(`/athletes/${a.id}/edit`)} className="text-sm px-3 py-1.5 rounded bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold">Edit</button>
                              <button onClick={()=> onDelete(a.id, a)} className="text-sm px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white" disabled={deleteMutation.isPending}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                  <EmptyState
                    icon={q.trim() ? "🔍" : "👥"}
                    title={q.trim() ? "No matches" : "No athletes yet"}
                    description={q.trim() ? `No athletes match "${q}".` : "Add your first athlete to get started."}
                    action={!q.trim() ? <ActionButton onClick={() => nav("/athletes/new")}>Add athlete</ActionButton> : undefined}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AthletesListPage;
