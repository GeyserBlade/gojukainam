import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input, Select } from "../components/Input";
import { listBelts, type Belt } from "../lib/belts";
import { listClubs, type Club } from "../lib/clubs";
import { listAllAthletes, listAthletes, type Athlete } from "../lib/athletes";

type Filters = {
  search: string;
  clubId: string;
  beltId: string;
  gender: string;
  minAge: string;
  maxAge: string;
};

const calculateAge = (dob: string, refDate: Date = new Date()) => {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = refDate.getFullYear() - birth.getFullYear();
  const monthDiff = refDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
};

const AthleteExtractPage = () => {
  const { role, clubId } = useAuth();
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    clubId: clubId ?? "",
    beltId: "",
    gender: "",
    minAge: "",
    maxAge: "",
  });
  const [ageRefDate, setAgeRefDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const canExtract = role === "SUPERADMIN" || role === "ADMIN" || role === "CLUB_MANAGER" || role === "COACH";
  const canSeeAll = role === "SUPERADMIN";

  const columns = useMemo(() => {
    const refDate = new Date(ageRefDate);
    return [
      { label: "First Name", get: (a: Athlete) => a.firstName },
      { label: "Last Name", get: (a: Athlete) => a.lastName },
      { label: "Gender", get: (a: Athlete) => a.gender },
      { label: "DOB", get: (a: Athlete) => new Date(a.dob).toLocaleDateString() },
      { label: "Age", get: (a: Athlete) => String(calculateAge(a.dob, refDate) ?? "") },
      { label: "Club", get: (a: Athlete) => a.club?.name ?? "" },
      { label: "Belt", get: (a: Athlete) => a.belt?.name ?? "" },
      { label: "Nationality", get: (a: Athlete) => a.nationality ?? "" },
      { label: "Weight (kg)", get: (a: Athlete) => a.weightKg ? String(a.weightKg) : "" },
      { label: "Instructor", get: (a: Athlete) => a.isInstructor ? "Yes" : "No" },
      { label: "Contact Email", get: (a: Athlete) => a.contactEmail ?? "" },
      { label: "Contact Phone", get: (a: Athlete) => a.contactPhone ?? "" },
    ];
  }, [ageRefDate]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, clubId: clubId ?? "" }));
  }, [clubId]);

  useEffect(() => {
    if (!canExtract) return;
    if (!clubId && !canSeeAll) {
      setError("A club needs to be associated with your session before generating extracts.");
      setAthletes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const [athleteRows, beltRows, clubRows] = await Promise.all([
          canSeeAll ? listAllAthletes() : listAthletes(clubId as string),
          listBelts().catch(() => []),
          canSeeAll ? listClubs().catch(() => []) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setAthletes(athleteRows);
          setBelts(beltRows);
          setClubs(clubRows);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.error || e.message || "Failed to load athletes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [canExtract, canSeeAll, clubId]);

  const filteredAthletes = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const minAge = filters.minAge ? Number(filters.minAge) : null;
    const maxAge = filters.maxAge ? Number(filters.maxAge) : null;
    const refDate = new Date(ageRefDate);

    return athletes.filter((athlete) => {
      if (filters.clubId && athlete.clubId !== filters.clubId) return false;
      if (filters.beltId && athlete.beltId !== filters.beltId) return false;
      if (filters.gender && athlete.gender !== filters.gender) return false;

      const age = calculateAge(athlete.dob, refDate);
      if (minAge !== null && (age ?? Infinity) < minAge) return false;
      if (maxAge !== null && (age ?? -Infinity) > maxAge) return false;

      if (search) {
        const tokens = [
          athlete.firstName,
          athlete.lastName,
          `${athlete.firstName} ${athlete.lastName}`,
          athlete.club?.name ?? "",
          athlete.belt?.name ?? "",
        ].join(" ").toLowerCase();
        if (!tokens.includes(search)) return false;
      }
      return true;
    });
  }, [athletes, filters, ageRefDate]);

  const availableAthletes = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return filteredAthletes.filter((a) => !selectedSet.has(a.id));
  }, [filteredAthletes, selectedIds]);

  const selectedAthletes = useMemo(() => {
    const map = new Map(athletes.map((a) => [a.id, a]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as Athlete[];
  }, [athletes, selectedIds]);

  const addSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const addManySelections = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setSelectedIds((prev) => {
      const set = new Set(prev);
      let changed = false;
      ids.forEach((id) => {
        if (!set.has(id)) {
          set.add(id);
          changed = true;
        }
      });
      return changed ? Array.from(set) : prev;
    });
  }, []);

  const removeSelection = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clearSelection = () => setSelectedIds([]);

  const handleDrop = (evt: DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const id = evt.dataTransfer.getData("text/athlete-id");
    if (id) addSelection(id);
    setDraggedId(null);
  };

  const download = (format: "csv" | "excel") => {
    if (!selectedAthletes.length) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    if (format === "csv") {
      const lines = [
        columns.map((c) => `"${c.label}"`).join(","),
        ...selectedAthletes.map((athlete) =>
          columns.map((c) => {
            const raw = c.get(athlete) ?? "";
            const value = typeof raw === "string" ? raw : String(raw ?? "");
            const escaped = value.replace(/\"/g, "\"\"");
            return `"${escaped}"`;
          }).join(",")
        ),
      ];
      const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `athlete-extract-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const header = `<tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>`;
    const body = selectedAthletes.map((athlete) =>
      `<tr>${columns.map((c) => `<td>${c.get(athlete) ?? ""}</td>`).join("")}</tr>`
    ).join("");
    const html = `<table>${header}${body}</table>`;
    const blob = new Blob([`\uFEFF${html}`], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `athlete-extract-${stamp}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canExtract) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Athlete Extract</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>Back</button>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="text-sm text-gray-300">Your role does not allow exporting athletes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-400">Data tools</p>
            <h1 className="text-3xl font-semibold">Athlete Extract Builder</h1>
            <p className="text-sm text-gray-400">Search, curate, then export athletes into CSV or Excel.</p>
          </div>
          <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>Back to dashboard</button>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 shadow-lg shadow-cyan-500/5">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Search name, club, belt..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <Select
              value={filters.clubId}
              onChange={(e) => setFilters((prev) => ({ ...prev, clubId: e.target.value }))}
              disabled={!canSeeAll}
            >
              {canSeeAll ? (
                <>
                  <option value="">All clubs</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </>
              ) : (
                <option value={clubId ?? ""}>{clubId ? "My club" : "No club selected"}</option>
              )}
            </Select>
            <Select
              value={filters.beltId}
              onChange={(e) => setFilters((prev) => ({ ...prev, beltId: e.target.value }))}
            >
              <option value="">All belts</option>
              {belts.map((belt) => (
                <option key={belt.id} value={belt.id}>{belt.name ?? `Belt ${belt.order}`}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-4 mt-3">
            <Select
              value={filters.gender}
              onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input
              type="number"
              min="0"
              placeholder="Min age"
              value={filters.minAge}
              onChange={(e) => setFilters((prev) => ({ ...prev, minAge: e.target.value }))}
            />
            <Input
              type="number"
              min="0"
              placeholder="Max age"
              value={filters.maxAge}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxAge: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="Age Ref Date"
              title="Age Calculation Reference Date"
              value={ageRefDate}
              onChange={(e) => setAgeRefDate(e.target.value)}
            />
            <button
              className="col-span-4 md:col-span-4 rounded-2xl bg-gray-800/60 border border-gray-700 text-sm text-gray-200 hover:border-cyan-500 transition py-2"
              onClick={() => {
                setFilters({
                  search: "",
                  clubId: clubId ?? "",
                  beltId: "",
                  gender: "",
                  minAge: "",
                  maxAge: "",
                });
                setAgeRefDate(new Date().toISOString().split('T')[0]);
              }}
            >
              Reset filters
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-800 bg-red-900/30 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div
            className={[
              "rounded-2xl border-2 p-5 transition h-fit",
              draggedId ? "border-cyan-500 bg-cyan-500/5" : "border-gray-800 bg-gray-900/40",
            ].join(" ")}
            onDragOver={(evt) => evt.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">Selection list</h2>
                <p className="text-xs text-gray-400">{selectedAthletes.length} athletes selected</p>
              </div>
              {selectedAthletes.length > 0 && (
                <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-white">Clear</button>
              )}
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedAthletes.map((athlete) => (
                <div key={athlete.id} className="rounded-2xl border border-gray-800 bg-gray-950/50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{athlete.firstName} {athlete.lastName}</p>
                    <p className="text-xs text-gray-400">{athlete.club?.name ?? "No club"} • {athlete.belt?.name ?? "No belt"}</p>
                  </div>
                  <button
                    onClick={() => removeSelection(athlete.id)}
                    className="text-xs px-3 py-1 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!selectedAthletes.length && (
                <div className="text-sm text-gray-400 border border-dashed border-gray-700 rounded-2xl p-6 text-center">
                  Drag athletes here or use the Add buttons to build your extract.
                </div>
              )}
            </div>
            <div className="mt-5 space-y-2">
              <button
                onClick={() => download("csv")}
                disabled={!selectedAthletes.length}
                className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 transition disabled:opacity-40"
              >
                Download CSV
              </button>
              <button
                onClick={() => download("excel")}
                disabled={!selectedAthletes.length}
                className="w-full rounded-2xl bg-emerald-500/80 hover:bg-emerald-500 text-black font-semibold py-3 transition disabled:opacity-40"
              >
                Download Excel
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">Browse & add</h2>
                <p className="text-xs text-gray-400">{availableAthletes.length} match current filters</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addManySelections(availableAthletes.map((a) => a.id))}
                  disabled={!availableAthletes.length}
                  className="text-xs px-3 py-1 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add all
                </button>
                {loading && <span className="text-xs text-gray-500">Loading...</span>}
              </div>
            </div>
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {availableAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4 hover:border-cyan-500/60 transition cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(evt) => {
                    evt.dataTransfer.setData("text/athlete-id", athlete.id);
                    setDraggedId(athlete.id);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-100">{athlete.firstName} {athlete.lastName}</p>
                      <p className="text-xs text-gray-400">{athlete.club?.name ?? "No club"} • {athlete.belt?.name ?? "No belt"}</p>
                    </div>
                    <button
                      onClick={() => addSelection(athlete.id)}
                      className="text-xs px-3 py-1 rounded-md bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {athlete.gender} • DOB {new Date(athlete.dob).toLocaleDateString()}
                    {(() => {
                      const age = calculateAge(athlete.dob, new Date(ageRefDate));
                      return age !== null ? ` • ${age} yrs` : "";
                    })()}
                  </p>
                </div>
              ))}
              {!loading && !availableAthletes.length && (
                <div className="text-sm text-gray-400 border border-dashed border-gray-800 rounded-2xl p-6 text-center">
                  No athletes match your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteExtractPage;
