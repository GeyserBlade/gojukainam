import { randomInt } from "crypto";
import { prisma } from "../lib/prisma.js";

// Entry statuses that take part in a draw. Only approved entries are drawn —
// submission alone is not enough; an admin must approve first.
const ELIGIBLE_STATUSES = ["APPROVED"] as const;

const ENTRY_INCLUDE = {
  athlete: { select: { id: true, firstName: true, lastName: true } },
  team: { select: { id: true, name: true } },
  club: { select: { id: true, name: true } },
} as const;

type BoutKey = string; // `${phase}:${round}:${position}`
const boutKey = (phase: string, round: number, position: number): BoutKey =>
  `${phase}:${round}:${position}`;

interface ComputedBout {
  phase: "MAIN" | "REPECHAGE";
  round: number;
  position: number;
  akaEntryId: string | null;
  aoEntryId: string | null;
  winnerEntryId: string | null;
  /** true when the winner was captured by a user (both fighters present), not a bye */
  isUserResult: boolean;
}

interface DrawState {
  bouts: ComputedBout[];
  placements: {
    firstEntryId: string | null;
    secondEntryId: string | null;
    thirdEntryIds: string[]; // 0..2 bronze medals (one per bracket half)
  };
  status: "DRAWN" | "IN_PROGRESS" | "COMPLETED";
}

/**
 * Bracket placement order, matching the Excel sheet's seeding map: shuffled
 * entry k goes to a position such that byes spread evenly across the bracket
 * quarters instead of stacking up on one side.
 * Returns a 0-based array: result[k] = 1-based bracket position for entry k.
 */
export function bracketPositions(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const m = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) next.push(s, m - s);
    seeds = next;
  }
  const pos = new Array<number>(size);
  seeds.forEach((seedNum, p) => {
    pos[seedNum - 1] = p + 1;
  });
  return pos;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function bracketSize(n: number): number {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

/**
 * Pure computation of the full bracket state from the slots and the stored
 * results. This is the code equivalent of the Excel formula cascade: winners
 * flow to the next round, byes auto-advance, the repechage pulls in everyone
 * beaten by each finalist, and the results box falls out at the end.
 */
export function computeDrawState(
  size: number,
  slotByPosition: Map<number, string>, // 1-based position -> entryId
  storedWinners: Map<BoutKey, string>
): DrawState {
  const totalRounds = Math.log2(size);
  const bouts: ComputedBout[] = [];

  // Number of real entries in the leaf range under bout (round, index)
  const subtreeCount = (round: number, index: number): number => {
    const span = 2 ** round;
    let count = 0;
    for (let p = index * span + 1; p <= (index + 1) * span; p++) {
      if (slotByPosition.has(p)) count++;
    }
    return count;
  };

  // winners[round][index] = entryId advancing out of that bout (or null)
  const winners: (string | null)[][] = [];
  const mainBouts: ComputedBout[][] = [];

  for (let r = 1; r <= totalRounds; r++) {
    winners[r] = [];
    mainBouts[r] = [];
    const boutsInRound = size / 2 ** r;
    for (let i = 0; i < boutsInRound; i++) {
      const aka =
        r === 1 ? slotByPosition.get(2 * i + 1) ?? null : winners[r - 1][2 * i];
      const ao =
        r === 1
          ? slotByPosition.get(2 * i + 2) ?? null
          : winners[r - 1][2 * i + 1];
      const akaSideCount = subtreeCount(r - 1, 2 * i);
      const aoSideCount = subtreeCount(r - 1, 2 * i + 1);
      const stored = storedWinners.get(boutKey("MAIN", r, i)) ?? null;

      let winner: string | null = null;
      let isUserResult = false;
      if (aka && ao) {
        // Both fighters known: only a captured result decides it
        if (stored && (stored === aka || stored === ao)) {
          winner = stored;
          isUserResult = true;
        }
      } else if (aka && !ao && aoSideCount === 0) {
        winner = aka; // bye: nobody can ever arrive on the other side
      } else if (ao && !aka && akaSideCount === 0) {
        winner = ao;
      }

      winners[r][i] = winner;
      const bout: ComputedBout = {
        phase: "MAIN",
        round: r,
        position: i,
        akaEntryId: aka,
        aoEntryId: ao,
        winnerEntryId: winner,
        isUserResult,
      };
      mainBouts[r][i] = bout;
      bouts.push(bout);
    }
  }

  const final = mainBouts[totalRounds][0];
  const finalists: (string | null)[] = [final.akaEntryId, final.aoEntryId];
  const firstEntryId = final.isUserResult ? final.winnerEntryId : null;
  const secondEntryId =
    firstEntryId !== null
      ? finalists.find((f) => f && f !== firstEntryId) ?? null
      : null;

  // Position of each entry, to trace a finalist's path back down the bracket
  const positionByEntry = new Map<string, number>();
  for (const [pos, entryId] of slotByPosition) positionByEntry.set(entryId, pos);

  const thirdEntryIds: string[] = [];
  let repechageResolved = true;

  for (let side = 0; side < 2; side++) {
    const finalist = finalists[side];
    if (!finalist) {
      // Half of the bracket that produced no finalist yet (or never will,
      // when it holds no entries at all)
      if (subtreeCount(totalRounds - 1, side) > 0) repechageResolved = false;
      continue;
    }

    // Everyone the finalist actually fought (and beat) on the way, in order
    const slotPos = positionByEntry.get(finalist)!;
    const opponents: string[] = [];
    for (let r = 1; r < totalRounds; r++) {
      const idx = Math.floor((slotPos - 1) / 2 ** r);
      const bout = mainBouts[r][idx];
      if (bout.akaEntryId && bout.aoEntryId) {
        opponents.push(
          bout.akaEntryId === finalist ? bout.aoEntryId! : bout.akaEntryId!
        );
      }
    }

    if (opponents.length === 0) {
      // Finalist had byes all the way: no bronze on this side
      continue;
    }
    if (opponents.length === 1) {
      // Only one beaten opponent: bronze without a repechage bout
      thirdEntryIds.push(opponents[0]);
      continue;
    }

    // Repechage chain: L1 vs L2, winner vs L3, ... last winner takes bronze
    let previousWinner: string | null = null;
    for (let stage = 1; stage < opponents.length; stage++) {
      const aka: string | null = stage === 1 ? opponents[0] : previousWinner;
      const ao: string | null = opponents[stage];
      const stored = storedWinners.get(boutKey("REPECHAGE", stage, side)) ?? null;
      let winner: string | null = null;
      let isUserResult = false;
      if (aka && ao && stored && (stored === aka || stored === ao)) {
        winner = stored;
        isUserResult = true;
      }
      bouts.push({
        phase: "REPECHAGE",
        round: stage,
        position: side,
        akaEntryId: aka,
        aoEntryId: ao,
        winnerEntryId: winner,
        isUserResult,
      });
      previousWinner = winner;
    }
    if (previousWinner) thirdEntryIds.push(previousWinner);
    else repechageResolved = false;
  }

  const hasUserResults = bouts.some((b) => b.isUserResult);
  const status =
    firstEntryId && repechageResolved
      ? "COMPLETED"
      : hasUserResults
      ? "IN_PROGRESS"
      : "DRAWN";

  return {
    bouts,
    placements: { firstEntryId, secondEntryId, thirdEntryIds },
    status,
  };
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function loadState(tx: Tx, drawId: string) {
  const draw = await tx.draw.findUnique({
    where: { id: drawId },
    include: { slots: true, bouts: true },
  });
  if (!draw) throw { status: 404, message: "Draw not found" };

  const slotByPosition = new Map<number, string>();
  for (const s of draw.slots) slotByPosition.set(s.position, s.entryId);

  const storedWinners = new Map<BoutKey, string>();
  for (const b of draw.bouts) {
    if (b.winnerEntryId)
      storedWinners.set(boutKey(b.phase, b.round, b.position), b.winnerEntryId);
  }
  return { draw, slotByPosition, storedWinners };
}

/**
 * Recompute the whole bracket from slots + captured results and persist any
 * bout rows that changed (created, updated or no longer applicable).
 */
async function recompute(tx: Tx, drawId: string) {
  const { draw, slotByPosition, storedWinners } = await loadState(tx, drawId);
  const state = computeDrawState(draw.size, slotByPosition, storedWinners);

  const existingByKey = new Map(
    draw.bouts.map((b) => [boutKey(b.phase, b.round, b.position), b])
  );
  const desiredKeys = new Set<string>();

  for (const bout of state.bouts) {
    const key = boutKey(bout.phase, bout.round, bout.position);
    desiredKeys.add(key);
    const existing = existingByKey.get(key);
    if (!existing) {
      await tx.bout.create({
        data: {
          drawId,
          phase: bout.phase,
          round: bout.round,
          position: bout.position,
          akaEntryId: bout.akaEntryId,
          aoEntryId: bout.aoEntryId,
          winnerEntryId: bout.winnerEntryId,
        },
      });
    } else if (
      existing.akaEntryId !== bout.akaEntryId ||
      existing.aoEntryId !== bout.aoEntryId ||
      existing.winnerEntryId !== bout.winnerEntryId
    ) {
      // Fighters or winner changed: any captured score detail no longer
      // describes this bout, so it is invalidated along with the result.
      await tx.bout.update({
        where: { id: existing.id },
        data: {
          akaEntryId: bout.akaEntryId,
          aoEntryId: bout.aoEntryId,
          winnerEntryId: bout.winnerEntryId,
          akaScore: null,
          aoScore: null,
          outcome: null,
          scoreJson: null,
        },
      });
    }
  }

  // Drop bouts that no longer apply (e.g. repechage after a corrected result)
  for (const [key, existing] of existingByKey) {
    if (!desiredKeys.has(key)) await tx.bout.delete({ where: { id: existing.id } });
  }

  if (draw.status !== state.status) {
    await tx.draw.update({ where: { id: drawId }, data: { status: state.status } });
  }

  return state;
}

function eligibleEntryWhere(eventId: string, divisionId: string, weightClassId: string | null) {
  return {
    eventId,
    divisionId,
    ...(weightClassId ? { weightClassId } : {}),
    status: { in: [...ELIGIBLE_STATUSES] },
  };
}

async function createDrawRecords(
  tx: Tx,
  params: { eventId: string; divisionId: string; weightClassId: string | null; entryIds: string[] }
) {
  const shuffled = shuffle(params.entryIds);
  const size = bracketSize(shuffled.length);
  const positions = bracketPositions(size);

  const draw = await tx.draw.create({
    data: {
      eventId: params.eventId,
      divisionId: params.divisionId,
      weightClassId: params.weightClassId,
      size,
    },
  });
  await tx.drawSlot.createMany({
    data: shuffled.map((entryId, k) => ({
      drawId: draw.id,
      position: positions[k],
      entryId,
    })),
  });
  await recompute(tx, draw.id);
  return draw.id;
}

export class DrawService {
  /**
   * Overview of every drawable category in an event: divisions (split by
   * weight class where used) with entry counts, plus the state of any
   * existing draw including whether it is out of sync with the entries.
   */
  static async list(eventId: string) {
    const [divisions, entries, draws] = await Promise.all([
      prisma.division.findMany({
        where: { eventId },
        orderBy: [{ category: "asc" }, { gender: "asc" }, { minAge: "asc" }],
      }),
      prisma.entry.findMany({
        where: { eventId, status: { in: [...ELIGIBLE_STATUSES] } },
        select: { id: true, divisionId: true, weightClassId: true },
      }),
      prisma.draw.findMany({
        where: { eventId },
        include: { slots: { select: { entryId: true } }, weightClass: true },
      }),
    ]);
    const weightClasses = await prisma.weightClass.findMany({ where: { eventId } });
    const wcById = new Map(weightClasses.map((w) => [w.id, w]));

    // Group eligible entries per category (division + optional weight class)
    const catKey = (divisionId: string, weightClassId: string | null) =>
      `${divisionId}:${weightClassId ?? ""}`;
    const entriesByCat = new Map<string, string[]>();
    for (const e of entries) {
      const key = catKey(e.divisionId, e.weightClassId);
      if (!entriesByCat.has(key)) entriesByCat.set(key, []);
      entriesByCat.get(key)!.push(e.id);
    }
    const drawsByCat = new Map(
      draws.map((d) => [catKey(d.divisionId, d.weightClassId), d])
    );

    const rows: any[] = [];
    for (const division of divisions) {
      // Categories = entry groups within the division, plus any stale draws,
      // plus a bare row so empty divisions still show up
      const keys = new Set<string>();
      for (const key of entriesByCat.keys())
        if (key.startsWith(`${division.id}:`)) keys.add(key);
      for (const key of drawsByCat.keys())
        if (key.startsWith(`${division.id}:`)) keys.add(key);
      if (keys.size === 0) keys.add(catKey(division.id, null));

      for (const key of keys) {
        const weightClassId = key.split(":")[1] || null;
        const entryIds = entriesByCat.get(key) ?? [];
        const draw = drawsByCat.get(key);
        let sync = null;
        if (draw) {
          const slotIds = new Set(draw.slots.map((s) => s.entryId));
          const eligibleIds = new Set(entryIds);
          sync = {
            added: entryIds.filter((id) => !slotIds.has(id)).length,
            removed: [...slotIds].filter((id) => !eligibleIds.has(id)).length,
          };
        }
        rows.push({
          divisionId: division.id,
          divisionName: division.name,
          category: division.category,
          gender: division.gender,
          weightClassId,
          weightClassName: weightClassId ? wcById.get(weightClassId)?.name ?? null : null,
          entryCount: entryIds.length,
          draw: draw
            ? {
                id: draw.id,
                size: draw.size,
                status: draw.status,
                inSync: sync!.added === 0 && sync!.removed === 0,
                matId: draw.matId,
                matOrder: draw.matOrder,
              }
            : null,
        });
      }
    }
    return rows;
  }

  static async create(
    data: { eventId: string; divisionId: string; weightClassId?: string | null },
    user: { id: string }
  ) {
    const weightClassId = data.weightClassId ?? null;
    const division = await prisma.division.findUnique({ where: { id: data.divisionId } });
    if (!division || division.eventId !== data.eventId)
      throw { status: 404, message: "Division not found for this event" };
    if (weightClassId) {
      const wc = await prisma.weightClass.findUnique({ where: { id: weightClassId } });
      if (!wc || wc.eventId !== data.eventId)
        throw { status: 404, message: "Weight class not found for this event" };
    }

    const existing = await prisma.draw.findFirst({
      where: { eventId: data.eventId, divisionId: data.divisionId, weightClassId },
    });
    if (existing)
      throw { status: 409, message: "A draw already exists for this category — regenerate it instead" };

    const entries = await prisma.entry.findMany({
      where: eligibleEntryWhere(data.eventId, data.divisionId, weightClassId),
      select: { id: true },
    });
    if (entries.length < 2)
      throw { status: 422, message: "At least 2 submitted or approved entries are needed for a draw" };

    const drawId = await prisma.$transaction(async (tx) => {
      const id = await createDrawRecords(tx, {
        eventId: data.eventId,
        divisionId: data.divisionId,
        weightClassId,
        entryIds: entries.map((e) => e.id),
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Draw",
          entityId: id,
          action: "GENERATE",
          diffJson: JSON.stringify({
            divisionId: data.divisionId,
            weightClassId,
            entryCount: entries.length,
          }),
        },
      });
      return id;
    });
    return DrawService.get(drawId);
  }

  /** Redraw a category with the current entries. Requires force once results exist. */
  static async regenerate(drawId: string, force: boolean, user: { id: string }) {
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: { bouts: { where: { NOT: { winnerEntryId: null } } } },
    });
    if (!draw) throw { status: 404, message: "Draw not found" };

    const hasResults = draw.bouts.some((b) => b.akaEntryId && b.aoEntryId);
    if (hasResults && !force)
      throw {
        status: 409,
        message: "This draw already has results. Regenerating will discard them.",
      };

    const entries = await prisma.entry.findMany({
      where: eligibleEntryWhere(draw.eventId, draw.divisionId, draw.weightClassId),
      select: { id: true },
    });
    if (entries.length < 2)
      throw { status: 422, message: "At least 2 submitted or approved entries are needed for a draw" };

    const newId = await prisma.$transaction(async (tx) => {
      await tx.draw.delete({ where: { id: drawId } });
      const id = await createDrawRecords(tx, {
        eventId: draw.eventId,
        divisionId: draw.divisionId,
        weightClassId: draw.weightClassId,
        entryIds: entries.map((e) => e.id),
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Draw",
          entityId: id,
          action: "REGENERATE",
          diffJson: JSON.stringify({
            previousDrawId: drawId,
            discardedResults: hasResults,
            entryCount: entries.length,
          }),
        },
      });
      return id;
    });
    return DrawService.get(newId);
  }

  static async delete(drawId: string, user: { id: string }) {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw { status: 404, message: "Draw not found" };
    await prisma.$transaction(async (tx) => {
      await tx.draw.delete({ where: { id: drawId } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Draw",
          entityId: drawId,
          action: "DELETE",
          diffJson: JSON.stringify({ divisionId: draw.divisionId }),
        },
      });
    });
  }

  /** Capture (or clear, with null) the winner of a bout, cascading the bracket. */
  static async setBoutWinner(
    drawId: string,
    boutId: string,
    winnerEntryId: string | null,
    user: { id: string }
  ) {
    const bout = await prisma.bout.findUnique({ where: { id: boutId } });
    if (!bout || bout.drawId !== drawId) throw { status: 404, message: "Bout not found" };
    if (winnerEntryId) {
      if (!bout.akaEntryId || !bout.aoEntryId)
        throw { status: 409, message: "Both fighters must be known before capturing a result" };
      if (winnerEntryId !== bout.akaEntryId && winnerEntryId !== bout.aoEntryId)
        throw { status: 422, message: "Winner must be one of the bout's fighters" };
    }

    await prisma.$transaction(async (tx) => {
      // Winner-only capture: any previous score detail no longer applies
      await tx.bout.update({
        where: { id: boutId },
        data: { winnerEntryId, akaScore: null, aoScore: null, outcome: null, scoreJson: null },
      });
      await recompute(tx, drawId);
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Bout",
          entityId: boutId,
          action: winnerEntryId ? "RESULT" : "RESULT_CLEARED",
          diffJson: JSON.stringify({ drawId, winnerEntryId }),
        },
      });
    });
    return DrawService.get(drawId);
  }

  /**
   * Capture a fully scored WKF kumite result: points, outcome and detail,
   * plus the winner, cascading the bracket exactly like setBoutWinner.
   */
  static async setBoutScore(
    drawId: string,
    boutId: string,
    data: {
      winnerEntryId: string;
      outcome: string;
      akaScore: number;
      aoScore: number;
      scoreJson?: string;
    },
    user: { id: string }
  ) {
    const bout = await prisma.bout.findUnique({ where: { id: boutId } });
    if (!bout || bout.drawId !== drawId) throw { status: 404, message: "Bout not found" };
    if (!bout.akaEntryId || !bout.aoEntryId)
      throw { status: 409, message: "Both fighters must be known before capturing a result" };
    if (data.winnerEntryId !== bout.akaEntryId && data.winnerEntryId !== bout.aoEntryId)
      throw { status: 422, message: "Winner must be one of the bout's fighters" };

    await prisma.$transaction(async (tx) => {
      await tx.bout.update({
        where: { id: boutId },
        data: {
          winnerEntryId: data.winnerEntryId,
          akaScore: data.akaScore,
          aoScore: data.aoScore,
          outcome: data.outcome,
          scoreJson: data.scoreJson ?? null,
        },
      });
      await recompute(tx, drawId);
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Bout",
          entityId: boutId,
          action: "SCORE",
          diffJson: JSON.stringify({
            drawId,
            winnerEntryId: data.winnerEntryId,
            outcome: data.outcome,
            akaScore: data.akaScore,
            aoScore: data.aoScore,
          }),
        },
      });
    });
    return DrawService.get(drawId);
  }

  /** Full bracket payload for display. */
  static async get(drawId: string) {
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        division: true,
        weightClass: true,
        slots: { include: { entry: { include: ENTRY_INCLUDE } }, orderBy: { position: "asc" } },
        bouts: { orderBy: [{ phase: "asc" }, { round: "asc" }, { position: "asc" }] },
      },
    });
    if (!draw) throw { status: 404, message: "Draw not found" };

    const slotByPosition = new Map<number, string>();
    for (const s of draw.slots) slotByPosition.set(s.position, s.entryId);
    const storedWinners = new Map<BoutKey, string>();
    for (const b of draw.bouts) {
      if (b.winnerEntryId)
        storedWinners.set(boutKey(b.phase, b.round, b.position), b.winnerEntryId);
    }
    const state = computeDrawState(draw.size, slotByPosition, storedWinners);

    // Out-of-sync info against current entries
    const eligible = await prisma.entry.findMany({
      where: eligibleEntryWhere(draw.eventId, draw.divisionId, draw.weightClassId),
      include: ENTRY_INCLUDE,
    });
    const slotIds = new Set(draw.slots.map((s) => s.entryId));
    const eligibleIds = new Set(eligible.map((e) => e.id));

    const summary = (entry: {
      id: string;
      athlete: { firstName: string; lastName: string } | null;
      team: { name: string } | null;
      club: { name: string } | null;
    }) => ({
      entryId: entry.id,
      name: entry.athlete
        ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
        : entry.team?.name ?? "Unknown",
      clubName: entry.club?.name ?? "",
    });

    const entryById = new Map(draw.slots.map((s) => [s.entryId, summary(s.entry)]));

    return {
      id: draw.id,
      eventId: draw.eventId,
      division: { id: draw.division.id, name: draw.division.name, category: draw.division.category },
      weightClass: draw.weightClass
        ? { id: draw.weightClass.id, name: draw.weightClass.name }
        : null,
      size: draw.size,
      status: draw.status,
      slots: draw.slots.map((s) => ({ position: s.position, entry: summary(s.entry) })),
      bouts: state.bouts.map((b) => {
        const stored = draw.bouts.find(
          (row) => row.phase === b.phase && row.round === b.round && row.position === b.position
        );
        return {
          id: stored?.id ?? null,
          phase: b.phase,
          round: b.round,
          position: b.position,
          aka: b.akaEntryId ? entryById.get(b.akaEntryId) ?? null : null,
          ao: b.aoEntryId ? entryById.get(b.aoEntryId) ?? null : null,
          winnerEntryId: b.winnerEntryId,
          isUserResult: b.isUserResult,
          akaScore: stored?.akaScore ?? null,
          aoScore: stored?.aoScore ?? null,
          outcome: stored?.outcome ?? null,
          scoreJson: stored?.scoreJson ?? null,
        };
      }),
      placements: {
        first: state.placements.firstEntryId
          ? entryById.get(state.placements.firstEntryId) ?? null
          : null,
        second: state.placements.secondEntryId
          ? entryById.get(state.placements.secondEntryId) ?? null
          : null,
        thirds: state.placements.thirdEntryIds.map((id) => entryById.get(id)).filter(Boolean),
      },
      sync: {
        inSync:
          slotIds.size === eligibleIds.size &&
          [...slotIds].every((id) => eligibleIds.has(id)),
        added: eligible.filter((e) => !slotIds.has(e.id)).map(summary),
        removed: draw.slots
          .filter((s) => !eligibleIds.has(s.entryId))
          .map((s) => summary(s.entry)),
      },
    };
  }
}
