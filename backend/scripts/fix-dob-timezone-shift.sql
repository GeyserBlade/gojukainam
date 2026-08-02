-- Fix Athlete.dob values that were shifted a day by a timezone conversion.
--
-- WHAT WENT WRONG
-- `dob` is a date-only concept stored in `timestamp(3) without time zone`.
-- Something wrote date-only values as the UTC *instant* of local midnight, so
-- the stored date component is the day BEFORE the real birthday:
--
--   real 2 Sep 2019, Windhoek UTC+2  ->  stored 2019-09-01 22:00:00
--   real 11 Jun 2004, Windhoek UTC+1  -> stored 2004-06-10 23:00:00
--
-- The two offsets are not two import paths. Namibia ran UTC+1 with summer DST
-- from 1994 until abolishing DST in September 2017, and UTC+2 either side of
-- that. The converter used the offset in effect *on the birth date*, so a
-- winter DST-era birthday lands at 23:00 and everything else at 22:00.
--
-- WHY NOBODY NOTICED
-- It round-trips. Prisma reads a naive timestamp back as a JS Date interpreted
-- as UTC, and a browser at +2 renders 2019-09-01T22:00Z as 2 September — the
-- right date. The read offset undoes the write offset, so every existing screen
-- has been correct by accident.
--
-- WHY IT MUST BE FIXED ANYWAY
-- The accident only holds while the reader sits at UTC+2. Any code taking UTC
-- calendar components — which is the correct, portable way to do date-only
-- arithmetic, and what the billing/birthday tools do — reads the day before for
-- 84 of 88 athletes. Silently, and next to app screens showing the right date.
--
-- THE FIX
-- Re-interpret each value as a UTC instant, convert back to Windhoek local, and
-- keep the calendar date at true midnight. Postgres consults the same historical
-- DST table the original conversion used, so this inverts it exactly rather than
-- approximately.
--
-- SAFE TO RE-RUN. After the fix a value is midnight local; re-applying maps
-- midnight -> 01:00/02:00 the same day -> the same date. Idempotent because
-- Africa/Windhoek is never behind UTC. It would NOT be idempotent for a
-- negative-offset zone, which is why the zone is hardcoded rather than taken
-- from a session setting. Every club in this federation is Namibian.
--
-- Usage:
--   psql "$DBURL" -f backend/scripts/fix-dob-timezone-shift.sql
--
-- Rollback (the backup table is written before anything changes):
--   UPDATE "Athlete" a SET dob = b."oldDob"
--     FROM "_AthleteDobBackup" b WHERE b."athleteId" = a.id;

\set ON_ERROR_STOP on
\pset border 2
\timing off

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Back up every current value, before touching anything.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "_AthleteDobBackup" (
    "athleteId"  text        PRIMARY KEY,
    "oldDob"     timestamp(3) NOT NULL,
    "backedUpAt" timestamptz NOT NULL DEFAULT now()
);

-- DO NOTHING keeps the FIRST backup authoritative. If this script is ever run
-- twice, the second run must not overwrite the originals with already-fixed
-- values — that would silently destroy the rollback path.
INSERT INTO "_AthleteDobBackup" ("athleteId", "oldDob")
SELECT id, dob FROM "Athlete"
ON CONFLICT ("athleteId") DO NOTHING;

\echo ''
\echo '=== Before ==='
SELECT to_char(dob, 'HH24:MI:SS') AS time_component, count(*) AS members
FROM "Athlete" GROUP BY 1 ORDER BY 2 DESC;

-- ---------------------------------------------------------------------------
-- 2. Normalise. The predicate catches both a wrong date component and a
--    stray non-midnight time, and leaves already-correct rows untouched.
-- ---------------------------------------------------------------------------
UPDATE "Athlete"
   SET dob = (dob AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Windhoek')::date
 WHERE dob IS DISTINCT FROM
       (dob AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Windhoek')::date::timestamp;

\echo ''
\echo '=== After — every row must read 00:00:00 ==='
SELECT to_char(dob, 'HH24:MI:SS') AS time_component, count(*) AS members
FROM "Athlete" GROUP BY 1 ORDER BY 2 DESC;

\echo ''
\echo '=== Net effect vs the backup ==='
SELECT count(*)                                            AS athletes,
       count(*) FILTER (WHERE a.dob::date = b."oldDob"::date) AS date_unchanged,
       count(*) FILTER (WHERE a.dob::date = b."oldDob"::date + 1) AS moved_forward_1_day,
       count(*) FILTER (WHERE a.dob::date NOT IN
                              (b."oldDob"::date, b."oldDob"::date + 1)) AS unexpected
FROM "Athlete" a JOIN "_AthleteDobBackup" b ON b."athleteId" = a.id;

-- ---------------------------------------------------------------------------
-- 3. Refuse to commit if anything moved by something other than 0 or 1 day.
-- ---------------------------------------------------------------------------
DO $$
DECLARE bad int; stragglers int;
BEGIN
    SELECT count(*) INTO bad
      FROM "Athlete" a JOIN "_AthleteDobBackup" b ON b."athleteId" = a.id
     WHERE a.dob::date NOT IN (b."oldDob"::date, b."oldDob"::date + 1);
    IF bad > 0 THEN
        RAISE EXCEPTION 'Aborting: % row(s) moved by an unexpected amount', bad;
    END IF;

    SELECT count(*) INTO stragglers
      FROM "Athlete" WHERE to_char(dob, 'HH24:MI:SS') <> '00:00:00';
    IF stragglers > 0 THEN
        RAISE EXCEPTION 'Aborting: % row(s) are still not at midnight', stragglers;
    END IF;
END $$;

COMMIT;

\echo ''
\echo 'Committed. Backup retained in "_AthleteDobBackup" — drop it only once the'
\echo 'frontend and the billing birthday tools have both been checked against a'
\echo 'few members you know the real birthdays of.'
