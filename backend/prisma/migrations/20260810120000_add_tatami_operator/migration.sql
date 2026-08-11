-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TATAMI_OPERATOR';

-- CreateTable
CREATE TABLE "MatOperator" (
    "id" TEXT NOT NULL,
    "matId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatOperator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatOperator_userId_idx" ON "MatOperator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatOperator_matId_userId_key" ON "MatOperator"("matId", "userId");

-- AddForeignKey
ALTER TABLE "MatOperator" ADD CONSTRAINT "MatOperator_matId_fkey" FOREIGN KEY ("matId") REFERENCES "Mat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatOperator" ADD CONSTRAINT "MatOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatOperator" ADD CONSTRAINT "MatOperator_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

