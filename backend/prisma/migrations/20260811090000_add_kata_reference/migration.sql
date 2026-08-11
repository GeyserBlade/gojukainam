-- CreateTable
CREATE TABLE "Kata" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KataPerformance" (
    "id" TEXT NOT NULL,
    "boutId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "kataId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KataPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kata_name_key" ON "Kata"("name");

-- CreateIndex
CREATE INDEX "Kata_order_idx" ON "Kata"("order");

-- CreateIndex
CREATE INDEX "KataPerformance_entryId_idx" ON "KataPerformance"("entryId");

-- CreateIndex
CREATE INDEX "KataPerformance_kataId_idx" ON "KataPerformance"("kataId");

-- CreateIndex
CREATE UNIQUE INDEX "KataPerformance_boutId_entryId_key" ON "KataPerformance"("boutId", "entryId");

-- AddForeignKey
ALTER TABLE "KataPerformance" ADD CONSTRAINT "KataPerformance_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "Bout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KataPerformance" ADD CONSTRAINT "KataPerformance_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KataPerformance" ADD CONSTRAINT "KataPerformance_kataId_fkey" FOREIGN KEY ("kataId") REFERENCES "Kata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed the allowable kata list as part of the migration rather than from a
-- seed script: `prisma/seed.ts` refuses to run against a populated database,
-- so on any environment that already has events (production included) a script
-- would never fire. Reference data that the app reads on every kata bout has
-- to arrive with the table.
--
-- The Goju Kai / Goju-ryu syllabus, ordered beginner to advanced, in tens so a
-- kata can be inserted between two others without renumbering. This is a
-- starting list, not a ruling: it is ordinary editable reference data, and an
-- association that runs a different set changes it in the app.
INSERT INTO "Kata" ("id", "name", "style", "order", "active", "createdAt", "updatedAt") VALUES
  ('kata_taikyoku_gedan',      'Taikyoku Gedan',       'Goju Kai',  10, true, NOW(), NOW()),
  ('kata_taikyoku_chudan',     'Taikyoku Chudan',      'Goju Kai',  20, true, NOW(), NOW()),
  ('kata_taikyoku_jodan',      'Taikyoku Jodan',       'Goju Kai',  30, true, NOW(), NOW()),
  ('kata_taikyoku_kake_uke',   'Taikyoku Kake Uke',    'Goju Kai',  40, true, NOW(), NOW()),
  ('kata_taikyoku_mawashi',    'Taikyoku Mawashi Uke', 'Goju Kai',  50, true, NOW(), NOW()),
  ('kata_gekisai_dai_ichi',    'Gekisai Dai Ichi',     'Goju-ryu',  60, true, NOW(), NOW()),
  ('kata_gekisai_dai_ni',      'Gekisai Dai Ni',       'Goju-ryu',  70, true, NOW(), NOW()),
  ('kata_gekiha_dai_ichi',     'Gekiha Dai Ichi',      'Goju Kai',  80, true, NOW(), NOW()),
  ('kata_gekiha_dai_ni',       'Gekiha Dai Ni',        'Goju Kai',  90, true, NOW(), NOW()),
  ('kata_kakuha_dai_ichi',     'Kakuha Dai Ichi',      'Goju Kai', 100, true, NOW(), NOW()),
  ('kata_kakuha_dai_ni',       'Kakuha Dai Ni',        'Goju Kai', 110, true, NOW(), NOW()),
  ('kata_sanchin',             'Sanchin',              'Goju-ryu', 120, true, NOW(), NOW()),
  ('kata_tensho',              'Tensho',               'Goju-ryu', 130, true, NOW(), NOW()),
  ('kata_saifa',               'Saifa',                'Goju-ryu', 140, true, NOW(), NOW()),
  ('kata_seiyunchin',          'Seiyunchin',           'Goju-ryu', 150, true, NOW(), NOW()),
  ('kata_shisochin',           'Shisochin',            'Goju-ryu', 160, true, NOW(), NOW()),
  ('kata_sanseru',             'Sanseru',              'Goju-ryu', 170, true, NOW(), NOW()),
  ('kata_seipai',              'Seipai',               'Goju-ryu', 180, true, NOW(), NOW()),
  ('kata_kururunfa',           'Kururunfa',            'Goju-ryu', 190, true, NOW(), NOW()),
  ('kata_seisan',              'Seisan',               'Goju-ryu', 200, true, NOW(), NOW()),
  ('kata_suparinpei',          'Suparinpei',           'Goju-ryu', 210, true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
