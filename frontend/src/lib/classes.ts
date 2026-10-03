import { api } from "./api";

/**
 * Classes, instructors and enrolment. Mirrors backend/src/services/class.service.ts.
 *
 * Dates are calendar days ("2026-03-01"), never Date objects: a class change
 * from 1 March must arrive as 1 March whatever the browser's time zone.
 */

export type Instructor = {
  id: string;
  name: string;
  active: boolean;
  athleteId: string | null;
  userId: string | null;
};

export type ClassRow = {
  id: string;
  name: string;
  schedule: string | null;
  active: boolean;
  /** Who teaches it today, and since when. Two means shared, split evenly. */
  instructors: Array<{ id: string; name: string; since: string }>;
  shared: boolean;
  memberCount: number;
};

export type CurrentEnrolment = {
  athleteId: string;
  classId: string;
  className: string;
  since: string;
};

export type EnrolmentHistoryRow = {
  classId: string;
  className: string;
  from: string;
  to: string | null;
};

/** Today as a calendar day in the user's own time zone — what "from today" means to them. */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function listClasses(clubId: string, includeInactive = false): Promise<ClassRow[]> {
  const { data } = await api.get(`/classes`, { params: { clubId, includeInactive: String(includeInactive) } });
  return data;
}

export async function createClass(payload: { clubId: string; name: string; schedule?: string | null }): Promise<ClassRow> {
  const { data } = await api.post(`/classes`, payload);
  return data;
}

export async function updateClass(
  clubId: string,
  id: string,
  payload: { name?: string; schedule?: string | null; active?: boolean },
): Promise<ClassRow> {
  const { data } = await api.patch(`/classes/${id}`, payload, { params: { clubId } });
  return data;
}

export async function setClassInstructors(
  clubId: string,
  id: string,
  payload: { instructorIds: string[]; from: string },
): Promise<void> {
  await api.put(`/classes/${id}/instructors`, payload, { params: { clubId } });
}

export async function listInstructors(clubId: string, includeInactive = false): Promise<Instructor[]> {
  const { data } = await api.get(`/classes/instructors`, { params: { clubId, includeInactive: String(includeInactive) } });
  return data;
}

export async function createInstructor(payload: { clubId: string; name: string }): Promise<Instructor> {
  const { data } = await api.post(`/classes/instructors`, payload);
  return data;
}

export async function updateInstructor(
  clubId: string,
  id: string,
  payload: { name?: string; active?: boolean },
): Promise<Instructor> {
  const { data } = await api.patch(`/classes/instructors/${id}`, payload, { params: { clubId } });
  return data;
}

export async function listCurrentEnrolments(clubId: string): Promise<CurrentEnrolment[]> {
  const { data } = await api.get(`/classes/enrolments`, { params: { clubId } });
  return data;
}

export async function getEnrolmentHistory(clubId: string, athleteId: string): Promise<EnrolmentHistoryRow[]> {
  const { data } = await api.get(`/classes/athletes/${athleteId}`, { params: { clubId } });
  return data;
}

/** The member's class from `from` onwards; `classId: null` ends it. */
export async function enrolAthlete(
  clubId: string,
  athleteId: string,
  payload: { classId: string | null; from: string },
): Promise<{ changed: boolean }> {
  const { data } = await api.put(`/classes/athletes/${athleteId}`, payload, { params: { clubId } });
  return data;
}

/**
 * Many members' classes from one date, all or nothing: if any one move is
 * refused (say, dated before that member's current class began) none land.
 */
export async function allocateMembers(
  clubId: string,
  payload: { from: string; assignments: Array<{ athleteId: string; classId: string | null }> },
): Promise<{ from: string; changed: number; unchanged: number }> {
  const { data } = await api.put(`/classes/enrolments`, payload, { params: { clubId } });
  return data;
}
