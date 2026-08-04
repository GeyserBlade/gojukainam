// Tournament division/weight-class templates.
// Sources:
//   - WKF_2024: WKF Competition Rules 2024 (Rev.1)
//   - NKF_FULL_2026: NKF All Styles National Junior & Senior Trials 2026 (full tournament)
//   - NKF_INDIVIDUAL_2026, NKF_TEAM_2026: subsets of NKF_FULL_2026
// Adjust as needed before applying to an event.

export type WeightClassDef = {
  name: string;
  minKg: number | null;
  maxKg: number | null;
};

export type DivisionDef = {
  key: string;
  name: string;
  minAge: number;
  maxAge: number;
  gender: "Male" | "Female";
  category: "KATA" | "KUMITE";
  notes?: string;
  weightClasses?: WeightClassDef[];
};

// ═══════════════════════════════════════════════════════════════════════════
// Shared weight-class sets (so NKF and WKF templates share identical tables
// where the rules agree; diverge where they don't).
// ═══════════════════════════════════════════════════════════════════════════

const CADET_M_KUMITE_WEIGHTS: WeightClassDef[] = [
  { name: "-52kg", minKg: null, maxKg: 52 },
  { name: "-57kg", minKg: 52, maxKg: 57 },
  { name: "-63kg", minKg: 57, maxKg: 63 },
  { name: "-70kg", minKg: 63, maxKg: 70 },
  { name: "+70kg", minKg: 70, maxKg: null },
];

const JUNIOR_M_KUMITE_WEIGHTS: WeightClassDef[] = [
  { name: "-55kg", minKg: null, maxKg: 55 },
  { name: "-61kg", minKg: 55, maxKg: 61 },
  { name: "-68kg", minKg: 61, maxKg: 68 },
  { name: "-76kg", minKg: 68, maxKg: 76 },
  { name: "+76kg", minKg: 76, maxKg: null },
];

const U21_SENIOR_M_KUMITE_WEIGHTS: WeightClassDef[] = [
  { name: "-60kg", minKg: null, maxKg: 60 },
  { name: "-67kg", minKg: 60, maxKg: 67 },
  { name: "-75kg", minKg: 67, maxKg: 75 },
  { name: "-84kg", minKg: 75, maxKg: 84 },
  { name: "+84kg", minKg: 84, maxKg: null },
];

const SENIOR_F_KUMITE_WEIGHTS: WeightClassDef[] = [
  { name: "-50kg", minKg: null, maxKg: 50 },
  { name: "-55kg", minKg: 50, maxKg: 55 },
  { name: "-61kg", minKg: 55, maxKg: 61 },
  { name: "-68kg", minKg: 61, maxKg: 68 },
  { name: "+68kg", minKg: 68, maxKg: null },
];

// ═══════════════════════════════════════════════════════════════════════════
// WKF 2024
// ═══════════════════════════════════════════════════════════════════════════

const WKF_2024_DIVISIONS: DivisionDef[] = [
  // ── Individual KATA ───────────────────────────────────────────────────────

  { key: "MINI_CADET_M_KATA",  name: "Mini Cadet Male Kata (10-13)",    minAge: 10, maxAge: 13, gender: "Male",   category: "KATA" },
  { key: "MINI_CADET_F_KATA",  name: "Mini Cadet Female Kata (10-13)",  minAge: 10, maxAge: 13, gender: "Female", category: "KATA" },
  { key: "CADET_M_KATA",       name: "Cadet Male Kata (14-15)",         minAge: 14, maxAge: 15, gender: "Male",   category: "KATA" },
  { key: "CADET_F_KATA",       name: "Cadet Female Kata (14-15)",       minAge: 14, maxAge: 15, gender: "Female", category: "KATA" },
  { key: "JUNIOR_M_KATA",      name: "Junior Male Kata (16-17)",        minAge: 16, maxAge: 17, gender: "Male",   category: "KATA" },
  { key: "JUNIOR_F_KATA",      name: "Junior Female Kata (16-17)",      minAge: 16, maxAge: 17, gender: "Female", category: "KATA" },
  { key: "U21_M_KATA",         name: "U21 Male Kata (18-20)",           minAge: 18, maxAge: 20, gender: "Male",   category: "KATA" },
  { key: "U21_F_KATA",         name: "U21 Female Kata (18-20)",         minAge: 18, maxAge: 20, gender: "Female", category: "KATA" },
  { key: "SENIOR_M_KATA",      name: "Senior Male Kata (18+)",          minAge: 18, maxAge: 99, gender: "Male",   category: "KATA" },
  { key: "SENIOR_F_KATA",      name: "Senior Female Kata (18+)",        minAge: 18, maxAge: 99, gender: "Female", category: "KATA" },

  // ── Team KATA ─────────────────────────────────────────────────────────────
  // Team composition: 3 competitors + 1 reserve (WKF rule 3.1.2)

  { key: "CADET_M_TEAM_KATA",   name: "Cadet Male Team Kata (14-15)",    minAge: 14, maxAge: 15, gender: "Male",   category: "KATA", notes: "Team event — 3 competitors + 1 reserve" },
  { key: "CADET_F_TEAM_KATA",   name: "Cadet Female Team Kata (14-15)",  minAge: 14, maxAge: 15, gender: "Female", category: "KATA", notes: "Team event — 3 competitors + 1 reserve" },
  { key: "JUNIOR_M_TEAM_KATA",  name: "Junior Male Team Kata (16-17)",   minAge: 16, maxAge: 17, gender: "Male",   category: "KATA", notes: "Team event — 3 competitors + 1 reserve" },
  { key: "JUNIOR_F_TEAM_KATA",  name: "Junior Female Team Kata (16-17)", minAge: 16, maxAge: 17, gender: "Female", category: "KATA", notes: "Team event — 3 competitors + 1 reserve" },
  { key: "SENIOR_M_TEAM_KATA",  name: "Senior Male Team Kata (18+)",     minAge: 18, maxAge: 99, gender: "Male",   category: "KATA", notes: "Team event — 3 competitors + 1 reserve" },
  { key: "SENIOR_F_TEAM_KATA",  name: "Senior Female Team Kata (18+)",   minAge: 18, maxAge: 99, gender: "Female", category: "KATA", notes: "Team event — 3 competitors + 1 reserve" },

  // ── Individual KUMITE ─────────────────────────────────────────────────────

  // Mini Cadet Kumite — weight classes are indicative (WKF has no official world champs)
  {
    key: "MINI_CADET_M_KUMITE", name: "Mini Cadet Male Kumite (10-13)", minAge: 10, maxAge: 13, gender: "Male", category: "KUMITE",
    notes: "Weight classes indicative — confirm with host federation",
    weightClasses: [
      { name: "-40kg", minKg: null, maxKg: 40 },
      { name: "-45kg", minKg: 40,   maxKg: 45 },
      { name: "-50kg", minKg: 45,   maxKg: 50 },
      { name: "+50kg", minKg: 50,   maxKg: null },
    ],
  },
  {
    key: "MINI_CADET_F_KUMITE", name: "Mini Cadet Female Kumite (10-13)", minAge: 10, maxAge: 13, gender: "Female", category: "KUMITE",
    notes: "Weight classes indicative — confirm with host federation",
    weightClasses: [
      { name: "-35kg", minKg: null, maxKg: 35 },
      { name: "-40kg", minKg: 35,   maxKg: 40 },
      { name: "-45kg", minKg: 40,   maxKg: 45 },
      { name: "+45kg", minKg: 45,   maxKg: null },
    ],
  },

  // Cadet Kumite
  { key: "CADET_M_KUMITE", name: "Cadet Male Kumite (14-15)", minAge: 14, maxAge: 15, gender: "Male", category: "KUMITE", weightClasses: CADET_M_KUMITE_WEIGHTS },
  {
    key: "CADET_F_KUMITE", name: "Cadet Female Kumite (14-15)", minAge: 14, maxAge: 15, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-47kg", minKg: null, maxKg: 47 },
      { name: "-54kg", minKg: 47,   maxKg: 54 },
      { name: "+54kg", minKg: 54,   maxKg: null },
    ],
  },

  // Junior Kumite
  { key: "JUNIOR_M_KUMITE", name: "Junior Male Kumite (16-17)", minAge: 16, maxAge: 17, gender: "Male", category: "KUMITE", weightClasses: JUNIOR_M_KUMITE_WEIGHTS },
  {
    key: "JUNIOR_F_KUMITE", name: "Junior Female Kumite (16-17)", minAge: 16, maxAge: 17, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-48kg", minKg: null, maxKg: 48 },
      { name: "-53kg", minKg: 48,   maxKg: 53 },
      { name: "-59kg", minKg: 53,   maxKg: 59 },
      { name: "+59kg", minKg: 59,   maxKg: null },
    ],
  },

  // U21 Kumite
  { key: "U21_M_KUMITE", name: "U21 Male Kumite (18-20)", minAge: 18, maxAge: 20, gender: "Male", category: "KUMITE", weightClasses: U21_SENIOR_M_KUMITE_WEIGHTS },
  {
    key: "U21_F_KUMITE", name: "U21 Female Kumite (18-20)", minAge: 18, maxAge: 20, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-50kg", minKg: null, maxKg: 50 },
      { name: "-55kg", minKg: 50,   maxKg: 55 },
      { name: "-61kg", minKg: 55,   maxKg: 61 },
      { name: "+61kg", minKg: 61,   maxKg: null },
    ],
  },

  // Senior Kumite
  { key: "SENIOR_M_KUMITE", name: "Senior Male Kumite (18+)", minAge: 18, maxAge: 99, gender: "Male", category: "KUMITE", weightClasses: U21_SENIOR_M_KUMITE_WEIGHTS },
  { key: "SENIOR_F_KUMITE", name: "Senior Female Kumite (18+)", minAge: 18, maxAge: 99, gender: "Female", category: "KUMITE", weightClasses: SENIOR_F_KUMITE_WEIGHTS },

  // ── Team KUMITE ───────────────────────────────────────────────────────────
  // Team kumite: 3 competitors (no weight classes per WKF rule 11.2.1)

  { key: "CADET_M_TEAM_KUMITE",   name: "Cadet Male Team Kumite (14-15)",    minAge: 14, maxAge: 15, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "CADET_F_TEAM_KUMITE",   name: "Cadet Female Team Kumite (14-15)",  minAge: 14, maxAge: 15, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "JUNIOR_M_TEAM_KUMITE",  name: "Junior Male Team Kumite (16-17)",   minAge: 16, maxAge: 17, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "JUNIOR_F_TEAM_KUMITE",  name: "Junior Female Team Kumite (16-17)", minAge: 16, maxAge: 17, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "SENIOR_M_TEAM_KUMITE",  name: "Senior Male Team Kumite (18+)",     minAge: 18, maxAge: 99, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "SENIOR_F_TEAM_KUMITE",  name: "Senior Female Team Kumite (18+)",   minAge: 18, maxAge: 99, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
];

// ═══════════════════════════════════════════════════════════════════════════
// NKF All Styles National Junior & Senior Trials 2026 — full tournament
// ═══════════════════════════════════════════════════════════════════════════

const NKF_INDIVIDUAL_DIVISIONS: DivisionDef[] = [
  // ── Individual KATA ───────────────────────────────────────────────────────

  { key: "CADET_M_KATA",   name: "Cadet Boys Kata (14/15)",       minAge: 14, maxAge: 15, gender: "Male",   category: "KATA" },
  { key: "CADET_F_KATA",   name: "Cadet Girls Kata (14/15)",      minAge: 14, maxAge: 15, gender: "Female", category: "KATA" },
  { key: "JUNIOR_M_KATA",  name: "Junior Male Kata (16/17)",      minAge: 16, maxAge: 17, gender: "Male",   category: "KATA" },
  { key: "JUNIOR_F_KATA",  name: "Junior Female Kata (16/17)",    minAge: 16, maxAge: 17, gender: "Female", category: "KATA" },
  { key: "U21_M_KATA",     name: "U21 Male Kata (18/19/20)",      minAge: 18, maxAge: 20, gender: "Male",   category: "KATA" },
  { key: "U21_F_KATA",     name: "U21 Female Kata (18/19/20)",    minAge: 18, maxAge: 20, gender: "Female", category: "KATA" },
  // NKF Senior Kata opens at 16+ (differs from WKF Senior Kata at 18+).
  { key: "NKF_SENIOR_M_KATA", name: "Senior Male Kata (16+)",     minAge: 16, maxAge: 99, gender: "Male",   category: "KATA", notes: "NKF Senior Kata opens at 16+" },
  { key: "NKF_SENIOR_F_KATA", name: "Senior Female Kata (16+)",   minAge: 16, maxAge: 99, gender: "Female", category: "KATA", notes: "NKF Senior Kata opens at 16+" },
  { key: "VETERAN_M_KATA", name: "Veteran Male Kata (35+)",       minAge: 35, maxAge: 99, gender: "Male",   category: "KATA", notes: "Veteran (35/45) — single division" },
  { key: "VETERAN_F_KATA", name: "Veteran Female Kata (35+)",     minAge: 35, maxAge: 99, gender: "Female", category: "KATA", notes: "Veteran (35/45) — single division" },

  // ── Individual KUMITE ─────────────────────────────────────────────────────

  { key: "CADET_M_KUMITE",  name: "Cadet Boys Kumite (14/15)",     minAge: 14, maxAge: 15, gender: "Male",   category: "KUMITE", weightClasses: CADET_M_KUMITE_WEIGHTS },
  {
    key: "NKF_CADET_F_KUMITE", name: "Cadet Girls Kumite (14/15)", minAge: 14, maxAge: 15, gender: "Female", category: "KUMITE",
    notes: "NKF cadet girls use 4 weight classes (differs from WKF's 3)",
    weightClasses: [
      { name: "-47kg", minKg: null, maxKg: 47 },
      { name: "-54kg", minKg: 47,   maxKg: 54 },
      { name: "-61kg", minKg: 54,   maxKg: 61 },
      { name: "+61kg", minKg: 61,   maxKg: null },
    ],
  },
  { key: "JUNIOR_M_KUMITE", name: "Junior Male Kumite (16/17)",    minAge: 16, maxAge: 17, gender: "Male",   category: "KUMITE", weightClasses: JUNIOR_M_KUMITE_WEIGHTS },
  {
    key: "NKF_JUNIOR_F_KUMITE", name: "Junior Female Kumite (16/17)", minAge: 16, maxAge: 17, gender: "Female", category: "KUMITE",
    notes: "NKF junior females use 5 weight classes (differs from WKF's 4)",
    weightClasses: [
      { name: "-48kg", minKg: null, maxKg: 48 },
      { name: "-53kg", minKg: 48,   maxKg: 53 },
      { name: "-59kg", minKg: 53,   maxKg: 59 },
      { name: "-66kg", minKg: 59,   maxKg: 66 },
      { name: "+66kg", minKg: 66,   maxKg: null },
    ],
  },
  { key: "U21_M_KUMITE", name: "U21 Male Kumite (18/19/20)",       minAge: 18, maxAge: 20, gender: "Male",   category: "KUMITE", weightClasses: U21_SENIOR_M_KUMITE_WEIGHTS },
  {
    key: "NKF_U21_F_KUMITE", name: "U21 Female Kumite (18/19/20)", minAge: 18, maxAge: 20, gender: "Female", category: "KUMITE",
    notes: "NKF U21 females use 5 weight classes (differs from WKF's 4)",
    weightClasses: SENIOR_F_KUMITE_WEIGHTS,
  },
  { key: "SENIOR_M_KUMITE", name: "Senior Male Kumite (18+)",      minAge: 18, maxAge: 99, gender: "Male",   category: "KUMITE", weightClasses: U21_SENIOR_M_KUMITE_WEIGHTS },
  { key: "SENIOR_F_KUMITE", name: "Senior Female Kumite (18+)",    minAge: 18, maxAge: 99, gender: "Female", category: "KUMITE", weightClasses: SENIOR_F_KUMITE_WEIGHTS },
  { key: "VETERAN_M_KUMITE", name: "Veteran Male Kumite (All weights)",   minAge: 35, maxAge: 99, gender: "Male",   category: "KUMITE", notes: "All weights — no weight classes" },
  { key: "VETERAN_F_KUMITE", name: "Veteran Female Kumite (All weights)", minAge: 35, maxAge: 99, gender: "Female", category: "KUMITE", notes: "All weights — no weight classes" },
];

const NKF_TEAM_DIVISIONS: DivisionDef[] = [
  // ── Team KATA ─────────────────────────────────────────────────────────────
  { key: "NKF_JUNIOR_M_TEAM_KATA", name: "Junior Male Team Kata (14-17)",   minAge: 14, maxAge: 17, gender: "Male",   category: "KATA", notes: "Team event — combined cadet+junior age range" },
  { key: "NKF_JUNIOR_F_TEAM_KATA", name: "Junior Female Team Kata (14-17)", minAge: 14, maxAge: 17, gender: "Female", category: "KATA", notes: "Team event — combined cadet+junior age range" },
  { key: "NKF_SENIOR_M_TEAM_KATA", name: "Senior Male Team Kata (16-39)",   minAge: 16, maxAge: 39, gender: "Male",   category: "KATA", notes: "Team event — senior age range 16-39" },
  { key: "NKF_SENIOR_F_TEAM_KATA", name: "Senior Female Team Kata (16-34)", minAge: 16, maxAge: 34, gender: "Female", category: "KATA", notes: "Team event — senior age range 16-34" },

  // ── Team KUMITE ───────────────────────────────────────────────────────────
  { key: "NKF_SENIOR_M_TEAM_KUMITE", name: "Senior Male Team Kumite (18-40)",   minAge: 18, maxAge: 40, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes" },
  { key: "NKF_SENIOR_F_TEAM_KUMITE", name: "Senior Female Team Kumite (18-35)", minAge: 18, maxAge: 35, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes" },
];

const NKF_FULL_2026_DIVISIONS: DivisionDef[] = [
  ...NKF_INDIVIDUAL_DIVISIONS,
  ...NKF_TEAM_DIVISIONS,
];

// ═══════════════════════════════════════════════════════════════════════════
// Goju Kai Small — no weight classes
// ═══════════════════════════════════════════════════════════════════════════
// Single-year age groups from 5 to 16, boys and girls, kata and kumite.
// Age is the only fairness control: no weight classes are attached to the
// kumite divisions, so entries are split by age and gender alone.
// Generated rather than written out — 48 divisions of purely mechanical
// variation would be error-prone by hand.

const GK_SMALL_AGES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;

const GK_SMALL_NO_WEIGHTS_DIVISIONS: DivisionDef[] = GK_SMALL_AGES.flatMap((age) =>
  (["KATA", "KUMITE"] as const).flatMap((category) =>
    ([
      ["Male", "M", "Boys"],
      ["Female", "F", "Girls"],
    ] as const).map(([gender, genderKey, genderLabel]): DivisionDef => ({
      key: `GK_SMALL_${genderKey}_${category}_${age}`,
      name: `${genderLabel} ${category === "KATA" ? "Kata" : "Kumite"} (age ${age})`,
      minAge: age,
      maxAge: age,
      gender,
      category,
      notes: "No weight classes — age and gender only",
    })),
  ),
);

// ═══════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════

export const TEMPLATES = {
  GK_SMALL_NO_WEIGHTS: GK_SMALL_NO_WEIGHTS_DIVISIONS,
  NKF_FULL_2026: NKF_FULL_2026_DIVISIONS,
  NKF_INDIVIDUAL_2026: NKF_INDIVIDUAL_DIVISIONS,
  NKF_TEAM_2026: NKF_TEAM_DIVISIONS,
  WKF_2024: WKF_2024_DIVISIONS,
} as const;

export type TemplateName = keyof typeof TEMPLATES;

export type TemplateMeta = {
  id: TemplateName;
  name: string;
  description: string;
  divisionCount: number;
  weightClassCount: number;
};

const countWeights = (divs: readonly DivisionDef[]) =>
  divs.reduce((sum, d) => sum + (d.weightClasses?.length ?? 0), 0);

export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: "GK_SMALL_NO_WEIGHTS",
    name: "Goju Kai Small No-weights",
    description: "Single-year age groups from 5 to 16, boys & girls, kata & kumite — no weight classes",
    divisionCount: GK_SMALL_NO_WEIGHTS_DIVISIONS.length,
    weightClassCount: countWeights(GK_SMALL_NO_WEIGHTS_DIVISIONS),
  },
  {
    id: "NKF_FULL_2026",
    name: "NKF Full Tournament 2026",
    description: "All ages + individual + team events (Cadet, Junior, U21, Senior, Veteran)",
    divisionCount: NKF_FULL_2026_DIVISIONS.length,
    weightClassCount: countWeights(NKF_FULL_2026_DIVISIONS),
  },
  {
    id: "NKF_INDIVIDUAL_2026",
    name: "NKF Individuals Only 2026",
    description: "Individual kata & kumite across all NKF age groups (no team events)",
    divisionCount: NKF_INDIVIDUAL_DIVISIONS.length,
    weightClassCount: countWeights(NKF_INDIVIDUAL_DIVISIONS),
  },
  {
    id: "NKF_TEAM_2026",
    name: "NKF Team Events Only 2026",
    description: "Team kata & team kumite for junior and senior age groups",
    divisionCount: NKF_TEAM_DIVISIONS.length,
    weightClassCount: countWeights(NKF_TEAM_DIVISIONS),
  },
  {
    id: "WKF_2024",
    name: "WKF 2024 Standard",
    description: "WKF Competition Rules 2024 — full set incl. Mini Cadet and all team events",
    divisionCount: WKF_2024_DIVISIONS.length,
    weightClassCount: countWeights(WKF_2024_DIVISIONS),
  },
];
