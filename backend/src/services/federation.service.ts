import { prisma } from "../lib/prisma.js";
import { nameScore } from "./billing-member.service.js";
import {
  ageInYears, ageMonthsRemainder, daysBetween, nextBirthday, startOfUtcDay, toIsoDate,
} from "../utils/dates.js";

/**
 * Federation-wide reads — the half of the agent surface that is about the
 * association rather than one club's money or one tournament.
 *
 * WHY A SEPARATE ROUTE FAMILY rather than opening /api/athletes and /api/clubs
 * to service keys: those routers exist for the frontend, carry writes, and
 * their handlers were written against `req.user`. Opening them would mean
 * auditing every handler in them for club leakage and keeping that audit true
 * forever. This file instead does what /api/billing and /api/competition
 * already did — a purpose-built read surface with computed fields, no writes,
 * and one gate — so widening the agent's reach never means widening a CRUD
 * router's.
 *
 * WHAT IS DELIBERATELY NOT HERE: medical notes and identity numbers. They are
 * not in the billing member payload either (see billing-member.service.ts) and
 * for the same reason — a minor's medical details are not something an
 * assistant needs in order to answer a question about the federation, and the
 * conversation is not redacted the way the audit log is.
 *
 * WHAT DOES NOT EXIST YET, so that nothing here pretends otherwise: there is
 * no grading history table. `Athlete` carries a current belt and a
 * `lastGraded` date and nothing else, so "when did she get her brown belt" is
 * answerable only for the grade she holds now. `gradedAt` below says exactly
 * that, and the tool description upstream repeats it.
 */

function fullName(a: { firstName: string; lastName: string }): string {
  return `${a.firstName} ${a.lastName}`;
}

/** Identity + belt, the shape every athlete answer here is built from. */
const ATHLETE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  dob: true,
  gender: true,
  nationality: true,
  isActive: true,
  isInstructor: true,
  weightKg: true,
  joinDate: true,
  lastGraded: true,
  invoiceRef: true,
  club: { select: { id: true, name: true, region: true } },
  belt: { select: { id: true, name: true, colour: true, order: true } },
} as const;

type AthleteRow = {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date;
  gender: string;
  nationality: string;
  isActive: boolean;
  isInstructor: boolean;
  weightKg: number | null;
  joinDate: Date | null;
  lastGraded: Date | null;
  invoiceRef: string | null;
  club: { id: string; name: string; region: string | null } | null;
  belt: { id: string; name: string | null; colour: string | null; order: number } | null;
};

function shapeAthlete(a: AthleteRow, asOf: Date) {
  const nb = nextBirthday(a.dob, asOf);
  return {
    athleteId: a.id,
    name: fullName(a),
    club: a.club,
    belt: a.belt,
    /**
     * Years at the current grade, computed here for the same reason ages are:
     * it is a date subtraction, and the answer is used to decide whether
     * someone is due for grading.
     */
    gradedAt: a.lastGraded ? toIsoDate(startOfUtcDay(a.lastGraded)) : null,
    yearsAtGrade: a.lastGraded ? ageInYears(startOfUtcDay(a.lastGraded), asOf) : null,
    daysAtGrade: a.lastGraded ? daysBetween(startOfUtcDay(a.lastGraded), asOf) : null,
    dob: toIsoDate(a.dob),
    ageYears: ageInYears(a.dob, asOf),
    ageMonths: ageMonthsRemainder(a.dob, asOf),
    nextBirthday: toIsoDate(nb.date),
    turningAge: nb.turningAge,
    daysToBirthday: nb.daysAway,
    gender: a.gender,
    nationality: a.nationality,
    isActive: a.isActive,
    isInstructor: a.isInstructor,
    weightKg: a.weightKg,
    joinDate: a.joinDate ? toIsoDate(startOfUtcDay(a.joinDate)) : null,
    memberRef: a.invoiceRef,
  };
}

export class FederationService {
  // -------------------------------------------------------------------------
  // Clubs
  // -------------------------------------------------------------------------

  /**
   * The club directory, and the call that turns "Swakopmund" into a clubId.
   *
   * Everything else in the agent's world takes a clubId, and a model asked to
   * remember one across turns will eventually type a plausible cuid that
   * belongs to nobody. So this is the resolution step, and it returns names in
   * a form worth matching against.
   */
  static async listClubs(opts: { q?: string } = {}) {
    const q = opts.q?.trim();
    const clubs = await prisma.club.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { region: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, region: true, contactName: true, email: true, phone: true,
        billingConfig: { select: { enabled: true } },
        _count: { select: { athletes: true, users: true, entries: true } },
      },
    });

    // One grouped query rather than a per-club count: active/inactive is the
    // split every roster question turns on, and N clubs must not mean N+1
    // queries here.
    const activeByClub = new Map(
      (
        await prisma.athlete.groupBy({
          by: ["clubId"],
          where: { isActive: true },
          _count: true,
        })
      ).map((g) => [g.clubId, g._count]),
    );
    const instructorsByClub = new Map(
      (
        await prisma.athlete.groupBy({
          by: ["clubId"],
          where: { isActive: true, isInstructor: true },
          _count: true,
        })
      ).map((g) => [g.clubId, g._count]),
    );

    return {
      count: clubs.length,
      clubs: clubs.map((c) => ({
        clubId: c.id,
        name: c.name,
        region: c.region,
        contactName: c.contactName,
        email: c.email,
        phone: c.phone,
        activeMembers: activeByClub.get(c.id) ?? 0,
        totalMembers: c._count.athletes,
        instructors: instructorsByClub.get(c.id) ?? 0,
        registeredUsers: c._count.users,
        competitionEntries: c._count.entries,
        /**
         * Whether the billing tools will answer for this club at all. False
         * means every money endpoint 404s for them by design (see
         * billing-guard.ts) — it is not an outage and not a permission
         * problem, and an answer that says "no invoices" instead of "not on
         * billing" would be a lie.
         */
        billingEnabled: c.billingConfig?.enabled ?? false,
      })),
    };
  }

  static async getClub(clubId: string, asOf: Date) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true, name: true, region: true, contactName: true, email: true, phone: true, notes: true,
        billingConfig: { select: { enabled: true } },
        _count: { select: { athletes: true, users: true, teams: true, entries: true } },
      },
    });
    if (!club) throw { status: 404, message: "Club not found" };

    const athletes = await prisma.athlete.findMany({
      where: { clubId },
      select: { isActive: true, isInstructor: true, dob: true, gender: true, belt: { select: { name: true, order: true } } },
    });
    const active = athletes.filter((a) => a.isActive);

    const beltCounts = new Map<string, { belt: string; order: number; count: number }>();
    for (const a of active) {
      const key = a.belt?.name ?? "(no belt recorded)";
      const row = beltCounts.get(key) ?? { belt: key, order: a.belt?.order ?? 9999, count: 0 };
      row.count += 1;
      beltCounts.set(key, row);
    }

    return {
      clubId: club.id,
      name: club.name,
      region: club.region,
      contactName: club.contactName,
      email: club.email,
      phone: club.phone,
      notes: club.notes,
      billingEnabled: club.billingConfig?.enabled ?? false,
      members: {
        active: active.length,
        inactive: athletes.length - active.length,
        total: athletes.length,
        instructors: active.filter((a) => a.isInstructor).length,
        juniors: active.filter((a) => ageInYears(a.dob, asOf) < 18).length,
        adults: active.filter((a) => ageInYears(a.dob, asOf) >= 18).length,
        male: active.filter((a) => a.gender === "Male").length,
        female: active.filter((a) => a.gender === "Female").length,
      },
      /** Active members only, deepest grade first. */
      belts: [...beltCounts.values()].sort((a, b) => b.order - a.order),
      registeredUsers: club._count.users,
      teams: club._count.teams,
      competitionEntries: club._count.entries,
    };
  }

  // -------------------------------------------------------------------------
  // Athletes
  // -------------------------------------------------------------------------

  /**
   * Every member of the federation, filterable.
   *
   * Deliberately paged by an explicit `limit` with the pre-limit total
   * returned as `count`: the failure mode of a truncated list is a model
   * counting the rows it was handed and reporting that as the answer, so the
   * true total travels next to the rows every time.
   */
  static async listAthletes(
    params: {
      q?: string;
      clubId?: string;
      beltId?: string;
      gender?: "Male" | "Female";
      includeInactive?: boolean;
      instructorsOnly?: boolean;
      minAge?: number;
      maxAge?: number;
      limit?: number;
    },
    asOf: Date,
  ) {
    const limit = params.limit ?? 50;
    const tokens = params.q?.trim().split(/\s+/).filter(Boolean) ?? [];

    const rows = await prisma.athlete.findMany({
      where: {
        ...(params.clubId ? { clubId: params.clubId } : {}),
        ...(params.beltId ? { beltId: params.beltId } : {}),
        ...(params.gender ? { gender: params.gender } : {}),
        ...(params.includeInactive ? {} : { isActive: true }),
        ...(params.instructorsOnly ? { isInstructor: true } : {}),
        ...(tokens.length > 0
          ? {
              OR: tokens.flatMap((t) => [
                { firstName: { contains: t, mode: "insensitive" as const } },
                { lastName: { contains: t, mode: "insensitive" as const } },
              ]),
            }
          : {}),
      },
      select: ATHLETE_SELECT,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // Age filtering is post-query on purpose: an age band is a function of dob
    // AND today, and expressing it as a date range in SQL puts the same
    // off-by-one-day arithmetic this codebase centralises in dates.ts back
    // into a `where` clause where nobody would find it.
    const shaped = rows
      .map((r) => shapeAthlete(r as AthleteRow, asOf))
      .filter((a) => (params.minAge === undefined ? true : a.ageYears >= params.minAge))
      .filter((a) => (params.maxAge === undefined ? true : a.ageYears <= params.maxAge));

    const ranked = tokens.length > 0
      ? shaped
          .map((a) => ({ ...a, score: Number(nameScore(a.name, params.q!).toFixed(3)) }))
          .filter((a) => a.score > 0)
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      : shaped;

    return {
      asOf: toIsoDate(startOfUtcDay(asOf)),
      /** Matches BEFORE `limit`. Read totals from here, never by counting rows. */
      count: ranked.length,
      returned: Math.min(ranked.length, limit),
      truncated: ranked.length > limit,
      athletes: ranked.slice(0, limit),
    };
  }

  /**
   * One member in full, wherever they train.
   *
   * The competition half is counts only — no medals, and deliberately no
   * `medals: null` placeholder either, because a null field is read as "none"
   * by anything summarising it. Placements are derived from the bracket by
   * /api/competition/athlete-record, and a second thinner copy here would be a
   * copy that can disagree with it.
   */
  static async getAthlete(athleteId: string, asOf: Date) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        ...ATHLETE_SELECT,
        contactEmail: true,
        contactPhone: true,
        guardianName1: true,
        guardianPhone1: true,
        guardianName2: true,
        guardianPhone2: true,
      },
    });
    if (!athlete) throw { status: 404, message: "Athlete not found" };

    const entries = await prisma.entry.findMany({
      where: { athleteId },
      select: {
        status: true,
        event: { select: { id: true, name: true, startDate: true } },
      },
      orderBy: { event: { startDate: "desc" } },
    });

    const today = startOfUtcDay(asOf);
    const events = new Map<string, { id: string; name: string; startDate: Date }>();
    for (const e of entries) events.set(e.event.id, e.event);
    const past = [...events.values()].filter((e) => startOfUtcDay(e.startDate) < today);

    return {
      ...shapeAthlete(athlete as AthleteRow, asOf),
      contactEmail: athlete.contactEmail,
      contactPhone: athlete.contactPhone,
      guardianName1: athlete.guardianName1,
      guardianPhone1: athlete.guardianPhone1,
      guardianName2: athlete.guardianName2,
      guardianPhone2: athlete.guardianPhone2,
      competition: {
        eventsEntered: events.size,
        eventsCompeted: past.length,
        entryCount: entries.length,
        approvedEntries: entries.filter((e) => e.status === "APPROVED").length,
        mostRecentEvent: [...events.values()][0]
          ? {
              id: [...events.values()][0]!.id,
              name: [...events.values()][0]!.name,
              startDate: toIsoDate(startOfUtcDay([...events.values()][0]!.startDate)),
            }
          : null,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Reference data
  // -------------------------------------------------------------------------

  /** The belt ramp, with how many active members hold each grade. */
  static async listBelts() {
    const [belts, counts] = await Promise.all([
      prisma.belt.findMany({
        orderBy: { order: "asc" },
        select: { id: true, name: true, colour: true, order: true, gradingRequirements: true },
      }),
      prisma.athlete.groupBy({ by: ["beltId"], where: { isActive: true }, _count: true }),
    ]);
    const byBelt = new Map(counts.map((c) => [c.beltId, c._count]));
    const ungraded = counts.find((c) => c.beltId === null)?._count ?? 0;

    return {
      count: belts.length,
      /** Ordered white to black — `order` ascending is junior to senior. */
      belts: belts.map((b) => ({ ...b, activeMembers: byBelt.get(b.id) ?? 0 })),
      /** Active members with no belt recorded. Not "no grade held" — see the Athlete model. */
      noBeltRecorded: ungraded,
    };
  }

  /**
   * How big the federation is, in one call.
   *
   * Exists so that "how many members are there in total" does not become a
   * dozen per-club calls that the model then adds up — the addition is the
   * part it gets wrong, and a wrong total looks exactly like a right one.
   */
  static async summary(asOf: Date) {
    const today = startOfUtcDay(asOf);
    const [clubCount, athletes, upcoming, lastEvent] = await Promise.all([
      prisma.club.count(),
      prisma.athlete.findMany({
        where: { isActive: true },
        select: { dob: true, gender: true, isInstructor: true, clubId: true },
      }),
      prisma.event.findMany({
        where: { startDate: { gte: today } },
        orderBy: { startDate: "asc" },
        take: 5,
        select: { id: true, name: true, startDate: true, city: true, status: true },
      }),
      prisma.event.findFirst({
        where: { startDate: { lt: today } },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, startDate: true },
      }),
    ]);

    return {
      asOf: toIsoDate(today),
      clubs: clubCount,
      activeMembers: athletes.length,
      instructors: athletes.filter((a) => a.isInstructor).length,
      juniors: athletes.filter((a) => ageInYears(a.dob, asOf) < 18).length,
      adults: athletes.filter((a) => ageInYears(a.dob, asOf) >= 18).length,
      male: athletes.filter((a) => a.gender === "Male").length,
      female: athletes.filter((a) => a.gender === "Female").length,
      clubsWithMembers: new Set(athletes.map((a) => a.clubId)).size,
      upcomingEvents: upcoming.map((e) => ({
        id: e.id,
        name: e.name,
        city: e.city,
        status: e.status,
        startDate: toIsoDate(startOfUtcDay(e.startDate)),
        daysAway: daysBetween(today, startOfUtcDay(e.startDate)),
      })),
      mostRecentPastEvent: lastEvent
        ? {
            id: lastEvent.id,
            name: lastEvent.name,
            startDate: toIsoDate(startOfUtcDay(lastEvent.startDate)),
            daysAgo: -daysBetween(today, startOfUtcDay(lastEvent.startDate)),
          }
        : null,
    };
  }
}
