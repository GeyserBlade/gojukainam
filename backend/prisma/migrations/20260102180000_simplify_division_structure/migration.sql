-- Step 1: Add the new 'category' column with a temporary default
ALTER TABLE "public"."Division" ADD COLUMN "category" "public"."CategoryType";

-- Step 2: Migrate data from categoryType to category
-- If categoryType is 'BOTH', default to KATA (will need manual review)
UPDATE "public"."Division"
SET "category" = CASE
  WHEN "categoryType" = 'KATA' THEN 'KATA'::"public"."CategoryType"
  WHEN "categoryType" = 'KUMITE' THEN 'KUMITE'::"public"."CategoryType"
  WHEN "categoryType" = 'BOTH' THEN 'KATA'::"public"."CategoryType"
  ELSE 'KATA'::"public"."CategoryType"
END;

-- Step 3: Make category NOT NULL now that all rows have values
ALTER TABLE "public"."Division" ALTER COLUMN "category" SET NOT NULL;

-- Step 4: Drop the old columns
ALTER TABLE "public"."Division" DROP COLUMN "categoryType";
ALTER TABLE "public"."Division" DROP COLUMN "competitorType";
ALTER TABLE "public"."Division" DROP COLUMN "minWeightKg";
ALTER TABLE "public"."Division" DROP COLUMN "maxWeightKg";

-- Step 5: Remove BOTH from CategoryType enum
ALTER TYPE "public"."CategoryType" RENAME TO "CategoryType_old";
CREATE TYPE "public"."CategoryType" AS ENUM ('KATA', 'KUMITE');
ALTER TABLE "public"."Division" ALTER COLUMN "category" TYPE "public"."CategoryType" USING "category"::text::"public"."CategoryType";
DROP TYPE "public"."CategoryType_old";

-- Step 6: Drop CompetitorType enum (no longer needed)
DROP TYPE IF EXISTS "public"."CompetitorType";

-- Step 7: Drop old index and create new ones
DROP INDEX IF EXISTS "public"."Division_eventId_categoryType_competitorType_idx";
CREATE INDEX "Division_eventId_category_gender_idx" ON "public"."Division"("eventId", "category", "gender");
