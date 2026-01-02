import { prisma } from "../server.js";
import { CreateAthlete } from "../utils/validators.js";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { ZodError } from "zod";
import { Athlete, Prisma } from "@prisma/client";

type RawRow = Record<string, any> & { __rowNum__?: number };

function scrubEmptyStrings<T extends Record<string, any>>(obj: T): T {
  const copy: any = Array.isArray(obj) ? [] : { ...obj };
  for (const k in obj) {
    const v = obj[k];
    if (v === "") copy[k] = undefined;
  }
  return copy as T;
}

export class AthleteService {
  static async getAll() {
    return prisma.athlete.findMany({
      include: {
        club: { select: { id: true, name: true } },
        belt: { select: { id: true, name: true, colour: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  static async getByClubId(clubId: string) {
    return prisma.athlete.findMany({
      where: { clubId },
      include: {
        club: { select: { id: true, name: true } },
        belt: { select: { id: true, name: true, colour: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  static async getById(id: string) {
    return prisma.athlete.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        belt: { select: { id: true, name: true, colour: true } },
      },
    });
  }

  static async create(data: any) {
    const parsed = CreateAthlete.parse(scrubEmptyStrings(data));
    const athleteData = { 
      ...parsed, 
      gender: parsed.gender as "Male" | "Female",
      isInstructor: parsed.isInstructor ?? undefined 
    };
    return prisma.athlete.create({ data: athleteData });
  }

  static async update(id: string, data: any) {
    const parsedData = (CreateAthlete.partial()).parse(scrubEmptyStrings(data));
    // Remove clubId from update data, as it cannot be updated
    if ("clubId" in parsedData) {
      delete parsedData.clubId;
    }
    const { clubId, ...updateData } = parsedData as any;
    
    if (updateData.gender && updateData.gender !== "Male" && updateData.gender !== "Female") {
      throw new Error("Invalid gender value");
    }
    
    // If gender is present but invalid (though validation should catch this), clean it up? 
    // The previous logic was a bit redundant, sticking to strict validation here.

    return prisma.athlete.update({ where: { id }, data: updateData });
  }

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // Remove dependent relations first to satisfy FK constraints
      await tx.teamMember.deleteMany({ where: { athleteId: id } });
      await tx.entry.deleteMany({ where: { athleteId: id } });
      await tx.athlete.delete({ where: { id } });
    });
  }

  static parseImportFile(buffer: Buffer, filename: string): RawRow[] {
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

  static mapImportRow(row: RawRow, clubId: string) {
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

  static async importAthletes(clubId: string, fileBuffer: Buffer, filename: string) {
    const rows = this.parseImportFile(fileBuffer, filename);
    if (rows.length === 0) throw { status: 400, message: "No rows found in file" };

    const belts = await prisma.belt.findMany({ select: { id: true } });
    const validBeltIds = new Set(belts.map(b => b.id));

    const failures: { rowNumber: number; reason: string }[] = [];
    const toInsert: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i] ?? {};
      const rowNumber = typeof raw.__rowNum__ === "number" ? raw.__rowNum__ + 1 : i + 2;
      try {
        const data = this.mapImportRow(raw, clubId);
        const parsed = CreateAthlete.parse(data);
        
        if (!validBeltIds.has(parsed.beltId)) {
          failures.push({ rowNumber, reason: `Belt ID "${parsed.beltId}" not found` });
          continue;
        }

        const athleteData = { ...parsed, gender: parsed.gender as "Male" | "Female" };
        toInsert.push(athleteData);
      } catch (err: any) {
        let reason = err?.message ?? "Unknown error";
        if (err instanceof ZodError) {
          reason = err.issues.map(issue => `${issue.path.join(".") || "field"}: ${issue.message}`).join("; ");
        }
        failures.push({ rowNumber, reason });
      }
    }

    let insertedCount = 0;
    if (toInsert.length > 0) {
      const result = await prisma.athlete.createMany({
        data: toInsert,
        skipDuplicates: false,
      });
      insertedCount = result.count;
    }

    return {
      insertedCount,
      failedCount: failures.length,
      failures,
    };
  }
}
