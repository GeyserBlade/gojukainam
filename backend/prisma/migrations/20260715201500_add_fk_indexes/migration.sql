-- CreateIndex
CREATE INDEX "Entry_athleteId_idx" ON "public"."Entry"("athleteId");

-- CreateIndex
CREATE INDEX "Entry_teamId_idx" ON "public"."Entry"("teamId");

-- CreateIndex
CREATE INDEX "Entry_divisionId_idx" ON "public"."Entry"("divisionId");

-- CreateIndex
CREATE INDEX "Entry_weightClassId_idx" ON "public"."Entry"("weightClassId");

-- CreateIndex
CREATE INDEX "Draw_matId_idx" ON "public"."Draw"("matId");

-- CreateIndex
CREATE INDEX "DrawSlot_entryId_idx" ON "public"."DrawSlot"("entryId");

-- CreateIndex
CREATE INDEX "Bout_akaEntryId_idx" ON "public"."Bout"("akaEntryId");

-- CreateIndex
CREATE INDEX "Bout_aoEntryId_idx" ON "public"."Bout"("aoEntryId");

-- CreateIndex
CREATE INDEX "Bout_winnerEntryId_idx" ON "public"."Bout"("winnerEntryId");

-- CreateIndex
CREATE INDEX "Bout_matId_idx" ON "public"."Bout"("matId");
