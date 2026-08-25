import { Router } from "express";
import { PublicService } from "../services/public.service.js";
import { getParam } from "../utils/params.js";

// No-auth routes: mounted BEFORE authMiddleware in server.ts so spectators can
// reach the read-only board without a session. Guard exposure carefully here.
export const router = Router();

/**
 * `maxAge` is kept at or below the matching server-side cache TTL in
 * public.service.ts, so worst-case staleness stays within one poll interval
 * rather than compounding browser cache on top of server cache.
 */
const publicJson = (
  handler: (token: string, req: import("express").Request) => Promise<unknown>,
  maxAge: number
) =>
  async (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ) => {
    try {
      const data = await handler(getParam(req.params.token), req);
      res.set("Cache-Control", `public, max-age=${maxAge}`);
      res.json(data);
    } catch (err: any) {
      if (err?.status && err?.message) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  };

router.get("/board/:token", publicJson((token) => PublicService.getBoard(token), 5));

router.get("/board/:token/schedule", publicJson((token) => PublicService.getSchedule(token), 60));

router.get("/board/:token/athletes", publicJson((token) => PublicService.getAthletes(token), 15));

router.get(
  "/board/:token/athletes/:athleteId",
  publicJson((token, req) => PublicService.getAthlete(token, getParam(req.params.athleteId)), 15)
);
