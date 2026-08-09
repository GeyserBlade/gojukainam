-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "boutDurationSec" INTEGER,
ADD COLUMN     "bufferPct" DOUBLE PRECISION,
ADD COLUMN     "winByGap" INTEGER;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "timingJson" TEXT;

