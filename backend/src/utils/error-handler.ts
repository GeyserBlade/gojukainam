import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err?.code === "P2002") { // Prisma unique constraint
    return res.status(409).json({ error: "Unique constraint failed", meta: err.meta });
  }
  if (err?.status) return res.status(err.status).json({ error: err.message });
  return res.status(500).json({ error: "Internal Server Error" });
}
