import { z } from "zod";

export const GenderEnum = z.enum(["Male", "Female"]);
export const EntryTypeEnum = z.enum(["KATA","KUMITE","TEAM_KATA","TEAM_KUMITE"]);
export const EntryStatusEnum = z.enum(["DRAFT","SUBMITTED","APPROVED","RETURNED"]);
export const RoleEnum = z.enum(["SUPERADMIN","ADMIN","CLUB_MANAGER","COACH","ATHLETE"]);

export const CreateAthlete = z.object({
  clubId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  invoiceRef: z.string().optional(),
  dob: z.string().transform(s => new Date(s)),
  gender: GenderEnum,
  nationality: z.string().min(1),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  beltId: z.string().min(1),
  weightKg: z.number().optional(),
  joinDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
  lastGraded: z.string().optional().transform(s => s ? new Date(s) : undefined),
  isInstructor: z.boolean().optional(),
  medicalNotes: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  guardianName1: z.string().optional(),
  guardianPhone1: z.string().optional(),
  guardianName2: z.string().optional(),
  guardianPhone2: z.string().optional(),
  photoUrl: z.string().url().optional(),
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

// ---------------- Users ----------------
export const CreateUser = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  role: RoleEnum,
  clubId: z.string().optional().nullable(),
});

export const UpdateUser = CreateUser.partial();

// ---------------- Belts ----------------
export const CreateBelt = z.object({
  name: z.string().optional().nullable(),
  colour: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  gradingRequirements: z.string().optional().nullable(),
  order: z.number().int(),
});

export const UpdateBelt = CreateBelt.partial();

// ---------------- Clubs ----------------
export const CreateClub = z.object({
  name: z.string().min(1),
  region: z.string().optional().nullable(),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateClub = CreateClub.partial();
