-- Classes: which class a member trains in, and who teaches it.
--
-- The basis for splitting monthly fee income between instructors. Dated
-- rather than overwritten (see the classes section of schema.prisma): a class
-- that becomes shared in March must not re-split January's fees.
--
-- Additive only: four new tables, no change to any existing column.

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "athleteId" TEXT,
    "userId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassInstructor" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassEnrolment" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Instructor_clubId_idx" ON "Instructor"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_clubId_name_key" ON "Instructor"("clubId", "name");

-- CreateIndex
CREATE INDEX "Class_clubId_idx" ON "Class"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_clubId_name_key" ON "Class"("clubId", "name");

-- CreateIndex
CREATE INDEX "ClassInstructor_classId_startDate_idx" ON "ClassInstructor"("classId", "startDate");

-- CreateIndex
CREATE INDEX "ClassInstructor_instructorId_idx" ON "ClassInstructor"("instructorId");

-- CreateIndex
CREATE INDEX "ClassEnrolment_athleteId_startDate_idx" ON "ClassEnrolment"("athleteId", "startDate");

-- CreateIndex
CREATE INDEX "ClassEnrolment_classId_idx" ON "ClassEnrolment"("classId");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInstructor" ADD CONSTRAINT "ClassInstructor_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInstructor" ADD CONSTRAINT "ClassInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrolment" ADD CONSTRAINT "ClassEnrolment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrolment" ADD CONSTRAINT "ClassEnrolment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- What Prisma cannot express.
-- ---------------------------------------------------------------------------

-- One class at a time. A member with two open enrolments would have their fee
-- counted against two classes' instructors, and the split would quietly
-- exceed what was paid.
CREATE UNIQUE INDEX "class_enrolment_one_open_per_athlete"
    ON "ClassEnrolment" ("athleteId")
    WHERE "endDate" IS NULL;

-- An instructor is on a class once at a time; two open rows would count them
-- twice and turn a 50/50 into 67/33.
CREATE UNIQUE INDEX "class_instructor_one_open_per_pair"
    ON "ClassInstructor" ("classId", "instructorId")
    WHERE "endDate" IS NULL;

-- A period that ends before it starts covers no day and would vanish from
-- every split without a trace.
ALTER TABLE "ClassEnrolment"
    ADD CONSTRAINT "class_enrolment_dates" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");
ALTER TABLE "ClassInstructor"
    ADD CONSTRAINT "class_instructor_dates" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");
