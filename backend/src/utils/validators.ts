import { z } from "zod";

export const GenderEnum = z.enum(["Male", "Female"]);
export const EntryTypeEnum = z.enum(["KATA","KUMITE","TEAM_KATA","TEAM_KUMITE"]);
export const EntryStatusEnum = z.enum(["DRAFT","SUBMITTED","APPROVED","RETURNED"]);
export const RoleEnum = z.enum(["SUPERADMIN","ADMIN","CLUB_MANAGER","COACH","ATHLETE"]);
export const EventStatusEnum = z.enum(["DRAFT","ACTIVE","CLOSED","ARCHIVED"]);

const dateSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return value;
}, z.date().refine((d) => !Number.isNaN(d.getTime()), "Invalid date"));

export const CreateAthlete = z.object({
  clubId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  invoiceRef: z.string().optional().nullable(),
  dob: dateSchema,
  gender: GenderEnum,
  nationality: z.string().min(1),
  idType: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  beltId: z.string().min(1),
  weightKg: z.number().optional().nullable(),
  joinDate: dateSchema.optional().nullable(),
  lastGraded: dateSchema.optional().nullable(),
  isInstructor: z.boolean().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  guardianName1: z.string().optional().nullable(),
  guardianPhone1: z.string().optional().nullable(),
  guardianName2: z.string().optional().nullable(),
  guardianPhone2: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
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
  reason: z.string().optional(), // stored in AuditLog + on entry when RETURNED
});

export const BulkSubmitEntries = z.object({
  eventId: z.string(),
  ids: z.array(z.string()).min(1),
});

export const DocumentTypeEnum = z.enum([
  "IDENTITY_DOCUMENT",
  "CLUB_MEMBERSHIP_FORM",
  "EVENT_ENTRY_FORM",
  "MEDICAL_CLEARANCE",
  "GRADING_CERTIFICATE",
  "PHOTO",
  "OTHER",
]);

export const RequestUploadBody = z.object({
  documentType: DocumentTypeEnum,
  label:        z.string().max(200).optional().nullable(),
  filename:     z.string().min(1).max(255),
  mimeType:     z.string().min(1).max(100),
  sizeBytes:    z.number().int().positive(),
  athleteId:    z.string().optional(),
  eventId:      z.string().optional(),
  clubId:       z.string().optional(),
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

// ---------------- Query/Param Schemas ----------------
export const IdParam = z.object({
  id: z.string().min(1),
});

export const EventIdQuery = z.object({
  eventId: z.string().min(1),
});

export const CreateDraw = z.object({
  eventId: z.string().min(1),
  divisionId: z.string().min(1),
  weightClassId: z.string().min(1).optional().nullable(),
});

export const RegenerateDraw = z.object({
  force: z.boolean().optional(),
});

export const SetBoutWinner = z.object({
  winnerEntryId: z.string().min(1).nullable(),
});

export const BOUT_OUTCOMES = ["POINTS", "GAP", "SENSHU", "HANTEI", "HANSOKU", "KIKEN"] as const;

export const SetBoutScore = z.object({
  winnerEntryId: z.string().min(1),
  outcome: z.enum(BOUT_OUTCOMES),
  akaScore: z.number().int().min(0).max(99),
  aoScore: z.number().int().min(0).max(99),
  scoreJson: z.string().max(20000).optional(),
});

export const BoutParams = z.object({
  id: z.string().min(1),
  boutId: z.string().min(1),
});

export const SetDrawLock = z.object({
  locked: z.boolean(),
});

// ---- Day-of run board ----
export const CreateMat = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1).max(60),
  order: z.number().int().min(0).optional(),
});

export const UpdateMat = z.object({
  name: z.string().min(1).max(60).optional(),
  order: z.number().int().min(0).optional(),
});

export const MatIdParam = z.object({
  matId: z.string().min(1),
});

export const AssignDrawMat = z.object({
  matId: z.string().min(1).nullable(),
  matOrder: z.number().int().min(0).optional().nullable(),
});

export const SetBoutMat = z.object({
  matId: z.string().min(1).nullable(),
});

export const ReorderMatQueue = z.object({
  boutIds: z.array(z.string().min(1)).min(1),
});

export const SetPublicAccess = z.object({
  enabled: z.boolean(),
});

export const SetCheckIn = z.object({
  checkedIn: z.boolean(),
});

export const ClubIdQuery = z.object({
  clubId: z.string().min(1),
});

export const EventEntriesQuery = z.object({
  eventId: z.string().min(1),
  clubId: z.string().optional(),
  divisionId: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "RETURNED"]).optional(),
  entryType: z.enum(["KATA", "KUMITE", "TEAM_KATA", "TEAM_KUMITE"]).optional(),
  searchQuery: z.string().optional(),
});

export const ClubAthletesQuery = z.object({
  clubId: z.string().min(1),
});

// Update schemas with max lengths for security
export const UpdateAthlete = CreateAthlete.partial();

// ---------------- Events ----------------
export const CreateEvent = z.object({
  name: z.string().min(1).max(200),
  venue: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  startDate: dateSchema,
  regOpen: dateSchema,
  regClose: dateSchema,
  status: EventStatusEnum.default("ACTIVE"),
  configJson: z.string().default("{}"),
});

export const UpdateEvent = CreateEvent.partial();

export const UpdateEventStatus = z.object({
  status: EventStatusEnum,
});

// ---------------- Divisions ----------------
export const CategoryTypeEnum = z.enum(["KATA", "KUMITE"]);

export const CreateDivision = z.object({
  eventId: z.string().min(1),
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  minAge: z.number().int().min(0).max(150),
  maxAge: z.number().int().min(0).max(150),
  gender: GenderEnum,
  category: CategoryTypeEnum, // KATA or KUMITE
  notes: z.string().optional().nullable(),
});

export const UpdateDivision = CreateDivision.omit({ eventId: true }).partial();

// ---------------- Weight Classes ----------------
export const CreateWeightClass = z.object({
  eventId: z.string().min(1),
  divisionId: z.string().optional().nullable(),
  gender: GenderEnum,
  name: z.string().min(1).max(50),
  minKg: z.number().optional().nullable(),
  maxKg: z.number().optional().nullable(),
});

export const UpdateWeightClass = CreateWeightClass.omit({ eventId: true }).partial();

// ---------------- Query Schemas ----------------
export const EventIdParam = z.object({
  eventId: z.string().min(1),
});

export const DivisionIdParam = z.object({
  divisionId: z.string().min(1),
});

export const WeightClassIdParam = z.object({
  weightClassId: z.string().min(1),
});

export const EligibleAthletesQuery = z.object({
  clubId: z.string().optional(),
});

// ---------------- Event Templates ----------------
export const ApplyTemplate = z.object({
  template: z.enum(["NKF_FULL_2026", "NKF_INDIVIDUAL_2026", "NKF_TEAM_2026", "WKF_2024"]),
});
