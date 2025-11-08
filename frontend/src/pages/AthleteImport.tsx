import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { listClubs, type Club } from "../lib/clubs";
import { importAthletes, type AthleteImportResult } from "../lib/athletes";
import { Label, Select } from "../components/Input";

type Failure = AthleteImportResult["failures"][number];

const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ACCEPTED_EXTENSIONS = ".csv,.xls,.xlsx";

const AthleteImportPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [clubError, setClubError] = useState<string | null>(null);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [clubsError, setClubsError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AthleteImportResult | null>(null);

  useEffect(() => {
    if (role !== "SUPERADMIN") return;
    setLoadingClubs(true);
    setClubsError(null);
    listClubs()
      .then((rows) => {
        setClubs(rows);
        setSelectedClub((prev) => prev || rows[0]?.id || "");
      })
      .catch((e: any) => setClubsError(e?.response?.data?.error || e.message || "Failed to load clubs"))
      .finally(() => setLoadingClubs(false));
  }, [role]);

  const acceptedTypes = useMemo(() => new Set(ACCEPTED_TYPES), []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const candidate = files[0];
    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    if (!acceptedTypes.has(candidate.type) && !["csv", "xls", "xlsx"].includes(extension)) {
      setFileError("Unsupported file type. Please upload CSV or Excel (.xls/.xlsx).");
      setFile(null);
      return;
    }
    setFile(candidate);
    setFileError(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    if (!selectedClub) {
      setClubError("Select a club before importing.");
      return;
    }
    setClubError(null);
    if (!file) {
      setFileError("Select a file to import.");
      return;
    }
    setFileError(null);
    setSubmitting(true);
    try {
      const summary = await importAthletes({ clubId: selectedClub, file });
      setResult(summary);
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || "Failed to import athletes";
      setResult({
        insertedCount: 0,
        failedCount: 1,
        failures: [{ rowNumber: 0, reason: message }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (role !== "SUPERADMIN") {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Import Athletes</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
              Back
            </button>
          </div>
          <p className="text-sm text-gray-400">Only SUPERADMIN users may import athletes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Import Athletes</h1>
          <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            Back
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Upload a CSV or Excel file with column headers matching the athlete schema (e.g., firstName, lastName, dob,
          gender, beltId, etc.). Invalid rows are skipped and reported.
        </p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label required>Club</Label>
            <Select
              disabled={loadingClubs}
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
            >
              <option value="" disabled>Select club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </Select>
            {clubError && <p className="text-xs text-red-400 mt-1">{clubError}</p>}
            {clubsError && <p className="text-xs text-red-400 mt-1">{clubsError}</p>}
          </div>

          <div>
            <Label required>File</Label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={onBrowseClick}
              className="border border-dashed border-cyan-600/60 rounded-2xl bg-gray-900/40 px-6 py-10 text-center cursor-pointer hover:bg-gray-900/60 transition"
            >
              <p className="text-sm text-gray-200">
                Drag & drop CSV/XLS/XLSX here, or <span className="text-cyan-400 underline">browse</span>
              </p>
              {file && (
                <p className="text-xs text-gray-400 mt-2">
                  Selected: <span className="text-gray-200">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !selectedClub || !file}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-2 transition disabled:opacity-50"
            >
              {submitting ? "Importing..." : "Start Import"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 p-4 rounded-2xl border border-gray-800 bg-gray-900/40">
            <h2 className="font-semibold mb-2 text-gray-200">Import Summary</h2>
            <p className="text-sm text-gray-300">
              Inserted: <span className="text-emerald-400 font-semibold">{result.insertedCount}</span> • Failed:{" "}
              <span className="text-red-400 font-semibold">{result.failedCount}</span>
            </p>
            {result.failedCount > 0 && (
              <div className="mt-4">
                <h3 className="text-sm text-gray-300 font-semibold mb-2">Failed Rows</h3>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-800">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-900/60 text-gray-400 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Row</th>
                        <th className="text-left px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {result.failures.map((failure: Failure, idx) => (
                        <tr key={`${failure.rowNumber}-${idx}`} className="bg-gray-900/20">
                          <td className="px-3 py-2 text-gray-300">{failure.rowNumber}</td>
                          <td className="px-3 py-2 text-gray-400">{failure.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteImportPage;
