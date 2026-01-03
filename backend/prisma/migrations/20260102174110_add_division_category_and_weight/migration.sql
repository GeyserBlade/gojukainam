-- CreateEnum
CREATE TYPE "public"."CategoryType" AS ENUM ('KATA', 'KUMITE', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."CompetitorType" AS ENUM ('INDIVIDUAL', 'TEAM', 'BOTH');

-- AlterTable
ALTER TABLE "public"."Division" ADD COLUMN     "categoryType" "public"."CategoryType" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "competitorType" "public"."CompetitorType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "maxWeightKg" DOUBLE PRECISION,
ADD COLUMN     "minWeightKg" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Division_eventId_categoryType_competitorType_idx" ON "public"."Division"("eventId", "categoryType", "competitorType");
