import type { Request, Response, NextFunction } from "express";

export type AuthUser = {
  id: string;
  role: "SUPERADMIN"|"ADMIN"|"CLUB_MANAGER"|"COACH"|"ATHLETE";
  clubId?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  // TODO: replace with JWT/Session. For dev, allow a header to impersonate.
  const role = (req.header("x-role") as AuthUser["role"]) || "SUPERADMIN";
  const clubId = req.header("x-club-id") || undefined;
  req.user = { id: "dev-user", role, clubId };
  next();
}

export function requireRoles(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
