import { randomInt } from "crypto";
import { prisma } from "../lib/prisma.js";
import type { BoutPhase } from "@prisma/client";

// Entry statuses that take part in a draw. Only approved entries are drawn —
// submission alone is not enough; an admin must approve first.
const ELIGIBLE_STATUSES = ["APPROVED"] as const;

// Statuses that can carry a seed. Wider than ELIGIBLE_STATUSES because admins
// seed a category while its entries are still in review — the review queue is
// SUBMITTED-only, so waiting for APPROVED would make the control useless.
// RETURNED is excluded: those entries are out of the field for now and keep
// their stored seed untouched.
const SEEDABLE_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED"] as const;

const ENTRY_INCLUDE = {
  athlete: { select: { id: true, firstName: true, lastName: true } },
  team: { select: { id: true, name: true } },
  club: { select: { id: true, name: true } },
} as const;

type BoutKey = string; // `${phase}:${round}:${position}`
export const boutKey = (phase: string, round: number, position: number): BoutKey =>
  `${phase}:${round}:${position}`;

export interface ComputedBout {
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

export type SeedableEntry = { id: string; seed: number | null };

/**
 * Dense ranks 1..N over the seeded members of a set.
 *
 * Entry.seed is a relative ordering, not a literal bracket rank, so gaps left
 * by a withdrawn seeded athlete compact away instead of blocking the draw:
 * seeds 1, 2, 5 become ranks 1, 2, 3. Duplicates are broken by entry id, so a
 * lost race between two admins still yields a valid draw rather than an error.
 */
export function denseSeedRanks(entries: SeedableEntry[]): Map<string, number> {
  const ranks = new Map<string, number>();
  entries
    .filter((e) => e.seed !== null)
    .sort((a, b) => a.seed! - b.seed! || a.id.localeCompare(b.id))
    .forEach((e, i) => ranks.set(e.id, i + 1));
  return ranks;
}

/** Seed tiers covering ranks 1..count: [1,1] [2,2] [3,4] [5,8] [9,16] ... */
function seedTiers(count: number): [number, number][] {
  const tiers: [number, number][] = [
    [1, 1],
    [2, 2],
  ];
  for (let lo = 3; lo <= count; ) {
    const hi = (lo - 1) * 2;
    tiers.push([lo, hi]);
    lo = hi + 1;
  }
  return tiers;
}

/**
 * Order entries for bracketPositions(): result[k] takes bracket position
 * bracketPositions(size)[k], i.e. it plays the bracket's "seed k+1" slot.
 *
 * Seeds 1 and 2 are placed exactly, which puts them in opposite halves so they
 * can only meet in the final. Seeds 3-4, 5-8, 9-16 ... are randomised within
 * their tier, per standard WKF/tennis practice: protected from each other, but
 * not predetermined. Unseeded entries fill whatever indices are left.
 *
 * Byes need no special handling: they are the unused tail indices, which
 * bracketPositions maps to the top seeds' round-1 partners, so the byes land on
 * the top seeds automatically.
 */
export function seededOrder(
  entries: SeedableEntry[]
): { id: string; rank: number | null }[] {
  const n = entries.length;
  const ranks = denseSeedRanks(entries);
  const idByRank = new Map([...ranks].map(([id, r]) => [r, id]));
  const seededCount = ranks.size;

  const order = new Array<{ id: string; rank: number | null } | undefined>(n);
  const used = new Set<number>();

  for (const [lo, hi] of seedTiers(seededCount)) {
    const tierRanks: number[] = [];
    for (let r = lo; r <= Math.min(hi, seededCount); r++) tierRanks.push(r);
    if (tierRanks.length === 0) continue;

    // Candidate k indices for this tier, clamped to the real field size so a
    // 3-entry category holding 3 seeds never reaches for k=3.
    const candidates: number[] = [];
    for (let k = lo - 1; k <= Math.min(hi, n) - 1; k++) candidates.push(k);

    const picked = shuffle(candidates);
    tierRanks.forEach((rank, i) => {
      order[picked[i]] = { id: idByRank.get(rank)!, rank };
      used.add(picked[i]);
    });
  }

  const rest = shuffle(entries.filter((e) => !ranks.has(e.id)));
  let next = 0;
  for (let k = 0; k < n; k++) {
    if (!used.has(k)) order[k] = { id: rest[next++].id, rank: null };
  }

  return order as { id: string; rank: number | null }[];
}

/**
 * True when a draw's snapshotted seeding no longer matches what the current
 * eligible entries would produce. Always compares dense rank to dense rank —
 * never a raw Entry.seed to a DrawSlot.seed, since the former is a relative
 * ordering and the latter is the compacted rank.
 */
function seedsDrifted(
  slots: { entryId: string; seed: number | null }[],
  ranks: Map<string, number>
): boolean {
  return slots.some((s) => s.seed !== (ranks.get(s.entryId) ?? null));
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
      // startedAt goes the same way — it was a status ping for the old
      // matchup, not this one.
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
          postTime: false,
          startedAt: null,
        },
      });
      // Recorded katas are score detail too — a kata attributed to a matchup
      // that no longer exists would still be counted by the "already performed"
      // rules this table exists for.
      await tx.kataPerformance.deleteMany({ where: { boutId: existing.id } });
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

/** Display shape for an entry wherever a draw payload names a competitor. */
function entrySummary(entry: {
  id: string;
  athlete: { firstName: string; lastName: string } | null;
  team: { name: string } | null;
  club: { name: string } | null;
}) {
  return {
    entryId: entry.id,
    name: entry.athlete
      ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
      : entry.team?.name ?? "Unknown",
    clubName: entry.club?.name ?? "",
  };
}

function eligibleEntryWhere(eventId: string, divisionId: string, weightClassId: string | null) {
  return {
    eventId,
    divisionId,
    ...(weightClassId ? { weightClassId } : {}),
    status: { in: [...ELIGIBLE_STATUSES] },
  };
}

function seedableEntryWhere(eventId: string, divisionId: string, weightClassId: string | null) {
  return {
    eventId,
    divisionId,
    ...(weightClassId ? { weightClassId } : {}),
    status: { in: [...SEEDABLE_STATUSES] },
  };
}

async function createDrawRecords(
  tx: Tx,
  params: {
    eventId: string;
    divisionId: string;
    weightClassId: string | null;
    entries: SeedableEntry[];
  }
) {
  const order = seededOrder(params.entries);
  const size = bracketSize(order.length);
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
    data: order.map((item, k) => ({
      drawId: draw.id,
      position: positions[k],
      entryId: item.id,
      seed: item.rank,
    })),
  });
  await recompute(tx, draw.id);
  return draw.id;
}

/** Who is writing a result. The role decides whether the correction policy applies. */
export type ActingUser = { id: string; role?: string };

/**
 * A tatami operator may record a result on their mat, and may correct the one
 * they just recorded — but they may not rewrite history.
 *
 * The rule: an operator can only overwrite a bout that *they* last wrote, and
 * only while nothing downstream of it has been decided. Both halves matter.
 * Without the first, one mat can undo another's work when a category is split
 * across tatami. Without the second, correcting an early round after later
 * rounds are fought silently invalidates everything built on it — and the
 * operator, who sees one bout at a time, has no way to know that.
 *
 * Anything they cannot fix themselves is a coordinator's job, which is a person
 * standing in the same hall, not a support ticket.
 *
 * Admins and coordinators are unaffected: they are the ones who repair brackets.
 */
async function assertOperatorMayWrite(
  bout: {
    id: string;
    drawId: string;
    winnerEntryId: string | null;
    round: number;
    phase: BoutPhase;
  },
  user: ActingUser,
) {
  if (user.role !== "TATAMI_OPERATOR") return;

  // Recording a fresh result is always fine.
  if (!bout.winnerEntryId) return;

  const lastWrite = await prisma.auditLog.findFirst({
    where: { entityType: "Bout", entityId: bout.id, action: { in: ["RESULT", "SCORE"] } },
    orderBy: { createdAt: "desc" },
    select: { userId: true },
  });
  if (lastWrite && lastWrite.userId !== user.id)
    throw {
      status: 409,
      message: "Someone else recorded this result — ask the tournament coordinator to change it",
    };

  // Anything decided in a later round of the same bracket was built on this
  // result. MAIN rounds ascend; a repechage bout is always downstream of the
  // main-bracket round it draws its losers from.
  const downstream = await prisma.bout.count({
    where: {
      drawId: bout.drawId,
      winnerEntryId: { not: null },
      id: { not: bout.id },
      OR: [
        { phase: bout.phase, round: { gt: bout.round } },
        ...(bout.phase === "MAIN" ? [{ phase: "REPECHAGE" as BoutPhase }] : []),
      ],
    },
  });
  if (downstream > 0)
    throw {
      status: 409,
      message:
        "Later bouts in this category have already been fought — ask the tournament coordinator to correct this one",
    };
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
        select: { id: true, divisionId: true, weightClassId: true, seed: true },
      }),
      prisma.draw.findMany({
        where: { eventId },
        include: { slots: { select: { entryId: true, seed: true } }, weightClass: true },
      }),
    ]);
    const weightClasses = await prisma.weightClass.findMany({ where: { eventId } });
    const wcById = new Map(weightClasses.map((w) => [w.id, w]));

    // Group eligible entries per category (division + optional weight class)
    const catKey = (divisionId: string, weightClassId: string | null) =>
      `${divisionId}:${weightClassId ?? ""}`;
    const entriesByCat = new Map<string, SeedableEntry[]>();
    for (const e of entries) {
      const key = catKey(e.divisionId, e.weightClassId);
      if (!entriesByCat.has(key)) entriesByCat.set(key, []);
      entriesByCat.get(key)!.push({ id: e.id, seed: e.seed });
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
        const catEntries = entriesByCat.get(key) ?? [];
        const draw = drawsByCat.get(key);
        let sync = null;
        if (draw) {
          const slotIds = new Set(draw.slots.map((s) => s.entryId));
          const eligibleIds = new Set(catEntries.map((e) => e.id));
          sync = {
            added: catEntries.filter((e) => !slotIds.has(e.id)).length,
            removed: [...slotIds].filter((id) => !eligibleIds.has(id)).length,
            seedsChanged: seedsDrifted(draw.slots, denseSeedRanks(catEntries)),
          };
        }
        rows.push({
          divisionId: division.id,
          divisionName: division.name,
          category: division.category,
          gender: division.gender,
          weightClassId,
          weightClassName: weightClassId ? wcById.get(weightClassId)?.name ?? null : null,
          entryCount: catEntries.length,
          draw: draw
            ? {
                id: draw.id,
                size: draw.size,
                status: draw.status,
                inSync: sync!.added === 0 && sync!.removed === 0 && !sync!.seedsChanged,
                seedsChanged: sync!.seedsChanged,
                locked: draw.locked,
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
      select: { id: true, seed: true },
    });
    if (entries.length < 2)
      throw { status: 422, message: "At least 2 approved entries are needed for a draw" };

    const drawId = await prisma.$transaction(async (tx) => {
      const id = await createDrawRecords(tx, {
        eventId: data.eventId,
        divisionId: data.divisionId,
        weightClassId,
        entries,
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
    if (draw.locked)
      throw { status: 409, message: "Draw is locked — unlock it to regenerate." };

    const hasResults = draw.bouts.some((b) => b.akaEntryId && b.aoEntryId);
    if (hasResults && !force)
      throw {
        status: 409,
        message: "This draw already has results. Regenerating will discard them.",
      };

    const entries = await prisma.entry.findMany({
      where: eligibleEntryWhere(draw.eventId, draw.divisionId, draw.weightClassId),
      select: { id: true, seed: true },
    });
    if (entries.length < 2)
      throw { status: 422, message: "At least 2 approved entries are needed for a draw" };

    const newId = await prisma.$transaction(async (tx) => {
      await tx.draw.delete({ where: { id: drawId } });
      const id = await createDrawRecords(tx, {
        eventId: draw.eventId,
        divisionId: draw.divisionId,
        weightClassId: draw.weightClassId,
        entries,
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
    if (draw.locked)
      throw { status: 409, message: "Draw is locked — unlock it to delete." };
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

  /** Lock (publish) or unlock a draw. Locked draws can't be regenerated/deleted. */
  static async setLock(drawId: string, locked: boolean, user: { id: string }) {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw { status: 404, message: "Draw not found" };
    await prisma.$transaction(async (tx) => {
      await tx.draw.update({ where: { id: drawId }, data: { locked } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Draw",
          entityId: drawId,
          action: locked ? "LOCK" : "UNLOCK",
          diffJson: JSON.stringify({ locked }),
        },
      });
    });
    return DrawService.get(drawId);
  }

  /**
   * The seeding panel's field for one category. Deliberately wider than the
   * draw's own eligibility: admins seed while entries are still being reviewed,
   * so DRAFT and SUBMITTED entries are listed too. RETURNED entries are left
   * out entirely — they keep whatever seed they hold, untouched.
   */
  static async listCategorySeeds(params: {
    eventId: string;
    divisionId: string;
    weightClassId: string | null;
  }) {
    const [entries, draw] = await Promise.all([
      prisma.entry.findMany({
        where: seedableEntryWhere(params.eventId, params.divisionId, params.weightClassId),
        include: ENTRY_INCLUDE,
      }),
      prisma.draw.findFirst({
        where: {
          eventId: params.eventId,
          divisionId: params.divisionId,
          weightClassId: params.weightClassId,
        },
        select: { id: true, locked: true },
      }),
    ]);

    const rows = entries
      .map((e) => ({ ...entrySummary(e), status: e.status, seed: e.seed }))
      .sort((a, b) => {
        if (a.seed !== null && b.seed !== null) return a.seed - b.seed;
        if (a.seed !== null) return -1;
        if (b.seed !== null) return 1;
        return a.name.localeCompare(b.name);
      });

    return { entries: rows, drawId: draw?.id ?? null, drawLocked: draw?.locked ?? false };
  }

  /**
   * Set the whole category's seeding in one write. Authoritative over exactly
   * the seedable entries: anything omitted from the payload is cleared, which
   * is what makes "remove a seed" work from the panel.
   */
  static async setCategorySeeds(
    params: { eventId: string; divisionId: string; weightClassId: string | null },
    seeds: { entryId: string; seed: number | null }[],
    user: { id: string }
  ) {
    const entries = await prisma.entry.findMany({
      where: seedableEntryWhere(params.eventId, params.divisionId, params.weightClassId),
      select: { id: true, seed: true },
    });
    const byId = new Map(entries.map((e) => [e.id, e]));

    const seen = new Set<string>();
    for (const row of seeds) {
      if (!byId.has(row.entryId))
        throw { status: 422, message: "An entry in this seeding does not belong to this category" };
      if (seen.has(row.entryId))
        throw { status: 422, message: "The same entry was given a seed twice" };
      seen.add(row.entryId);
    }
    const values = seeds.map((s) => s.seed).filter((s): s is number => s !== null);
    if (new Set(values).size !== values.length)
      throw { status: 422, message: "Two entries were given the same seed" };

    const wanted = new Map(seeds.map((s) => [s.entryId, s.seed]));
    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        const seed = wanted.get(entry.id) ?? null;
        if (seed === entry.seed) continue;
        await tx.entry.update({ where: { id: entry.id }, data: { seed } });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Entry",
          entityId: `category:${params.divisionId}:${params.weightClassId ?? ""}`,
          action: "SEED_SET_BULK",
          diffJson: JSON.stringify({ eventId: params.eventId, seeds }),
        },
      });
    });

    return DrawService.listCategorySeeds(params);
  }

  /**
   * Set one entry's seed, for the review list where there is no whole-category
   * context. Not blocked by a locked draw: the bracket snapshots its own seeds,
   * so the published draw is unaffected and simply reports as out of sync.
   */
  static async setEntrySeed(entryId: string, seed: number | null, user: { id: string }) {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, eventId: true, divisionId: true, weightClassId: true, seed: true },
    });
    if (!entry) throw { status: 404, message: "Entry not found" };

    if (seed !== null) {
      const clash = await prisma.entry.findFirst({
        where: {
          ...seedableEntryWhere(entry.eventId, entry.divisionId, entry.weightClassId),
          seed,
          NOT: { id: entryId },
        },
        include: ENTRY_INCLUDE,
      });
      if (clash)
        throw {
          status: 409,
          message: `Seed ${seed} is already held by ${entrySummary(clash).name} (${clash.status.toLowerCase()})`,
        };
    }

    await prisma.$transaction(async (tx) => {
      await tx.entry.update({ where: { id: entryId }, data: { seed } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Entry",
          entityId: entryId,
          action: "SEED_SET",
          diffJson: JSON.stringify({ from: entry.seed, to: seed }),
        },
      });
    });

    return { entryId, seed };
  }

  /** Capture (or clear, with null) the winner of a bout, cascading the bracket. */
  static async setBoutWinner(
    drawId: string,
    boutId: string,
    winnerEntryId: string | null,
    user: ActingUser
  ) {
    const bout = await prisma.bout.findUnique({ where: { id: boutId } });
    if (!bout || bout.drawId !== drawId) throw { status: 404, message: "Bout not found" };
    await assertOperatorMayWrite(bout, user);
    if (winnerEntryId) {
      if (!bout.akaEntryId || !bout.aoEntryId)
        throw { status: 409, message: "Both fighters must be known before capturing a result" };
      if (winnerEntryId !== bout.akaEntryId && winnerEntryId !== bout.aoEntryId)
        throw { status: 422, message: "Winner must be one of the bout's fighters" };
    }

    await prisma.$transaction(async (tx) => {
      // Winner-only capture: any previous score detail no longer applies.
      // Clearing a result (winnerEntryId: null) also clears startedAt — the
      // bout goes back to an unknown in-progress state, not a stale "still
      // being scored" one.
      await tx.bout.update({
        where: { id: boutId },
        data: {
          winnerEntryId,
          akaScore: null,
          aoScore: null,
          outcome: null,
          scoreJson: null,
          postTime: false,
          ...(winnerEntryId ? {} : { startedAt: null }),
        },
      });
      // Same reasoning as the score fields above: a winner-only capture says
      // "never mind the detail", and the kata performed is detail.
      await tx.kataPerformance.deleteMany({ where: { boutId } });
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
   * Best-effort "someone is scoring this bout" ping, fired once by the
   * mat-side scoreboard the first time its clock starts. Idempotent (a
   * second call is a no-op) and unaudited — this is a status signal for
   * other viewers of the draw, not a state change worth an audit trail.
   */
  static async startBout(drawId: string, boutId: string) {
    const bout = await prisma.bout.findUnique({
      where: { id: boutId },
      select: { id: true, drawId: true, startedAt: true },
    });
    if (!bout || bout.drawId !== drawId) throw { status: 404, message: "Bout not found" };
    if (!bout.startedAt) {
      await prisma.bout.update({ where: { id: boutId }, data: { startedAt: new Date() } });
    }
    return { ok: true };
  }

  /**
   * Capture a fully scored result — points, outcome and detail, plus the
   * winner — cascading the bracket exactly like setBoutWinner. Used by both
   * mat-side boards: WKF kumite (points, outcome POINTS/GAP/…) and the kata
   * flag panel (outcome FLAGS, scores = flags taken, plus the kata each
   * competitor performed).
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
      postTime?: boolean;
      akaKataId?: string | null;
      aoKataId?: string | null;
    },
    user: ActingUser
  ) {
    const bout = await prisma.bout.findUnique({ where: { id: boutId } });
    if (!bout || bout.drawId !== drawId) throw { status: 404, message: "Bout not found" };
    await assertOperatorMayWrite(bout, user);
    if (!bout.akaEntryId || !bout.aoEntryId)
      throw { status: 409, message: "Both fighters must be known before capturing a result" };
    if (data.winnerEntryId !== bout.akaEntryId && data.winnerEntryId !== bout.aoEntryId)
      throw { status: 422, message: "Winner must be one of the bout's fighters" };

    const postTime = data.postTime ?? false;

    // Which kata each side performed, resolved to (entryId, kataId) pairs.
    // Checked here rather than left to the foreign key so a mistyped id comes
    // back as a 422 the mat can read, not a 500.
    const katas: { entryId: string; kataId: string | null }[] = [];
    if (data.akaKataId !== undefined) katas.push({ entryId: bout.akaEntryId, kataId: data.akaKataId });
    if (data.aoKataId !== undefined) katas.push({ entryId: bout.aoEntryId, kataId: data.aoKataId });
    const kataIds = katas.map((k) => k.kataId).filter((id): id is string => !!id);
    if (kataIds.length > 0) {
      const found = await prisma.kata.count({ where: { id: { in: kataIds } } });
      if (found !== new Set(kataIds).size)
        throw { status: 422, message: "Unknown kata" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.bout.update({
        where: { id: boutId },
        data: {
          winnerEntryId: data.winnerEntryId,
          akaScore: data.akaScore,
          aoScore: data.aoScore,
          outcome: data.outcome,
          scoreJson: data.scoreJson ?? null,
          postTime,
        },
      });
      await recompute(tx, drawId);

      // After the recompute, which is what invalidates stale performances —
      // writing first would mean re-deleting our own rows in the case where
      // the bracket shifts under this bout.
      for (const { entryId, kataId } of katas) {
        if (kataId === null) {
          await tx.kataPerformance.deleteMany({ where: { boutId, entryId } });
        } else {
          await tx.kataPerformance.upsert({
            where: { boutId_entryId: { boutId, entryId } },
            create: { boutId, entryId, kataId },
            update: { kataId },
          });
        }
      }

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
            postTime,
            ...(katas.length > 0
              ? { katas: Object.fromEntries(katas.map((k) => [k.entryId, k.kataId])) }
              : {}),
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
        bouts: {
          orderBy: [{ phase: "asc" }, { round: "asc" }, { position: "asc" }],
          include: { kataPerformances: { include: { kata: { select: { id: true, name: true } } } } },
        },
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

    const summary = entrySummary;

    // Seed shown on the bracket is the snapshot taken when the draw was made,
    // so a later Entry.seed edit never changes a published bracket. Drift is
    // reported separately through `sync` below.
    const entryById = new Map(
      draw.slots.map((s) => [s.entryId, { ...summary(s.entry), seed: s.seed }])
    );

    const ranks = denseSeedRanks(eligible.map((e) => ({ id: e.id, seed: e.seed })));
    const seedsChanged = seedsDrifted(draw.slots, ranks);

    return {
      id: draw.id,
      eventId: draw.eventId,
      division: { id: draw.division.id, name: draw.division.name, category: draw.division.category },
      weightClass: draw.weightClass
        ? { id: draw.weightClass.id, name: draw.weightClass.name }
        : null,
      size: draw.size,
      status: draw.status,
      locked: draw.locked,
      slots: draw.slots.map((s) => ({
        position: s.position,
        seed: s.seed,
        entry: { ...summary(s.entry), seed: s.seed },
      })),
      bouts: state.bouts.map((b) => {
        const stored = draw.bouts.find(
          (row) => row.phase === b.phase && row.round === b.round && row.position === b.position
        );
        // Keyed by entry rather than by side: the performance belongs to the
        // competitor, and which corner they stood in is a property of the bout.
        const kataFor = (entryId: string | null) =>
          entryId
            ? stored?.kataPerformances.find((p) => p.entryId === entryId)?.kata ?? null
            : null;
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
          postTime: stored?.postTime ?? false,
          startedAt: stored?.startedAt?.toISOString() ?? null,
          akaKata: kataFor(b.akaEntryId),
          aoKata: kataFor(b.aoEntryId),
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
          [...slotIds].every((id) => eligibleIds.has(id)) &&
          !seedsChanged,
        seedsChanged,
        added: eligible
          .filter((e) => !slotIds.has(e.id))
          .map((e) => ({ ...summary(e), seed: ranks.get(e.id) ?? null })),
        removed: draw.slots
          .filter((s) => !eligibleIds.has(s.entryId))
          .map((s) => ({ ...summary(s.entry), seed: s.seed })),
        seedChanges: draw.slots
          .filter((s) => s.seed !== (ranks.get(s.entryId) ?? null))
          .map((s) => ({
            ...summary(s.entry),
            from: s.seed,
            to: ranks.get(s.entryId) ?? null,
          })),
      },
    };
  }

  /**
   * Event-wide results: every drawn category's podium plus a club medal tally.
   * Placements come straight from the bracket compute, so partially-run
   * categories return whatever is already decided (rest null).
   */
  static async eventResults(eventId: string) {
    const draws = await prisma.draw.findMany({
      where: { eventId },
      include: {
        division: true,
        weightClass: true,
        slots: { include: { entry: { include: ENTRY_INCLUDE } } },
        bouts: true,
      },
      orderBy: [{ division: { category: "asc" } }, { division: { name: "asc" } }],
    });

    type ResultEntry = { entryId: string; name: string; clubId: string; clubName: string };
    const summary = (entry: {
      id: string;
      athlete: { firstName: string; lastName: string } | null;
      team: { name: string } | null;
      club: { id: string; name: string } | null;
    }): ResultEntry => ({
      entryId: entry.id,
      name: entry.athlete
        ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
        : entry.team?.name ?? "Unknown",
      clubId: entry.club?.id ?? "",
      clubName: entry.club?.name ?? "",
    });

    const tally = new Map<string, { clubId: string; clubName: string; gold: number; silver: number; bronze: number }>();
    const medal = (e: ResultEntry | null, kind: "gold" | "silver" | "bronze") => {
      if (!e || !e.clubId) return;
      const row = tally.get(e.clubId) ?? { clubId: e.clubId, clubName: e.clubName, gold: 0, silver: 0, bronze: 0 };
      row[kind] += 1;
      tally.set(e.clubId, row);
    };

    const categories = draws.map((draw) => {
      const slotByPosition = new Map<number, string>();
      const entryById = new Map<string, ResultEntry>();
      for (const s of draw.slots) {
        slotByPosition.set(s.position, s.entryId);
        entryById.set(s.entryId, summary(s.entry));
      }
      const storedWinners = new Map<BoutKey, string>();
      for (const b of draw.bouts) {
        if (b.winnerEntryId) storedWinners.set(boutKey(b.phase, b.round, b.position), b.winnerEntryId);
      }
      const state = computeDrawState(draw.size, slotByPosition, storedWinners);
      const lookup = (id: string | null) => (id ? entryById.get(id) ?? null : null);

      const first = lookup(state.placements.firstEntryId);
      const second = lookup(state.placements.secondEntryId);
      const thirds = state.placements.thirdEntryIds.map(lookup).filter((e): e is ResultEntry => !!e);

      medal(first, "gold");
      medal(second, "silver");
      for (const t of thirds) medal(t, "bronze");

      return {
        drawId: draw.id,
        divisionName: draw.division.name,
        weightClassName: draw.weightClass?.name ?? null,
        category: draw.division.category,
        gender: draw.division.gender,
        status: state.status,
        first,
        second,
        thirds,
      };
    });

    const clubTally = [...tally.values()]
      .map((c) => ({ ...c, total: c.gold + c.silver + c.bronze }))
      .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.clubName.localeCompare(b.clubName));

    return { categories, clubTally };
  }
}
