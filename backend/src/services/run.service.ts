import { prisma } from "../lib/prisma.js";
import { computeDrawState } from "./draw.service.js";
import { EventService } from "./event.service.js";

// Day-of "run the event" board: per-mat queues of ready bouts, mat planning,
// and check-in. Bracket bouts are compute-derived, so this reads slots +
// stored winners and reuses computeDrawState rather than trusting bout rows.

const boutKey = (phase: string, round: number, position: number) =>
  `${phase}:${round}:${position}`;

export interface RunOrderableBout {
  phase: string;
  round: number;
  position: number;
}

/**
 * Which run-order group a bout belongs to within its own division: main
 * bracket rounds up through the semi-finals (0), then the bronze/repechage
 * bouts (1), then the final (2) — WKF running order, so the final is always
 * a division's last bout and the medal ceremony can follow immediately
 * after it. `size` is the draw's bracket size, needed only to know which
 * MAIN round is the final; REPECHAGE is always group 1 regardless of size.
 */
function boutRunGroup(bout: RunOrderableBout, size: number): number {
  if (bout.phase === "REPECHAGE") return 1;
  return bout.round === Math.log2(size) ? 2 : 0;
}

/**
 * Sorts one division's bouts into WKF running order. The queue below sorts
 * a *merged* multi-division board, so it calls boutRunGroup directly as one
 * of several tie-break keys rather than this — but single-division
 * surfaces (and frontend/src/lib/callup.ts's call-up sheet, which
 * reimplements this exact rule since the two projects share no code) use
 * this directly, so the running order is never hand-rolled twice.
 */
export function sortBoutsForRunning<T extends RunOrderableBout>(bouts: readonly T[], size: number): T[] {
  return [...bouts].sort(
    (a, b) => boutRunGroup(a, size) - boutRunGroup(b, size) || a.round - b.round || a.position - b.position,
  );
}

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
  size: number;
  category: string;
  gender: string;
  isKumite: boolean;
  aka: ReturnType<typeof summarise>;
  ao: ReturnType<typeof summarise>;
  matId: string | null;
  drawMatOrder: number | null;
  queueOrder: number | null;
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
          size: draw.size,
          category,
          gender: draw.division.gender,
          isKumite: draw.division.category === "KUMITE",
          aka: entryById.get(cb.akaEntryId)!,
          ao: entryById.get(cb.aoEntryId)!,
          matId: row?.matId ?? draw.matId ?? null,
          drawMatOrder: draw.matOrder ?? null,
          queueOrder: row?.queueOrder ?? null,
        });
      }
    }

    // Manual per-bout queueOrder wins (nulls last); otherwise the natural
    // category/bracket order stands — WKF running order within a division
    // (boutRunGroup: main up through semis, then bronze, then the final
    // last), divisions kept together by their own place in the mat's
    // running order (drawMatOrder).
    const sortQueue = (a: QueueItem, b: QueueItem) =>
      (a.queueOrder ?? Number.MAX_SAFE_INTEGER) - (b.queueOrder ?? Number.MAX_SAFE_INTEGER) ||
      (a.drawMatOrder ?? Number.MAX_SAFE_INTEGER) - (b.drawMatOrder ?? Number.MAX_SAFE_INTEGER) ||
      boutRunGroup(a, a.size) - boutRunGroup(b, b.size) ||
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

  /**
   * What one tatami operator sees: only the mats they are assigned to, and only
   * the bouts on them.
   *
   * Scoped from their grants outwards rather than from an event inwards — an
   * operator never names an event, so there is no event id to get wrong or to
   * tamper with. An operator with no assignment gets an empty list, not an
   * error: on the morning of a tournament that is a normal state, and it is the
   * screen that tells them to find the coordinator.
   */
  static async getOperatorBoard(userId: string) {
    const assignments = await prisma.matOperator.findMany({
      where: { userId },
      include: {
        mat: {
          include: {
            event: { select: { id: true, name: true, startDate: true, status: true } },
          },
        },
      },
      orderBy: [{ mat: { order: "asc" } }],
    });

    // Only live events. A grant on last month's tournament is not a way in.
    const active = assignments.filter((a) => a.mat.event.status === "ACTIVE");

    const mats = [];
    for (const a of active) {
      const board = await this.getBoard(a.mat.eventId);
      const mat = board.mats.find((m) => m.id === a.matId);
      mats.push({
        matId: a.matId,
        matName: a.mat.name,
        event: a.mat.event,
        queue: mat?.queue ?? [],
      });
    }
    return { mats };
  }

  // ---- Mat operators ----

  static async listMatOperators(eventId: string) {
    const rows = await prisma.matOperator.findMany({
      where: { mat: { eventId } },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        mat: { select: { id: true, name: true } },
      },
      orderBy: [{ mat: { order: "asc" } }, { createdAt: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      matId: r.matId,
      matName: r.mat.name,
      user: r.user,
      createdAt: r.createdAt,
    }));
  }

  static async assignMatOperator(matId: string, userId: string, grantedById: string) {
    const [mat, user] = await Promise.all([
      prisma.mat.findUnique({ where: { id: matId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
    ]);
    if (!mat) throw { status: 404, message: "Mat not found" };
    if (!user) throw { status: 404, message: "User not found" };

    // Anyone can be handed a tatami — a coach helping out for an hour keeps
    // their own role. The grant is what confers the power, exactly as with an
    // event coordinator.
    const existing = await prisma.matOperator.findUnique({
      where: { matId_userId: { matId, userId } },
    });
    if (existing) throw { status: 409, message: "Already assigned to this mat" };

    const row = await prisma.matOperator.create({
      data: { matId, userId, grantedById },
    });
    await prisma.auditLog.create({
      data: {
        userId: grantedById,
        entityType: "MatOperator",
        entityId: row.id,
        action: "ASSIGN",
        diffJson: JSON.stringify({ matId, userId }),
      },
    });
    return row;
  }

  static async removeMatOperator(matId: string, userId: string, actingUserId: string) {
    const row = await prisma.matOperator.findUnique({
      where: { matId_userId: { matId, userId } },
    });
    if (!row) throw { status: 404, message: "Not assigned to this mat" };
    await prisma.matOperator.delete({ where: { id: row.id } });
    await prisma.auditLog.create({
      data: {
        userId: actingUserId,
        entityType: "MatOperator",
        entityId: row.id,
        action: "UNASSIGN",
        diffJson: JSON.stringify({ matId, userId }),
      },
    });
  }

  // ---- Mats ----
  static async listMats(eventId: string) {
    return prisma.mat.findMany({
      where: { eventId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  static async createMat(data: { eventId: string; name: string; order?: number }) {
    // max(order)+1, not count(): after deleting a mat from the middle, count()
    // hands the new mat an order that already exists, and two mats sharing an
    // order makes the up/down swap on the Plan tab a no-op.
    const last = await prisma.mat.findFirst({
      where: { eventId: data.eventId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const mat = await prisma.mat.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        order: data.order ?? (last?.order ?? -1) + 1,
      },
    });
    // Adding a floor on the plan board is the organizer restating how many
    // floors the tournament runs on; the timing config has to follow.
    await EventService.syncMatCount(data.eventId);
    return mat;
  }

  static async updateMat(matId: string, data: { name?: string; order?: number }) {
    const mat = await prisma.mat.findUnique({ where: { id: matId } });
    if (!mat) throw { status: 404, message: "Mat not found" };
    return prisma.mat.update({ where: { id: matId }, data });
  }

  static async deleteMat(matId: string) {
    const mat = await prisma.mat.findUnique({ where: { id: matId } });
    if (!mat) throw { status: 404, message: "Mat not found" };

    // A completed category's floor is a record of where it was actually fought.
    // Deleting the mat would null that out (Draw.matId is SetNull), rewriting
    // history as a side effect of a planning action — so refuse instead.
    const completed = await prisma.draw.count({ where: { matId, status: "COMPLETED" } });
    if (completed > 0)
      throw {
        status: 409,
        message: `${mat.name} has ${completed} completed ${completed === 1 ? "category" : "categories"} on it and cannot be removed`,
      };

    // Remaining draws/bouts referencing this mat fall back to unassigned
    // (SetNull); its breaks are deleted with it (Cascade).
    await prisma.mat.delete({ where: { id: matId } });
    await EventService.syncMatCount(mat.eventId);
  }

  // ---- Assignment ----
  static async assignDrawMat(
    drawId: string,
    data: { matId: string | null; matOrder?: number | null },
    user: { id: string },
  ) {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) throw { status: 404, message: "Draw not found" };
    // Same rule the plan board enforces: a category that has been fought keeps
    // the floor it ran on — but one that never had a floor can still be given
    // one. See plan.service.ts for the full reasoning.
    if (draw.status === "COMPLETED" && draw.matId !== null && draw.matId !== data.matId)
      throw { status: 409, message: "That category has already been completed and cannot be moved" };
    if (data.matId) {
      const mat = await prisma.mat.findUnique({ where: { id: data.matId } });
      if (!mat || mat.eventId !== draw.eventId)
        throw { status: 404, message: "Mat not found for this event" };
    }
    // Position within the mat. An explicit matOrder wins; a draw already on
    // this mat keeps the slot it has; anything newly assigned goes to the end
    // of the queue. Defaulting to 0 (the old behaviour) gave every category on
    // a mat the same order, so nothing was actually ordered.
    let matOrder: number | null = null;
    if (data.matId) {
      if (data.matOrder != null) {
        matOrder = data.matOrder;
      } else if (draw.matId === data.matId && draw.matOrder != null) {
        matOrder = draw.matOrder;
      } else {
        const last = await prisma.draw.findFirst({
          where: { matId: data.matId, id: { not: drawId } },
          orderBy: { matOrder: { sort: "desc", nulls: "last" } },
          select: { matOrder: true },
        });
        matOrder = (last?.matOrder ?? -1) + 1;
      }
    }

    const updated = await prisma.draw.update({
      where: { id: drawId },
      data: { matId: data.matId, matOrder },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "Draw",
        entityId: drawId,
        action: "ASSIGN_MAT",
        diffJson: JSON.stringify({ matId: data.matId, matOrder }),
      },
    });
    return updated;
  }

  /**
   * Persist the running order of the categories on a mat: matOrder = index for
   * each draw in the given order. Draws must belong to the mat's event, and are
   * moved onto the mat if they were not already on it.
   */
  static async reorderMatDraws(matId: string, drawIds: string[], user: { id: string }) {
    const mat = await prisma.mat.findUnique({ where: { id: matId } });
    if (!mat) throw { status: 404, message: "Mat not found" };

    const draws = await prisma.draw.findMany({
      where: { id: { in: drawIds } },
      select: { id: true, eventId: true },
    });
    const byId = new Map(draws.map((d) => [d.id, d]));
    for (const id of drawIds) {
      const draw = byId.get(id);
      if (!draw) throw { status: 404, message: "Draw not found" };
      if (draw.eventId !== mat.eventId)
        throw { status: 400, message: "Draw does not belong to this mat's event" };
    }

    await prisma.$transaction([
      ...drawIds.map((id, index) =>
        prisma.draw.update({ where: { id }, data: { matId, matOrder: index } }),
      ),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Mat",
          entityId: matId,
          action: "REORDER_CATEGORIES",
          diffJson: JSON.stringify({ drawIds }),
        },
      }),
    ]);

    return { updatedCount: drawIds.length };
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

  /**
   * Persist the organizer's manual running order for a mat: queueOrder = index
   * for each bout in the given order. Bouts must belong to the mat's event.
   */
  static async reorderMatQueue(matId: string, boutIds: string[], user: { id: string }) {
    const mat = await prisma.mat.findUnique({ where: { id: matId } });
    if (!mat) throw { status: 404, message: "Mat not found" };

    const bouts = await prisma.bout.findMany({
      where: { id: { in: boutIds } },
      include: { draw: { select: { eventId: true } } },
    });
    const byId = new Map(bouts.map((b) => [b.id, b]));
    for (const id of boutIds) {
      const bout = byId.get(id);
      if (!bout) throw { status: 404, message: "Bout not found" };
      if (bout.draw.eventId !== mat.eventId)
        throw { status: 400, message: "Bout does not belong to this mat's event" };
    }

    await prisma.$transaction([
      ...boutIds.map((id, index) =>
        prisma.bout.update({ where: { id }, data: { queueOrder: index } }),
      ),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Mat",
          entityId: matId,
          action: "REORDER_QUEUE",
          diffJson: JSON.stringify({ boutIds }),
        },
      }),
    ]);

    return { updatedCount: boutIds.length };
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
