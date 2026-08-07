import { Router, type Request } from "express";
import { requireRoles } from "../utils/auth.js";
import { requireEventManager } from "../utils/event-scope.js";
import { EntryService } from "../services/entry.service.js";
import { validate, validateMultiple } from "../middleware/validate.js";
import { CreateEntry, UpdateEntryStatus, EventEntriesQuery, IdParam, BulkSubmitEntries, SetEntrySeed } from "../utils/validators.js";
import { getParam } from "../utils/params.js";
import { DrawService } from "../services/draw.service.js";

export const router = Router();

// Handlers below catch expected {status, message} errors and respond directly
// rather than calling next(err), so errorHandler's console.error never sees
// them — Railway logs stayed empty for every 403/409/400 on this router.
// Log here instead, at the point that has the request context.
function logExpectedError(action: string, req: Request, err: { status: number; message: string }) {
  console.warn(
    `[entries:${action}] ${err.status} ${err.message} — user=${req.user?.id ?? "?"} role=${req.user?.role ?? "?"} clubId=${req.user?.clubId ?? "?"}`,
  );
}

// list entries by event (club-scoped unless admin)
router.get("/", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), validate(EventEntriesQuery, 'query'), async (req, res, next) => {
  try {
    const { eventId, clubId, divisionId, status, entryType, searchQuery } = req.query as {
      eventId: string;
      clubId?: string;
      divisionId?: string;
      status?: string;
      entryType?: string;
      searchQuery?: string;
    };

    const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";
    let effectiveClubId = clubId;

    if (!isAdmin) {
      if (!req.user?.clubId) {
        return res.status(400).json({ error: "clubId missing for scoped request" });
      }
      effectiveClubId = req.user.clubId; // force own club
    }

    const rows = await EntryService.list(eventId, {
      clubId: effectiveClubId,
      divisionId,
      status,
      entryType,
      searchQuery
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// create entry (individual or team)
router.post("/", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), validate(CreateEntry), async (req, res, next) => {
  try {
    // Basic authz check on clubId before calling service
    const clubId = req.body.clubId;
    const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";

    if (!isAdmin) {
      if (!req.user?.clubId) return res.status(400).json({ error: "clubId missing for scoped request" });
      if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
    }

    const row = await EntryService.create(req.body, { role: req.user!.role });
    res.status(201).json(row);
  } catch (err: any) {
    if (err.status && err.message) {
      logExpectedError("create", req, err);
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// bulk submit DRAFT/RETURNED entries -> SUBMITTED (club-scoped unless admin)
router.post("/bulk-submit", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), validate(BulkSubmitEntries), async (req, res, next) => {
  try {
    const { eventId, ids } = req.body as { eventId: string; ids: string[] };
    const user = {
      id: req.user!.id,
      role: req.user!.role,
      clubId: req.user!.clubId,
    };
    const result = await EntryService.bulkSubmit(eventId, ids, user);
    res.json(result);
  } catch (err: any) {
    if (err.status && err.message) {
      logExpectedError("bulk-submit", req, err);
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// delete a DRAFT entry (club-scoped unless admin)
router.delete("/:id", requireRoles("CLUB_MANAGER", "ADMIN", "SUPERADMIN"), validate(IdParam, "params"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    const user = {
      id: req.user!.id,
      role: req.user!.role,
      clubId: req.user!.clubId,
    };
    await EntryService.delete(id, user);
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) {
      logExpectedError("delete", req, err);
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// change status (submit/approve/return)
router.put("/:id/status", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), validateMultiple({ params: IdParam, body: UpdateEntryStatus }), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    const user = {
      id: req.user!.id,
      role: req.user!.role,
      clubId: req.user!.clubId
    };

    const updated = await EntryService.updateStatus(id, req.body, user);
    res.json(updated);
  } catch (err: any) {
    if (err.status && err.message) {
      logExpectedError("update-status", req, err);
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// set or clear one entry's seed (the whole-category equivalent is PUT /draws/seeds)
router.put("/:id/seed", requireEventManager({ in: "lookup", key: "id", via: "entry" }), validateMultiple({ params: IdParam, body: SetEntrySeed }), async (req, res, next) => {
  try {
    const row = await DrawService.setEntrySeed(getParam(req.params.id), req.body.seed, { id: req.user!.id });
    res.json(row);
  } catch (err: any) {
    if (err.status && err.message) {
      logExpectedError("set-seed", req, err);
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});
