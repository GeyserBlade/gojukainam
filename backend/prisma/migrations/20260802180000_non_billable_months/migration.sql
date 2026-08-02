-- AlterTable
ALTER TABLE "ClubBillingConfig" ADD COLUMN     "nonBillableMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

