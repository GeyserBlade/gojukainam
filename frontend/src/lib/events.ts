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

// ============ Eligible Athletes ============

export async function getEligibleAthletes(eventId: string, divisionId: string, clubId?: string): Promise<EligibleAthlete[]> {
  const params: any = {};
  if (clubId) params.clubId = clubId;

  const res = await api.get(`/events/${eventId}/divisions/${divisionId}/eligible-athletes`, { params });
  return res.data;
}
