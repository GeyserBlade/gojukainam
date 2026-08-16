import { z } from "zod";

export const GenderEnum = z.enum(["Male", "Female"]);
export const EntryTypeEnum = z.enum(["KATA","KUMITE","TEAM_KATA","TEAM_KUMITE"]);
export const EntryStatusEnum = z.enum(["DRAFT","SUBMITTED","APPROVED","RETURNED"]);
export const RoleEnum = z.enum(["SUPERADMIN","ADMIN","CLUB_MANAGER","COACH","ATHLETE","TATAMI_OPERATOR"]);
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
  // Optional — an athlete may be registered before their grade is known.
  // Explicit null clears it; an absent key on update leaves it alone.
  beltId: z.string().min(1).optional().nullable(),
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

// ---------------- Katas ----------------
export const CreateKata = z.object({
  name: z.string().min(1).max(80),
  style: z.string().max(60).optional().nullable(),
  order: z.number().int(),
  active: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const UpdateKata = CreateKata.partial();

export const KataListQuery = z.object({
  /** "1" to include retired katas — the admin screen, not the mat. */
  includeInactive: z.enum(["0", "1"]).optional(),
});

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

/// FLAGS is the kata decision: five judges, one flag each, majority wins. It is
/// kept distinct from HANTEI, which in kumite means the referee panel breaking
/// a tie that the scoreboard could not — reading a kata result back as "hantei"
/// would say the wrong thing about how it was reached.
export const BOUT_OUTCOMES = ["POINTS", "GAP", "SENSHU", "HANTEI", "HANSOKU", "KIKEN", "FLAGS"] as const;

export const SetBoutScore = z.object({
  winnerEntryId: z.string().min(1),
  outcome: z.enum(BOUT_OUTCOMES),
  /// Kumite: points. Kata (FLAGS): the number of flags that side took.
  akaScore: z.number().int().min(0).max(99),
  aoScore: z.number().int().min(0).max(99),
  scoreJson: z.string().max(20000).optional(),
  /// True when at least one scored action was entered after the bout clock
  /// expired (the mat's post-buzzer awarding window). Audit-trail only — the
  /// route never uses this to accept or reject the write.
  postTime: z.boolean().optional(),
  /// Kata performed by each side, as Kata ids. Optional throughout: a kata bout
  /// can be decided before anyone has recorded what was performed, and every
  /// kumite result omits them entirely. Explicit null clears a previously
  /// recorded kata; absent leaves it alone.
  akaKataId: z.string().min(1).nullable().optional(),
  aoKataId: z.string().min(1).nullable().optional(),
});

export const BoutParams = z.object({
  id: z.string().min(1),
  boutId: z.string().min(1),
});

export const SetDrawLock = z.object({
  locked: z.boolean(),
});

// ---- Seeding ----
// Capped at a flat 64 rather than the entry count, which moves as entries are
// approved or returned. Seeds are a relative ordering and get compacted to
// dense ranks at draw time, so the exact ceiling is not load-bearing.
export const SeedValue = z.number().int().min(1).max(64).nullable();

export const CategorySeedsQuery = z.object({
  eventId: z.string().min(1),
  divisionId: z.string().min(1),
  weightClassId: z.string().min(1).optional(),
});

export const SetCategorySeeds = z.object({
  eventId: z.string().min(1),
  divisionId: z.string().min(1),
  weightClassId: z.string().min(1).optional().nullable(),
  // Empty array is valid: it clears every seed in the category.
  seeds: z.array(z.object({ entryId: z.string().min(1), seed: SeedValue })).max(256),
});

export const SetEntrySeed = z.object({
  seed: SeedValue,
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

export const ReorderMatDraws = z.object({
  drawIds: z.array(z.string().min(1)).min(1),
});

export const SetPublicAccess = z.object({
  enabled: z.boolean(),
});

export const AssignMatOperator = z.object({
  userId: z.string().min(1),
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

// ---------------- Event timing ----------------
//
// The tournament's default timing variables, stored on Event.timingJson and
// edited from the event hub's Overview tab. Every field has a default, so
// parsing `{}` yields a complete, usable config — which is exactly what the
// read path does for an event that has never been configured.
//
// The plan board's schedule (frontend `lib/schedule.ts`) reads these to time
// the day. The older Estimator tab does not — it still runs on its own
// session-only inputs, which is a deliberate leftover, not an oversight.

/**
 * How the lunch break interacts with the mats.
 * - ALL_MATS: every mat stops at the same time; the whole venue breaks together.
 * - PER_FLOOR: each floor/mat takes its own break when its running order allows,
 *   so competition never fully stops.
 */
export const LunchModeEnum = z.enum(["ALL_MATS", "PER_FLOOR"]);

/**
 * How a kata bout is run, which decides how many performances it costs the mat.
 * - SEQUENTIAL: AKA performs, then AO, then the flags. Two performances per
 *   bout — the WKF format, and the default here.
 * - TOGETHER: both competitors perform side by side at the same time. One
 *   performance per bout, so the category takes roughly half as long.
 *
 * This is the single biggest lever on how long a kata category runs, which is
 * why it is a stored setting rather than an assumption baked into the maths.
 */
export const KataModeEnum = z.enum(["SEQUENTIAL", "TOGETHER"]);

const timedBlock = (enabled: boolean, minutes: number) =>
  z.object({
    enabled: z.boolean().default(enabled),
    minutes: z.number().min(0).max(600).default(minutes),
  });

/**
 * "HH:MM", 24-hour. Stored as a string rather than a DateTime because it is a
 * time of day on whatever day the event runs, with no timezone of its own —
 * the plan's schedule is read off a wall clock in the venue.
 */
export const ClockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time as HH:MM");

export const EventTimingConfig = z.object({
  /** Mats/floors running in parallel. */
  mats: z.number().int().min(1).max(50).default(2),
  /** When the first block of the day starts — the plan's schedule counts from here. */
  dayStartTime: ClockTime.default("08:00"),
  /** Default kumite bout clock for a category that doesn't override it. */
  defaultBoutDurationSec: z.number().int().min(10).max(1800).default(120),
  /**
   * How long one kata *performance* takes. Separate from the kumite clock
   * because they are unrelated numbers — a kata is ~90s of choreography, a
   * kumite bout is a 2-3 minute fight.
   */
  kataBoutDurationSec: z.number().int().min(10).max(1800).default(90),
  /** Whether a kata bout costs the mat one performance or two — see KataModeEnum. */
  kataMode: KataModeEnum.default("SEQUENTIAL"),
  /** Mat time between bouts — competitor changeover, not the match itself. */
  transitionSecondsPerBout: z.number().int().min(0).max(1800).default(60),
  /** Default injury/stoppage buffer, as a percentage on top of bout time. */
  defaultBufferPct: z.number().min(0).max(100).default(10),
  /** Time a mat loses moving from one category to the next. */
  changeoverMinutes: z.number().min(0).max(240).default(5),
  opening: timedBlock(true, 15).default({ enabled: true, minutes: 15 }),
  closing: timedBlock(true, 15).default({ enabled: true, minutes: 15 }),
  lunch: z
    .object({
      enabled: z.boolean().default(true),
      minutes: z.number().min(0).max(600).default(30),
      mode: LunchModeEnum.default("ALL_MATS"),
    })
    .default({ enabled: true, minutes: 30, mode: "ALL_MATS" }),
  /** Athlete check-in / warm-up block before the first bout. Off by default. */
  checkin: timedBlock(false, 20).default({ enabled: false, minutes: 20 }),
});

export type EventTimingConfigInput = z.input<typeof EventTimingConfig>;
export type EventTimingConfigParsed = z.output<typeof EventTimingConfig>;

// ---------------- Tournament plan ----------------
//
// The plan is the concrete running order: which categories sit on which floor,
// in what sequence, with the ceremonies and breaks placed between them.

export const ScheduleBlockKindEnum = z.enum(["OPENING", "CLOSING", "LUNCH", "BREAK"]);

/**
 * `matId: null` means the block spans every floor; a `startTime` then says when
 * the whole venue stops. A block on a mat is positioned by the running-order
 * endpoint instead, so it takes neither `startTime` nor `matOrder` here.
 */
export const CreateScheduleBlock = z.object({
  eventId: z.string().min(1),
  kind: ScheduleBlockKindEnum,
  label: z.string().min(1).max(80),
  minutes: z.number().int().min(0).max(600),
  matId: z.string().min(1).optional().nullable(),
  startTime: ClockTime.optional().nullable(),
});

export const UpdateScheduleBlock = z.object({
  label: z.string().min(1).max(80).optional(),
  minutes: z.number().int().min(0).max(600).optional(),
  startTime: ClockTime.optional().nullable(),
});

export const PlanItemRef = z.object({
  kind: z.enum(["CATEGORY", "BLOCK"]),
  id: z.string().min(1),
});

/**
 * The whole board in one write. Every lane the drag touched is sent complete,
 * so a cross-floor move is one atomic transaction rather than a remove and an
 * insert that can half-fail and leave a category on two floors' worth of
 * ordering — or on none.
 *
 * `matId: null` is the unassigned pool: categories only, since a break has to
 * belong either to a floor or to the whole venue.
 */
export const SetPlanOrder = z.object({
  eventId: z.string().min(1),
  lanes: z
    .array(
      z.object({
        matId: z.string().min(1).nullable(),
        items: z.array(PlanItemRef),
      }),
    )
    .min(1),
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

  // Per-category timing overrides. null clears the override and returns the
  // category to the inherited value — it never means "zero seconds"/"no gap",
  // so these deliberately have no numeric default here.
  boutDurationSec: z.number().int().min(10).max(1800).optional().nullable(),
  bufferPct: z.number().min(0).max(100).optional().nullable(),
  winByGap: z.number().int().min(1).max(20).optional().nullable(),
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

export const AthletePoolQuery = z.object({
  clubId: z.string().optional(),
});

// ---------------- Event Coordinators ----------------
export const AddCoordinator = z.object({
  userId: z.string().min(1),
});

export const CoordinatorParams = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

export const CoordinatorCandidatesQuery = z.object({
  search: z.string().max(120).optional(),
});

// ---------------- Event Templates ----------------
export const ApplyTemplate = z.object({
  // Keep in step with TEMPLATES in data/wkf-template.ts.
  template: z.enum(["GK_NAM_2026", "GK_SMALL_NO_WEIGHTS", "NKF_FULL_2026", "NKF_INDIVIDUAL_2026", "NKF_TEAM_2026", "WKF_2024"]),
});

// ---------------------------------------------------------------------------
// Club billing (M1b: read endpoints)
// ---------------------------------------------------------------------------

export const FeeTypeEnum = z.enum([
  "MONTHLY", "GRADING", "TOURNAMENT_ENTRY", "CAMP", "REGISTRATION", "OTHER",
]);
export const FeeCadenceEnum = z.enum(["MONTHLY", "ONE_OFF"]);
export const MemberInvoiceStatusEnum = z.enum([
  "DRAFT", "APPROVED", "SENT", "PARTIALLY_PAID", "PAID", "CANCELLED", "WRITTEN_OFF",
]);
export const PaymentMethodEnum = z.enum(["EFT", "CASH", "CARD", "DEBIT_ORDER", "OTHER"]);

/** "2026-08". Rejected early so a malformed key never reaches a query. */
export const periodKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");

/**
 * A boolean that survives a query string.
 *
 * NOT z.coerce.boolean(). That is Boolean(value), and Boolean("false") is true,
 * so every explicit `false` a caller sent arrived as `true`:
 * ?includeInactive=false returned inactive members, and ?unallocatedOnly=false
 * would have narrowed a payment list to exactly the payments it was meant to
 * stop excluding. No error either time — the endpoint answered a different
 * question confidently.
 *
 * Found when the Telegram model started passing the flag explicitly rather
 * than omitting it: "how many members do we have?" answered "61 active
 * members" when 54 are active. The bug predates the model and was simply never
 * reached, which is the argument for fixing it here rather than teaching
 * callers to omit the parameter.
 *
 * Unrecognised values are rejected rather than coerced, so a typo is a 400 and
 * not a silent flip.
 */
const QueryBoolean = z.union([
  z.boolean(),
  z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1"),
]);

/** Every billing read is club-scoped; there is no federation-wide billing view. */
export const BillingClubQuery = z.object({
  clubId: z.string().min(1),
});

export const BillingMembersQuery = z.object({
  clubId: z.string().min(1),
  /** Defaults to active-only: the invoice run bills active members. */
  includeInactive: QueryBoolean.optional(),
  q: z.string().trim().min(1).optional(),
});

export const BillingMemberSearchQuery = z.object({
  clubId: z.string().min(1),
  name: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(25).optional(),
});

export const BirthdaysQuery = z
  .object({
    clubId: z.string().min(1),
    /** Either a day count, or an explicit window — not both. */
    days: z.coerce.number().int().min(0).max(366).optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine((v) => !(v.days !== undefined && (v.from || v.to)), {
    message: "Pass either days, or from/to — not both",
  })
  .refine((v) => !((v.from && !v.to) || (v.to && !v.from)), {
    message: "from and to must be given together",
  });

export const ArrearsQuery = z.object({
  clubId: z.string().min(1),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const BillingInvoicesQuery = z.object({
  clubId: z.string().min(1),
  status: MemberInvoiceStatusEnum.optional(),
  periodKey: periodKeySchema.optional(),
  athleteId: z.string().min(1).optional(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const OpenInvoicesQuery = z.object({
  clubId: z.string().min(1),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const BillingPaymentsQuery = z.object({
  clubId: z.string().min(1),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  unallocatedOnly: QueryBoolean.optional(),
});

export const BillingSummaryQuery = z.object({
  clubId: z.string().min(1),
  periodKey: periodKeySchema.optional(),
});

// --- Billing writes (M3) ---------------------------------------------------

export const CreateInvoiceRun = z.object({
  clubId: z.string().min(1),
  periodKey: periodKeySchema,
  /** true computes and returns without writing — what the approval gate previews. */
  dryRun: z.boolean().optional(),
});

export const SetMemberInvoiceStatus = z.object({
  // PAID / PARTIALLY_PAID are absent on purpose: they are derived from
  // allocations, and the service returns 422 if anyone asks for them anyway.
  status: z.enum(["APPROVED", "SENT", "CANCELLED", "WRITTEN_OFF"]),
  reason: z.string().trim().min(1).max(500).optional(),
});

const allocationSchema = z.object({
  invoiceId: z.string().min(1),
  amountCents: z.number().int().positive(),
});

export const RecordPayment = z.object({
  clubId: z.string().min(1),
  receivedDate: dateSchema,
  amountCents: z.number().int().positive(),
  method: PaymentMethodEnum,
  source: z.enum(["bank-csv", "cash", "manual"]),
  bankReference: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  externalHash: z.string().trim().min(16).max(128).optional(),
  matchMethod: z.string().trim().max(64).optional(),
  matchConfidence: z.number().min(0).max(1).optional(),
  notes: z.string().trim().max(500).optional(),
  allocations: z.array(allocationSchema).max(50).optional(),
});

export const AllocatePayment = z.object({
  clubId: z.string().min(1),
  allocations: z.array(allocationSchema).min(1).max(50),
});

export const CreateFeeSchedule = z.object({
  clubId: z.string().min(1),
  code: z.string().trim().regex(/^[A-Z0-9_]{2,40}$/, "A-Z, 0-9 and underscore"),
  name: z.string().trim().min(1).max(120),
  feeType: FeeTypeEnum,
  cadence: FeeCadenceEnum,
  amountCents: z.number().int().nonnegative(),
  effectiveFrom: dateSchema,
  effectiveTo: dateSchema.optional().nullable(),
  active: z.boolean().optional(),
});

export const UpdateFeeSchedule = CreateFeeSchedule.omit({ clubId: true, code: true }).partial();

export const CreateSubscription = z.object({
  clubId: z.string().min(1),
  athleteId: z.string().min(1),
  feeScheduleId: z.string().min(1),
  startDate: dateSchema,
  endDate: dateSchema.optional().nullable(),
  quantity: z.number().int().min(1).max(20).optional(),
  overrideAmountCents: z.number().int().nonnegative().optional().nullable(),
});

export const ApplyInvoiceDiscount = z.object({
  clubId: z.string().min(1),
  discountCents: z.number().int().nonnegative(),
  reason: z.string().trim().min(1).max(200),
});

export const RosterGapsQuery = z.object({
  clubId: z.string().min(1),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// --- Competition reads (M8) ------------------------------------------------
//
// clubId is required on the entry-shaped queries and absent from the
// result-shaped ones. That asymmetry is the scope rule made structural: a
// caller cannot ask for another club's entries because there is nowhere to put
// the club, and cannot accidentally club-scope a podium for the same reason.

export const CompetitionEventsQuery = z.object({
  clubId: z.string().min(1),
  when: z.enum(["past", "upcoming", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const CompetitionEventQuery = z.object({
  clubId: z.string().min(1),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const CompetitionEntriesQuery = z.object({
  clubId: z.string().min(1),
  eventId: z.string().min(1).optional(),
  athleteId: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "RETURNED"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const CompetitionAthleteRecordQuery = z.object({
  clubId: z.string().min(1),
  athleteId: z.string().min(1),
  eventId: z.string().min(1).optional(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const CompetitionResultsQuery = z.object({
  eventId: z.string().min(1),
  /** Free text matched against the composed category label, all words must hit. */
  q: z.string().trim().min(1).max(80).optional(),
  type: z.enum(["KATA", "KUMITE"]).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  limit: z.coerce.number().int().min(1).max(80).optional(),
});
