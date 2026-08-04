-- CreateTable
CREATE TABLE "EventCoordinator" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCoordinator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventCoordinator_userId_idx" ON "EventCoordinator"("userId");

-- CreateIndex
CREATE INDEX "EventCoordinator_eventId_idx" ON "EventCoordinator"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCoordinator_eventId_userId_key" ON "EventCoordinator"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventCoordinator" ADD CONSTRAINT "EventCoordinator_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCoordinator" ADD CONSTRAINT "EventCoordinator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCoordinator" ADD CONSTRAINT "EventCoordinator_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

