import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { listClubs, type Club } from "@/lib/clubs"
import { importAthletes, type AthleteImportResult } from "@/lib/athletes"

const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]
const ACCEPTED_EXTENSIONS = ".csv,.xls,.xlsx"

const AthleteImportPage = () => {
  const { role } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<string>("")
  const [clubsError, setClubsError] = useState<string | null>(null)
  const [loadingClubs, setLoadingClubs] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AthleteImportResult | null>(null)

  useEffect(() => {
    if (role !== "SUPERADMIN") return
    setLoadingClubs(true)
    setClubsError(null)
    listClubs()
      .then((rows) => {
        setClubs(rows)
        setSelectedClub((prev) => prev || rows[0]?.id || "")
      })
      .catch((e) => {
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          (e as Error)?.message ??
          "Failed to load clubs"
        setClubsError(msg)
      })
      .finally(() => setLoadingClubs(false))
  }, [role])

  const acceptedTypes = useMemo(() => new Set(ACCEPTED_TYPES), [])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const candidate = files[0]
    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? ""
    if (
      !acceptedTypes.has(candidate.type) &&
      !["csv", "xls", "xlsx"].includes(extension)
    ) {
      setFileError("Unsupported file. Upload CSV or Excel (.xls/.xlsx).")
      setFile(null)
      return
    }
    setFile(candidate)
    setFileError(null)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    handleFiles(event.dataTransfer.files)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setResult(null)
    if (!selectedClub) return
    if (!file) {
      setFileError("Select a file to import.")
      return
    }
    setSubmitting(true)
    try {
      const summary = await importAthletes({ clubId: selectedClub, file })
      setResult(summary)
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        "Failed to import athletes"
      setResult({
        insertedCount: 0,
        failedCount: 1,
        failures: [{ rowNumber: 0, reason: msg }],
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (role !== "SUPERADMIN") {
    return (
      <AppShell title="Import athletes">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Only SUPERADMIN users may import athletes.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title="Import athletes">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
            IMPORT ATHLETES
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Upload a CSV or Excel file with column headers matching the athlete
            schema (firstName, lastName, dob, gender, beltId, etc.). Invalid rows
            are skipped and reported below. Grade is optional — leave{" "}
            <code className="text-foreground">beltId</code> blank, or drop the
            column entirely, and the athlete imports with no grade recorded.
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <Label htmlFor="club" className="mb-1.5">
                  Club <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedClub}
                  onValueChange={setSelectedClub}
                  disabled={loadingClubs}
                >
                  <SelectTrigger id="club" className="w-full">
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clubsError && (
                  <p className="mt-1 text-xs text-destructive">{clubsError}</p>
                )}
              </div>

              <div>
                <Label className="mb-1.5">
                  File <span className="text-destructive">*</span>
                </Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30 hover:bg-muted/30",
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Drag & drop or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV, XLS, or XLSX
                      </p>
                    </div>
                  </div>
                  {file && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs">
                      <FileSpreadsheet className="size-3.5" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {fileError && (
                  <p className="mt-1 text-xs text-destructive">{fileError}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || !selectedClub || !file}
                className="w-full sm:w-auto sm:min-w-32"
                size="lg"
              >
                {submitting ? "Importing..." : "Start import"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Import summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-md border bg-belt-green/5 border-belt-green/30 px-4 py-3">
                  <CheckCircle2 className="size-5 text-belt-green shrink-0" />
                  <div>
                    <p className="font-display text-2xl tracking-wide text-belt-green leading-none">
                      {result.insertedCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Inserted</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-4 py-3",
                    result.failedCount > 0
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-muted/40 border-border",
                  )}
                >
                  <AlertCircle
                    className={cn(
                      "size-5 shrink-0",
                      result.failedCount > 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "font-display text-2xl tracking-wide leading-none",
                        result.failedCount > 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {result.failedCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </div>
                </div>
              </div>

              {result.failedCount > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Failed rows</p>
                  <div className="rounded-md border max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.failures.map((f, i) => (
                          <TableRow key={`${f.rowNumber}-${i}`}>
                            <TableCell className="tabular-nums">{f.rowNumber}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {f.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default AthleteImportPage
