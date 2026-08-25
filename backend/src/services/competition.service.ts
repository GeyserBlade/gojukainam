import { prisma } from "../lib/prisma.js";
import { boutKey, computeDrawState } from "./draw.service.js";
import { daysBetween, startOfUtcDay, toIsoDate } from "../utils/dates.js";

/**
 * Competition reads for machine callers — the question set a person actually
 * asks about a tournament: has it happened, is my athlete in it, did they
 * fight, what did they get, and who took the medals in a category.
 *
 * NOTHING HERE IS STORED. There is no results table and no placement column:
 * a podium is derived from the bracket every time it is asked for, by the same
 * computeDrawState() the draw screen and the public board use. That is the
 * point — a second, stored copy of a placement is a copy that can disagree with
 * the bracket it came from, and the bracket is the thing officials actually
 * correct on the day.
 *
 * TWO SCOPES, DELIBERATELY DIFFERENT (and see the route file, which enforces
 * them):
 *
 *   Entries are CLUB-SCOPED. Who a club has entered, in which weight class,
 *   seeded where, is competitive information before the event runs. An agent
 *   key sees its own club and no other.
 *
 *   Events and results are FEDERATION-WIDE. A medal is announced from the
 *   floor, printed on a certificate and already served to every authenticated
 *   user by /api/reports/results — and to the whole internet by the public
 *   board. Club-scoping a podium would make "who won the girls 10-11 kumite"
 *   unanswerable while the answer is on a wall in the venue.
 */

/** What a competitor is called wherever this file names one. */
type Competitor = {
  entryId: string;
  athleteId: string | null;
  name: string;
  clubId: string;
  clubName: string;
};

const ENTRY_INCLUDE = {
  athlete: { select: { id: true, firstName: true, lastName: true } },
  team: { select: { id: true, name: true } },
  club: { select: { id: true, name: true } },
} as const;

function competitor(entry: {
  id: string;
  athlete: { id: string; firstName: string; lastName: string } | null;
  team: { name: string } | null;
  club: { id: string; name: string } | null;
}): Competitor {
  return {
    entryId: entry.id,
    athleteId: entry.athlete?.id ?? null,
    name: entry.athlete
      ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
      : entry.team?.name ?? "Unknown",
    clubId: entry.club?.id ?? "",
    clubName: entry.club?.name ?? "",
  };
}

/**
 * The name a person uses for a category out loud: "Girls Kumite (age 10-11)",
 * or with the weight class appended for kumite divisions that have them.
 * Matched against free text in `results`, so it is also the search surface.
 */
function categoryLabel(divisionName: string, weightClassName: string | null): string {
  return weightClassName ? `${divisionName} ${weightClassName}` : divisionName;
}

/** Round names, so an answer can say "lost in the semi-final" without counting. */
function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semi-final";
  if (fromEnd === 2) return "Quarter-final";
  return `Round of ${2 ** (fromEnd + 1)}`;
}

export type DrawRow = {
  id: string;
  size: number;
  division: { name: string; category: string; gender: string };
  weightClass: { name: string } | null;
  slots: Array<{ position: number; entryId: string; entry: Parameters<typeof competitor>[0] }>;
  bouts: Array<{
    phase: string;
    round: number;
    position: number;
    akaScore: number | null;
    aoScore: number | null;
    outcome: string | null;
    winnerEntryId: string | null;
  }>;
};

const DRAW_INCLUDE = {
  division: { select: { name: true, category: true, gender: true } },
  weightClass: { select: { name: true } },
  slots: { include: { entry: { include: ENTRY_INCLUDE } } },
  bouts: {
    select: {
      phase: true, round: true, position: true,
      akaScore: true, aoScore: true, outcome: true, winnerEntryId: true,
    },
  },
} as const;

/**
 * Everything derivable from one bracket, computed once and reused by both the
 * podium view and the per-athlete view — so those two can never disagree about
 * who won a category.
 */
export function resolveDraw(draw: DrawRow) {
  const slotByPosition = new Map<number, string>();
  const byEntry = new Map<string, Competitor>();
  for (const s of draw.slots) {
    slotByPosition.set(s.position, s.entryId);
    byEntry.set(s.entryId, competitor(s.entry));
  }

  const storedWinners = new Map<string, string>();
  const storedByKey = new Map<string, DrawRow["bouts"][number]>();
  for (const b of draw.bouts) {
    const key = boutKey(b.phase, b.round, b.position);
    storedByKey.set(key, b);
    if (b.winnerEntryId) storedWinners.set(key, b.winnerEntryId);
  }

  const state = computeDrawState(draw.size, slotByPosition, storedWinners);
  const look = (id: string | null) => (id ? byEntry.get(id) ?? null : null);

  return {
    draw,
    state,
    byEntry,
    storedByKey,
    totalRounds: Math.log2(draw.size),
    label: categoryLabel(draw.division.name, draw.weightClass?.name ?? null),
    podium: {
      first: look(state.placements.firstEntryId),
      second: look(state.placements.secondEntryId),
      thirds: state.placements.thirdEntryIds
        .map(look)
        .filter((c): c is Competitor => c !== null),
    },
  };
}

/**
 * How an athlete's day in one category actually went.
 *
 * `boutsFought` counts only bouts computeDrawState marked isUserResult — both
 * fighters present and a result captured. A bye is an advance, not a fight, and
 * conflating the two would let "did Ben compete?" answer yes for someone who
 * walked through an empty half of the bracket and then never appeared.
 */
export function athleteRunIn(resolved: ReturnType<typeof resolveDraw>, entryId: string) {
  const { state, byEntry, storedByKey, totalRounds } = resolved;

  const bouts = state.bouts
    .filter((b) => b.akaEntryId === entryId || b.aoEntryId === entryId)
    .map((b) => {
      const opponentId = b.akaEntryId === entryId ? b.aoEntryId : b.akaEntryId;
      const stored = storedByKey.get(boutKey(b.phase, b.round, b.position));
      const isAka = b.akaEntryId === entryId;
      return {
        phase: b.phase,
        round: b.phase === "MAIN" ? roundName(b.round, totalRounds) : `Repechage ${b.round}`,
        opponent: opponentId ? byEntry.get(opponentId)?.name ?? null : null,
        opponentClub: opponentId ? byEntry.get(opponentId)?.clubName ?? null : null,
        /** null = not fought yet (or a bye, which `contested:false` marks). */
        result: !b.isUserResult ? null : b.winnerEntryId === entryId ? "WON" : "LOST",
        contested: b.isUserResult,
        scoreFor: stored?.[isAka ? "akaScore" : "aoScore"] ?? null,
        scoreAgainst: stored?.[isAka ? "aoScore" : "akaScore"] ?? null,
        outcome: stored?.outcome ?? null,
      };
    });

  const fought = bouts.filter((b) => b.contested);
  const placement =
    state.placements.firstEntryId === entryId
      ? 1
      : state.placements.secondEntryId === entryId
        ? 2
        : state.placements.thirdEntryIds.includes(entryId)
          ? 3
          : null;

  return {
    /** DRAWN = bracket made, nothing run yet. Never report a placement from a DRAWN category. */
    categoryStatus: state.status,
    fieldSize: resolved.byEntry.size,
    boutsFought: fought.length,
    boutsWon: fought.filter((b) => b.result === "WON").length,
    placement,
    medal: placement === 1 ? "gold" : placement === 2 ? "silver" : placement === 3 ? "bronze" : null,
    bouts,
  };
}

export class CompetitionService {
  /**
   * The federation calendar, with one club's involvement attached.
   *
   * Which club is the caller's choice: a `federation:read` key (or an admin)
   * may ask about any of them, and the answer names the club it counted rather
   * than leaving "ours" to be inferred. Everything else in the row — the
   * event, its dates, how many categories are drawn — is federation-wide and
   * identical whoever asks.
   *
   * `hasTakenPlace` is computed here rather than left to the caller for the
   * same reason ages are: a model handed a date and today's date gets the
   * comparison wrong often enough to matter, and shows no sign of having
   * guessed. Events have no end date in the schema, so a multi-day tournament
   * is judged by its start — stated in the field name, not hidden.
   */
  static async listEvents(params: {
    clubId: string;
    when?: "past" | "upcoming" | "all";
    limit?: number;
    asOf: Date;
  }) {
    const { clubId, when = "all", limit = 25, asOf } = params;
    const today = startOfUtcDay(asOf);

    // Named once for the whole list rather than joined per event: the counts
    // below are all for this one club, and an answer that says "Swakopmund"
    // is checkable in a way that "your club" is not.
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
    });
    if (!club) throw { status: 404, message: "Club not found" };

    const where =
      when === "past"
        ? { startDate: { lt: today } }
        : when === "upcoming"
          ? { startDate: { gte: today } }
          : {};

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: "desc" },
      take: limit,
      select: {
        id: true, name: true, venue: true, city: true, country: true,
        startDate: true, regOpen: true, regClose: true, status: true,
        entries: {
          where: { clubId },
          select: { id: true, status: true, athleteId: true },
        },
        draws: { select: { status: true } },
      },
    });

    return {
      asOf: toIsoDate(today),
      count: events.length,
      events: events.map((e) => {
        const start = startOfUtcDay(e.startDate);
        const athletes = new Set(
          e.entries.map((x) => x.athleteId).filter((x): x is string => x !== null),
        );
        return {
          id: e.id,
          name: e.name,
          venue: e.venue,
          city: e.city,
          country: e.country,
          startDate: toIsoDate(start),
          status: e.status,
          hasTakenPlace: start.getTime() < today.getTime(),
          isToday: start.getTime() === today.getTime(),
          /** Negative = in the past. */
          daysAway: daysBetween(today, start),
          registration: {
            opensOn: toIsoDate(startOfUtcDay(e.regOpen)),
            closesOn: toIsoDate(startOfUtcDay(e.regClose)),
            isOpen: e.regOpen.getTime() <= asOf.getTime() && asOf.getTime() <= e.regClose.getTime(),
          },
          club: {
            id: club.id,
            name: club.name,
            entryCount: e.entries.length,
            athleteCount: athletes.size,
            approvedCount: e.entries.filter((x) => x.status === "APPROVED").length,
          },
          categoriesDrawn: e.draws.length,
          /**
           * Draw.status is persisted from the same computeDrawState this file
           * uses, so it is an honest "has anything actually been run" flag
           * without recomputing every bracket for a list of events.
           */
          resultsCaptured: e.draws.some((d) => d.status !== "DRAWN"),
        };
      }),
    };
  }

  /** One event, plus every category in it and the named club's entry counts. */
  static async getEvent(eventId: string, clubId: string, asOf: Date) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true, name: true, venue: true, city: true, country: true,
        startDate: true, regOpen: true, regClose: true, status: true,
        divisions: {
          select: { id: true, name: true, category: true, gender: true, minAge: true, maxAge: true },
          orderBy: { name: "asc" },
        },
        entries: { where: { clubId }, select: { id: true, status: true, athleteId: true } },
        draws: { select: { status: true } },
      },
    });
    if (!event) throw { status: 404, message: "Event not found" };

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
    });
    if (!club) throw { status: 404, message: "Club not found" };

    const today = startOfUtcDay(asOf);
    const start = startOfUtcDay(event.startDate);
    const athletes = new Set(
      event.entries.map((x) => x.athleteId).filter((x): x is string => x !== null),
    );

    return {
      asOf: toIsoDate(today),
      id: event.id,
      name: event.name,
      venue: event.venue,
      city: event.city,
      country: event.country,
      startDate: toIsoDate(start),
      status: event.status,
      hasTakenPlace: start.getTime() < today.getTime(),
      isToday: start.getTime() === today.getTime(),
      daysAway: daysBetween(today, start),
      registration: {
        opensOn: toIsoDate(startOfUtcDay(event.regOpen)),
        closesOn: toIsoDate(startOfUtcDay(event.regClose)),
        isOpen:
          event.regOpen.getTime() <= asOf.getTime() && asOf.getTime() <= event.regClose.getTime(),
      },
      divisions: event.divisions,
      club: {
        id: club.id,
        name: club.name,
        entryCount: event.entries.length,
        athleteCount: athletes.size,
        approvedCount: event.entries.filter((x) => x.status === "APPROVED").length,
      },
      categoriesDrawn: event.draws.length,
      resultsCaptured: event.draws.some((d) => d.status !== "DRAWN"),
    };
  }

  /**
   * This club's entries. Club-scoped at the query, not filtered afterwards —
   * a `where` that cannot be forgotten beats a `.filter` that can.
   */
  static async listEntries(params: {
    clubId: string;
    eventId?: string;
    athleteId?: string;
    status?: string;
    limit?: number;
  }) {
    const { clubId, eventId, athleteId, status, limit = 100 } = params;

    const entries = await prisma.entry.findMany({
      where: {
        clubId,
        ...(eventId ? { eventId } : {}),
        ...(athleteId ? { athleteId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      take: limit,
      orderBy: [{ event: { startDate: "desc" } }, { createdAt: "asc" }],
      include: {
        ...ENTRY_INCLUDE,
        event: { select: { id: true, name: true, startDate: true } },
        division: { select: { name: true, category: true, gender: true } },
        weightClass: { select: { name: true } },
        drawSlots: { select: { id: true, seed: true } },
      },
    });

    return {
      count: entries.length,
      entries: entries.map((e) => ({
        entryId: e.id,
        eventId: e.event.id,
        eventName: e.event.name,
        eventDate: toIsoDate(startOfUtcDay(e.event.startDate)),
        athleteId: e.athlete?.id ?? null,
        name: e.athlete ? `${e.athlete.firstName} ${e.athlete.lastName}` : e.team?.name ?? "Unknown",
        isTeam: e.athlete === null,
        entryType: e.entryType,
        category: categoryLabel(e.division.name, e.weightClass?.name ?? null),
        divisionCategory: e.division.category,
        gender: e.division.gender,
        /** DRAFT and SUBMITTED are NOT in the event: only APPROVED entries are drawn. */
        status: e.status,
        statusReason: e.statusReason,
        checkedIn: e.checkedIn,
        /** In a bracket. False before the draw is made, whatever the status. */
        drawn: e.drawSlots.length > 0,
        seed: e.seed,
      })),
    };
  }

  /**
   * One athlete's competition history: entered, approved, drawn, fought, placed.
   *
   * Club-scoped through the entry query, so a key for one club cannot read
   * another club's athlete by guessing an id.
   */
  static async athleteRecord(params: {
    clubId: string;
    athleteId: string;
    eventId?: string;
    asOf: Date;
  }) {
    const { clubId, athleteId, eventId, asOf } = params;

    const athlete = await prisma.athlete.findFirst({
      where: { id: athleteId, clubId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!athlete) throw { status: 404, message: "Athlete not found" };

    const entries = await prisma.entry.findMany({
      where: { athleteId, clubId, ...(eventId ? { eventId } : {}) },
      orderBy: { event: { startDate: "desc" } },
      include: {
        event: { select: { id: true, name: true, startDate: true, status: true } },
        division: { select: { id: true, name: true, category: true, gender: true } },
        weightClass: { select: { id: true, name: true } },
      },
    });

    // Every bracket this athlete could appear in, loaded once. A category is
    // identified by (event, division, weightClass) — the same key Draw is
    // unique on — so a missing draw means "not drawn yet", not "no result".
    const draws = entries.length
      ? await prisma.draw.findMany({
          where: {
            OR: entries.map((e) => ({
              eventId: e.eventId,
              divisionId: e.divisionId,
              weightClassId: e.weightClassId,
            })),
          },
          include: DRAW_INCLUDE,
        })
      : [];

    const resolvedByKey = new Map<string, ReturnType<typeof resolveDraw>>();
    for (const d of draws) {
      resolvedByKey.set(
        `${d.eventId}:${d.divisionId}:${d.weightClassId ?? ""}`,
        resolveDraw(d as unknown as DrawRow),
      );
    }

    const today = startOfUtcDay(asOf);

    return {
      asOf: toIsoDate(today),
      athleteId: athlete.id,
      name: `${athlete.firstName} ${athlete.lastName}`,
      count: entries.length,
      entries: entries.map((e) => {
        const start = startOfUtcDay(e.event.startDate);
        const resolved = resolvedByKey.get(
          `${e.eventId}:${e.divisionId}:${e.weightClassId ?? ""}`,
        );
        const run = resolved ? athleteRunIn(resolved, e.id) : null;

        return {
          entryId: e.id,
          eventId: e.event.id,
          eventName: e.event.name,
          eventDate: toIsoDate(start),
          hasTakenPlace: start.getTime() < today.getTime(),
          entryType: e.entryType,
          category: categoryLabel(e.division.name, e.weightClass?.name ?? null),
          divisionCategory: e.division.category,
          entryStatus: e.status,
          checkedIn: e.checkedIn,
          drawn: resolved !== undefined && run !== null && run.fieldSize > 0,
          ...(run
            ? {
                categoryStatus: run.categoryStatus,
                fieldSize: run.fieldSize,
                boutsFought: run.boutsFought,
                boutsWon: run.boutsWon,
                placement: run.placement,
                medal: run.medal,
                bouts: run.bouts,
              }
            : {
                categoryStatus: null,
                fieldSize: null,
                boutsFought: 0,
                boutsWon: 0,
                placement: null,
                medal: null,
                bouts: [],
              }),
        };
      }),
    };
  }

  /**
   * Podiums for an event, optionally narrowed to one category.
   *
   * Federation-wide by design — see the file header. Partially-run categories
   * return whatever is already decided and the rest null, with `categoryStatus`
   * saying which is which, so an unfinished bracket reads as unfinished rather
   * than as "nobody won".
   */
  static async results(params: {
    eventId: string;
    q?: string;
    type?: "KATA" | "KUMITE";
    gender?: "Male" | "Female";
    limit?: number;
  }) {
    const { eventId, q, type, gender, limit = 40 } = params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startDate: true },
    });
    if (!event) throw { status: 404, message: "Event not found" };

    const draws = await prisma.draw.findMany({
      where: {
        eventId,
        ...(type ? { division: { category: type } } : {}),
        ...(gender ? { division: { gender } } : {}),
      },
      orderBy: [{ division: { category: "asc" } }, { division: { name: "asc" } }],
      include: DRAW_INCLUDE,
    });

    const resolved = draws.map((d) => resolveDraw(d as unknown as DrawRow));

    // Free-text narrowing happens on the composed label, because that is the
    // string a person says: "girls kumite 10-11" has to reach a division named
    // "Girls Kumite (age 10-11)" without the asker knowing the exact wording.
    const needle = q?.trim().toLowerCase();
    const matched = needle
      ? resolved.filter((r) => {
          const hay = `${r.label} ${r.draw.division.category} ${r.draw.division.gender}`.toLowerCase();
          return needle.split(/\s+/).every((w) => hay.includes(w));
        })
      : resolved;

    const tally = new Map<
      string,
      { clubId: string; clubName: string; gold: number; silver: number; bronze: number }
    >();
    const count = (c: Competitor | null, kind: "gold" | "silver" | "bronze") => {
      if (!c || !c.clubId) return;
      const row = tally.get(c.clubId) ?? {
        clubId: c.clubId, clubName: c.clubName, gold: 0, silver: 0, bronze: 0,
      };
      row[kind] += 1;
      tally.set(c.clubId, row);
    };

    const categories = matched.slice(0, limit).map((r) => {
      count(r.podium.first, "gold");
      count(r.podium.second, "silver");
      for (const t of r.podium.thirds) count(t, "bronze");
      return {
        drawId: r.draw.id,
        category: r.label,
        divisionCategory: r.draw.division.category,
        gender: r.draw.division.gender,
        /** COMPLETED = every placement decided. Anything else means results are still coming in. */
        categoryStatus: r.state.status,
        fieldSize: r.byEntry.size,
        gold: r.podium.first,
        silver: r.podium.second,
        bronze: r.podium.thirds,
      };
    });

    return {
      eventId: event.id,
      eventName: event.name,
      eventDate: toIsoDate(startOfUtcDay(event.startDate)),
      /** Categories matching the filter, BEFORE `limit`. Read totals from here. */
      count: matched.length,
      returned: categories.length,
      /** Nothing at all has been run yet — say so rather than reporting empty podiums. */
      anyResults: matched.some((r) => r.state.status !== "DRAWN"),
      categories,
      // Tallied over the returned categories only, so it agrees with what is
      // shown rather than describing rows the caller cannot see.
      clubTally: [...tally.values()]
        .map((c) => ({ ...c, total: c.gold + c.silver + c.bronze }))
        .sort(
          (a, b) =>
            b.gold - a.gold ||
            b.silver - a.silver ||
            b.bronze - a.bronze ||
            a.clubName.localeCompare(b.clubName),
        ),
    };
  }
  // -------------------------------------------------------------------------
  // Tournament day: brackets, mats, running order.
  //
  // Event-scoped, never club-scoped — see the note at the top of this file and
  // the gate comment in routes/competition.ts. Every one of these is already
  // on the public board for anyone holding the event link; the value added
  // here is that the numbers are counted server-side, so "how many categories
  // are still to run on Mat 2" is a field rather than an inference from a list
  // the model half-read.
  // -------------------------------------------------------------------------

  /**
   * Every category in an event, drawn or not, and how far each bracket has got.
   *
   * A category with entries but no bracket is included with `hasDraw: false`
   * rather than omitted: "which categories still need drawing" is the question
   * this is asked on the morning of an event, and a list that silently skips
   * them answers it wrong.
   */
  static async listDraws(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startDate: true },
    });
    if (!event) throw { status: 404, message: "Event not found" };

    const [draws, mats, divisions, weightClasses, entryGroups] = await Promise.all([
      prisma.draw.findMany({
        where: { eventId },
        include: { ...DRAW_INCLUDE, mat: { select: { id: true, name: true, order: true } } },
      }),
      prisma.mat.findMany({
        where: { eventId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, order: true },
      }),
      prisma.division.findMany({
        where: { eventId },
        orderBy: [{ category: "asc" }, { gender: "asc" }, { minAge: "asc" }],
        select: { id: true, name: true, category: true, gender: true, minAge: true, maxAge: true },
      }),
      prisma.weightClass.findMany({ where: { eventId }, select: { id: true, name: true } }),
      // APPROVED only: an undrawn category is interesting because people will
      // step on the mat for it, and only an approved entry does.
      prisma.entry.groupBy({
        by: ["divisionId", "weightClassId"],
        where: { eventId, status: "APPROVED" },
        _count: true,
      }),
    ]);

    const wcName = new Map(weightClasses.map((w) => [w.id, w.name]));
    const divisionById = new Map(divisions.map((d) => [d.id, d]));
    const catKey = (divisionId: string, weightClassId: string | null) =>
      `${divisionId}:${weightClassId ?? ""}`;
    const approvedByCat = new Map(
      entryGroups.map((g) => [catKey(g.divisionId, g.weightClassId), g._count]),
    );

    const drawn = draws.map((draw) => {
      const resolved = resolveDraw(draw as unknown as DrawRow);
      const bouts = resolved.state.bouts;
      const contested = bouts.filter((b) => b.isUserResult);
      return {
        drawId: draw.id,
        category: resolved.label,
        divisionId: draw.divisionId,
        divisionCategory: draw.division.category,
        gender: draw.division.gender,
        minAge: divisionById.get(draw.divisionId)?.minAge ?? null,
        maxAge: divisionById.get(draw.divisionId)?.maxAge ?? null,
        weightClass: draw.weightClass?.name ?? null,
        hasDraw: true,
        /** Bracket size (2, 4, 8, 16, 32), NOT the number of competitors. */
        bracketSize: draw.size,
        /** Competitors actually in the bracket. This is the field size. */
        fieldSize: resolved.byEntry.size,
        /** Approved entries right now — differs from fieldSize when entries moved after the draw. */
        approvedEntries: approvedByCat.get(catKey(draw.divisionId, draw.weightClassId)) ?? 0,
        status: resolved.state.status,
        locked: draw.locked,
        boutsFought: contested.length,
        /**
         * Bouts that could be called to the mat right now: both competitors
         * known, no result captured. NOT "bouts remaining" — in a bracket that
         * has not run, everything past round one has unknown fighters, so this
         * is 2 for a field of 6 rather than 5. The distinction matters on the
         * day, which is why the two counts are separate fields.
         */
        boutsReady: bouts.filter((b) => !b.isUserResult && b.akaEntryId && b.aoEntryId).length,
        /**
         * How many contested bouts the main bracket will produce in total:
         * a single-elimination field of N settles in N-1. Excludes repechage,
         * which depends on who loses to whom and cannot be known in advance.
         */
        mainDrawBouts: Math.max(resolved.byEntry.size - 1, 0),
        mat: draw.mat ? { id: draw.mat.id, name: draw.mat.name } : null,
        matOrder: draw.matOrder,
        podium: resolved.podium,
      };
    });

    const drawnKeys = new Set(draws.map((d) => catKey(d.divisionId, d.weightClassId)));
    const undrawn = entryGroups
      .filter((g) => g._count > 0 && !drawnKeys.has(catKey(g.divisionId, g.weightClassId)))
      .flatMap((g) => {
        const division = divisionById.get(g.divisionId);
        if (!division) return [];
        return [{
          drawId: null,
          category: categoryLabel(
            division.name,
            g.weightClassId ? wcName.get(g.weightClassId) ?? null : null,
          ),
          divisionId: division.id,
          divisionCategory: division.category,
          gender: division.gender,
          minAge: division.minAge,
          maxAge: division.maxAge,
          weightClass: g.weightClassId ? wcName.get(g.weightClassId) ?? null : null,
          hasDraw: false as const,
          bracketSize: null,
          fieldSize: null,
          approvedEntries: g._count,
          status: null,
          locked: false,
          boutsFought: null,
          boutsReady: null,
          mainDrawBouts: null,
          mat: null,
          matOrder: null,
          podium: null,
        }];
      });

    const categories = [...drawn, ...undrawn].sort((a, b) =>
      a.category.localeCompare(b.category),
    );

    return {
      event: { id: event.id, name: event.name, startDate: toIsoDate(startOfUtcDay(event.startDate)) },
      mats,
      count: categories.length,
      drawnCount: drawn.length,
      undrawnCount: undrawn.length,
      /** True once at least one bout anywhere in the event has a captured result. */
      anyResults: drawn.some((d) => d.boutsFought > 0),
      categories,
    };
  }

  /**
   * One bracket, round by round.
   *
   * Rounds are NAMED ("Final", "Semi-final") by the same roundName() the
   * athlete record uses, so the two can never disagree about what to call the
   * same bout. `scoreJson` is deliberately not returned: it is a per-action
   * blob for the scoreboard UI, and a model handed it will narrate it wrong.
   */
  static async getDraw(drawId: string) {
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        ...DRAW_INCLUDE,
        mat: { select: { id: true, name: true } },
        event: { select: { id: true, name: true, startDate: true } },
      },
    });
    if (!draw) throw { status: 404, message: "Draw not found" };

    const resolved = resolveDraw(draw as unknown as DrawRow);
    const { byEntry, storedByKey, totalRounds } = resolved;
    const look = (id: string | null) => (id ? byEntry.get(id) ?? null : null);

    const slots = [...draw.slots]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        position: s.position,
        seed: s.seed,
        competitor: byEntry.get(s.entryId) ?? null,
      }));

    const bouts = resolved.state.bouts.map((b) => {
      const stored = storedByKey.get(boutKey(b.phase, b.round, b.position));
      return {
        phase: b.phase,
        round: b.phase === "MAIN" ? roundName(b.round, totalRounds) : `Repechage ${b.round}`,
        roundNumber: b.round,
        position: b.position,
        aka: look(b.akaEntryId),
        ao: look(b.aoEntryId),
        winner: look(b.winnerEntryId),
        /** False = a bye or a bout not yet fought. A bye has no loser to name. */
        contested: b.isUserResult,
        akaScore: stored?.akaScore ?? null,
        aoScore: stored?.aoScore ?? null,
        outcome: stored?.outcome ?? null,
      };
    });

    return {
      drawId: draw.id,
      event: {
        id: draw.event.id,
        name: draw.event.name,
        startDate: toIsoDate(startOfUtcDay(draw.event.startDate)),
      },
      category: resolved.label,
      divisionCategory: draw.division.category,
      gender: draw.division.gender,
      bracketSize: draw.size,
      fieldSize: byEntry.size,
      status: resolved.state.status,
      locked: draw.locked,
      mat: draw.mat ? { id: draw.mat.id, name: draw.mat.name } : null,
      matOrder: draw.matOrder,
      slots,
      bouts,
      podium: resolved.podium,
    };
  }

  /**
   * The running order: what sits on each mat, in what sequence, with the
   * breaks in their real places.
   *
   * Categories and schedule blocks share one `matOrder` index space per mat —
   * that is how "lunch after the U14 pools on Mat 2" is representable at all —
   * so they are merged into a single ordered list here rather than returned as
   * two lists for the caller to interleave. A model asked to do that
   * interleaving gets it wrong, and the mistake looks like a real schedule.
   */
  static async schedule(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startDate: true },
    });
    if (!event) throw { status: 404, message: "Event not found" };

    const [mats, blocks, draws, divisions, weightClasses] = await Promise.all([
      prisma.mat.findMany({
        where: { eventId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, order: true },
      }),
      prisma.scheduleBlock.findMany({
        where: { eventId },
        orderBy: [{ matOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.draw.findMany({
        where: { eventId },
        select: {
          id: true, divisionId: true, weightClassId: true, size: true, status: true,
          matId: true, matOrder: true, _count: { select: { slots: true } },
        },
      }),
      prisma.division.findMany({
        where: { eventId },
        select: { id: true, name: true, category: true, gender: true },
      }),
      prisma.weightClass.findMany({ where: { eventId }, select: { id: true, name: true } }),
    ]);

    const divisionById = new Map(divisions.map((d) => [d.id, d]));
    const wcName = new Map(weightClasses.map((w) => [w.id, w.name]));

    type Item = {
      kind: "category" | "break";
      order: number | null;
      label: string;
      drawId?: string | null;
      status?: string | null;
      fieldSize?: number | null;
      minutes?: number | null;
    };

    const categoryItems = draws.map((d) => {
      const division = divisionById.get(d.divisionId);
      return {
        matId: d.matId,
        item: {
          kind: "category" as const,
          order: d.matOrder,
          label: categoryLabel(
            division?.name ?? "Unknown category",
            d.weightClassId ? wcName.get(d.weightClassId) ?? null : null,
          ),
          drawId: d.id,
          status: d.status,
          fieldSize: d._count.slots,
        } satisfies Item,
      };
    });

    const blockItems = blocks.map((b) => ({
      matId: b.matId,
      startTime: b.startTime,
      item: {
        kind: "break" as const,
        order: b.matOrder,
        label: b.label,
        minutes: b.minutes,
        blockKind: b.kind,
      },
    }));

    // Unplaced items sort after placed ones rather than at order 0, so a
    // category nobody has scheduled yet never appears to be running first.
    const byOrder = (a: { order: number | null }, b: { order: number | null }) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

    return {
      event: { id: event.id, name: event.name, startDate: toIsoDate(startOfUtcDay(event.startDate)) },
      mats: mats.map((m) => ({
        id: m.id,
        name: m.name,
        running: [
          ...categoryItems.filter((c) => c.matId === m.id).map((c) => c.item),
          ...blockItems.filter((b) => b.matId === m.id).map((b) => b.item),
        ].sort(byOrder),
      })),
      /**
       * Categories with no mat yet. Not an error — the organiser assigns mats
       * when the draws are done — but "what is unplaced" is the question the
       * plan screen exists to answer, so it is a field rather than a silence.
       */
      unassigned: categoryItems.filter((c) => c.matId === null).map((c) => c.item),
      /** Blocks that stop the whole venue. `startTime` is a "HH:MM" clock anchor, or null for "before the first bout"/"after the last". */
      venueWide: blockItems
        .filter((b) => b.matId === null)
        .map((b) => ({ ...b.item, startTime: b.startTime })),
    };
  }
}
