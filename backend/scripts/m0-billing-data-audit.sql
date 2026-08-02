-- M0 — billing data audit. Read-only. Run before writing any billing schema.
--
-- Club-scoped billing (sensai plan v3.2 §2.1) assumes things about the club's
-- existing rows that nobody has checked. Three features depend on them:
--
--   birthdays   need real `dob` values, not import placeholders
--   invoicing   needs `isActive` to mean "actually trains here"
--   references  need `invoiceRef` to be empty, or already the scheme we want
--
-- The last one can force a design change: the plan uses the existing
-- Athlete.invoiceRef as the member payment reference. If it already holds
-- values under some other scheme, that decision reverses and billing gets its
-- own `memberRef` column instead. Decide from this output, not from optimism.
--
-- Usage (Railway production, read-only):
--   psql "$RAILWAY_DATABASE_URL" -v club=Windhoek -f backend/scripts/m0-billing-data-audit.sql
--
-- `club` is matched with ILIKE '%…%'. Check §1 output before trusting the rest:
-- if it returns more than one club, narrow the pattern.

\set ON_ERROR_STOP on
\pset border 2
-- Note the unquoted :club here — using :'club' would embed the quotes in the
-- pattern itself and silently match nothing.
\set club_pattern '%' :club '%'

\echo '=== 1. Which club(s) does the pattern match? ==='
SELECT c.id, c.name, count(a.id) AS athletes,
       count(a.id) FILTER (WHERE a."isActive") AS active
FROM "Club" c LEFT JOIN "Athlete" a ON a."clubId" = c.id
WHERE c.name ILIKE :'club_pattern'
GROUP BY c.id, c.name ORDER BY c.name;

\echo ''
\echo '=== 2. How is dob actually stored? ==='
-- Prisma DateTime maps to timestamp(3) WITHOUT time zone by default. The client
-- reads it back as a JS Date interpreted as UTC, so all age arithmetic must use
-- getUTCFullYear/Month/Date. A non-zero time component means something wrote
-- through a timezone and the date may already be off by one.
SELECT column_name, data_type, datetime_precision
FROM information_schema.columns
WHERE table_name = 'Athlete' AND column_name = 'dob';

SELECT count(*) AS athletes,
       count(DISTINCT to_char(dob, 'HH24:MI:SS')) AS distinct_time_components,
       min(to_char(dob, 'HH24:MI:SS')) AS min_time,
       max(to_char(dob, 'HH24:MI:SS')) AS max_time
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern';

\echo ''
\echo '=== 3. Is dob real, or placeholder? ==='
-- dob is NOT NULL, so everyone has *a* value. That is the trap: absence shows
-- up as a suspiciously popular date rather than as a null.
SELECT count(*) AS athletes,
       count(*) FILTER (WHERE date_part('month', dob) = 1
                          AND date_part('day', dob) = 1)      AS jan_1_suspects,
       count(*) FILTER (WHERE dob > now() - interval '3 years')  AS impossibly_young,
       count(*) FILTER (WHERE dob < now() - interval '90 years') AS impossibly_old,
       count(*) FILTER (WHERE date_part('month', dob) = 2
                          AND date_part('day', dob) = 29)      AS leap_day_births
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern';

-- Any single date shared by 3+ members is an import artefact until proven
-- otherwise. A real roster does not cluster.
SELECT dob::date, count(*) AS members
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern'
GROUP BY 1 HAVING count(*) >= 3 ORDER BY 2 DESC;

\echo ''
\echo '=== 4. invoiceRef — the decision this audit exists for ==='
SELECT count(*) AS athletes,
       count("invoiceRef") AS with_ref,
       count(DISTINCT "invoiceRef") AS distinct_refs
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern';

-- What shape are the existing values? Empty result => adopt the plan's scheme
-- as designed. Anything else => read it before deciding.
SELECT "invoiceRef", count(*) AS members
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern' AND "invoiceRef" IS NOT NULL
GROUP BY 1 ORDER BY 1 LIMIT 30;

\echo ''
\echo '--- Federation-wide duplicate check. This is the one statement in the'
\echo '--- billing migration that can FAIL against production data:'
\echo '---   CREATE UNIQUE INDEX athlete_invoice_ref_club_key'
\echo '---     ON "Athlete" ("clubId","invoiceRef") WHERE "invoiceRef" IS NOT NULL;'
\echo '--- Rows here must be resolved before that index is applied.'
SELECT "clubId", "invoiceRef", count(*) AS collisions
FROM "Athlete"
WHERE "invoiceRef" IS NOT NULL
GROUP BY 1, 2 HAVING count(*) > 1 ORDER BY 3 DESC;

\echo ''
\echo '=== 5. Who can actually be contacted about an invoice? ==='
-- Parents are the contact records; agents never message a minor (plan §7).
-- A member with no guardian contact and a dob under 18 cannot be invoiced to
-- anyone, which is a data task, not a software one.
SELECT count(*) AS athletes,
       count(*) FILTER (WHERE a."isActive") AS active,
       count(a."contactEmail")   AS email,
       count(a."contactPhone")   AS phone,
       count(a."guardianName1")  AS guardian_name,
       count(a."guardianPhone1") AS guardian_phone,
       count(*) FILTER (WHERE a."isActive"
                          AND a.dob > now() - interval '18 years'
                          AND a."guardianPhone1" IS NULL
                          AND a."contactPhone" IS NULL)  AS minors_uncontactable
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern';

\echo ''
\echo '=== 6. isActive hygiene — the invoice run bills exactly this set ==='
SELECT a."isActive",
       count(*) AS members,
       min(a."joinDate")::date AS earliest_join,
       max(a."joinDate")::date AS latest_join,
       count(*) FILTER (WHERE a."joinDate" IS NULL) AS no_join_date,
       count(*) FILTER (WHERE a."lastGraded" < now() - interval '2 years') AS not_graded_2y
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern'
GROUP BY 1;

\echo ''
\echo '=== 7. The roster the first invoice run would bill ==='
SELECT a."lastName", a."firstName", a.dob::date,
       date_part('year', age(a.dob))::int AS age_years,
       a."invoiceRef", a."guardianName1", a."guardianPhone1"
FROM "Athlete" a JOIN "Club" c ON c.id = a."clubId"
WHERE c.name ILIKE :'club_pattern' AND a."isActive"
ORDER BY a."lastName", a."firstName";
