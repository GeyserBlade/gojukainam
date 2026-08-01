import { api } from "./api";

export interface DrawEntrySummary {
  entryId: string;
  name: string;
  clubName: string;
  /** Dense seed rank as drawn; null = unseeded. */
  seed?: number | null;
}

export type BoutOutcome = "POINTS" | "GAP" | "SENSHU" | "HANTEI" | "HANSOKU" | "KIKEN";

export interface DrawBout {
  id: string | null;
  phase: "MAIN" | "REPECHAGE";
  round: number;
  /** MAIN: bout index within the round. REPECHAGE: side (0 = top half, 1 = bottom half). */
  position: number;
  aka: DrawEntrySummary | null;
  ao: DrawEntrySummary | null;
  winnerEntryId: string | null;
  isUserResult: boolean;
  /** WKF scoring detail — null for winner-only results */
  akaScore: number | null;
  aoScore: number | null;
  outcome: BoutOutcome | null;
  scoreJson: string | null;
}

export type DrawStatus = "DRAWN" | "IN_PROGRESS" | "COMPLETED";

export interface DrawDetail {
  id: string;
  eventId: string;
  division: { id: string; name: string; category: "KATA" | "KUMITE" };
  weightClass: { id: string; name: string } | null;
  size: number;
  status: DrawStatus;
  locked: boolean;
  slots: { position: number; seed: number | null; entry: DrawEntrySummary }[];
  bouts: DrawBout[];
  placements: {
    first: DrawEntrySummary | null;
    second: DrawEntrySummary | null;
    thirds: DrawEntrySummary[];
  };
  sync: {
    inSync: boolean;
    /** Seeding changed since the draw was made, independently of the entry set. */
    seedsChanged: boolean;
    added: DrawEntrySummary[];
    removed: DrawEntrySummary[];
    seedChanges: (DrawEntrySummary & { from: number | null; to: number | null })[];
  };
}

export interface DrawCategoryRow {
  divisionId: string;
  divisionName: string;
  category: "KATA" | "KUMITE";
  gender: "Male" | "Female";
  weightClassId: string | null;
  weightClassName: string | null;
  entryCount: number;
  draw: {
    id: string;
    size: number;
    status: DrawStatus;
    inSync: boolean;
    seedsChanged: boolean;
    locked: boolean;
    matId: string | null;
    matOrder: number | null;
  } | null;
}

export interface CategorySeedRow {
  entryId: string;
  name: string;
  clubName: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
  seed: number | null;
}

export interface CategorySeeds {
  entries: CategorySeedRow[];
  drawId: string | null;
  drawLocked: boolean;
}

export async function listCategorySeeds(params: {
  eventId: string;
  divisionId: string;
  weightClassId?: string | null;
}): Promise<CategorySeeds> {
  const res = await api.get("/draws/seeds", {
    // The backend reads this straight off req.query, so an empty string would
    // be treated as a real weight-class id. Omit it instead.
    params: {
      eventId: params.eventId,
      divisionId: params.divisionId,
      ...(params.weightClassId ? { weightClassId: params.weightClassId } : {}),
    },
  });
  return res.data;
}

export async function setCategorySeeds(data: {
  eventId: string;
  divisionId: string;
  weightClassId?: string | null;
  seeds: { entryId: string; seed: number | null }[];
}): Promise<CategorySeeds> {
  const res = await api.put("/draws/seeds", data);
  return res.data;
}

export async function listDrawCategories(eventId: string): Promise<DrawCategoryRow[]> {
  const res = await api.get("/draws", { params: { eventId } });
  return res.data;
}

export async function getDraw(id: string): Promise<DrawDetail> {
  const res = await api.get(`/draws/${id}`);
  return res.data;
}

export async function createDraw(data: {
  eventId: string;
  divisionId: string;
  weightClassId?: string | null;
}): Promise<DrawDetail> {
  const res = await api.post("/draws", data);
  return res.data;
}

export async function regenerateDraw(id: string, force = false): Promise<DrawDetail> {
  const res = await api.post(`/draws/${id}/regenerate`, { force });
  return res.data;
}

export async function setBoutWinner(
  drawId: string,
  boutId: string,
  winnerEntryId: string | null
): Promise<DrawDetail> {
  const res = await api.put(`/draws/${drawId}/bouts/${boutId}`, { winnerEntryId });
  return res.data;
}

export async function setBoutScore(
  drawId: string,
  boutId: string,
  data: {
    winnerEntryId: string;
    outcome: BoutOutcome;
    akaScore: number;
    aoScore: number;
    scoreJson?: string;
  }
): Promise<DrawDetail> {
  const res = await api.put(`/draws/${drawId}/bouts/${boutId}/score`, data);
  return res.data;
}

export async function setDrawLock(id: string, locked: boolean): Promise<DrawDetail> {
  const res = await api.put(`/draws/${id}/lock`, { locked });
  return res.data;
}

export async function deleteDraw(id: string): Promise<void> {
  await api.delete(`/draws/${id}`);
}
