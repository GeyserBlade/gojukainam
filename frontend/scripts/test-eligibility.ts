/**
 * Unit tests for the entry-management screen's pure helpers
 * (src/pages/event-management/eligibility.ts) — the age-band headings the
 * division boards are grouped under, and the eligibility rule the boards ghost
 * themselves by. No network, no DOM. Mirrors scripts/test-timing.ts.
 *
 * The band labels are also produced server-side for the printable entry list
 * (`ageBandLabel` in backend/src/services/entry-list.service.ts, checked by
 * backend/scripts/test-event-entry-list.ts). The two are a deliberate mirror,
 * so both are tested and the same cases appear on each side.
 *
 * Run: npx tsx scripts/test-eligibility.ts
 */
import {
  ageAt,
  ageBandLabel,
  groupDivisionsByAge,
  isEligible,
} from "../src/pages/event-management/eligibility";
import type { Division } from "../src/lib/events";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const division = (
  name: string,
  minAge: number,
  maxAge: number,
  category: "KATA" | "KUMITE" = "KATA",
  gender: "Male" | "Female" = "Male",
): Division =>
  ({
    id: `${name}-${gender}`,
    eventId: "e1",
    key: name.replace(/\s+/g, "_"),
    name,
    minAge,
    maxAge,
    gender,
    category,
  }) as Division;

console.log("\nage-band labels: the age part of the name, whichever way round it is written:");
{
  check(
    "gender-last names reduce to the age words",
    ageBandLabel("Under 12 Boys Kata", 10, 11) === "Under 12",
    ageBandLabel("Under 12 Boys Kata", 10, 11),
  );
  check(
    "a trailing parenthetical goes too",
    ageBandLabel("Mini Cadet Male Kata (10-13)", 10, 13) === "Mini Cadet",
    ageBandLabel("Mini Cadet Male Kata (10-13)", 10, 13),
  );
  check(
    "'Team Kata' is stripped like any other discipline",
    ageBandLabel("Under 18 Team Kata Boys", 10, 17) === "Under 18",
    ageBandLabel("Under 18 Team Kata Boys", 10, 17),
  );
}

console.log("\ndiscipline-first names fall back to the ages, not to 'KATA':");
{
  // The federation's own template writes categories this way, and a band that
  // holds both disciplines must not be headed by one of them.
  check(
    "KATA BOYS 5-6 -> Ages 5–6",
    ageBandLabel("KATA BOYS 5-6", 5, 6) === "Ages 5–6",
    ageBandLabel("KATA BOYS 5-6", 5, 6),
  );
  check(
    "KUMITE GIRLS 8-9 -> Ages 8–9",
    ageBandLabel("KUMITE GIRLS 8-9", 8, 9) === "Ages 8–9",
    ageBandLabel("KUMITE GIRLS 8-9", 8, 9),
  );
  check(
    "a single-year band says Age, not Ages",
    ageBandLabel("KATA BOYS 7", 7, 7) === "Age 7",
    ageBandLabel("KATA BOYS 7", 7, 7),
  );
  check(
    "a bare discipline name falls back too",
    ageBandLabel("Kata", 12, 13) === "Ages 12–13",
    ageBandLabel("Kata", 12, 13),
  );
  check(
    "and an empty name",
    ageBandLabel("", 12, 13) === "Ages 12–13",
    ageBandLabel("", 12, 13),
  );
  // Note the strip only fires on a *following* word: "BOYS 5-6" keeps its ages
  // and is a perfectly good heading, so it is deliberately left alone.
  check(
    "a name that is already just ages is kept",
    ageBandLabel("BOYS 5-6", 5, 6) === "BOYS 5-6",
    ageBandLabel("BOYS 5-6", 5, 6),
  );
}

console.log("\ngroupDivisionsByAge buckets by the age span and sorts youngest first:");
{
  const groups = groupDivisionsByAge([
    division("KUMITE BOYS 10-11", 10, 11, "KUMITE"),
    division("KATA BOYS 5-6", 5, 6),
    division("KATA BOYS 10-11", 10, 11),
    division("KUMITE BOYS 5-6", 5, 6, "KUMITE"),
  ]);
  check("two bands", groups.length === 2, groups.map((g) => g.key));
  check(
    "youngest first, each holding both disciplines",
    groups[0].key === "5-6" && groups[0].divisions.length === 2 && groups[1].key === "10-11",
    groups.map((g) => `${g.key}:${g.divisions.length}`),
  );
  check(
    "a band whose first division is kumite is still not headed 'KUMITE'",
    groups[1].label === "Ages 10–11",
    groups.map((g) => g.label),
  );
}

console.log("\nisEligible is age-on-the-event-date plus gender:");
{
  const u12 = division("Under 12 Boys Kata", 10, 11);
  const eventDate = "2026-06-01T00:00:00Z";
  check(
    "birthday before the event -> in",
    isEligible({ dob: "2015-01-01T00:00:00Z", gender: "Male" }, u12, eventDate),
  );
  check(
    "birthday after the event -> still 10, in",
    isEligible({ dob: "2015-09-01T00:00:00Z", gender: "Male" }, u12, eventDate),
  );
  check(
    "too young -> out",
    !isEligible({ dob: "2017-01-01T00:00:00Z", gender: "Male" }, u12, eventDate),
  );
  check(
    "right age, wrong gender -> out",
    !isEligible({ dob: "2015-01-01T00:00:00Z", gender: "Female" }, u12, eventDate),
  );
  check("ageAt is birthday-aware", ageAt("2015-09-01T00:00:00Z", eventDate) === 10, ageAt("2015-09-01T00:00:00Z", eventDate));
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
