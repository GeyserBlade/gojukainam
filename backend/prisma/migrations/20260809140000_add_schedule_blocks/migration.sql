-- CreateEnum
CREATE TYPE "ScheduleBlockKind" AS ENUM ('OPENING', 'CLOSING', 'LUNCH', 'BREAK');

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" "ScheduleBlockKind" NOT NULL,
    "label" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "matId" TEXT,
    "matOrder" INTEGER,
    "startTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleBlock_eventId_idx" ON "ScheduleBlock"("eventId");

-- CreateIndex
CREATE INDEX "ScheduleBlock_matId_idx" ON "ScheduleBlock"("matId");

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_matId_fkey" FOREIGN KEY ("matId") REFERENCES "Mat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

