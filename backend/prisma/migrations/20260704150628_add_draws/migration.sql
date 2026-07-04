-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('DRAWN', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BoutPhase" AS ENUM ('MAIN', 'REPECHAGE');

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "weightClassId" TEXT,
    "size" INTEGER NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'DRAWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawSlot" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "DrawSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bout" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "phase" "BoutPhase" NOT NULL DEFAULT 'MAIN',
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "akaEntryId" TEXT,
    "aoEntryId" TEXT,
    "winnerEntryId" TEXT,

    CONSTRAINT "Bout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Draw_eventId_idx" ON "Draw"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Draw_eventId_divisionId_weightClassId_key" ON "Draw"("eventId", "divisionId", "weightClassId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawSlot_drawId_position_key" ON "DrawSlot"("drawId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DrawSlot_drawId_entryId_key" ON "DrawSlot"("drawId", "entryId");

-- CreateIndex
CREATE INDEX "Bout_drawId_idx" ON "Bout"("drawId");

-- CreateIndex
CREATE UNIQUE INDEX "Bout_drawId_phase_round_position_key" ON "Bout"("drawId", "phase", "round", "position");

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_weightClassId_fkey" FOREIGN KEY ("weightClassId") REFERENCES "WeightClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawSlot" ADD CONSTRAINT "DrawSlot_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawSlot" ADD CONSTRAINT "DrawSlot_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_akaEntryId_fkey" FOREIGN KEY ("akaEntryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_aoEntryId_fkey" FOREIGN KEY ("aoEntryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
