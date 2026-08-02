-- Fix Athlete.joinDate and Athlete.lastGraded, shifted a day by the same
-- timezone conversion that hit dob.
--
-- Companion to fix-dob-timezone-shift.sql, which is already applied. dob is
-- deliberately NOT touched here: it is fixed, verified, and has its own backup
-- table, and re-normalising a correct value is pointless risk.
--
-- SAME CAUSE. Date-only values written as the UTC instant of local midnight,
-- so the stored date component is the day BEFORE the real one:
--
--   really joined 1 Feb 2017   ->  stored 2017-01-31 22:00:00   (UTC+2)
--   really graded 21 Jun 2025  ->  stored 2025-06-20 22:00:00
--
-- Measured on production, 54 members:
--   joinDate     37 of 48 at 22:00:00, 11 correct, 6 null
--   lastGraded    9 of 35 at 22:00:00, 26 correct, 19 null
--
-- WHY IT MATTERS LESS THAN dob, BUT STILL MATTERS. Nothing bills off either
-- column, so no money is wrong. But "when did Ben join?" answers a day out,
-- and lastGraded feeds grading eligibility: time-in-grade will not care about
-- one day, while a notice reading "graded 20 June" when it was the 21st is
-- exactly what a parent notices.
--
-- DIFFERENT FROM dob IN ONE WAY: both columns are nullable. Every operation
-- below is null-safe, and a null stays null rather than becoming an epoch.
--
-- SAFE TO RE-RUN. After the fix a value is local midnight; re-applying maps
-- midnight to 01:00/02:00 the same day, so the date does not move. Idempotent
-- only because Africa/Windhoek is never behind UTC — hence the hardcoded zone.
--
-- Usage:
--   psql "$DBURL" -f backend/scripts/fix-athlete-date-shift.sql
--
-- Rollback:
--   UPDATE "Athlete" a SET "joinDate" = b."oldJoinDate", "lastGraded" = b."oldLastGraded"
--     FROM "_AthleteDateBackup" b WHERE b."athleteId" = a.id;

\set ON_ERROR_STOP on
\pset border 2
\timing off

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Back up both columns before touching anything.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "_AthleteDateBackup" (
    "athleteId"     text PRIMARY KEY,
    "oldJoinDate"   timestamp(3),
    "oldLastGraded" timestamp(3),
    "backedUpAt"    timestamptz NOT NULL DEFAULT now()
);

-- DO NOTHING keeps the FIRST backup authoritative, so a second run cannot
-- overwrite the originals with already-corrected values and destroy the
-- rollback path.
INSERT INTO "_AthleteDateBackup" ("athleteId", "oldJoinDate", "oldLastGraded")
SELECT id, "joinDate", "lastGraded" FROM "Athlete"
ON CONFLICT ("athleteId") DO NOTHING;

\echo ''
\echo '=== Before ==='
SELECT 'joinDate' AS column, coalesce(to_char("joinDate", 'HH24:MI:SS'), '(null)') AS time_component,
       count(*) AS members
FROM "Athlete" GROUP BY 1, 2
UNION ALL
SELECT 'lastGraded', coalesce(to_char("lastGraded", 'HH24:MI:SS'), '(null)'), count(*)
FROM "Athlete" GROUP BY 1, 2
ORDER BY 1, 3 DESC;

-- ---------------------------------------------------------------------------
-- 2. Normalise. IS DISTINCT FROM rather than <> so nulls compare correctly
--    and a null row is simply not updated.
-- ---------------------------------------------------------------------------
UPDATE "Athlete"
   SET "joinDate" = ("joinDate" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Windhoek')::date
 WHERE "joinDate" IS NOT NULL
   AND "joinDate" IS DISTINCT FROM
       ("joinDate" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Windhoek')::date::timestamp;

UPDATE "Athlete"
   SET "lastGraded" = ("lastGraded" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Windhoek')::date
 WHERE "lastGraded" IS NOT NULL
   AND "lastGraded" IS DISTINCT FROM
       ("lastGraded" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Windhoek')::date::timestamp;

\echo ''
\echo '=== After — every non-null value must read 00:00:00 ==='
SELECT 'joinDate' AS column, coalesce(to_char("joinDate", 'HH24:MI:SS'), '(null)') AS time_component,
       count(*) AS members
FROM "Athlete" GROUP BY 1, 2
UNION ALL
SELECT 'lastGraded', coalesce(to_char("lastGraded", 'HH24:MI:SS'), '(null)'), count(*)
FROM "Athlete" GROUP BY 1, 2
ORDER BY 1, 3 DESC;

\echo ''
\echo '=== Net effect vs the backup ==='
SELECT
  count(*) FILTER (WHERE a."joinDate"::date = b."oldJoinDate"::date)         AS join_unchanged,
  count(*) FILTER (WHERE a."joinDate"::date = b."oldJoinDate"::date + 1)     AS join_moved_1_day,
  count(*) FILTER (WHERE a."lastGraded"::date = b."oldLastGraded"::date)     AS graded_unchanged,
  count(*) FILTER (WHERE a."lastGraded"::date = b."oldLastGraded"::date + 1) AS graded_moved_1_day
FROM "Athlete" a JOIN "_AthleteDateBackup" b ON b."athleteId" = a.id;

-- ---------------------------------------------------------------------------
-- 3. Refuse to commit on any unexpected movement, or a surviving non-midnight
--    value, or a null that became non-null (or the reverse).
-- ---------------------------------------------------------------------------
DO $$
DECLARE bad int; stragglers int; nulls int;
BEGIN
    SELECT count(*) INTO bad
      FROM "Athlete" a JOIN "_AthleteDateBackup" b ON b."athleteId" = a.id
     WHERE (a."joinDate" IS NOT NULL
            AND a."joinDate"::date NOT IN (b."oldJoinDate"::date, b."oldJoinDate"::date + 1))
        OR (a."lastGraded" IS NOT NULL
            AND a."lastGraded"::date NOT IN (b."oldLastGraded"::date, b."oldLastGraded"::date + 1));
    IF bad > 0 THEN
        RAISE EXCEPTION 'Aborting: % row(s) moved by an unexpected amount', bad;
    END IF;

    SELECT count(*) INTO stragglers
      FROM "Athlete"
     WHERE ("joinDate" IS NOT NULL AND to_char("joinDate", 'HH24:MI:SS') <> '00:00:00')
        OR ("lastGraded" IS NOT NULL AND to_char("lastGraded", 'HH24:MI:SS') <> '00:00:00');
    IF stragglers > 0 THEN
        RAISE EXCEPTION 'Aborting: % row(s) still not at midnight', stragglers;
    END IF;

    SELECT count(*) INTO nulls
      FROM "Athlete" a JOIN "_AthleteDateBackup" b ON b."athleteId" = a.id
     WHERE (a."joinDate" IS NULL) <> (b."oldJoinDate" IS NULL)
        OR (a."lastGraded" IS NULL) <> (b."oldLastGraded" IS NULL);
    IF nulls > 0 THEN
        RAISE EXCEPTION 'Aborting: % row(s) gained or lost a null', nulls;
    END IF;
END $$;

COMMIT;

\echo ''
\echo 'Committed. Backup retained in "_AthleteDateBackup" — drop it once a few'
\echo 'join dates and grading dates have been checked against what you know.'
