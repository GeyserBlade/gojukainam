import { useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileText, Loader2, Trash2, Upload } from "lucide-react"

import {
  listDocuments,
  uploadDocument,
  getDownloadUrl,
  deleteDocument,
  DOCUMENT_TYPE_LABELS,
  type Document,
  type DocumentType,
  type EntityFilter,
} from "@/lib/documents"
import { EmptyState, ErrorState, Spinner } from "@/components/UIState"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_MB = 20

type Props = {
  entityFilter: EntityFilter
  canUpload: boolean
  canDelete: boolean
  title?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentRow({
  doc,
  canDelete,
  onDelete,
}: {
  doc: Document
  canDelete: boolean
  onDelete: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handleView() {
    setLoading(true)
    try {
      const url = await getDownloadUrl(doc.id)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      toast.error("Failed to get download link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            {doc.label || doc.filename}
          </span>
          <Badge variant="outline" className="font-normal text-[10px]">
            {DOCUMENT_TYPE_LABELS[doc.documentType]}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {doc.filename} · {formatBytes(doc.sizeBytes)} ·{" "}
          {new Date(doc.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleView}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : null}
          View
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(doc.id)}
            aria-label={`Delete ${doc.label || doc.filename}`}
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  )
}

export function DocumentSection({ entityFilter, canUpload, canDelete, title = "Documents" }: Props) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState<DocumentType>("OTHER")
  const [label, setLabel] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const queryKey = ["documents", entityFilter]

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listDocuments(entityFilter),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Document deleted")
    },
    onError: (err) => showApiError(err, "Failed to delete document"),
  })

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Delete document?",
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    deleteMutation.mutate(id)
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError("Only PDF, JPEG, PNG, and WEBP files are allowed.")
      e.target.value = ""
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_MB}MB.`)
      e.target.value = ""
      return
    }

    setUploading(true)
    try {
      await uploadDocument({
        file,
        documentType: docType,
        label: label.trim() || null,
        ...entityFilter,
      })
      queryClient.invalidateQueries({ queryKey })
      toast.success("Document uploaded")
      setLabel("")
      e.target.value = ""
    } catch (err) {
      const msg = (err as Error)?.message || "Upload failed"
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-md border bg-card p-4 space-y-4">
      <h2 className="text-sm uppercase tracking-wider font-medium text-muted-foreground">
        {title}
      </h2>

      {canUpload && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="doc-type" className="mb-1.5">Document type</Label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as DocumentType)}
                disabled={uploading}
              >
                <SelectTrigger id="doc-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, lbl]) => (
                    <SelectItem key={value} value={value}>
                      {lbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="doc-label" className="mb-1.5">Label (optional)</Label>
              <Input
                id="doc-label"
                type="text"
                placeholder="e.g. 2026 Grading Certificate"
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
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload />
                  Choose file & upload
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5">
              PDF, JPEG, PNG, WEBP — max {MAX_MB}MB
            </p>
          </div>

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>
      )}

      <div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Spinner size={16} /> Loading documents…
          </div>
        )}
        {error && !isLoading && (
          <ErrorState
            title="Couldn't load documents"
            message={(error as Error)?.message}
          />
        )}
        {!isLoading && !error && documents.length === 0 && (
          <EmptyState
            icon={<FileText />}
            title="No documents"
            description={
              canUpload
                ? "Upload a document to get started."
                : "No documents have been uploaded yet."
            }
          />
        )}
        {!isLoading && !error && documents.length > 0 && (
          <div>
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canDelete={canDelete}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
