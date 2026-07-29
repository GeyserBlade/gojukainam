-- Backfills the foreign-key indexes that were applied to the dev database
-- out-of-band during a security/perf hardening pass but never written into
-- schema.prisma or a migration. IF NOT EXISTS keeps this a no-op on databases
-- that already received them by hand, while still creating them on fresh ones.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Entry_athleteId_idx" ON "public"."Entry"("athleteId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Entry_teamId_idx" ON "public"."Entry"("teamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Entry_divisionId_idx" ON "public"."Entry"("divisionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Entry_weightClassId_idx" ON "public"."Entry"("weightClassId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Draw_matId_idx" ON "public"."Draw"("matId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DrawSlot_entryId_idx" ON "public"."DrawSlot"("entryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bout_akaEntryId_idx" ON "public"."Bout"("akaEntryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bout_aoEntryId_idx" ON "public"."Bout"("aoEntryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bout_winnerEntryId_idx" ON "public"."Bout"("winnerEntryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bout_matId_idx" ON "public"."Bout"("matId");
