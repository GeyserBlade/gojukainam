import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { EntryService } from "../services/entry.service.js";
import { validate, validateMultiple } from "../middleware/validate.js";
import { CreateEntry, UpdateEntryStatus, EventEntriesQuery, IdParam } from "../utils/validators.js";

export const router = Router();

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

    const row = await EntryService.create(req.body);
    res.status(201).json(row);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// change status (submit/approve/return)
router.put("/:id/status", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), validateMultiple({ params: IdParam, body: UpdateEntryStatus }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = {
      id: req.user!.id,
      role: req.user!.role,
      clubId: req.user!.clubId
    };

    const updated = await EntryService.updateStatus(id, req.body, user);
    res.json(updated);
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});
