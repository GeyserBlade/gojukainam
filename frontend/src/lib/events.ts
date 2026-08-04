import { api } from "./api";

export type EventStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export interface Event {
  id: string;
  name: string;
  venue: string;
  city: string;
  country: string;
  startDate: string;
  regOpen: string;
  regClose: string;
  status: EventStatus;
  configJson: string;
  publicToken?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    divisions: number;
    weightClasses: number;
    entries: number;
  };
  divisions?: Division[];
  weightClasses?: WeightClass[];
}

export type CategoryType = "KATA" | "KUMITE";

export interface Division {
  id: string;
  eventId: string;
  key: string;
  name: string;
  minAge: number;
  maxAge: number;
  gender: "Male" | "Female";
  category: CategoryType;
  notes?: string | null;
  _count?: {
    entries: number;
  };
}

export interface WeightClass {
  id: string;
  eventId: string;
  divisionId?: string | null;
  gender: "Male" | "Female";
  name: string;
  minKg?: number | null;
  maxKg?: number | null;
  division?: {
    name: string;
  };
  _count?: {
    entries: number;
  };
}

export interface EligibleAthlete {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "Male" | "Female";
  nationality: string;
  weightKg?: number | null;
  age: number;
  isEntered: boolean;
  club: {
    name: string;
  };
  belt: {
    name: string | null;
    colour: string | null;
  };
}

/**
 * An athlete in the event-wide pool. Same projection as EligibleAthlete, but
 * `isEntered` means "entered in any division of this event" rather than in one
 * specific division.
 */
export interface PoolAthlete {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "Male" | "Female";
  nationality: string;
  weightKg?: number | null;
  age: number;
  isEntered: boolean;
  club: {
    name: string;
  };
  belt: {
    name: string | null;
    colour: string | null;
  };
}

export interface CreateEventDto {
  name: string;
  venue: string;
  city: string;
  country: string;
  startDate: string | Date;
  regOpen: string | Date;
  regClose: string | Date;
  configJson?: string;
}

export interface CreateDivisionDto {
  eventId: string;
  key: string;
  name: string;
  minAge: number;
  maxAge: number;
  gender: "Male" | "Female";
  category?: CategoryType;
  notes?: string;
}

export interface CreateWeightClassDto {
  eventId: string;
  divisionId?: string;
  gender: "Male" | "Female";
  name: string;
  minKg?: number;
  maxKg?: number;
}

// ============ Events ============

export async function listEvents(activeOnly = false): Promise<Event[]> {
  const params = activeOnly ? { activeOnly: "true" } : {};
  const res = await api.get("/events", { params });
  return res.data;
}

export async function getEvent(id: string): Promise<Event> {
  const res = await api.get(`/events/${id}`);
  return res.data;
}

// ---- Registration window (mirrors backend utils/regWindow.ts) ----
// Registration is open only when the event is ACTIVE and now ∈ [regOpen, regClose].
// Clubs are held to this; admins bypass it server-side.
export interface RegistrationState {
  open: boolean;
  message: string | null;
}

const fmtRegDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

export function registrationState(
  event: Pick<Event, "status" | "regOpen" | "regClose"> | undefined,
  now: Date = new Date(),
): RegistrationState {
  if (!event) return { open: false, message: null };
  if (event.status === "DRAFT")
    return { open: false, message: "Registration hasn't opened yet — the event is still being set up." };
  if (event.status === "CLOSED" || event.status === "ARCHIVED")
    return { open: false, message: "Registration is closed for this event." };
  if (now < new Date(event.regOpen))
    return { open: false, message: `Registration opens on ${fmtRegDate(event.regOpen)}.` };
  if (now > new Date(event.regClose))
    return { open: false, message: `Registration closed on ${fmtRegDate(event.regClose)}.` };
  return { open: true, message: null };
}

export interface EventReadiness {
  entries: { draft: number; submitted: number; approved: number; returned: number; total: number };
  draws: { generated: number; completed: number; locked: number };
  checkin: { done: number; total: number };
  mats: number;
  divisions: number;
}

export async function getReadiness(id: string): Promise<EventReadiness> {
  const res = await api.get(`/events/${id}/readiness`);
  return res.data;
}

export async function createEvent(data: CreateEventDto): Promise<Event> {
  const res = await api.post("/events", data);
  return res.data;
}

export async function updateEvent(id: string, data: Partial<CreateEventDto>): Promise<Event> {
  const res = await api.put(`/events/${id}`, data);
  return res.data;
}

export async function updateEventStatus(id: string, status: EventStatus): Promise<Event> {
  const res = await api.patch(`/events/${id}/status`, { status });
  return res.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`);
}

// Enable/disable (and rotate) the read-only public board token.
export async function setPublicAccess(id: string, enabled: boolean): Promise<Event> {
  const res = await api.post(`/events/${id}/public-token`, { enabled });
  return res.data;
}

// ============ Divisions ============

export async function getDivisions(eventId: string): Promise<Division[]> {
  const res = await api.get(`/events/${eventId}/divisions`);
  return res.data;
}

export async function createDivision(data: CreateDivisionDto): Promise<Division> {
  const res = await api.post(`/events/${data.eventId}/divisions`, data);
  return res.data;
}

export async function updateDivision(id: string, data: Partial<Omit<CreateDivisionDto, "eventId">>): Promise<Division> {
  const res = await api.put(`/events/divisions/${id}`, data);
  return res.data;
}

export async function deleteDivision(id: string): Promise<void> {
  await api.delete(`/events/divisions/${id}`);
}

// ============ Weight Classes ============

export async function getWeightClasses(eventId: string): Promise<WeightClass[]> {
  const res = await api.get(`/events/${eventId}/weights`);
  return res.data;
}

export async function createWeightClass(data: CreateWeightClassDto): Promise<WeightClass> {
  const res = await api.post(`/events/${data.eventId}/weights`, data);
  return res.data;
}

export async function updateWeightClass(id: string, data: Partial<Omit<CreateWeightClassDto, "eventId">>): Promise<WeightClass> {
  const res = await api.put(`/events/weights/${id}`, data);
  return res.data;
}

export async function deleteWeightClass(id: string): Promise<void> {
  await api.delete(`/events/weights/${id}`);
}

// ============ Coordinators ============

export interface CoordinatorUser {
  id: string;
  name: string | null;
  email: string;
  role: "CLUB_MANAGER" | "COACH";
  club: { id: string; name: string } | null;
}

export interface Coordinator {
  id: string;
  createdAt: string;
  user: CoordinatorUser;
  grantedBy: { id: string; name: string | null; email: string } | null;
}

export async function listCoordinators(eventId: string): Promise<Coordinator[]> {
  const res = await api.get(`/events/${eventId}/coordinators`);
  return res.data;
}

export async function listCoordinatorCandidates(
  eventId: string,
  search?: string,
): Promise<CoordinatorUser[]> {
  const res = await api.get(`/events/${eventId}/coordinator-candidates`, {
    params: search ? { search } : undefined,
  });
  return res.data;
}

export async function addCoordinator(eventId: string, userId: string): Promise<Coordinator[]> {
  const res = await api.post(`/events/${eventId}/coordinators`, { userId });
  return res.data;
}

export async function removeCoordinator(eventId: string, userId: string): Promise<Coordinator[]> {
  const res = await api.delete(`/events/${eventId}/coordinators/${userId}`);
  return res.data;
}

// ============ Templates ============

export type TemplateId = "GK_SMALL_NO_WEIGHTS" | "NKF_FULL_2026" | "NKF_INDIVIDUAL_2026" | "NKF_TEAM_2026" | "WKF_2024";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  divisionCount: number;
  weightClassCount: number;
}

export interface ApplyTemplateResult {
  divisionsCreated: number;
  divisionsSkipped: number;
  weightClassesCreated: number;
  message: string;
}

export async function listTemplates(): Promise<TemplateMeta[]> {
  const res = await api.get("/events/templates");
  return res.data;
}

export async function applyTemplate(eventId: string, template: TemplateId): Promise<ApplyTemplateResult> {
  const res = await api.post(`/events/${eventId}/apply-template`, { template });
  return res.data;
}

// ============ Eligible Athletes ============

export async function getEligibleAthletes(eventId: string, divisionId: string, clubId?: string): Promise<EligibleAthlete[]> {
  const params: any = {};
  if (clubId) params.clubId = clubId;

  const res = await api.get(`/events/${eventId}/divisions/${divisionId}/eligible-athletes`, { params });
  return res.data;
}

/**
 * The whole athlete pool for an event in one request, with age resolved against
 * the event date. For screens that show every division at once and decide
 * eligibility client-side — use getEligibleAthletes when you only need one
 * division. Carries no PII: never swap this for the full athlete list.
 */
export async function getAthletePool(eventId: string, clubId?: string): Promise<PoolAthlete[]> {
  const params: any = {};
  if (clubId) params.clubId = clubId;

  const res = await api.get(`/events/${eventId}/athlete-pool`, { params });
  return res.data;
}
