-- Money invariants. Read-only. Run after any reconciliation pass, and before
-- believing a billing report.
--
-- These are the properties the allocation transaction is written to preserve.
-- If any query below returns rows, something wrote money outside that path and
-- the numbers on every screen are wrong.
--
-- Usage:
--   psql "$DBURL" -f backend/scripts/check-billing-invariants.sql

\set ON_ERROR_STOP on
\pset border 2

\echo ''
\echo '=== 1. amountPaidCents must equal the sum of allocations ==='
\echo '--- (recomputed, never incremented — a drift here means someone incremented)'
SELECT i.id, i."paymentRef", i."amountPaidCents",
       coalesce(sum(a."amountCents"), 0) AS allocated,
       i."amountPaidCents" - coalesce(sum(a."amountCents"), 0) AS drift
FROM "MemberInvoice" i
LEFT JOIN "PaymentAllocation" a ON a."invoiceId" = i.id
GROUP BY i.id, i."paymentRef", i."amountPaidCents"
HAVING i."amountPaidCents" <> coalesce(sum(a."amountCents"), 0);

\echo ''
\echo '=== 2. no invoice may be allocated beyond its total ==='
SELECT i.id, i."paymentRef", i."totalCents", sum(a."amountCents") AS allocated
FROM "MemberInvoice" i
JOIN "PaymentAllocation" a ON a."invoiceId" = i.id
GROUP BY i.id, i."paymentRef", i."totalCents"
HAVING sum(a."amountCents") > i."totalCents";

\echo ''
\echo '=== 3. no payment may be allocated beyond its own value ==='
SELECT p.id, p."receivedDate"::date, p."amountCents", sum(a."amountCents") AS allocated
FROM "Payment" p
JOIN "PaymentAllocation" a ON a."paymentId" = p.id
GROUP BY p.id, p."receivedDate", p."amountCents"
HAVING sum(a."amountCents") > p."amountCents";

\echo ''
\echo '=== 4. PAID must mean fully paid ==='
SELECT id, "paymentRef", status, "amountPaidCents", "totalCents"
FROM "MemberInvoice"
WHERE status = 'PAID' AND "amountPaidCents" < "totalCents";

\echo ''
\echo '=== 5. PARTIALLY_PAID must mean partly, not fully or not at all ==='
SELECT id, "paymentRef", status, "amountPaidCents", "totalCents"
FROM "MemberInvoice"
WHERE status = 'PARTIALLY_PAID'
  AND ("amountPaidCents" <= 0 OR "amountPaidCents" >= "totalCents");

\echo ''
\echo '=== 6. an allocation may never cross a club boundary ==='
SELECT a.id, p."clubId" AS payment_club, i."clubId" AS invoice_club
FROM "PaymentAllocation" a
JOIN "Payment" p ON p.id = a."paymentId"
JOIN "MemberInvoice" i ON i.id = a."invoiceId"
WHERE p."clubId" <> i."clubId";

\echo ''
\echo '=== 7. every invoice reference must embed its member reference ==='
\echo '--- (a mismatch means a reference was reassigned after invoicing)'
SELECT i.id, i."paymentRef", a."invoiceRef" AS member_ref
FROM "MemberInvoice" i
JOIN "Athlete" a ON a.id = i."athleteId"
WHERE a."invoiceRef" IS NOT NULL
  AND i."paymentRef" NOT LIKE a."invoiceRef" || '-%';

\echo ''
\echo '=== 8. no duplicate subscription invoice for a member in a period ==='
\echo '--- (the @@unique should make this impossible; verifying it holds)'
SELECT "clubId", "athleteId", "periodKey", count(*)
FROM "MemberInvoice"
WHERE "periodKey" IS NOT NULL
GROUP BY 1, 2, 3 HAVING count(*) > 1;

\echo ''
\echo '=== Totals, for eyeballing against the club dashboard ==='
SELECT c.name AS club,
       count(*) FILTER (WHERE i.status NOT IN ('DRAFT','CANCELLED'))      AS live_invoices,
       sum(i."totalCents")      FILTER (WHERE i.status NOT IN ('DRAFT','CANCELLED')) AS invoiced,
       sum(i."amountPaidCents") FILTER (WHERE i.status NOT IN ('DRAFT','CANCELLED')) AS collected,
       -- Two independent scalar subqueries, NOT a join. Joining Payment to
       -- PaymentAllocation fans out any payment with more than one allocation
       -- — one bank line settling two members' invoices gets its amount
       -- counted twice — and the credit figure comes out too high.
       (SELECT coalesce(sum(p."amountCents"), 0)
          FROM "Payment" p WHERE p."clubId" = c.id)
       - (SELECT coalesce(sum(al."amountCents"), 0)
            FROM "PaymentAllocation" al
            JOIN "Payment" p2 ON p2.id = al."paymentId"
           WHERE p2."clubId" = c.id)                                       AS unallocated_credit
FROM "MemberInvoice" i
JOIN "Club" c ON c.id = i."clubId"
GROUP BY c.id, c.name;

\echo ''
\echo 'Every section above should be empty except the last. Rows anywhere else'
\echo 'mean money was written outside the allocation transaction.'
