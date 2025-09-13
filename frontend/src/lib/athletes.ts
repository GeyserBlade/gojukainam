import { api } from "./api";

export type Gender = "Male" | "Female";

export type Athlete = {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  nationality: string;
  idType?: string | null;
  idNumber?: string | null;
  beltRank?: string | null;
  weightKg?: number | null;
  medicalNotes?: string | null;
  emergencyName: string;
  emergencyPhone: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  photoUrl?: string | null;
  waiverUrl?: string | null;
  club?: { id: string; name: string };
};

export async function listAthletes(clubId: string): Promise<Athlete[]> {
  const { data } = await api.get("/athletes", { params: { clubId } });
  return data;
}

export async function listAllAthletes(): Promise<Athlete[]> {
  const { data } = await api.get("/athletes/all");
  return data;
}

export async function deleteAthlete(id: string): Promise<void> {
  await api.delete(`/athletes/${id}`);
}
