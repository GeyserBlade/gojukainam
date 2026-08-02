import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthUser } from "./auth.js";

/**
 * Service-account authentication for machine callers — today, the sensai
 * tools-api, which is the only write path its agents have.
 *
 * THE LOAD-BEARING DESIGN DECISION: an API key populates `req.agent` and never
 * `req.user`. `requireRoles` (auth.ts) rejects on `!req.user`, so a key is
 * already denied on every pre-existing route without editing any of them. A key
 * reaches exactly the routes that opt in with `requireAgent` /
 * `requireAgentOrRoles`, and nothing else.
 *
 * Had the key minted a role instead — `req.user = { role: "ADMIN" }` — a
 * credential living in a Docker container would unlock athletes, users, events,
 * draws and every other federation route the moment it leaked. Default-deny
 * here is a property of the type, not of anyone's diligence.
 */

export type AgentIdentity = {
  keyId: string;
  name: string;
  /**
   * The single club this key may act for. Non-nullable by design — see the
   * ApiKey model. A nullable "federation-wide" value would make the club check
   * below a no-op, so the escalation path is removed at the type rather than
   * guarded against at each call site.
   */
  clubId: string;
  scopes: string[];
};

declare global {
  namespace Express {
    interface Request {
      agent?: AgentIdentity;
    }
  }
}

/** Stable id for the User row that exists only as an audit-log FK target. */
export const AGENT_USER_ID = "agent-service";

/** Scopes recognised today. Billing routes land in M1b. */
export const AGENT_SCOPES = [
  "members:read",
  "billing:read",
  "billing:write",
  "payments:write",
] as const;
export type AgentScope = (typeof AGENT_SCOPES)[number];

const KEY_PREFIX = "gjk";
// gjk_<8 hex>_<32+ base64url>
const KEY_PATTERN = /^gjk_([a-f0-9]{8})_([A-Za-z0-9_-]{32,})$/;

/** Write `lastUsedAt` at most this often, so it doesn't cost a write per request. */
const LAST_USED_THROTTLE_MS = 5 * 60 * 1000;

function sha256(input: string): Buffer {
  return crypto.createHash("sha256").update(input, "utf8").digest();
}

/**
 * Mint a key. Returns the plaintext exactly once — it is not recoverable
 * afterwards, because only its sha256 is stored.
 */
export function generateApiKey(): { key: string; prefix: string; hashedKey: string } {
  const prefix = crypto.randomBytes(4).toString("hex");            // 8 chars
  const secret = crypto.randomBytes(24).toString("base64url");     // 32 chars
  const key = `${KEY_PREFIX}_${prefix}_${secret}`;
  return { key, prefix, hashedKey: sha256(key).toString("hex") };
}

/**
 * Resolve a presented key to an agent identity, or null.
 *
 * sha256 rather than bcrypt, deliberately, and unlike the password path in
 * auth.service.ts: this secret carries 192 bits of entropy from a CSPRNG, so
 * there is no dictionary to slow down, and bcrypt would add ~100ms to every
 * agent request. Slow hashing protects low-entropy human passwords; it buys
 * nothing here.
 */
export async function verifyApiKey(raw: string): Promise<AgentIdentity | null> {
  const parsed = KEY_PATTERN.exec(raw);
  if (!parsed) return null;                     // malformed: never touches the DB
  const prefix = parsed[1]!;

  const record = await prisma.apiKey.findUnique({
    where: { prefix },
    select: {
      id: true, name: true, clubId: true, scopes: true, hashedKey: true,
      revokedAt: true, expiresAt: true, lastUsedAt: true,
    },
  });
  if (!record) return null;

  const presented = sha256(raw);
  const stored = Buffer.from(record.hashedKey, "hex");
  // Equal lengths are guaranteed by both sides being sha256 digests, but
  // timingSafeEqual throws rather than returning false on a mismatch, so the
  // guard stays.
  if (stored.length !== presented.length) return null;
  if (!crypto.timingSafeEqual(stored, presented)) return null;

  // Validity checks come AFTER the constant-time compare so that a wrong secret
  // and a revoked key are indistinguishable from the outside.
  if (record.revokedAt) return null;
  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) return null;

  const stale =
    !record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS;
  if (stale) {
    // Fire and forget: a failed bookkeeping write must not fail the request.
    prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch((err) => console.error("[agent-auth] lastUsedAt update failed", err));
  }

  return {
    keyId: record.id,
    name: record.name,
    clubId: record.clubId,
    scopes: record.scopes,
  };
}

/**
 * Path prefixes an agent key is allowed to reach at all.
 *
 * Adding an entry here is the single act that exposes a route family to
 * machine callers — keep the list short, and keep it a list of prefixes rather
 * than a wildcard, so widening it is always a visible diff.
 */
const AGENT_ALLOWED_PREFIXES: readonly string[] = ["/api/billing"];

/**
 * Structural default-deny for agent callers, mounted immediately after
 * authMiddleware.
 *
 * The original design leaned on `requireRoles` rejecting `!req.user` to keep
 * keys off every existing route. That is true wherever `requireRoles` is
 * present — but six handlers in routes/events.ts have no role gate at all
 * (docs/conventions.md calls for one on every route; these predate this
 * change), so authentication alone was enough to read them. An agent key would
 * have inherited that gap.
 *
 * Allowlisting by path makes the guarantee independent of whether an individual
 * handler remembered its gate, so a future unguarded route cannot quietly
 * become agent-reachable. Humans pass through untouched.
 */
export function agentRouteGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.agent) return next();
  const ok = AGENT_ALLOWED_PREFIXES.some(
    (p) => req.path === p || req.path.startsWith(`${p}/`),
  );
  if (!ok) return res.status(403).json({ error: "Forbidden" });
  next();
}

/** Agent-only route. Humans get 403 even with a valid session. */
export function requireAgent(...scopes: AgentScope[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.agent) return res.status(403).json({ error: "Forbidden" });
    if (!scopes.every((s) => req.agent!.scopes.includes(s))) {
      return res.status(403).json({ error: "Insufficient scope" });
    }
    next();
  };
}

/**
 * Either a machine with the right scopes, or a human with the right role.
 * Most billing routes want this: admin-ui drives them through tools-api, but a
 * CLUB_MANAGER also uses the same endpoints from the federation frontend.
 */
export function requireAgentOrRoles(scopes: AgentScope[], ...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.agent) {
      if (!scopes.every((s) => req.agent!.scopes.includes(s))) {
        return res.status(403).json({ error: "Insufficient scope" });
      }
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

/**
 * Club ownership for agent callers, mirroring the human check that route
 * bodies already do (docs/conventions.md: `requireRoles` says *this kind of
 * caller may call this*; the body says *…for this club*).
 *
 * No-op for human callers — their club check is the existing `req.user.clubId`
 * comparison, which this must not duplicate or contradict.
 */
export function assertAgentClub(req: Request, clubId: string): void {
  if (req.agent && req.agent.clubId !== clubId) {
    throw { status: 403, message: "Forbidden" };
  }
}

/**
 * The agent's User row exists for exactly one reason: gojukainam's own
 * `AuditLog.userId` is an FK to `User`, so app-level audit rows written during
 * an agent request need a valid target and should read as "agent-service".
 *
 * It is never assigned to `req.user`. It carries the lowest role in the enum
 * and no passwordHash, and its address is under the reserved `.invalid` TLD
 * (RFC 2606) so no magic-link mail can ever be delivered to it — belt and
 * braces on a row that should never be able to hold a session.
 *
 * Mirrors ensureDevUser() in auth.ts.
 */
export async function ensureAgentUser() {
  await prisma.user.upsert({
    where: { id: AGENT_USER_ID },
    update: {},
    create: {
      id: AGENT_USER_ID,
      email: "agent-service@invalid",
      name: "Agent Service",
      role: "ATHLETE",
    },
  });
}
