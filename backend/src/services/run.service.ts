import { prisma } from "../lib/prisma.js";
import { computeDrawState } from "./draw.service.js";

// Day-of "run the event" board: per-mat queues of ready bouts, mat planning,
// and check-in. Bracket bouts are compute-derived, so this reads slots +
// stored winners and reuses computeDrawState rather than trusting bout rows.

const boutKey = (phase: string, round: number, position: number) =>
  `${phase}:${round}:${position}`;

const PHASE_ORDER: Record<string, number> = { MAIN: 0, REPECHAGE: 1 };

const SLOT_ENTRY_INCLUDE = {
  entry: {
    select: {
      id: true,
      checkedIn: true,
      athlete: { select: { firstName: true, lastName: true } },
      team: { select: { name: true } },
      club: { select: { name: true } },
    },
  },
} as const;

type SlotEntry = {
  id: string;
  checkedIn: boolean;
  athlete: { firstName: string; lastName: string } | null;
  team: { name: string } | null;
  club: { name: string } | null;
};

const summarise = (e: SlotEntry) => ({
  entryId: e.id,
  name: e.athlete ? `${e.athlete.firstName} ${e.athlete.lastName}` : e.team?.name ?? "Unknown",
  clubName: e.club?.name ?? "",
  checkedIn: e.checkedIn,
});

interface QueueItem {
  drawId: string;
  boutId: string | null;
  phase: string;
  round: number;
  position: number;
  category: string;
  gender: string;
  isKumite: boolean;
  aka: ReturnType<typeof summarise>;
  ao: ReturnType<typeof summarise>;
  matId: string | null;
  drawMatOrder: number | null;
}

export class RunService {
  /** Per-mat running order of ready bouts across all draws in an event. */
  static async getBoard(eventId: string) {
    const [mats, draws] = await Promise.all([
      prisma.mat.findMany({ where: { eventId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
      prisma.draw.findMany({
        where: { eventId },
        include: {
          division: true,
          weightClass: true,
          slots: { include: SLOT_ENTRY_INCLUDE },
          bouts: true,
        },
      }),
    ]);

    const items: QueueItem[] = [];
    for (const draw of draws) {
      const slotByPosition = new Map<number, string>();
      const entryById = new Map<string, ReturnType<typeof summarise>>();
      for (const s of draw.slots) {
        slotByPosition.set(s.position, s.entryId);
        entryById.set(s.entryId, summarise(s.entry as SlotEntry));
      }
      const storedWinners = new Map<string, string>();
      const boutRowByKey = new Map<string, (typeof draw.bouts)[number]>();
      for (const b of draw.bouts) {
        boutRowByKey.set(boutKey(b.phase, b.round, b.position), b);
        if (b.winnerEntryId) storedWinners.set(boutKey(b.phase, b.round, b.position), b.winnerEntryId);
      }

      const state = computeDrawState(draw.size, slotByPosition, storedWinners);
      const category = draw.weightClass
        ? `${draw.division.name} · ${draw.weightClass.name}`
        : draw.division.name;

      for (const cb of state.bouts) {
        // Ready = both fighters known and no result yet.
        if (!cb.akaEntryId || !cb.aoEntryId || cb.winnerEntryId) continue;
        const row = boutRowByKey.get(boutKey(cb.phase, cb.round, cb.position));
        items.push({
          drawId: draw.id,
          boutId: row?.id ?? null,
          phase: cb.phase,
          round: cb.round,
          position: cb.position,
          category,
          gender: draw.division.gender,
          isKumite: draw.division.category === "KUMITE",
          aka: entryById.get(cb.akaEntryId)!,
          ao: entryById.get(cb.aoEntryId)!,
          matId: row?.matId ?? draw.matId ?? null,
          drawMatOrder: draw.matOrder ?? null,
        });
      }
    }

    const sortQueue = (a: QueueItem, b: QueueItem) =>
      (a.drawMatOrder ?? Number.MAX_SAFE_INTEGER) - (b.drawMatOrder ?? Number.MAX_SAFE_INTEGER) ||
      (PHASE_ORDER[a.phase] ?? 0) - (PHASE_ORDER[b.phase] ?? 0) ||
      a.round - b.round ||
      a.position - b.position ||
      a.category.localeCompare(b.category);

    const byMat = (matId: string | null) =>
      items.filter((i) => i.matId === matId).sort(sortQueue);

    return {
      mats: mats.map((m) => ({ id: m.id, name: m.name, order: m.order, queue: byMat(m.id) })),
      unassigned: byMat(null),
    };
  }

  // ---- Mats ----
  static async listMats(eventId: string) {
    return prisma.mat.findMany({
      where: { eventId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  static async createMat(data: { eventId: string; name: string; order?: number }) {
    const count = await prisma.mat.count({ where: { eventId: data.eventId } });
    return prisma.mat.create({
      data: { eventId: data.eventId, name: data.name, order: data.order ?? count },
    });
  }

  static async updateMat(matId: string, data: { name?: string; order?: number }) {
    const mat = await prisma.mat.findUnique({ where: { id: matId } });
    if (!mat) throw { status: 404, message: "Mat not found" };
    return prisma.mat.update({ where: { id: matId }, data });
  }

  static async deleteMat(matId: string) {
    const mat = await prisma.mat.findUnique({ where: { id: matId } });
    if (!mat) throw { status: 404, message: "Mat not found" };
    // Draws/bouts referencing this mat fall back to unassigned (SetNull).
    await prisma.mat.delete({ where: { id: matId } });
  }

  // ---- Assignment ----
  static async assignDrawMat(
    drawId: string,
    data: { matId: string | null; matOrder?: number | null },
    user: { id: string },
  ) {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw { status: 404, message: "Draw not found" };
    if (data.matId) {
      const mat = await prisma.mat.findUnique({ where: { id: data.matId } });
      if (!mat || mat.eventId !== draw.eventId)
        throw { status: 404, message: "Mat not found for this event" };
    }
    const updated = await prisma.draw.update({
      where: { id: drawId },
      data: { matId: data.matId, matOrder: data.matId ? data.matOrder ?? 0 : null },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "Draw",
        entityId: drawId,
        action: "ASSIGN_MAT",
        diffJson: JSON.stringify({ matId: data.matId, matOrder: data.matOrder }),
      },
    });
    return updated;
  }

  static async setBoutMat(boutId: string, matId: string | null, user: { id: string }) {
    const bout = await prisma.bout.findUnique({ where: { id: boutId }, include: { draw: true } });
    if (!bout) throw { status: 404, message: "Bout not found" };
    if (matId) {
      const mat = await prisma.mat.findUnique({ where: { id: matId } });
      if (!mat || mat.eventId !== bout.draw.eventId)
        throw { status: 404, message: "Mat not found for this event" };
    }
    const updated = await prisma.bout.update({ where: { id: boutId }, data: { matId } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "Bout",
        entityId: boutId,
        action: "MOVE_MAT",
        diffJson: JSON.stringify({ matId }),
      },
    });
    return updated;
  }

  // ---- Check-in ----
  static async setCheckIn(entryId: string, checkedIn: boolean, user: { id: string }) {
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    if (!entry) throw { status: 404, message: "Entry not found" };
    const updated = await prisma.entry.update({ where: { id: entryId }, data: { checkedIn } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "Entry",
        entityId: entryId,
        action: checkedIn ? "CHECKIN" : "CHECKIN_CLEARED",
        diffJson: JSON.stringify({ checkedIn }),
      },
    });
    return updated;
  }
}
