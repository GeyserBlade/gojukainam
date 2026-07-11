import { StorageClient } from "@supabase/storage-js";
import { randomUUID } from "crypto";

// Lazily construct the client so the server can boot without Supabase
// configured (e.g. local dev). Building it eagerly throws "Invalid URL" at
// import time when SUPABASE_URL is missing, which crashes the whole app even
// though most work doesn't touch document storage.
let _storage: StorageClient | null = null;

function getStorage(): StorageClient {
  if (_storage) return _storage;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable uploads/downloads."
    );
  }

  // Use storage-js directly to avoid the realtime/WebSocket dependency in supabase-js
  _storage = new StorageClient(`${url}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
  return _storage;
}

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
  const { data, error } = await getStorage().from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`);
  return data.signedUrl;
}

export async function createDownloadUrl(key: string): Promise<string> {
  const { data, error } = await getStorage().from(BUCKET).createSignedUrl(key, TTL);
  if (error || !data) throw new Error(`Failed to create download URL: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteObject(key: string): Promise<void> {
  const { error } = await getStorage().from(BUCKET).remove([key]);
  if (error) throw new Error(`Failed to delete object: ${error.message}`);
}
