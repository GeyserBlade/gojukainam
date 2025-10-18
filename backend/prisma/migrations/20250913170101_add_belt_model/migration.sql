/*
  Warnings:

  - You are about to drop the column `beltRank` on the `Athlete` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyName` on the `Athlete` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `Athlete` table. All the data in the column will be lost.
  - You are about to drop the column `guardianName` on the `Athlete` table. All the data in the column will be lost.
  - You are about to drop the column `guardianPhone` on the `Athlete` table. All the data in the column will be lost.
  - You are about to drop the column `waiverUrl` on the `Athlete` table. All the data in the column will be lost.
  - Added the required column `beltId` to the `Athlete` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Athlete" DROP COLUMN "beltRank",
DROP COLUMN "emergencyName",
DROP COLUMN "emergencyPhone",
DROP COLUMN "guardianName",
DROP COLUMN "guardianPhone",
DROP COLUMN "waiverUrl",
ADD COLUMN     "beltId" TEXT NOT NULL,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "guardianName1" TEXT,
ADD COLUMN     "guardianName2" TEXT,
ADD COLUMN     "guardianPhone1" TEXT,
ADD COLUMN     "guardianPhone2" TEXT,
ADD COLUMN     "invoiceRef" TEXT,
ADD COLUMN     "isInstructor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinDate" TIMESTAMP(3),
ADD COLUMN     "lastGraded" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."Belt" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "colour" TEXT,
    "notes" TEXT,
    "gradingRequirements" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Belt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Athlete" ADD CONSTRAINT "Athlete_beltId_fkey" FOREIGN KEY ("beltId") REFERENCES "public"."Belt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
