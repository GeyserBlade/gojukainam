import { StorageClient } from "@supabase/storage-js";
import { randomUUID } from "crypto";

// Use storage-js directly to avoid the realtime/WebSocket dependency in supabase-js
export const storage = new StorageClient(
  `${process.env.SUPABASE_URL}/storage/v1`,
  {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  }
);

const BUCKET = process.env.SUPABASE_BUCKET_NAME ?? "documents";
const TTL = Number(process.env.PRESIGNED_URL_TTL_SECONDS ?? 300);

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function buildStorageKey(
  entityType: "athletes" | "events" | "clubs",
  entityId: string,
  docType: string,
  mimeType: string
): string {
  const ext = MIME_TO_EXT[mimeType] ?? "bin";
  return `${entityType}/${entityId}/${docType.toLowerCase()}/${randomUUID()}.${ext}`;
}

export async function createUploadUrl(key: string): Promise<string> {
  const { data, error } = await storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`);
  return data.signedUrl;
}

export async function createDownloadUrl(key: string): Promise<string> {
  const { data, error } = await storage.from(BUCKET).createSignedUrl(key, TTL);
  if (error || !data) throw new Error(`Failed to create download URL: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteObject(key: string): Promise<void> {
  const { error } = await storage.from(BUCKET).remove([key]);
  if (error) throw new Error(`Failed to delete object: ${error.message}`);
}
