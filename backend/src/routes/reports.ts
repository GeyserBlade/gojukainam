import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../utils/auth.js";
import { DrawService } from "../services/draw.service.js";
import { EntrySheetService } from "../services/entry-sheet.service.js";
import { isEventCoordinator } from "../utils/event-scope.js";

export const router = Router();

/**
 * Who may pull *this* club's sheet for *this* event.
 *
 * Three ways in, and they are not the same check: an admin exports anyone; the
 * event's coordinator exports any club **of that event** (they are the person
 * chasing confirmations, and they are usually a CLUB_MANAGER, so role alone
 * would scope them to their own dojo); everyone else is limited to the club
 * they belong to. Returns an error message, or null when access is allowed.
 */
async function clubSheetDenial(
  user: { id: string; role: string; clubId?: string | null } | undefined,
  eventId: string,
  clubId: string,
): Promise<string | null> {
  if (!user) return "Forbidden";
  if (user.role === "SUPERADMIN" || user.role === "ADMIN") return null;
  if (await isEventCoordinator(user.id, eventId)) return null;
  if (user.clubId && user.clubId === clubId) return null;
  return "Forbidden";
}

// Quote a CSV cell; a leading apostrophe neutralizes spreadsheet formula injection.
const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

// Event-wide results: per-category podiums + club medal tally
router.get("/results", requireRoles("CLUB_MANAGER", "COACH", "ATHLETE", "ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId?: string };
    if (!eventId) return res.status(400).json({ error: "eventId required" });
    res.json(await DrawService.eventResults(eventId));
  } catch (err) { next(err); }
});

// ... existing code ...

router.get("/entries.csv", requireRoles("CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"), async (req, res) => {
  const { eventId } = req.query as { eventId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });

  // scope to club for non-admins
  const where: any = { eventId };
  const isAdmin = req.user?.role === "SUPERADMIN" || req.user?.role === "ADMIN";
  if (!isAdmin) {
    if (!req.user?.clubId) return res.status(400).json({ error: "clubId missing for scoped request" });
    where.clubId = req.user.clubId;
  }

  const rows = await prisma.entry.findMany({
    where,
    include: { athlete: true, team: true, division: true, club: true, weightClass: true },
    orderBy: { createdAt: "asc" }
  });

  const header = [
    "entryId","status","type","club","athlete","team","division","weightClass","feeCents","createdAt"
  ];
  const lines = rows.map(r => [
    r.id, r.status, r.entryType,
    r.club?.name ?? "",
    r.athlete ? `${r.athlete.firstName} ${r.athlete.lastName}` : "",
    r.team?.name ?? "",
    r.division?.name ?? "",
    r.weightClass?.name ?? "",
    r.feeCents,
    r.createdAt.toISOString(),
  ].map(csvCell).join(","));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="entries-${eventId}.csv"`);
  res.send([header.join(","), ...lines].join("\n"));
});

const SHEET_ROLES = ["CLUB_MANAGER", "COACH", "ADMIN", "SUPERADMIN"] as const;

/** Which clubs this caller may export a sheet for, and how many entries each has. */
router.get("/club-entries/clubs", requireRoles(...SHEET_ROLES), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId?: string };
    if (!eventId) return res.status(400).json({ error: "eventId required" });

    const clubs = await EntrySheetService.clubsForEvent(eventId);

    const user = req.user;
    const isAdmin = user?.role === "SUPERADMIN" || user?.role === "ADMIN";
    if (isAdmin || (user && (await isEventCoordinator(user.id, eventId)))) {
      return res.json(clubs);
    }
    // A club user is told about their own club and nothing else — the list
    // would otherwise leak who else has entered this event.
    res.json(clubs.filter((c) => c.id === user?.clubId));
  } catch (err) { next(err); }
});

/**
 * One club's entries for one event, shaped as a confirmation document.
 * Feeds both the printable sheet in the app and the workbook below, so the two
 * formats can never disagree about what a club was asked to confirm.
 */
router.get("/club-entries", requireRoles(...SHEET_ROLES), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId?: string; clubId?: string };
    if (!eventId) return res.status(400).json({ error: "eventId required" });
    // A club user needs no clubId in the query — theirs is the only one they
    // can ask for, so defaulting it keeps the caller from having to know it.
    const clubId = (req.query.clubId as string | undefined) || req.user?.clubId || "";
    if (!clubId) return res.status(400).json({ error: "clubId required" });

    const denial = await clubSheetDenial(req.user, eventId, clubId);
    if (denial) return res.status(403).json({ error: denial });

    res.json(await EntrySheetService.build(eventId, clubId));
  } catch (err) { next(err); }
});

router.get("/club-entries.xlsx", requireRoles(...SHEET_ROLES), async (req, res, next) => {
  try {
    const { eventId } = req.query as { eventId?: string; clubId?: string };
    if (!eventId) return res.status(400).json({ error: "eventId required" });
    const clubId = (req.query.clubId as string | undefined) || req.user?.clubId || "";
    if (!clubId) return res.status(400).json({ error: "clubId required" });

    const denial = await clubSheetDenial(req.user, eventId, clubId);
    if (denial) return res.status(403).json({ error: denial });

    const sheet = await EntrySheetService.build(eventId, clubId);
    const workbook = EntrySheetService.toWorkbook(sheet);
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${EntrySheetService.fileStem(sheet)}.xlsx"`,
    );
    res.send(Buffer.from(buffer as ArrayBuffer));
  } catch (err) { next(err); }
});
