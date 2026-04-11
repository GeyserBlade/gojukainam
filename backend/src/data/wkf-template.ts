// WKF 2024 standard tournament divisions and weight classes
// Source: WKF Competition Rules 2024 (Rev.1)
// Weight classes for Mini Cadet are indicative — they vary by federation.
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
      { name: "-40kg", minKg: null, maxKg: 40   },
      { name: "-45kg", minKg: 40,   maxKg: 45   },
      { name: "-50kg", minKg: 45,   maxKg: 50   },
      { name: "+50kg", minKg: 50,   maxKg: null  },
    ],
  },
  {
    key: "MINI_CADET_F_KUMITE", name: "Mini Cadet Female Kumite (10-13)", minAge: 10, maxAge: 13, gender: "Female", category: "KUMITE",
    notes: "Weight classes indicative — confirm with host federation",
    weightClasses: [
      { name: "-35kg", minKg: null, maxKg: 35   },
      { name: "-40kg", minKg: 35,   maxKg: 40   },
      { name: "-45kg", minKg: 40,   maxKg: 45   },
      { name: "+45kg", minKg: 45,   maxKg: null  },
    ],
  },

  // Cadet Kumite (WKF Competition Rules, Article 3)
  {
    key: "CADET_M_KUMITE", name: "Cadet Male Kumite (14-15)", minAge: 14, maxAge: 15, gender: "Male", category: "KUMITE",
    weightClasses: [
      { name: "-52kg", minKg: null, maxKg: 52   },
      { name: "-57kg", minKg: 52,   maxKg: 57   },
      { name: "-63kg", minKg: 57,   maxKg: 63   },
      { name: "-70kg", minKg: 63,   maxKg: 70   },
      { name: "+70kg", minKg: 70,   maxKg: null  },
    ],
  },
  {
    key: "CADET_F_KUMITE", name: "Cadet Female Kumite (14-15)", minAge: 14, maxAge: 15, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-47kg", minKg: null, maxKg: 47   },
      { name: "-54kg", minKg: 47,   maxKg: 54   },
      { name: "+54kg", minKg: 54,   maxKg: null  },
    ],
  },

  // Junior Kumite
  {
    key: "JUNIOR_M_KUMITE", name: "Junior Male Kumite (16-17)", minAge: 16, maxAge: 17, gender: "Male", category: "KUMITE",
    weightClasses: [
      { name: "-55kg", minKg: null, maxKg: 55   },
      { name: "-61kg", minKg: 55,   maxKg: 61   },
      { name: "-68kg", minKg: 61,   maxKg: 68   },
      { name: "-76kg", minKg: 68,   maxKg: 76   },
      { name: "+76kg", minKg: 76,   maxKg: null  },
    ],
  },
  {
    key: "JUNIOR_F_KUMITE", name: "Junior Female Kumite (16-17)", minAge: 16, maxAge: 17, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-48kg", minKg: null, maxKg: 48   },
      { name: "-53kg", minKg: 48,   maxKg: 53   },
      { name: "-59kg", minKg: 53,   maxKg: 59   },
      { name: "+59kg", minKg: 59,   maxKg: null  },
    ],
  },

  // U21 Kumite
  {
    key: "U21_M_KUMITE", name: "U21 Male Kumite (18-20)", minAge: 18, maxAge: 20, gender: "Male", category: "KUMITE",
    weightClasses: [
      { name: "-60kg", minKg: null, maxKg: 60   },
      { name: "-67kg", minKg: 60,   maxKg: 67   },
      { name: "-75kg", minKg: 67,   maxKg: 75   },
      { name: "-84kg", minKg: 75,   maxKg: 84   },
      { name: "+84kg", minKg: 84,   maxKg: null  },
    ],
  },
  {
    key: "U21_F_KUMITE", name: "U21 Female Kumite (18-20)", minAge: 18, maxAge: 20, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-50kg", minKg: null, maxKg: 50   },
      { name: "-55kg", minKg: 50,   maxKg: 55   },
      { name: "-61kg", minKg: 55,   maxKg: 61   },
      { name: "+61kg", minKg: 61,   maxKg: null  },
    ],
  },

  // Senior Kumite
  {
    key: "SENIOR_M_KUMITE", name: "Senior Male Kumite (18+)", minAge: 18, maxAge: 99, gender: "Male", category: "KUMITE",
    weightClasses: [
      { name: "-60kg", minKg: null, maxKg: 60   },
      { name: "-67kg", minKg: 60,   maxKg: 67   },
      { name: "-75kg", minKg: 67,   maxKg: 75   },
      { name: "-84kg", minKg: 75,   maxKg: 84   },
      { name: "+84kg", minKg: 84,   maxKg: null  },
    ],
  },
  {
    key: "SENIOR_F_KUMITE", name: "Senior Female Kumite (18+)", minAge: 18, maxAge: 99, gender: "Female", category: "KUMITE",
    weightClasses: [
      { name: "-50kg", minKg: null, maxKg: 50   },
      { name: "-55kg", minKg: 50,   maxKg: 55   },
      { name: "-61kg", minKg: 55,   maxKg: 61   },
      { name: "-68kg", minKg: 61,   maxKg: 68   },
      { name: "+68kg", minKg: 68,   maxKg: null  },
    ],
  },

  // ── Team KUMITE ───────────────────────────────────────────────────────────
  // Team kumite: 3 competitors (no weight classes per WKF rule 11.2.1)

  { key: "CADET_M_TEAM_KUMITE",   name: "Cadet Male Team Kumite (14-15)",    minAge: 14, maxAge: 15, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "CADET_F_TEAM_KUMITE",   name: "Cadet Female Team Kumite (14-15)",  minAge: 14, maxAge: 15, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "JUNIOR_M_TEAM_KUMITE",  name: "Junior Male Team Kumite (16-17)",   minAge: 16, maxAge: 17, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "JUNIOR_F_TEAM_KUMITE",  name: "Junior Female Team Kumite (16-17)", minAge: 16, maxAge: 17, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "SENIOR_M_TEAM_KUMITE",  name: "Senior Male Team Kumite (18+)",     minAge: 18, maxAge: 99, gender: "Male",   category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
  { key: "SENIOR_F_TEAM_KUMITE",  name: "Senior Female Team Kumite (18+)",   minAge: 18, maxAge: 99, gender: "Female", category: "KUMITE", notes: "Team event — no weight classes (WKF rule 11.2.1)" },
];

export const TEMPLATES = {
  WKF_2024: WKF_2024_DIVISIONS,
} as const;

export type TemplateName = keyof typeof TEMPLATES;
