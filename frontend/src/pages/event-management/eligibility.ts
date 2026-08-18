// Eligibility & event-config helpers for the entry-management screen.
// Pure functions — no React. Keep this dependency-free.

import type { Division } from "@/lib/events";
import type { Entry } from "@/lib/entries";

export interface EventConfig {
  currency: string;
  fees: {
    kataIndividual: number;
    kumiteIndividual: number;
    teamKata: number;
    teamKumite: number;
  };
  limits: {
    maxIndividualEventsPerAthlete: number;
    maxEntriesPerClubPerCategory: number;
  };
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  currency: "NAD",
  fees: { kataIndividual: 150, kumiteIndividual: 150, teamKata: 300, teamKumite: 300 },
  limits: { maxIndividualEventsPerAthlete: 2, maxEntriesPerClubPerCategory: 10 },
};

/** Safely parse an event's configJson with sensible defaults. */
export function parseEventConfig(configJson?: string | null): EventConfig {
  if (!configJson) return DEFAULT_EVENT_CONFIG;
  try {
    const parsed = JSON.parse(configJson) as Partial<EventConfig>;
    return {
      ...DEFAULT_EVENT_CONFIG,
      ...parsed,
      fees: { ...DEFAULT_EVENT_CONFIG.fees, ...(parsed.fees ?? {}) },
      limits: { ...DEFAULT_EVENT_CONFIG.limits, ...(parsed.limits ?? {}) },
    };
  } catch {
    return DEFAULT_EVENT_CONFIG;
  }
}

/** Age at a given event date (handles year-month-day rollover correctly). */
export function ageAt(dob: string, atDate: string | Date): number {
  const birth = new Date(dob);
  const at = typeof atDate === "string" ? new Date(atDate) : atDate;
  let age = at.getFullYear() - birth.getFullYear();
  const m = at.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age--;
  return age;
}

/** Is the athlete eligible for the division based on age & gender? */
export function isEligible(
  athlete: { dob: string; gender: "Male" | "Female" },
  division: Pick<Division, "minAge" | "maxAge" | "gender">,
  eventDate: string | Date,
): boolean {
  const age = ageAt(athlete.dob, eventDate);
  return athlete.gender === division.gender && age >= division.minAge && age <= division.maxAge;
}

/** Individual entry types only (TEAM_KATA / TEAM_KUMITE excluded). */
export function isIndividualEntry(entry: Pick<Entry, "entryType">): boolean {
  return entry.entryType === "KATA" || entry.entryType === "KUMITE";
}

/** Count of individual entries an athlete has across the event. */
export function individualEntryCount(athleteId: string, entries: Entry[]): number {
  return entries.filter((e) => e.athleteId === athleteId && isIndividualEntry(e)).length;
}

/** Fee in cents for an entry, sourced from the event config. */
export function feeForEntry(entry: Pick<Entry, "entryType">, config: EventConfig): number {
  switch (entry.entryType) {
    case "KATA":
      return config.fees.kataIndividual;
    case "KUMITE":
      return config.fees.kumiteIndividual;
    case "TEAM_KATA":
      return config.fees.teamKata;
    case "TEAM_KUMITE":
      return config.fees.teamKumite;
    default:
      return 0;
  }
}

/** Map a division category to the individual entry type. */
export function individualEntryTypeFor(category: "KATA" | "KUMITE"): "KATA" | "KUMITE" {
  return category;
}

/**
 * The heading for the age band a division sits in.
 *
 * Strip a trailing parenthetical, then the gender and discipline words, which
 * leaves the age part of the name: "Under 10 Boys" and "Mini Cadet Male Kata
 * (10-13)" both reduce cleanly.
 *
 * The federation's own template names categories the other way round — "KATA
 * BOYS 5-6" — and stripping from the gender word leaves "KATA", which would
 * head a band that holds kumite too with a discipline it is not. When nothing
 * but a discipline survives (or nothing at all), the ages name the band, which
 * is what the band actually is.
 *
 * Mirrored by `ageBandLabel` in backend/src/services/entry-list.service.ts, so
 * the printable entry list and this screen head their sections identically —
 * keep the two in step.
 */
export function ageBandLabel(name: string, minAge: number, maxAge: number): string {
  const stripped = name
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+(Boys|Girls|Men|Women|Boy|Girl|Male|Female)\b.*/i, "")
    .replace(/\s+(Team\s+)?(Kata|Kumite)\b.*/i, "")
    .trim();
  if (!stripped || /^(team\s+)?(kata|kumite)$/i.test(stripped)) {
    return minAge === maxAge ? `Age ${minAge}` : `Ages ${minAge}\u2013${maxAge}`;
  }
  return stripped;
}

/** Group divisions by age band (shared minAge/maxAge), sorted by minAge ascending. */
export function groupDivisionsByAge(divisions: Division[]) {
  const buckets = new Map<
    string,
    { key: string; label: string; minAge: number; divisions: Division[] }
  >();
  for (const d of divisions) {
    const key = `${d.minAge}-${d.maxAge}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: ageBandLabel(d.name, d.minAge, d.maxAge),
        minAge: d.minAge,
        divisions: [],
      });
    }
    buckets.get(key)!.divisions.push(d);
  }
  return Array.from(buckets.values()).sort((a, b) => a.minAge - b.minAge);
}

/** Group divisions by category (Kata / Kumite). */
export function groupDivisionsByCategory(divisions: Division[]) {
  const kata = divisions.filter((d) => d.category === "KATA");
  const kumite = divisions.filter((d) => d.category === "KUMITE");
  return [
    kata.length ? { key: "KATA", label: "Kata", divisions: kata } : null,
    kumite.length ? { key: "KUMITE", label: "Kumite", divisions: kumite } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; divisions: Division[] }>;
}
