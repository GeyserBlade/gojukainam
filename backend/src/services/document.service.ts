import { prisma } from "../lib/prisma.js";
import { buildStorageKey, createUploadUrl, createDownloadUrl, deleteObject } from "../lib/storage.js";
import type { DocumentType } from "@prisma/client";

export type EntityRef =
  | { athleteId: string }
  | { eventId: string }
  | { clubId: string };

export class DocumentService {
  static async requestUpload(params: {
    entityRef: EntityRef;
    documentType: DocumentType;
    label: string | null;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string;
  }) {
    const { entityRef, documentType, label, filename, mimeType, sizeBytes, uploadedById } = params;

    let entityType: "athletes" | "events" | "clubs";
    let entityId: string;
    if ("athleteId" in entityRef) { entityType = "athletes"; entityId = entityRef.athleteId; }
    else if ("eventId" in entityRef) { entityType = "events"; entityId = entityRef.eventId; }
    else { entityType = "clubs"; entityId = entityRef.clubId; }

    const storageKey = buildStorageKey(entityType, entityId, documentType, mimeType);
    const uploadUrl = await createUploadUrl(storageKey);

    const doc = await prisma.document.create({
      data: {
        documentType,
        label,
        storageKey,
        filename,
        mimeType,
        sizeBytes,
        uploadedById,
        ...entityRef,
      },
    });

    return { document: doc, uploadUrl };
  }

  static async listForEntity(entityRef: EntityRef) {
    return prisma.document.findMany({
      where: entityRef,
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
  }

  static async getDownloadUrl(id: string): Promise<string | null> {
    const doc = await prisma.document.findUnique({ where: { id }, select: { storageKey: true } });
    if (!doc) return null;
    return createDownloadUrl(doc.storageKey);
  }

  static async delete(id: string): Promise<void> {
    const doc = await prisma.document.findUnique({ where: { id }, select: { storageKey: true } });
    if (!doc) return;
    await deleteObject(doc.storageKey);
    await prisma.document.delete({ where: { id } });
  }
}
