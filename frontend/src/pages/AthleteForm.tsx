import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Label, Select, Textarea } from "../components/Input";
import { Athlete, createAthlete, getAthlete, updateAthlete, Gender } from "../lib/athletes";
import { listClubs, Club } from "../lib/clubs";
import { listBelts, Belt } from "../lib/belts";

type Mode = "create" | "edit";

const formatApiError = (err: any) => {
  const data = err?.response?.data;
  if (data?.issues && Array.isArray(data.issues)) {
    const details = data.issues.map((issue: any) => {
      const path = Array.isArray(issue.path) && issue.path.length ? issue.path.join(".") : "field";
      return `${path}: ${issue.message}`;
    }).join("; ");
    return `${data.error || "Validation failed"}: ${details}`;
  }
  return data?.error || err?.message || "Failed to save athlete";
};

const AthleteFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const mode: Mode = id ? "edit" : "create";
  const { role, clubId } = useAuth();
  const nav = useNavigate();
  const canManage = role === "CLUB_MANAGER" || role === "ADMIN" || role === "SUPERADMIN";

  const [clubs, setClubs] = useState<Club[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Athlete>>({
    clubId: clubId || undefined,
    gender: "Male",
  });

  useEffect(() => {
    if (!canManage) return;
    setLoading(true); setError(null);
    const promises: Promise<any>[] = [listBelts()];
    if (role !== "CLUB_MANAGER") promises.push(listClubs());
    Promise.all(promises)
      .then(([beltsData, clubsData]) => { setBelts(beltsData); if (clubsData) setClubs(clubsData); })
      .catch((e:any) => setError(e?.response?.data?.error || e.message || "Failed to load lookups"))
      .finally(() => setLoading(false));
  }, [canManage, role]);

  useEffect(() => {
    if (mode === "edit" && id) {
      setLoading(true); setError(null);
      getAthlete(id)
        .then((a) => setForm({ ...a }))
        .catch((e:any)=> setError(e?.response?.data?.error || e.message || "Failed to load athlete"))
        .finally(()=> setLoading(false));
    }
  }, [mode, id]);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold">{mode === "create" ? "New Athlete" : "Edit Athlete"}</h1>
            <button className="px-3 py-2 text-sm text-gray-400 hover:text-white" onClick={() => nav("/dashboard")}>Back to Dashboard</button>
          </div>
        </header>
        <main className="p-4">
          <p className="text-sm text-gray-400">You do not have permission to manage athletes.</p>
        </main>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = { ...form };
      if (typeof payload.weightKg === "string") payload.weightKg = Number(payload.weightKg) || undefined;
      if (!payload.clubId && clubId) payload.clubId = clubId;
      if (mode === "create") {
        await createAthlete(payload);
        nav("/athletes");
      } else if (mode === "edit" && id) {
        await updateAthlete(id, payload);
        nav("/athletes");
      }
    } catch (err: any) {
      setError(formatApiError(err));
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">{mode === "create" ? "New Athlete" : "Edit Athlete"}</h1>
          <button className="px-3 py-2 text-sm text-gray-400 hover:text-white active:text-gray-300" onClick={() => nav("/athletes")}>Back</button>
        </div>
      </header>

      <main className="p-4 pb-8">
        <div className="max-w-3xl mx-auto">
          {loading && <p className="text-sm text-gray-400 py-4">Loading...</p>}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {role !== "CLUB_MANAGER" && (
              <div>
                <Label required>Club</Label>
                <Select required value={form.clubId || ""} onChange={(e)=> setForm({ ...form, clubId: e.target.value })}>
                  <option value="" disabled>Select a club</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
              <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>First Name</Label>
                  <Input required value={form.firstName || ""} onChange={(e)=> setForm({ ...form, firstName: e.target.value })} autoCapitalize="words" />
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <Input required value={form.lastName || ""} onChange={(e)=> setForm({ ...form, lastName: e.target.value })} autoCapitalize="words" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label required>Date of Birth</Label>
                  <Input required type="date" value={form.dob ? String(form.dob).slice(0,10) : ""} onChange={(e)=> setForm({ ...form, dob: e.target.value as any })} />
                </div>
                <div>
                  <Label required>Gender</Label>
                  <Select required value={(form.gender as Gender) || "Male"} onChange={(e)=> setForm({ ...form, gender: e.target.value as Gender })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Select>
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <Label required>Nationality</Label>
                  <Input required value={form.nationality || ""} onChange={(e)=> setForm({ ...form, nationality: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Identification Section */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
              <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">Identification</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>ID Type</Label>
                  <Input value={form.idType || ""} onChange={(e)=> setForm({ ...form, idType: e.target.value })} />
                </div>
                <div>
                  <Label>ID Number</Label>
                  <Input value={form.idNumber || ""} onChange={(e)=> setForm({ ...form, idNumber: e.target.value })} />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <Label>Weight (kg)</Label>
                  <Input type="number" inputMode="decimal" value={(form.weightKg as any) ?? ""} onChange={(e)=> setForm({ ...form, weightKg: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* Karate Information Section */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
              <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">Karate Information</h2>
              <div>
                <Label required>Belt</Label>
                <Select required value={form.beltId || ""} onChange={(e)=> setForm({ ...form, beltId: e.target.value })}>
                  <option value="" disabled>Select a belt</option>
                  {belts.map(b => <option key={b.id} value={b.id}>{b.name || b.colour || b.id}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Join Date</Label>
                  <Input type="date" value={form.joinDate ? String(form.joinDate).slice(0,10) : ""} onChange={(e)=> setForm({ ...form, joinDate: e.target.value as any })} />
                </div>
                <div>
                  <Label>Last Graded</Label>
                  <Input type="date" value={form.lastGraded ? String(form.lastGraded).slice(0,10) : ""} onChange={(e)=> setForm({ ...form, lastGraded: e.target.value as any })} />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive !== false}
                  onChange={(e)=> setForm({ ...form, isActive: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <div>
                  <span className="text-sm text-gray-200">Active athlete</span>
                  <p className="text-xs text-gray-500">Inactive athletes cannot be entered in events</p>
                </div>
              </label>
              <div>
                <Label>Medical Notes</Label>
                <Textarea rows={3} value={form.medicalNotes || ""} onChange={(e)=> setForm({ ...form, medicalNotes: e.target.value })} />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
              <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <Input type="email" inputMode="email" autoCapitalize="none" value={form.contactEmail || ""} onChange={(e)=> setForm({ ...form, contactEmail: e.target.value })} />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input type="tel" inputMode="tel" value={form.contactPhone || ""} onChange={(e)=> setForm({ ...form, contactPhone: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
              <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">Guardian Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Guardian Name 1</Label>
                  <Input value={form.guardianName1 || ""} onChange={(e)=> setForm({ ...form, guardianName1: e.target.value })} autoCapitalize="words" />
                </div>
                <div>
                  <Label>Guardian Phone 1</Label>
                  <Input type="tel" inputMode="tel" value={form.guardianPhone1 || ""} onChange={(e)=> setForm({ ...form, guardianPhone1: e.target.value })} />
                </div>
                <div>
                  <Label>Guardian Name 2</Label>
                  <Input value={form.guardianName2 || ""} onChange={(e)=> setForm({ ...form, guardianName2: e.target.value })} autoCapitalize="words" />
                </div>
                <div>
                  <Label>Guardian Phone 2</Label>
                  <Input type="tel" inputMode="tel" value={form.guardianPhone2 || ""} onChange={(e)=> setForm({ ...form, guardianPhone2: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Photo Section */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
              <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">Photo</h2>
              <div>
                <Label>Photo URL</Label>
                <Input type="url" value={form.photoUrl || ""} onChange={(e)=> setForm({ ...form, photoUrl: e.target.value })} />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit">{mode === "create" ? "Create Athlete" : "Save Changes"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AthleteFormPage;
