import { api } from "./api";

export type Gender = "Male" | "Female";

export type Athlete = {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  invoiceRef?: string | null;
  dob: string;
  gender: Gender;
  nationality: string;
  idType?: string | null;
  idNumber?: string | null;
  beltId: string;
  weightKg?: number | null;
  joinDate?: string | null;
  lastGraded?: string | null;
  isInstructor?: boolean | null;
  medicalNotes?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  guardianName1?: string | null;
  guardianPhone1?: string | null;
  guardianName2?: string | null;
  guardianPhone2?: string | null;
  photoUrl?: string | null;
  club?: { id: string; name: string };
  belt?: { id: string; name?: string | null; colour?: string | null };
};

export async function listAthletes(clubId: string): Promise<Athlete[]> {
  const { data } = await api.get("/athletes", { params: { clubId } });
  return data;
}

export async function listAllAthletes(): Promise<Athlete[]> {
  const { data } = await api.get("/athletes/all");
  return data;
}

export async function getAthlete(id: string): Promise<Athlete> {
  const { data } = await api.get(`/athletes/${id}`);
  return data;
}

export async function createAthlete(payload: Omit<Athlete, "id"|"club"|"belt"|"joinDate"|"lastGraded"> & { joinDate?: string | null; lastGraded?: string | null }): Promise<Athlete> {
  const { data } = await api.post(`/athletes`, payload);
  return data;
}

export async function updateAthlete(id: string, payload: Partial<Athlete>): Promise<Athlete> {
  const { data } = await api.put(`/athletes/${id}`, payload);
  return data;
}

export async function deleteAthlete(id: string): Promise<void> {
  await api.delete(`/athletes/${id}`);
}

export type AthleteImportResult = {
  insertedCount: number;
  failedCount: number;
  failures: Array<{ rowNumber: number; reason: string }>;
};

export async function importAthletes(params: { clubId: string; file: File }): Promise<AthleteImportResult> {
  const formData = new FormData();
  formData.append("clubId", params.clubId);
  formData.append("file", params.file);
  const { data } = await api.post("/athletes/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
