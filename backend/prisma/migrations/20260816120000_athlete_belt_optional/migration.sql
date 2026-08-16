-- Grade (belt) becomes optional on an athlete: a club may register someone
-- before their grade is known or confirmed. Existing rows are unaffected — this
-- only drops the NOT NULL, so every athlete keeps the belt they already have.
--
-- The foreign key is deliberately left as it is (ON DELETE RESTRICT). Prisma
-- would default an optional relation to SET NULL, which would silently regrade
-- every athlete when a belt is deleted; the schema pins onDelete: Restrict so
-- this migration has no FK statement at all.
-- AlterTable
ALTER TABLE "Athlete" ALTER COLUMN "beltId" DROP NOT NULL;
