import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { prisma } from "../lib/prisma.js";

export type AuthUser = {
  id: string;
  role: "SUPERADMIN"|"ADMIN"|"CLUB_MANAGER"|"COACH"|"ATHLETE";
  clubId?: string | null;
};

// Stable id used by the dev-header auth stub. A matching User row is upserted
// at startup (see ensureDevUser) so audit-log writes have a valid FK target.
export const DEV_USER_ID = "dev-user";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Try Cookie Auth (JWT)
  const token = req.cookies?.auth_token;
  if (token) {
    const user = AuthService.verifySessionToken(token);
    if (user) {
      req.user = user as AuthUser;
      return next();
    }
    // If token is invalid (expired/bad signature), we could clear it?
    // But let's fall through to see if dev auth catches it or we 401.
  }

  // 2. Try Dev Auth (Headers) — only when explicitly enabled via env var
  const allowDevAuth = process.env.ALLOW_DEV_AUTH === "true";
  if (allowDevAuth && req.header("x-role")) {
    const role = (req.header("x-role") as AuthUser["role"]) || "SUPERADMIN";
    const clubId = req.header("x-club-id") || undefined;
    req.user = { id: DEV_USER_ID, role, clubId };
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * Ensure the dev-auth stub user exists so audit-log writes (which reference
 * userId) succeed under header auth. No-op unless ALLOW_DEV_AUTH is enabled.
 */
export async function ensureDevUser() {
  if (process.env.ALLOW_DEV_AUTH !== "true") return;
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: { id: DEV_USER_ID, email: "dev-user@localhost", name: "Dev User", role: "SUPERADMIN" },
  });
}

export function requireRoles(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}




