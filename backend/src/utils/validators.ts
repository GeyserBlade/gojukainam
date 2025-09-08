import { z } from "zod";

export const GenderEnum = z.enum(["Male", "Female"]);
export const EntryTypeEnum = z.enum(["KATA","KUMITE","TEAM_KATA","TEAM_KUMITE"]);
export const EntryStatusEnum = z.enum(["DRAFT","SUBMITTED","APPROVED","RETURNED"]);

export const CreateAthlete = z.object({
  clubId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().transform(s => new Date(s)),
  gender: GenderEnum,
  nationality: z.string().min(1),
  idNumber: z.string().optional(),
  wkfId: z.string().optional(),
  beltRank: z.string().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  medicalNotes: z.string().optional(),
  emergencyName: z.string().min(1),
  emergencyPhone: z.string().min(1),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  photoUrl: z.string().url().optional(),
  waiverUrl: z.string().url().optional(),
});

export const CreateEntry = z.object({
  eventId: z.string(),
  clubId: z.string(),
  entryType: EntryTypeEnum,
  divisionId: z.string(),
  athleteId: z.string().optional(),      // required for individual
  weightClassId: z.string().optional(),  // required for Kumite individual
  teamId: z.string().optional(),         // required for team entries
  feeCents: z.number().int().nonnegative().default(0),
  status: EntryStatusEnum.default("DRAFT"),
  notes: z.string().optional(),
});

export const UpdateEntryStatus = z.object({
  id: z.string(),
  status: z.enum(["SUBMITTED","APPROVED","RETURNED"]),
  reason: z.string().optional(), // stored in AuditLog
});

export const BulkUpdateEntryStatus = z.object({
  eventId: z.string(),
  ids: z.array(z.string()).min(1),
  status: z.enum(["APPROVED","RETURNED"]),
  reason: z.string().optional(),
});

export const CreateTeam = z.object({
  eventId: z.string(),
  clubId: z.string(),
  name: z.string().min(1),
  teamType: z.enum(["TEAM_KATA","TEAM_KUMITE"]),
  divisionId: z.string(),
});

export const AddTeamMembers = z.object({
  teamId: z.string(),
  members: z.array(z.object({
    athleteId: z.string(),
    isReserve: z.boolean().default(false),
  })).min(1),
});
