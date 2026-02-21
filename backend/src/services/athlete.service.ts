import { prisma } from "../lib/prisma.js";
import { CreateAthlete } from "../utils/validators.js";
import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { ZodError } from "zod";
import { Athlete, Prisma } from "@prisma/client";

type RawRow = Record<string, any> & { __rowNum__?: number };

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (typeof value === "object") {
    if ("richText" in value) return (value as ExcelJS.CellRichTextValue).richText.map(r => r.text).join("");
    if ("result" in value) return cellToString((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
    if ("text" in value) return String((value as any).text);
  }
  return String(value);
}

function scrubEmptyStrings<T extends Record<string, any>>(obj: T): T {
  const copy: any = Array.isArray(obj) ? [] : { ...obj };
  for (const k in obj) {
    const v = obj[k];
    if (v === "") copy[k] = undefined;
  }
  return copy as T;
}

export class AthleteService {
  static async getAll(includeInactive = false) {
    return prisma.athlete.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        club: { select: { id: true, name: true } },
        belt: { select: { id: true, name: true, colour: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  static async getByClubId(clubId: string, includeInactive = false) {
    return prisma.athlete.findMany({
      where: includeInactive ? { clubId } : { clubId, isActive: true },
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
      isInstructor: parsed.isInstructor ?? undefined,
      isActive: parsed.isActive ?? undefined
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

  static async parseImportFile(buffer: Buffer, filename: string): Promise<RawRow[]> {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".csv")) {
      const text = buffer.toString("utf8");
      return parseCsv(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as RawRow[];
    }
    if (lower.endsWith(".xlsx")) {
      const workbook = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ExcelJS Buffer type differs from Node's in TS 5+
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return [];

      const headers: Record<number, string> = {};
      const rows: RawRow[] = [];
      let isFirstRow = true;

      worksheet.eachRow((row, rowNumber) => {
        if (isFirstRow) {
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            headers[colNumber] = String(cell.value ?? "").trim();
          });
          isFirstRow = false;
          return;
        }
        const rowData: RawRow = { __rowNum__: rowNumber - 1 }; // keep xlsx-compatible 0-indexed convention
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) rowData[header] = cellToString(cell.value);
        });
        rows.push(rowData);
      });

      return rows;
    }
    throw { status: 400, message: "Unsupported file type. Upload CSV or XLSX." };
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
      "isActive",
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
    if (mapped.isActive !== undefined) {
      const val = String(mapped.isActive).trim().toLowerCase();
      mapped.isActive = val === "true" || val === "1" || val === "yes";
    }
    return scrubEmptyStrings(mapped);
  }

  static async importAthletes(clubId: string, fileBuffer: Buffer, filename: string) {
    const rows = await this.parseImportFile(fileBuffer, filename);
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
