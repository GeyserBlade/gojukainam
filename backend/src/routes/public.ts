import { Router } from "express";
import { PublicService } from "../services/public.service.js";
import { getParam } from "../utils/params.js";

// No-auth routes: mounted BEFORE authMiddleware in server.ts so spectators can
// reach the read-only board without a session. Guard exposure carefully here.
export const router = Router();

router.get("/board/:token", async (req, res, next) => {
  try {
    const data = await PublicService.getBoard(getParam(req.params.token));
    res.json(data);
  } catch (err: any) {
    if (err?.status && err?.message) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});
