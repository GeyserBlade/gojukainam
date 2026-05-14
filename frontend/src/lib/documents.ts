import { api } from "./api";

export type DocumentType =
  | "IDENTITY_DOCUMENT"
  | "CLUB_MEMBERSHIP_FORM"
  | "EVENT_ENTRY_FORM"
  | "MEDICAL_CLEARANCE"
  | "GRADING_CERTIFICATE"
  | "PHOTO"
  | "OTHER";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IDENTITY_DOCUMENT:    "Identity Document",
  CLUB_MEMBERSHIP_FORM: "Club Membership Form",
  EVENT_ENTRY_FORM:     "Event Entry Form",
  MEDICAL_CLEARANCE:    "Medical Clearance",
  GRADING_CERTIFICATE:  "Grading Certificate",
  PHOTO:                "Photo",
  OTHER:                "Other",
};

export type Document = {
  id:           string;
  documentType: DocumentType;
  label:        string | null;
  filename:     string;
  mimeType:     string;
  sizeBytes:    number;
  storageKey:   string;
  uploadedById: string;
  uploadedBy:   { id: string; name: string | null; email: string };
  athleteId:    string | null;
  eventId:      string | null;
  clubId:       string | null;
  createdAt:    string;
};

export type EntityFilter =
  | { athleteId: string }
  | { eventId: string }
  | { clubId: string };

export async function listDocuments(filter: EntityFilter): Promise<Document[]> {
  const { data } = await api.get("/documents", { params: filter });
  return data;
}

export async function requestUploadUrl(params: {
  documentType: DocumentType;
  label?: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
} & EntityFilter): Promise<{ document: Document; uploadUrl: string }> {
  const { data } = await api.post("/documents/upload-url", params);
  return data;
}

export async function getDownloadUrl(id: string): Promise<string> {
  const { data } = await api.get(`/documents/${id}/download-url`);
  return data.url;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function uploadDocument(
  params: {
    documentType: DocumentType;
    label?: string | null;
    file: File;
  } & EntityFilter
): Promise<Document> {
  const { file, documentType, label, ...entityFilter } = params;

  const { document, uploadUrl } = await requestUploadUrl({
    documentType,
    label,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    ...(entityFilter as EntityFilter),
  });

  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!response.ok) {
    throw new Error(`Upload to storage failed: ${response.status} ${response.statusText}`);
  }

  return document;
}
