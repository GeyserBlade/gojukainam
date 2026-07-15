-- AlterTable
ALTER TABLE "Bout" ADD COLUMN     "matId" TEXT;

-- AlterTable
ALTER TABLE "Draw" ADD COLUMN     "matId" TEXT,
ADD COLUMN     "matOrder" INTEGER;

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "checkedIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Mat" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mat_eventId_idx" ON "Mat"("eventId");

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_matId_fkey" FOREIGN KEY ("matId") REFERENCES "Mat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_matId_fkey" FOREIGN KEY ("matId") REFERENCES "Mat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mat" ADD CONSTRAINT "Mat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
