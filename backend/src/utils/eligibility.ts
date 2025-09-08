import { prisma } from "../server";
import type { Gender } from "@prisma/client";

// compute age as of event date
export function ageOn(date: Date, dob: Date) {
  let age = date.getFullYear() - dob.getFullYear();
  const m = date.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && date.getDate() < dob.getDate())) age--;
  return age;
}

// Find suitable division by gender + age
export async function findDivisionForAthlete(eventId: string, gender: Gender, dob: Date) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw { status: 404, message: "Event not found" };
  const divisions = await prisma.division.findMany({ where: { eventId } });
  const age = ageOn(event.startDate, dob);
  return divisions.find(d => d.gender === gender && age >= d.minAge && age <= d.maxAge)
      ?? null;
}

// Ensure entry doesn’t violate uniqueness rules (individual or team)
export async function assertNoDuplicateEntry(params: {
  eventId: string;
  entryType: "KATA"|"KUMITE"|"TEAM_KATA"|"TEAM_KUMITE";
  divisionId: string;
  athleteId?: string | null;
  teamId?: string | null;
}) {
  const exists = await prisma.entry.findFirst({
    where: {
      eventId: params.eventId,
      entryType: params.entryType,
      divisionId: params.divisionId,
      athleteId: params.athleteId ?? undefined,
      teamId: params.teamId ?? undefined
    },
    select: { id: true }
  });
  if (exists) throw { status: 409, message: "Duplicate entry exists for this athlete/team in this division & type" };
}

// For Kumite individual, ensure weight class matches gender & division
export async function validateWeightClass(weightClassId: string, eventId: string, divisionId: string, gender: Gender) {
  const wc = await prisma.weightClass.findUnique({ where: { id: weightClassId } });
  if (!wc || wc.eventId !== eventId || wc.divisionId !== divisionId || wc.gender !== gender) {
    throw { status: 400, message: "Invalid weight class selection" };
  }
}
