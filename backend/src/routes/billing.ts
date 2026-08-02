import { Router } from "express";
import type { Request } from "express";
import { validate, validateMultiple } from "../middleware/validate.js";
import { requireAgentOrRoles, assertAgentClub } from "../utils/agent-auth.js";
import { requireBillingEnabled } from "../utils/billing-guard.js";
import { getParam } from "../utils/params.js";
import { startOfUtcDay } from "../utils/dates.js";
import {
  AllocatePayment, ArrearsQuery, BillingClubQuery, BillingInvoicesQuery, BillingMemberSearchQuery,
  BillingMembersQuery, BillingPaymentsQuery, BillingSummaryQuery, BirthdaysQuery,
  CreateFeeSchedule, CreateInvoiceRun, CreateSubscription, OpenInvoicesQuery,
  RecordPayment, SetMemberInvoiceStatus,
} from "../utils/validators.js";
import { BillingMemberService } from "../services/billing-member.service.js";
import { MemberInvoiceService } from "../services/member-invoice.service.js";
import { BillingPaymentWriteService } from "../services/billing-payment.service.js";
import {
  BillingConfigService, BillingInvoiceService, BillingPaymentService,
  FeeScheduleService, SubscriptionService,
} from "../services/billing.service.js";
import { prisma } from "../lib/prisma.js";

export const router = Router();

/**
 * Club billing — read endpoints (M1b).
 *
 * Every handler does the same three things before any work, in this order:
 *   1. requireBillingEnabled(clubId) — 404 for clubs that have not opted in,
 *      so the feature is invisible to the rest of the federation
 *   2. assertAgentClub(req, clubId)  — a service key may only act for its club
 *   3. the query itself, always filtered by clubId
 *
 * Role gate is requireAgentOrRoles: admin-ui reaches these through tools-api
 * with a scoped key, and a CLUB_MANAGER reaches the same endpoints from the
 * federation frontend.
 */

const readGate = requireAgentOrRoles(
  ["billing:read"],
  "SUPERADMIN", "ADMIN", "CLUB_MANAGER",
);

/** `asOf` defaults to today. Parsed to a UTC calendar day — never a local one. */
function asOfFrom(value: unknown): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfUtcDay(new Date(`${value}T00:00:00Z`));
  }
  return startOfUtcDay(new Date());
}

/**
 * 404 for a club that has not opted in, then 403 for any caller reaching
 * outside its own club. Order matters: a non-participating club learns nothing
 * about the feature, even from a caller who would otherwise be refused.
 *
 * Both caller kinds are checked. requireAgentOrRoles only says *this kind of
 * caller may call this*; ownership is a separate question, per
 * docs/conventions.md — and a CLUB_MANAGER passing someone else's clubId is
 * exactly as much a cross-tenant read as a service key doing it.
 */
async function gate(req: Request, clubId: string) {
  await requireBillingEnabled(clubId);
  assertAgentClub(req, clubId);

  const role = req.user?.role;
  if (role && role !== "SUPERADMIN" && role !== "ADMIN" && req.user?.clubId !== clubId) {
    throw { status: 403, message: "Forbidden" };
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
router.get("/config/:clubId", readGate, async (req, res, next) => {
  try {
    const clubId = getParam(req.params.clubId);
    await gate(req, clubId);
    const config = await BillingConfigService.get(clubId);
    if (!config) return res.status(404).json({ error: "Not found" });
    res.json(config);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Members — the Q&A surface
// ---------------------------------------------------------------------------
router.get("/members", readGate, validate(BillingMembersQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingMembersQuery.parse(req.query);
    await gate(req, q.clubId);
    const asOf = asOfFrom(undefined);
    res.json({
      asOf: asOf.toISOString().slice(0, 10),
      members: await BillingMemberService.list(
        q.clubId,
        { includeInactive: q.includeInactive ?? false, ...(q.q ? { q: q.q } : {}) },
        asOf,
      ),
    });
  } catch (err) { next(err); }
});

router.get("/members/search", readGate, validate(BillingMemberSearchQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingMemberSearchQuery.parse(req.query);
    await gate(req, q.clubId);
    const candidates = await BillingMemberService.search(q.clubId, q.name, q.limit ?? 10);
    // Always a list, even at length 1. A caller that must disambiguate should
    // be made to look at the count rather than handed something authoritative.
    res.json({ query: q.name, count: candidates.length, candidates });
  } catch (err) { next(err); }
});

router.get("/members/:id", readGate, validate(BillingClubQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingClubQuery.parse(req.query);
    await gate(req, q.clubId);
    const member = await BillingMemberService.getById(q.clubId, getParam(req.params.id), asOfFrom(undefined));
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(member);
  } catch (err) { next(err); }
});

router.get("/birthdays", readGate, validate(BirthdaysQuery, "query"), async (req, res, next) => {
  try {
    const q = BirthdaysQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json(
      await BillingMemberService.birthdays(
        q.clubId,
        {
          ...(q.days !== undefined ? { days: q.days } : {}),
          ...(q.from ? { from: q.from } : {}),
          ...(q.to ? { to: q.to } : {}),
        },
        asOfFrom(undefined),
      ),
    );
  } catch (err) { next(err); }
});

router.get("/arrears", readGate, validate(ArrearsQuery, "query"), async (req, res, next) => {
  try {
    const q = ArrearsQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json(await BillingMemberService.arrears(q.clubId, asOfFrom(q.asOf)));
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Fee schedules and subscriptions — what the invoice run will read
// ---------------------------------------------------------------------------
router.get("/fee-schedules", readGate, validate(BillingClubQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingClubQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json(await FeeScheduleService.list(q.clubId));
  } catch (err) { next(err); }
});

router.get("/subscriptions", readGate, validate(BillingClubQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingClubQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json(await SubscriptionService.list(q.clubId, asOfFrom(undefined)));
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Invoices and payments
// ---------------------------------------------------------------------------
router.get("/invoices", readGate, validate(BillingInvoicesQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingInvoicesQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json({
      invoices: await BillingInvoiceService.list(
        q.clubId,
        {
          ...(q.status ? { status: q.status } : {}),
          ...(q.periodKey ? { periodKey: q.periodKey } : {}),
          ...(q.athleteId ? { athleteId: q.athleteId } : {}),
        },
        asOfFrom(q.asOf),
      ),
    });
  } catch (err) { next(err); }
});

// Registered before /invoices/:id so "open" is never read as an id.
router.get("/open-invoices", readGate, validate(OpenInvoicesQuery, "query"), async (req, res, next) => {
  try {
    const q = OpenInvoicesQuery.parse(req.query);
    await gate(req, q.clubId);
    const asOf = asOfFrom(q.asOf);
    res.json({
      asOf: asOf.toISOString().slice(0, 10),
      invoices: await BillingInvoiceService.openInvoices(q.clubId, asOf),
    });
  } catch (err) { next(err); }
});

router.get("/invoices/:id", readGate, validate(BillingClubQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingClubQuery.parse(req.query);
    await gate(req, q.clubId);
    const invoice = await BillingInvoiceService.getById(q.clubId, getParam(req.params.id), asOfFrom(undefined));
    if (!invoice) return res.status(404).json({ error: "Not found" });
    res.json(invoice);
  } catch (err) { next(err); }
});

router.get("/payments", readGate, validate(BillingPaymentsQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingPaymentsQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json({
      payments: await BillingPaymentService.list(q.clubId, {
        ...(q.from ? { from: q.from } : {}),
        ...(q.to ? { to: q.to } : {}),
        ...(q.unallocatedOnly !== undefined ? { unallocatedOnly: q.unallocatedOnly } : {}),
      }),
    });
  } catch (err) { next(err); }
});

router.get("/summary", readGate, validate(BillingSummaryQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingSummaryQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json(
      await BillingInvoiceService.summary(
        q.clubId,
        q.periodKey,
        asOfFrom(undefined),
      ),
    );
  } catch (err) { next(err); }
});

/**
 * Liveness for sensai's heartbeat. Deliberately reports only a count, never
 * which clubs — an enabled-club list is not the agent's business.
 */
router.get("/health", readGate, async (_req, res, next) => {
  try {
    const { prisma } = await import("../lib/prisma.js");
    const enabledClubs = await prisma.clubBillingConfig.count({ where: { enabled: true } });
    res.json({ ok: true, enabledClubs });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Writes (M3)
//
// Same gate as the reads: 404 for a club that has not opted in, then 403 for
// any caller reaching outside its own club. The scope is billing:write, so a
// key issued for reads alone cannot reach any of this.
// ---------------------------------------------------------------------------

const writeGate = requireAgentOrRoles(
  ["billing:write"],
  "SUPERADMIN", "ADMIN", "CLUB_MANAGER",
);

/** Who is doing this, for the createdVia / recordedVia audit trail. */
function actorLabel(req: Request): string {
  if (req.agent) return `agent:${req.agent.name}`;
  return `human:${req.user?.id ?? "unknown"}`;
}

router.post("/invoice-runs", writeGate, validate(CreateInvoiceRun), async (req, res, next) => {
  try {
    const body = CreateInvoiceRun.parse(req.body);
    await gate(req, body.clubId);

    // dryRun is the default. Generating a month of invoices should be the
    // deliberate branch, not the one you get by forgetting a flag.
    if (body.dryRun !== false) {
      return res.json({ dryRun: true, ...(await MemberInvoiceService.planRun(body.clubId, body.periodKey)) });
    }

    const result = await MemberInvoiceService.executeRun(
      body.clubId,
      body.periodKey,
      actorLabel(req),
    );
    res.status(result.replayed ? 200 : 201).json({ dryRun: false, ...result });
  } catch (err) { next(err); }
});

router.post("/invoice-runs/:id/approve", writeGate, validate(BillingClubQuery, "query"), async (req, res, next) => {
  try {
    const q = BillingClubQuery.parse(req.query);
    await gate(req, q.clubId);
    res.json(await MemberInvoiceService.approveRun(q.clubId, getParam(req.params.id)));
  } catch (err) { next(err); }
});

router.post("/invoices/:id/status", writeGate, validateMultiple({ body: SetMemberInvoiceStatus, query: BillingClubQuery }), async (req, res, next) => {
  try {
    const q = BillingClubQuery.parse(req.query);
    const body = SetMemberInvoiceStatus.parse(req.body);
    await gate(req, q.clubId);
    res.json(
      await MemberInvoiceService.setStatus(
        q.clubId,
        getParam(req.params.id),
        body.status,
        body.reason,
      ),
    );
  } catch (err) { next(err); }
});

router.post("/payments", writeGate, validate(RecordPayment), async (req, res, next) => {
  try {
    const body = RecordPayment.parse(req.body);
    await gate(req, body.clubId);
    const result = await BillingPaymentWriteService.record({
      clubId: body.clubId,
      receivedDate: body.receivedDate,
      amountCents: body.amountCents,
      method: body.method,
      source: body.source,
      recordedVia: actorLabel(req),
      bankReference: body.bankReference,
      description: body.description,
      externalHash: body.externalHash,
      matchMethod: body.matchMethod,
      matchConfidence: body.matchConfidence,
      notes: body.notes,
      allocations: body.allocations,
    });
    // A replayed bank line is a no-op, not a conflict: the caller should not
    // have to tell "already recorded" apart from "failed".
    res.status(result.replayed ? 200 : 201).json(result);
  } catch (err) { next(err); }
});

router.post("/payments/:id/allocations", writeGate, validate(AllocatePayment), async (req, res, next) => {
  try {
    const body = AllocatePayment.parse(req.body);
    await gate(req, body.clubId);
    res.json(
      await BillingPaymentWriteService.allocate(
        body.clubId,
        getParam(req.params.id),
        body.allocations,
        actorLabel(req),
      ),
    );
  } catch (err) { next(err); }
});

router.post("/fee-schedules", writeGate, validate(CreateFeeSchedule), async (req, res, next) => {
  try {
    const body = CreateFeeSchedule.parse(req.body);
    await gate(req, body.clubId);
    const { clubId, ...data } = body;
    res.status(201).json(
      await prisma.feeSchedule.create({ data: { clubId, ...data } }),
    );
  } catch (err) { next(err); }
});

router.post("/subscriptions", writeGate, validate(CreateSubscription), async (req, res, next) => {
  try {
    const body = CreateSubscription.parse(req.body);
    await gate(req, body.clubId);

    // The athlete must belong to the club the caller is scoped to, or a
    // subscription becomes a way to reach across the tenant boundary.
    const athlete = await prisma.athlete.findFirst({
      where: { id: body.athleteId, clubId: body.clubId },
      select: { id: true },
    });
    if (!athlete) return res.status(404).json({ error: "Not found" });

    const { clubId, ...data } = body;
    res.status(201).json(await prisma.memberSubscription.create({ data }));
  } catch (err) { next(err); }
});
