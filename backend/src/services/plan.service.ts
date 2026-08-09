import { prisma } from "../lib/prisma.js";
import { EventService } from "./event.service.js";
import {
  CreateScheduleBlock,
  SetPlanOrder,
  UpdateScheduleBlock,
} from "../utils/validators.js";
import type { z } from "zod";

/**
 * Tournament planning: which categories run on which floor, in what order, and
 * where the ceremonies and breaks sit between them.
 *
 * This is the *plan*, not the run. `run.service.ts` owns the day-of board —
 * per-bout queues, check-in, moving a single bout — and reads the same
 * `Draw.matId` / `Draw.matOrder` columns this writes. Mat CRUD stays there so
 * both surfaces agree; everything else about the plan lives here.
 *
 * The one rule the whole module is built around: **a category that has already
 * been fought is not re-plannable.** A COMPLETED draw's floor and position are
 * a record of what happened, so every write path here refuses to move one.
 */

type OrderInput = z.infer<typeof SetPlanOrder>;

/** Categories in this state are history, not plan — see the module comment. */
const isCompleted = (status: string) => status === "COMPLETED";

export class PlanService {
  /**
   * Everything the plan board needs in one round trip: the floors, every
   * category that has a draw (with the numbers the schedule estimate is built
   * from), the placed blocks, and the event's timing defaults.
   *
   * Categories without a draw are included too, flagged `hasDraw: false`. They
   * cannot be placed on a floor — there is nothing to run yet — but the planner
   * needs to see that they are missing rather than wonder why the category list
   * is short.
   */
  static async getBoard(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startDate: true, timingJson: true },
    });
    if (!event) throw { status: 404, message: "Event not found" };

    const [mats, blocks, divisions, draws, entryGroups, weightClasses] = await Promise.all([
      prisma.mat.findMany({
        where: { eventId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.scheduleBlock.findMany({
        where: { eventId },
        orderBy: [{ matOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.division.findMany({
        where: { eventId },
        orderBy: [{ category: "asc" }, { gender: "asc" }, { minAge: "asc" }],
      }),
      prisma.draw.findMany({
        where: { eventId },
        select: {
          id: true,
          divisionId: true,
          weightClassId: true,
          size: true,
          status: true,
          locked: true,
          matId: true,
          matOrder: true,
          _count: { select: { slots: true } },
        },
      }),
      // APPROVED only: the plan is about who will actually step on the mat.
      prisma.entry.groupBy({
        by: ["divisionId", "weightClassId"],
        where: { eventId, status: "APPROVED" },
        _count: true,
      }),
      prisma.weightClass.findMany({ where: { eventId }, select: { id: true, name: true } }),
    ]);

    const wcName = new Map(weightClasses.map((w) => [w.id, w.name]));
    const divisionById = new Map(divisions.map((d) => [d.id, d]));
    const catKey = (divisionId: string, weightClassId: string | null) =>
      `${divisionId}:${weightClassId ?? ""}`;
    const entryCountByCat = new Map(
      entryGroups.map((g) => [catKey(g.divisionId, g.weightClassId), g._count]),
    );

    // One row per category that has a draw, plus a bare row for every category
    // that has approved entries but no draw yet.
    const drawnKeys = new Set(draws.map((d) => catKey(d.divisionId, d.weightClassId)));
    const categories = [
      ...draws.map((draw) => {
        const division = divisionById.get(draw.divisionId)!;
        return {
          key: catKey(draw.divisionId, draw.weightClassId),
          divisionId: draw.divisionId,
          divisionName: division.name,
          category: division.category,
          gender: division.gender,
          minAge: division.minAge,
          maxAge: division.maxAge,
          // Per-category timing overrides; null means "inherit the event default".
          boutDurationSec: division.boutDurationSec,
          bufferPct: division.bufferPct,
          weightClassId: draw.weightClassId,
          weightClassName: draw.weightClassId ? wcName.get(draw.weightClassId) ?? null : null,
          entryCount: entryCountByCat.get(catKey(draw.divisionId, draw.weightClassId)) ?? 0,
          hasDraw: true,
          drawId: draw.id,
          drawSize: draw.size,
          // The entry count the bracket was actually built with. Drifts from
          // entryCount when entries changed after the draw was generated, and
          // that drift is exactly why the schedule prefers this.
          drawEntryCount: draw._count.slots,
          status: draw.status,
          locked: draw.locked,
          matId: draw.matId,
          matOrder: draw.matOrder,
        };
      }),
      ...entryGroups
        .filter((g) => !drawnKeys.has(catKey(g.divisionId, g.weightClassId)) && g._count > 0)
        .flatMap((g) => {
          const division = divisionById.get(g.divisionId);
          if (!division) return [];
          return [
            {
              key: catKey(g.divisionId, g.weightClassId),
              divisionId: g.divisionId,
              divisionName: division.name,
              category: division.category,
              gender: division.gender,
              minAge: division.minAge,
              maxAge: division.maxAge,
              boutDurationSec: division.boutDurationSec,
              bufferPct: division.bufferPct,
              weightClassId: g.weightClassId,
              weightClassName: g.weightClassId ? wcName.get(g.weightClassId) ?? null : null,
              entryCount: g._count,
              hasDraw: false as const,
              drawId: null,
              drawSize: null,
              drawEntryCount: null,
              status: null,
              locked: false,
              matId: null,
              matOrder: null,
            },
          ];
        }),
    ];

    return {
      event: { id: event.id, name: event.name, startDate: event.startDate },
      timing: EventService.parseTiming(event.timingJson),
      mats: mats.map((m) => ({ id: m.id, name: m.name, order: m.order })),
      blocks: blocks.map((b) => ({
        id: b.id,
        kind: b.kind,
        label: b.label,
        minutes: b.minutes,
        matId: b.matId,
        matOrder: b.matOrder,
        startTime: b.startTime,
      })),
      categories,
    };
  }

  // ---- Schedule blocks ----

  static async createBlock(input: unknown, user: { id: string }) {
    const data = CreateScheduleBlock.parse(input);

    if (data.matId) {
      const mat = await prisma.mat.findUnique({ where: { id: data.matId } });
      if (!mat || mat.eventId !== data.eventId)
        throw { status: 404, message: "Mat not found for this event" };
    }

    // A block on a floor is positioned by the running order, not by the clock;
    // accepting a startTime there would show a time the schedule never honours.
    const startTime = data.matId ? null : data.startTime ?? null;

    // Append to the end of the floor's running order, sharing the index space
    // with that floor's categories — the planner drags it into place from there.
    let matOrder: number | null = null;
    if (data.matId) matOrder = await this.nextMatOrder(data.matId);

    const block = await prisma.scheduleBlock.create({
      data: {
        eventId: data.eventId,
        kind: data.kind,
        label: data.label,
        minutes: data.minutes,
        matId: data.matId ?? null,
        matOrder,
        startTime,
      },
    });
    await this.audit(user.id, "ScheduleBlock", block.id, "CREATE", {
      kind: block.kind,
      matId: block.matId,
      minutes: block.minutes,
    });
    return block;
  }

  static async updateBlock(blockId: string, input: unknown, user: { id: string }) {
    const data = UpdateScheduleBlock.parse(input);
    const block = await prisma.scheduleBlock.findUnique({ where: { id: blockId } });
    if (!block) throw { status: 404, message: "Break not found" };

    // Same reasoning as create: only a venue-wide block has a clock anchor.
    const patch: { label?: string; minutes?: number; startTime?: string | null } = {};
    if (data.label !== undefined) patch.label = data.label;
    if (data.minutes !== undefined) patch.minutes = data.minutes;
    if (data.startTime !== undefined) patch.startTime = block.matId ? null : data.startTime;

    const updated = await prisma.scheduleBlock.update({ where: { id: blockId }, data: patch });
    await this.audit(user.id, "ScheduleBlock", blockId, "UPDATE", patch);
    return updated;
  }

  static async deleteBlock(blockId: string, user: { id: string }) {
    const block = await prisma.scheduleBlock.findUnique({ where: { id: blockId } });
    if (!block) throw { status: 404, message: "Break not found" };
    await prisma.scheduleBlock.delete({ where: { id: blockId } });
    await this.audit(user.id, "ScheduleBlock", blockId, "DELETE", { kind: block.kind });
  }

  // ---- Running order ----

  /**
   * Rewrite the running order of one or more lanes atomically.
   *
   * Every lane the drag touched arrives complete — source and destination —
   * so a cross-floor move is a single transaction. Positions are reassigned
   * densely from 0 across categories and blocks together: they share one index
   * space per floor, which is what lets a break sit *between* two categories.
   */
  static async setOrder(input: unknown, user: { id: string }) {
    const data = SetPlanOrder.parse(input) as OrderInput;
    const { eventId, lanes } = data;

    const matIds = lanes.map((l) => l.matId).filter((id): id is string => id !== null);
    const mats = await prisma.mat.findMany({ where: { id: { in: matIds } } });
    const matById = new Map(mats.map((m) => [m.id, m]));
    for (const id of matIds) {
      const mat = matById.get(id);
      if (!mat) throw { status: 404, message: "Mat not found" };
      if (mat.eventId !== eventId)
        throw { status: 400, message: "Mat does not belong to this event" };
    }
    if (new Set(lanes.map((l) => l.matId ?? "")).size !== lanes.length)
      throw { status: 400, message: "A floor was sent twice in the same order" };

    const drawIds = lanes.flatMap((l) =>
      l.items.filter((i) => i.kind === "CATEGORY").map((i) => i.id),
    );
    const blockIds = lanes.flatMap((l) =>
      l.items.filter((i) => i.kind === "BLOCK").map((i) => i.id),
    );
    if (new Set([...drawIds, ...blockIds]).size !== drawIds.length + blockIds.length)
      throw { status: 400, message: "An item was sent twice in the same order" };

    const [draws, blocks] = await Promise.all([
      prisma.draw.findMany({
        where: { id: { in: drawIds } },
        select: { id: true, eventId: true, status: true, matId: true, matOrder: true },
      }),
      prisma.scheduleBlock.findMany({
        where: { id: { in: blockIds } },
        select: { id: true, eventId: true, matId: true },
      }),
    ]);
    const drawById = new Map(draws.map((d) => [d.id, d]));
    const blockById = new Map(blocks.map((b) => [b.id, b]));

    const drawWrites: { id: string; matId: string | null; matOrder: number | null }[] = [];
    const blockWrites: { id: string; matId: string; matOrder: number }[] = [];

    for (const lane of lanes) {
      lane.items.forEach((item, index) => {
        if (item.kind === "CATEGORY") {
          const draw = drawById.get(item.id);
          if (!draw) throw { status: 404, message: "Category not found" };
          if (draw.eventId !== eventId)
            throw { status: 400, message: "Category does not belong to this event" };
          // A finished category keeps the floor it was actually fought on —
          // moving it would rewrite the record.
          //
          // Only once it *has* a floor, though: a category fought before anyone
          // touched the plan has `matId: null`, and there is no record to
          // protect there — refusing that placement would make it permanently
          // unplaceable rather than merely unmovable.
          //
          // Its index within the floor is only plan bookkeeping and is allowed
          // to shift, because inserting anything above it necessarily renumbers
          // everything below; pinning the index too would fail the whole write
          // for an edit that never touched the completed category at all.
          //
          // Checked here rather than only in the UI: the board is a shared
          // surface and two planners can be dragging at the same time.
          if (isCompleted(draw.status) && draw.matId !== null && draw.matId !== lane.matId)
            throw {
              status: 409,
              message: "That category has already been completed and cannot be moved to another floor",
            };
          drawWrites.push({
            id: item.id,
            matId: lane.matId,
            // Unassigned means no position at all, not position 0 — a stale
            // order left behind would resurrect on the next assignment.
            matOrder: lane.matId ? index : null,
          });
        } else {
          const block = blockById.get(item.id);
          if (!block) throw { status: 404, message: "Break not found" };
          if (block.eventId !== eventId)
            throw { status: 400, message: "Break does not belong to this event" };
          if (!lane.matId)
            throw {
              status: 400,
              message: "A break cannot sit in the unassigned pool — put it on a floor or make it venue-wide",
            };
          blockWrites.push({ id: item.id, matId: lane.matId, matOrder: index });
        }
      });
    }

    await prisma.$transaction([
      ...drawWrites.map((w) =>
        prisma.draw.update({ where: { id: w.id }, data: { matId: w.matId, matOrder: w.matOrder } }),
      ),
      ...blockWrites.map((w) =>
        prisma.scheduleBlock.update({
          where: { id: w.id },
          data: { matId: w.matId, matOrder: w.matOrder },
        }),
      ),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          entityType: "Event",
          entityId: eventId,
          action: "PLAN_REORDER",
          diffJson: JSON.stringify({ lanes }),
        },
      }),
    ]);

    return { updatedCategories: drawWrites.length, updatedBlocks: blockWrites.length };
  }

  // ---- Helpers ----

  /** Next free slot at the end of a floor's running order, across both kinds. */
  private static async nextMatOrder(matId: string): Promise<number> {
    const [lastDraw, lastBlock] = await Promise.all([
      prisma.draw.findFirst({
        where: { matId },
        orderBy: { matOrder: { sort: "desc", nulls: "last" } },
        select: { matOrder: true },
      }),
      prisma.scheduleBlock.findFirst({
        where: { matId },
        orderBy: { matOrder: { sort: "desc", nulls: "last" } },
        select: { matOrder: true },
      }),
    ]);
    return Math.max(lastDraw?.matOrder ?? -1, lastBlock?.matOrder ?? -1) + 1;
  }

  private static async audit(
    userId: string,
    entityType: string,
    entityId: string,
    action: string,
    diff: unknown,
  ) {
    await prisma.auditLog.create({
      data: { userId, entityType, entityId, action, diffJson: JSON.stringify(diff) },
    });
  }
}
