-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('MONTHLY', 'GRADING', 'TOURNAMENT_ENTRY', 'CAMP', 'REGISTRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeCadence" AS ENUM ('MONTHLY', 'ONE_OFF');

-- CreateEnum
CREATE TYPE "MemberInvoiceStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "MemberInvoiceKind" AS ENUM ('SUBSCRIPTION', 'ONE_OFF');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFT', 'CASH', 'CARD', 'DEBIT_ORDER', 'OTHER');

-- CreateTable
CREATE TABLE "ClubBillingConfig" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'NAD',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Windhoek',
    "refPrefix" TEXT NOT NULL DEFAULT 'KAR',
    "nextRefSeq" INTEGER NOT NULL DEFAULT 1,
    "invoiceDay" INTEGER NOT NULL DEFAULT 1,
    "dueDaysAfter" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubBillingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeSchedule" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feeType" "FeeType" NOT NULL,
    "cadence" "FeeCadence" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSubscription" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "feeScheduleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "overrideAmountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceRun" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "invoiceCount" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdVia" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberInvoice" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "kind" "MemberInvoiceKind" NOT NULL DEFAULT 'SUBSCRIPTION',
    "periodKey" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "status" "MemberInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentRef" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NAD',
    "runId" TEXT,
    "pdfDocumentId" TEXT,
    "createdVia" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeScheduleId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmountCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,

    CONSTRAINT "MemberInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NAD',
    "method" "PaymentMethod" NOT NULL,
    "bankReference" TEXT,
    "description" TEXT,
    "externalHash" TEXT,
    "source" TEXT NOT NULL,
    "matchMethod" TEXT,
    "matchConfidence" DECIMAL(4,3),
    "recordedVia" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdVia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubBillingConfig_clubId_key" ON "ClubBillingConfig"("clubId");

-- CreateIndex
CREATE INDEX "FeeSchedule_clubId_active_idx" ON "FeeSchedule"("clubId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FeeSchedule_clubId_code_key" ON "FeeSchedule"("clubId", "code");

-- CreateIndex
CREATE INDEX "MemberSubscription_athleteId_idx" ON "MemberSubscription"("athleteId");

-- CreateIndex
CREATE INDEX "MemberSubscription_feeScheduleId_idx" ON "MemberSubscription"("feeScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSubscription_athleteId_feeScheduleId_startDate_key" ON "MemberSubscription"("athleteId", "feeScheduleId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceRun_clubId_periodKey_key" ON "InvoiceRun"("clubId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "MemberInvoice_paymentRef_key" ON "MemberInvoice"("paymentRef");

-- CreateIndex
CREATE UNIQUE INDEX "MemberInvoice_pdfDocumentId_key" ON "MemberInvoice"("pdfDocumentId");

-- CreateIndex
CREATE INDEX "MemberInvoice_clubId_status_dueDate_idx" ON "MemberInvoice"("clubId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "MemberInvoice_athleteId_status_idx" ON "MemberInvoice"("athleteId", "status");

-- CreateIndex
CREATE INDEX "MemberInvoice_clubId_periodKey_idx" ON "MemberInvoice"("clubId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "MemberInvoice_clubId_athleteId_periodKey_key" ON "MemberInvoice"("clubId", "athleteId", "periodKey");

-- CreateIndex
CREATE INDEX "MemberInvoiceLine_invoiceId_idx" ON "MemberInvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "MemberInvoiceLine_feeScheduleId_idx" ON "MemberInvoiceLine"("feeScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalHash_key" ON "Payment"("externalHash");

-- CreateIndex
CREATE INDEX "Payment_clubId_receivedDate_idx" ON "Payment"("clubId", "receivedDate");

-- CreateIndex
CREATE INDEX "Payment_bankReference_idx" ON "Payment"("bankReference");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_invoiceId_key" ON "PaymentAllocation"("paymentId", "invoiceId");

-- AddForeignKey
ALTER TABLE "ClubBillingConfig" ADD CONSTRAINT "ClubBillingConfig_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES "FeeSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRun" ADD CONSTRAINT "InvoiceRun_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvoice" ADD CONSTRAINT "MemberInvoice_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvoice" ADD CONSTRAINT "MemberInvoice_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvoice" ADD CONSTRAINT "MemberInvoice_runId_fkey" FOREIGN KEY ("runId") REFERENCES "InvoiceRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvoiceLine" ADD CONSTRAINT "MemberInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "MemberInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvoiceLine" ADD CONSTRAINT "MemberInvoiceLine_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES "FeeSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "MemberInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Member payment references must be unique WITHIN a club, and only where set.
-- Prisma cannot express a partial unique index, so it is appended here.
--
-- This is the only statement in this migration that can fail against existing
-- data. The M0 audit (backend/scripts/m0-billing-data-audit.sql) found 0 of 88
-- athletes with an invoiceRef and no duplicates federation-wide, so it applies
-- cleanly today — re-run that audit before deploying if time has passed.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "athlete_invoice_ref_club_key"
    ON "Athlete" ("clubId", "invoiceRef")
    WHERE "invoiceRef" IS NOT NULL;
