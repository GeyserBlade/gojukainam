import { api } from "./api";
import { normalizeEventTiming, type EventTiming } from "./timing";
import type { ScheduleBlockKind } from "./schedule";

// The tournament plan: which categories run on which floor, in what order, and
// where the ceremonies and breaks sit between them. Mat CRUD lives in lib/run.ts
// — the plan board and the day-of run board share the same mats.

export type CategoryStatus = "DRAWN" | "IN_PROGRESS" | "COMPLETED";

export interface PlanCategory {
  /** `divisionId:weightClassId` — stable across refetches, unlike the draw id. */
  key: string;
  divisionId: string;
  divisionName: string;
  category: "KATA" | "KUMITE";
  gender: "Male" | "Female";
  minAge: number;
  maxAge: number;
  /** Per-category timing overrides; null = inherit the event default. */
  boutDurationSec: number | null;
  bufferPct: number | null;
  weightClassId: string | null;
  weightClassName: string | null;
  entryCount: number;
  /** False when no draw exists yet — the category cannot be placed on a floor. */
  hasDraw: boolean;
  drawId: string | null;
  drawSize: number | null;
  /** Entries the bracket was built with; drifts from entryCount after edits. */
  drawEntryCount: number | null;
  status: CategoryStatus | null;
  locked: boolean;
  matId: string | null;
  matOrder: number | null;
}

export interface PlanBlock {
  id: string;
  kind: ScheduleBlockKind;
  label: string;
  minutes: number;
  /** null = spans every floor. */
  matId: string | null;
  matOrder: number | null;
  startTime: string | null;
}

export interface PlanBoard {
  event: { id: string; name: string; startDate: string };
  timing: EventTiming;
  mats: { id: string; name: string; order: number }[];
  blocks: PlanBlock[];
  categories: PlanCategory[];
}

export const categoryTitle = (c: PlanCategory) =>
  c.weightClassName ? `${c.divisionName} · ${c.weightClassName}` : c.divisionName;

export async function getPlanBoard(eventId: string): Promise<PlanBoard> {
  const res = await api.get("/plan/board", { params: { eventId } });
  // The timing config comes back complete from the backend; normalizing again
  // keeps one code path for "anything -> a usable EventTiming".
  return { ...res.data, timing: normalizeEventTiming(res.data.timing) };
}

export async function createPlanBlock(data: {
  eventId: string;
  kind: ScheduleBlockKind;
  label: string;
  minutes: number;
  matId?: string | null;
  startTime?: string | null;
}): Promise<PlanBlock> {
  const res = await api.post("/plan/blocks", data);
  return res.data;
}

export async function updatePlanBlock(
  blockId: string,
  data: { label?: string; minutes?: number; startTime?: string | null },
): Promise<PlanBlock> {
  const res = await api.patch(`/plan/blocks/${blockId}`, data);
  return res.data;
}

export async function deletePlanBlock(blockId: string): Promise<void> {
  await api.delete(`/plan/blocks/${blockId}`);
}

export interface PlanLane {
  /** null = the unassigned pool. Categories only. */
  matId: string | null;
  items: { kind: "CATEGORY" | "BLOCK"; id: string }[];
}

/**
 * Rewrite the running order of every lane a drag touched, in one atomic call.
 * Send both the source and the destination lane for a cross-floor move — the
 * backend reassigns positions densely from 0 within each lane it receives.
 */
export async function setPlanOrder(eventId: string, lanes: PlanLane[]): Promise<void> {
  await api.put("/plan/order", { eventId, lanes });
}
