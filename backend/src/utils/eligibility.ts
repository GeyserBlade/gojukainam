import { prisma } from "../lib/prisma.js";
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
  entryType: "KATA" | "KUMITE" | "TEAM_KATA" | "TEAM_KUMITE" | "BUNKAI";
  divisionId: string;
  athleteId?: string | null;
  teamId?: string | null;
}) {
  const { eventId, entryType, divisionId, athleteId, teamId } = params;

  if (athleteId) {
    const count = await prisma.entry.count({
      where: {
        eventId,
        entryType,
        divisionId,
        athleteId,
      },
    });
    if (count > 0) {
      throw { status: 409, message: "Athlete is already entered in this division for this category" };
    }
  } else if (teamId) {
    const count = await prisma.entry.count({
      where: {
        eventId,
        entryType,
        divisionId,
        teamId,
      },
    });
    if (count > 0) {
      throw { status: 409, message: "Team is already entered in this division for this category" };
    }
  }
}

// For Kumite individual, ensure weight class matches gender & division
export async function validateWeightClass(
  weightClassId: string,
  eventId: string,
  divisionId: string,
  gender: "Male" | "Female" | Gender
) {
  const wc = await prisma.weightClass.findUnique({ where: { id: weightClassId } });
  if (!wc) throw { status: 404, message: "Weight class not found" };

  if (wc.eventId !== eventId) throw { status: 400, message: "Weight class does not belong to this event" };

  if (wc.gender !== gender) {
    throw { status: 400, message: `Weight class gender (${wc.gender}) does not match athlete (${gender})` };
  }
}

// Validate athlete is eligible for a specific division based on age and gender
export async function validateAthleteEligibility(
  athleteId: string,
  divisionId: string,
  eventId: string
) {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { dob: true, gender: true, firstName: true, lastName: true, isActive: true }
  });
  if (!athlete) throw { status: 404, message: "Athlete not found" };

  // Check if athlete is active
  if (!athlete.isActive) {
    throw {
      status: 400,
      message: `Athlete ${athlete.firstName} ${athlete.lastName} is inactive and cannot be entered`
    };
  }

  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { minAge: true, maxAge: true, gender: true, name: true, eventId: true }
  });
  if (!division) throw { status: 404, message: "Division not found" };

  if (division.eventId !== eventId) {
    throw { status: 400, message: "Division does not belong to this event" };
  }

  // Check gender
  if (division.gender !== athlete.gender) {
    throw {
      status: 400,
      message: `Athlete gender (${athlete.gender}) does not match division gender (${division.gender})`
    };
  }

  // Check age
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { startDate: true, name: true }
  });
  if (!event) throw { status: 404, message: "Event not found" };

  const athleteAge = ageOn(event.startDate, athlete.dob);

  if (athleteAge < division.minAge || athleteAge > division.maxAge) {
    throw {
      status: 400,
      message: `Athlete ${athlete.firstName} ${athlete.lastName} (age ${athleteAge}) is not eligible for division "${division.name}" (ages ${division.minAge}-${division.maxAge})`
    };
  }

  return { athleteAge, division, athlete, event };
}

// Validate athlete's weight is within the weight class range
export async function validateAthleteWeight(
  athleteId: string,
  weightClassId: string
) {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { weightKg: true, firstName: true, lastName: true }
  });
  if (!athlete) throw { status: 404, message: "Athlete not found" };

  const weightClass = await prisma.weightClass.findUnique({
    where: { id: weightClassId },
    select: { minKg: true, maxKg: true, name: true }
  });
  if (!weightClass) throw { status: 404, message: "Weight class not found" };

  // If athlete has no weight recorded, we can't validate
  if (athlete.weightKg === null || athlete.weightKg === undefined) {
    throw {
      status: 400,
      message: `Athlete ${athlete.firstName} ${athlete.lastName} has no weight recorded`
    };
  }

  // Check if weight is within range
  if (weightClass.minKg !== null && athlete.weightKg < weightClass.minKg) {
    throw {
      status: 400,
      message: `Athlete weight (${athlete.weightKg}kg) is below weight class minimum (${weightClass.minKg}kg)`
    };
  }

  if (weightClass.maxKg !== null && athlete.weightKg > weightClass.maxKg) {
    throw {
      status: 400,
      message: `Athlete weight (${athlete.weightKg}kg) exceeds weight class maximum (${weightClass.maxKg}kg)`
    };
  }

  return { athlete, weightClass };
}
