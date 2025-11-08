import { Router } from "express";
import { prisma } from "../server";
import { requireRoles } from "../utils/auth";
import { CreateAthlete } from "../utils/validators";
import multer from "multer";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { ZodError } from "zod";

export const router = Router();

function scrubEmptyStrings<T extends Record<string, any>>(obj: T): T {
  const copy: any = Array.isArray(obj) ? [] : { ...obj };
  for (const k in obj) {
    const v = obj[k];
    if (v === "") copy[k] = undefined;
  }
  return copy as T;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// list all athletes (Superadmin)
router.get("/all", requireRoles("SUPERADMIN"), async (_req, res) => {
  const rows = await prisma.athlete.findMany({
    include: {
      club: { select: { id: true, name: true } },
      belt: { select: { id: true, name: true, colour: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(rows);
});

// list own club athletes (Club Manager / Coach)
router.get("/", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res) => {
  const { clubId } = req.query as { clubId?: string };
  if (!clubId) return res.status(400).json({ error: "clubId required" });
  // authorization: club scoped
  if (req.user?.role === "CLUB_MANAGER") {
    if (req.user.clubId !== clubId) return res.status(403).json({ error: "Forbidden" });
  }
  const rows = await prisma.athlete.findMany({
    where: { clubId },
    include: {
      club: { select: { id: true, name: true } },
      belt: { select: { id: true, name: true, colour: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json(rows);
});

// get single athlete by id (admin/club scoped)
router.get("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await prisma.athlete.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        belt: { select: { id: true, name: true, colour: true } },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== row.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(row);
  } catch (err) { next(err); }
});

// create athlete (club scoped)
router.post("/", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const parsed = CreateAthlete.parse(scrubEmptyStrings(req.body));
    // club scoping
    if (req.user?.role === "CLUB_MANAGER") {
      if (req.user.clubId !== parsed.clubId) return res.status(403).json({ error: "Forbidden" });
    }
    const athleteData = { ...parsed, gender: parsed.gender as "Male" | "Female" };
    const row = await prisma.athlete.create({ data: athleteData });
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// update athlete (club scoped)
router.put("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await prisma.athlete.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = (CreateAthlete.partial()).parse(scrubEmptyStrings(req.body));
    // Remove clubId from update data, as it cannot be updated
    if ("clubId" in data) {
      delete data.clubId;
    }
    const { clubId, ...updateData } = data as any;
    if (updateData.gender && updateData.gender !== "Male" && updateData.gender !== "Female") {
      return res.status(400).json({ error: "Invalid gender value" });
    }
    if (updateData.gender && (updateData.gender === "Male" || updateData.gender === "Female")) {
      // ok
    } else if (updateData.gender) {
      delete updateData.gender;
    }
    const row = await prisma.athlete.update({ where: { id }, data: updateData });
    res.json(row);
  } catch (err) { next(err); }
});

// delete athlete (club scoped)
router.delete("/:id", requireRoles("CLUB_MANAGER","ADMIN","SUPERADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.athlete.findUnique({
      where: { id },
      select: { id: true, clubId: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    // Only SUPERADMIN or same-club users may delete
    if (req.user?.role !== "SUPERADMIN" && req.user?.clubId !== existing.clubId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.$transaction(async (tx) => {
      // Remove dependent relations first to satisfy FK constraints
      await tx.teamMember.deleteMany({ where: { athleteId: id } });
      await tx.entry.deleteMany({ where: { athleteId: id } });
      await tx.athlete.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (err) { next(err); }
});

type RawRow = Record<string, any> & { __rowNum__?: number };

function parseImportFile(buffer: Buffer, filename: string): RawRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8");
    return parseCsv(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as RawRow[];
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm") || lower.endsWith(".xlsb")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
  }
  throw { status: 400, message: "Unsupported file type. Upload CSV or Excel." };
}

function mapImportRow(row: RawRow, clubId: string) {
  const fields = [
    "firstName",
    "lastName",
    "invoiceRef",
    "dob",
    "gender",
    "nationality",
    "idType",
    "idNumber",
    "beltId",
    "weightKg",
    "joinDate",
    "lastGraded",
    "isInstructor",
    "medicalNotes",
    "contactEmail",
    "contactPhone",
    "guardianName1",
    "guardianPhone1",
    "guardianName2",
    "guardianPhone2",
    "photoUrl",
  ] as const;
  const mapped: Record<string, any> = { clubId };
  for (const key of fields) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      mapped[key] = value.trim();
    } else {
      mapped[key] = value;
    }
  }
  if (mapped.gender) {
    const g = String(mapped.gender).trim().toLowerCase();
    if (g === "male" || g === "m") mapped.gender = "Male";
    else if (g === "female" || g === "f") mapped.gender = "Female";
  }
  if (mapped.weightKg !== undefined) {
    const num = Number(mapped.weightKg);
    mapped.weightKg = Number.isFinite(num) ? num : undefined;
  }
  if (mapped.isInstructor !== undefined) {
    const val = String(mapped.isInstructor).trim().toLowerCase();
    mapped.isInstructor = val === "true" || val === "1" || val === "yes";
  }
  return scrubEmptyStrings(mapped);
}

router.post("/import", requireRoles("SUPERADMIN"), upload.single("file"), async (req, res, next) => {
  try {
    const clubId = (req.body?.clubId as string | undefined)?.trim();
    if (!clubId) return res.status(400).json({ error: "clubId required" });
    const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
    if (!club) return res.status(404).json({ error: "Club not found" });
    if (!req.file) return res.status(400).json({ error: "file required" });

    const rows = parseImportFile(req.file.buffer, req.file.originalname);
    if (rows.length === 0) return res.status(400).json({ error: "No rows found in file" });

    const failures: { rowNumber: number; reason: string }[] = [];
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i] ?? {};
      const rowNumber = typeof raw.__rowNum__ === "number" ? raw.__rowNum__ + 1 : i + 2;
      try {
        const data = mapImportRow(raw, clubId);
        const parsed = CreateAthlete.parse(data);
        const athleteData = { ...parsed, gender: parsed.gender as "Male" | "Female" };
        await prisma.athlete.create({ data: athleteData });
        insertedCount++;
      } catch (err: any) {
        let reason = err?.message ?? "Unknown error";
        if (err instanceof ZodError) {
          reason = err.issues.map(issue => `${issue.path.join(".") || "field"}: ${issue.message}`).join("; ");
        } else if (err?.code === "P2002") {
          reason = "Duplicate record violates unique constraint";
        }
        failures.push({ rowNumber, reason });
      }
    }

    res.json({
      insertedCount,
      failedCount: failures.length,
      failures,
    });
  } catch (err) { next(err); }
});
