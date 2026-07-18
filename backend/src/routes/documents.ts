import { Router } from "express";
import { requireRoles, type AuthUser } from "../utils/auth.js";
import { validate } from "../middleware/validate.js";
import { RequestUploadBody } from "../utils/validators.js";
import { DocumentService, type EntityRef } from "../services/document.service.js";
import { prisma } from "../lib/prisma.js";
import { getParam } from "../utils/params.js";

export const router = Router();

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

// Read access: admins see all; club-scoped roles (CLUB_MANAGER, COACH) see their
// own club's athlete/club documents plus organizer-published event documents.
async function canReadDocuments(
  user: AuthUser,
  ref: { athleteId?: string | null; eventId?: string | null; clubId?: string | null },
): Promise<boolean> {
  if (user.role === "SUPERADMIN" || user.role === "ADMIN") return true;
  if (!user.clubId) return false;
  if (ref.athleteId) {
    const athlete = await prisma.athlete.findUnique({ where: { id: ref.athleteId }, select: { clubId: true } });
    return !!athlete && athlete.clubId === user.clubId;
  }
  if (ref.clubId) return ref.clubId === user.clubId;
  if (ref.eventId) return true;
  return false;
}

// POST /api/documents/upload-url
// Validates permissions, creates a DB record, returns a pre-signed upload URL
router.post(
  "/upload-url",
  requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER"),
  validate(RequestUploadBody),
  async (req, res, next) => {
    try {
      const { documentType, label, filename, mimeType, sizeBytes, athleteId, eventId, clubId } = req.body;

      if (!ALLOWED_MIME.has(mimeType)) {
        return res.status(400).json({ error: "Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP" });
      }
      if (sizeBytes > MAX_SIZE_BYTES) {
        return res.status(400).json({ error: "File too large. Maximum 20MB." });
      }

      let entityRef: EntityRef;

      if (athleteId) {
        const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { clubId: true } });
        if (!athlete) return res.status(404).json({ error: "Athlete not found" });
        if (req.user?.role === "CLUB_MANAGER" && req.user.clubId !== athlete.clubId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        entityRef = { athleteId };
      } else if (eventId) {
        if (req.user?.role === "CLUB_MANAGER") return res.status(403).json({ error: "Forbidden" });
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
        if (!event) return res.status(404).json({ error: "Event not found" });
        entityRef = { eventId };
      } else if (clubId) {
        if (req.user?.role === "CLUB_MANAGER") return res.status(403).json({ error: "Forbidden" });
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
        if (!club) return res.status(404).json({ error: "Club not found" });
        entityRef = { clubId };
      } else {
        return res.status(400).json({ error: "One of athleteId, eventId, or clubId is required" });
      }

      const result = await DocumentService.requestUpload({
        entityRef,
        documentType,
        label: label ?? null,
        filename,
        mimeType,
        sizeBytes,
        uploadedById: req.user!.id,
      });

      res.status(201).json(result);
    } catch (err) { next(err); }
  }
);

// GET /api/documents?athleteId=... | ?eventId=... | ?clubId=...
router.get("/", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH"), async (req, res, next) => {
  try {
    const { athleteId, eventId, clubId } = req.query as Record<string, string | undefined>;

    let entityRef: EntityRef;

    if (athleteId) {
      const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { clubId: true } });
      if (!athlete) return res.status(404).json({ error: "Athlete not found" });
      entityRef = { athleteId };
    } else if (eventId) {
      entityRef = { eventId };
    } else if (clubId) {
      entityRef = { clubId };
    } else {
      return res.status(400).json({ error: "One of athleteId, eventId, or clubId is required" });
    }

    if (!(await canReadDocuments(req.user!, entityRef))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const docs = await DocumentService.listForEntity(entityRef);
    res.json(docs);
  } catch (err) { next(err); }
});

// GET /api/documents/:id/download-url
// Returns a short-lived pre-signed download URL
router.get("/:id/download-url", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH"), async (req, res, next) => {
  try {
    const doc = await DocumentService.getById(getParam(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found" });

    if (!(await canReadDocuments(req.user!, doc))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const url = await DocumentService.getDownloadUrl(getParam(req.params.id));
    res.json({ url });
  } catch (err) { next(err); }
});

// DELETE /api/documents/:id
router.delete(
  "/:id",
  requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER"),
  async (req, res, next) => {
    try {
      const doc = await DocumentService.getById(getParam(req.params.id));
      if (!doc) return res.status(404).json({ error: "Not found" });

      if (req.user?.role === "CLUB_MANAGER") {
        if (doc.athleteId) {
          const athlete = await prisma.athlete.findUnique({ where: { id: doc.athleteId }, select: { clubId: true } });
          if (req.user.clubId !== athlete?.clubId) return res.status(403).json({ error: "Forbidden" });
        } else {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      await DocumentService.delete(getParam(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  }
);
