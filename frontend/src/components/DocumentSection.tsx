import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDocuments,
  uploadDocument,
  getDownloadUrl,
  deleteDocument,
  DOCUMENT_TYPE_LABELS,
  type Document,
  type DocumentType,
  type EntityFilter,
} from "../lib/documents";
import { Label, Select, ActionButton } from "./Input";
import { EmptyState, ErrorState, Spinner } from "./UIState";
import { useToast, useApiErrorToast } from "./Toast";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_MB = 20;

type Props = {
  entityFilter: EntityFilter;
  canUpload: boolean;
  canDelete: boolean;
  title?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({
  doc,
  canDelete,
  onDelete,
}: {
  doc: Document;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleView() {
    setLoading(true);
    try {
      const url = await getDownloadUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Failed to get download link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-800 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-200 truncate">
            {doc.label || doc.filename}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 whitespace-nowrap">
            {DOCUMENT_TYPE_LABELS[doc.documentType]}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {doc.filename} &middot; {formatBytes(doc.sizeBytes)} &middot;{" "}
          {new Date(doc.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ActionButton type="button" variant="secondary" onClick={handleView} disabled={loading}>
          {loading ? <Spinner size={14} /> : "View"}
        </ActionButton>
        {canDelete && (
          <ActionButton type="button" variant="danger" onClick={() => onDelete(doc.id)}>
            Delete
          </ActionButton>
        )}
      </div>
    </div>
  );
}

export function DocumentSection({ entityFilter, canUpload, canDelete, title = "Documents" }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const showApiError = useApiErrorToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>("OTHER");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const queryKey = ["documents", entityFilter];

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listDocuments(entityFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Document deleted");
    },
    onError: (err) => showApiError(err, "Failed to delete document"),
  });

  function onDelete(id: string) {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    deleteMutation.mutate(id);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError("Only PDF, JPEG, PNG, and WEBP files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_MB}MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      await uploadDocument({
        file,
        documentType: docType,
        label: label.trim() || null,
        ...entityFilter,
      });
      queryClient.invalidateQueries({ queryKey });
      toast.success("Document uploaded");
      setLabel("");
      e.target.value = "";
    } catch (err: unknown) {
      const msg = (err as any)?.message || "Upload failed";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
      <h2 className="font-medium text-gray-300 text-sm uppercase tracking-wide">{title}</h2>

      {canUpload && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Document Type</Label>
              <Select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                disabled={uploading}
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, lbl]) => (
                  <option key={value} value={value}>{lbl}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Label (optional)</Label>
              <input
                type="text"
                className="w-full rounded-lg bg-gray-800/60 border border-gray-700 px-4 py-3 md:px-3 md:py-2 text-base md:text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                placeholder="e.g., 2026 Grading Certificate"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={uploading}
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={onFileChange}
              disabled={uploading}
            />
            <ActionButton
              type="button"
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Spinner size={14} /> Uploading…
                </span>
              ) : (
                "Choose File & Upload"
              )}
            </ActionButton>
            <p className="text-xs text-gray-500 mt-1.5">PDF, JPEG, PNG, WEBP — max {MAX_MB}MB</p>
          </div>

          {uploadError && (
            <p className="text-sm text-red-400">{uploadError}</p>
          )}
        </div>
      )}

      <div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Spinner size={16} /> Loading documents…
          </div>
        )}
        {error && !isLoading && (
          <ErrorState title="Couldn't load documents" message={(error as any)?.message} />
        )}
        {!isLoading && !error && documents.length === 0 && (
          <EmptyState
            icon="📄"
            title="No documents"
            description={canUpload ? "Upload a document to get started." : "No documents have been uploaded yet."}
          />
        )}
        {!isLoading && !error && documents.length > 0 && (
          <div>
            {documents.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} canDelete={canDelete} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
