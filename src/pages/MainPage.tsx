import React, { useEffect, useState, useMemo } from "react";
import { getAllStudents, updateStudent } from "../api/apiStudent";
import { getAllGrades } from "../api/gradeApi";

interface Grade {
  _id: string;
  description: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  weight?: number;
  gradeId?: Grade | string;
  contactEmail?: string;
  contactPhone?: string;
  active?: boolean;
}

interface EditForm {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  weight: string;
  gradeId: string;
  contactEmail: string;
  contactPhone: string;
  active: boolean;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getGradeId(student: Student): string {
  if (!student.gradeId) return "";
  if (typeof student.gradeId === "string") return student.gradeId;
  return student.gradeId._id;
}

function getGradeDescription(student: Student): string {
  if (!student.gradeId) return "N/A";
  if (typeof student.gradeId === "string") return student.gradeId;
  return student.gradeId.description;
}

const MainPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterBelt, setFilterBelt] = useState("");
  const [filterAgeMin, setFilterAgeMin] = useState("");
  const [filterAgeMax, setFilterAgeMax] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    weight: "",
    gradeId: "",
    contactEmail: "",
    contactPhone: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([getAllStudents(), getAllGrades()])
      .then(([s, g]) => {
        setStudents(s);
        setGrades(g);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterBelt && getGradeId(s) !== filterBelt) return false;
      if (s.dob) {
        const age = getAge(s.dob);
        if (filterAgeMin && age < Number(filterAgeMin)) return false;
        if (filterAgeMax && age > Number(filterAgeMax)) return false;
      } else {
        if (filterAgeMin || filterAgeMax) return false;
      }
      return true;
    });
  }, [students, filterBelt, filterAgeMin, filterAgeMax]);

  function startEdit(student: Student) {
    setErrors([]);
    setEditingId(student._id);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      dob: student.dob ? student.dob.substring(0, 10) : "",
      gender: student.gender,
      weight: student.weight?.toString() ?? "",
      gradeId: getGradeId(student),
      contactEmail: student.contactEmail ?? "",
      contactPhone: student.contactPhone ?? "",
      active: student.active ?? true,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setErrors([]);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setErrors([]);
    try {
      const payload: Record<string, unknown> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        dob: editForm.dob,
        gender: editForm.gender,
        weight: editForm.weight ? Number(editForm.weight) : undefined,
        gradeId: editForm.gradeId || undefined,
        contactEmail: editForm.contactEmail || undefined,
        contactPhone: editForm.contactPhone || undefined,
        active: editForm.active,
      };
      await updateStudent(editingId, payload);
      const refreshed = await getAllStudents();
      setStudents(refreshed);
      setEditingId(null);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else if (data?.message) {
        setErrors([data.message]);
      } else {
        setErrors([err.message || "An error occurred"]);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Athletes</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-semibold mb-1">Belt</label>
          <select
            className="border p-2 rounded"
            value={filterBelt}
            onChange={(e) => setFilterBelt(e.target.value)}
          >
            <option value="">All Belts</option>
            {grades.map((g) => (
              <option key={g._id} value={g._id}>
                {g.description}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Age Min</label>
          <input
            type="number"
            className="border p-2 rounded w-20"
            value={filterAgeMin}
            min={0}
            onChange={(e) => setFilterAgeMin(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Age Max</label>
          <input
            type="number"
            className="border p-2 rounded w-20"
            value={filterAgeMax}
            min={0}
            onChange={(e) => setFilterAgeMax(e.target.value)}
            placeholder="99"
          />
        </div>
        {(filterBelt || filterAgeMin || filterAgeMax) && (
          <button
            className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
            onClick={() => {
              setFilterBelt("");
              setFilterAgeMin("");
              setFilterAgeMax("");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Athlete</h2>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded mb-4">
                <p className="font-semibold mb-1">Validation errors:</p>
                <ul className="list-disc list-inside">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">First Name</label>
                <input
                  className="border p-2 rounded w-full"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Last Name</label>
                <input
                  className="border p-2 rounded w-full"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  className="border p-2 rounded w-full"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Gender</label>
                <select
                  className="border p-2 rounded w-full"
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                >
                  <option value="">-- Select --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={editForm.weight}
                  onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Belt / Grade</label>
                <select
                  className="border p-2 rounded w-full"
                  value={editForm.gradeId}
                  onChange={(e) => setEditForm({ ...editForm, gradeId: e.target.value })}
                >
                  <option value="">-- Select Belt --</option>
                  {grades.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  className="border p-2 rounded w-full"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input
                  className="border p-2 rounded w-full"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                />
                <label className="text-sm font-semibold">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded shadow p-6">
        <p className="text-sm text-gray-500 mb-3">
          Showing {filteredStudents.length} of {students.length} athletes
        </p>
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border text-left">Name</th>
              <th className="py-2 px-4 border text-left">Age</th>
              <th className="py-2 px-4 border text-left">Belt</th>
              <th className="py-2 px-4 border text-left">Active</th>
              <th className="py-2 px-4 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="py-2 px-4 border">
                    {student.dob ? getAge(student.dob) : "N/A"}
                  </td>
                  <td className="py-2 px-4 border">
                    {getGradeDescription(student)}
                  </td>
                  <td className="py-2 px-4 border">
                    {student.active ? "Yes" : "No"}
                  </td>
                  <td className="py-2 px-4 border">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => startEdit(student)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 px-4 border" colSpan={5}>
                  No athletes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainPage;
