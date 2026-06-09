import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"
import { DocumentSection } from "@/components/DocumentSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  type Athlete,
  type Gender,
  createAthlete,
  getAthlete,
  updateAthlete,
} from "@/lib/athletes"
import { listClubs, type Club } from "@/lib/clubs"
import { listBelts, type Belt } from "@/lib/belts"

type Mode = "create" | "edit"

const formatApiError = (err: unknown) => {
  const data = (err as { response?: { data?: { error?: string; details?: Array<{ path?: string; message: string }> } } })?.response?.data
  if (data?.details && Array.isArray(data.details) && data.details.length) {
    const msg = data.details
      .map((d) => `${d.path || "field"}: ${d.message}`)
      .join("; ")
    return `${data.error ?? "Validation failed"}: ${msg}`
  }
  return data?.error ?? (err as Error)?.message ?? "Failed to save athlete"
}

const RequiredMark = () => (
  <span className="text-destructive ml-0.5" aria-hidden>*</span>
)

const FieldLabel = ({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
}) => (
  <Label htmlFor={htmlFor} className="mb-1.5">
    {children}
    {required && <RequiredMark />}
  </Label>
)

const AthleteFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const mode: Mode = id ? "edit" : "create"
  const { role, clubId } = useAuth()
  const nav = useNavigate()
  const canManage =
    role === "CLUB_MANAGER" || role === "ADMIN" || role === "SUPERADMIN"

  const [clubs, setClubs] = useState<Club[]>([])
  const [belts, setBelts] = useState<Belt[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<Athlete>>({
    clubId: clubId || undefined,
    gender: "Male",
  })

  useEffect(() => {
    if (!canManage) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const supportPromises: Promise<unknown>[] = [listBelts()]
    if (role !== "CLUB_MANAGER") supportPromises.push(listClubs())
    if (mode === "edit" && id) supportPromises.push(getAthlete(id))
    Promise.all(supportPromises)
      .then((results) => {
        if (cancelled) return
        const [beltsData, second, third] = results
        setBelts(beltsData as Belt[])
        if (mode === "edit" && id) {
          const athleteData = role !== "CLUB_MANAGER" ? third : second
          setForm({ ...(athleteData as Athlete) })
          if (role !== "CLUB_MANAGER") setClubs(second as Club[])
        } else {
          if (role !== "CLUB_MANAGER") setClubs(second as Club[])
        }
      })
      .catch((e) => { if (!cancelled) setError(formatApiError(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [canManage, role, mode, id])

  if (!canManage) {
    return (
      <AppShell title={mode === "create" ? "New athlete" : "Edit athlete"}>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage athletes.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload: Partial<Athlete> & { weightKg?: number } = { ...form }
      if (typeof payload.weightKg === "string") {
        payload.weightKg = Number(payload.weightKg) || undefined
      }
      if (!payload.clubId && clubId) payload.clubId = clubId
      if (mode === "create") {
        await createAthlete(payload as Parameters<typeof createAthlete>[0])
      } else if (mode === "edit" && id) {
        await updateAthlete(id, payload)
      }
      nav("/athletes")
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const titleText = mode === "create" ? "NEW ATHLETE" : "EDIT ATHLETE"

  return (
    <AppShell title={mode === "create" ? "New athlete" : "Edit athlete"}>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => nav("/athletes")}
          aria-label="Back to athletes"
        >
          <ArrowLeft />
        </Button>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
          {titleText}
        </h1>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className={cn(
          "space-y-4 sm:space-y-6",
          // Leave room for the mobile sticky save bar.
          "pb-24 sm:pb-0",
        )}
      >
        {role !== "CLUB_MANAGER" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldLabel htmlFor="club" required>
                Club
              </FieldLabel>
              <Select
                value={form.clubId || ""}
                onValueChange={(v) => setForm({ ...form, clubId: v })}
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Personal information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="firstName" required>First name</FieldLabel>
                <Input
                  id="firstName"
                  required
                  value={form.firstName || ""}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  autoCapitalize="words"
                />
              </div>
              <div>
                <FieldLabel htmlFor="lastName" required>Last name</FieldLabel>
                <Input
                  id="lastName"
                  required
                  value={form.lastName || ""}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  autoCapitalize="words"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel htmlFor="dob" required>Date of birth</FieldLabel>
                <Input
                  id="dob"
                  type="date"
                  required
                  value={form.dob ? String(form.dob).slice(0, 10) : ""}
                  onChange={(e) =>
                    setForm({ ...form, dob: e.target.value })
                  }
                />
              </div>
              <div>
                <FieldLabel htmlFor="gender" required>Gender</FieldLabel>
                <Select
                  value={(form.gender as Gender) || "Male"}
                  onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
                >
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <FieldLabel htmlFor="nationality" required>Nationality</FieldLabel>
                <Input
                  id="nationality"
                  required
                  value={form.nationality || ""}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="idType">ID type</FieldLabel>
              <Input
                id="idType"
                value={form.idType || ""}
                onChange={(e) => setForm({ ...form, idType: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="idNumber">ID number</FieldLabel>
              <Input
                id="idNumber"
                value={form.idNumber || ""}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <FieldLabel htmlFor="weightKg">Weight (kg)</FieldLabel>
              <Input
                id="weightKg"
                type="number"
                inputMode="decimal"
                value={form.weightKg ?? ""}
                onChange={(e) =>
                  setForm({ ...form, weightKg: Number(e.target.value) || undefined })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Karate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FieldLabel htmlFor="belt" required>Belt</FieldLabel>
              <Select
                key={form.beltId || "no-belt"}
                value={form.beltId || ""}
                onValueChange={(v) => setForm({ ...form, beltId: v })}
              >
                <SelectTrigger id="belt" className="w-full">
                  <SelectValue placeholder="Select a belt" />
                </SelectTrigger>
                <SelectContent>
                  {belts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || b.colour || b.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="joinDate">Join date</FieldLabel>
                <Input
                  id="joinDate"
                  type="date"
                  value={form.joinDate ? String(form.joinDate).slice(0, 10) : ""}
                  onChange={(e) =>
                    setForm({ ...form, joinDate: e.target.value })
                  }
                />
              </div>
              <div>
                <FieldLabel htmlFor="lastGraded">Last graded</FieldLabel>
                <Input
                  id="lastGraded"
                  type="date"
                  value={form.lastGraded ? String(form.lastGraded).slice(0, 10) : ""}
                  onChange={(e) =>
                    setForm({ ...form, lastGraded: e.target.value })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 rounded border-input accent-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  Active athlete
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Inactive athletes can't be entered into events.
                </p>
              </div>
            </label>
            <div>
              <FieldLabel htmlFor="medicalNotes">Medical notes</FieldLabel>
              <Textarea
                id="medicalNotes"
                rows={3}
                value={form.medicalNotes || ""}
                onChange={(e) =>
                  setForm({ ...form, medicalNotes: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
              <Input
                id="contactEmail"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                value={form.contactEmail || ""}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="contactPhone">Phone</FieldLabel>
              <Input
                id="contactPhone"
                type="tel"
                inputMode="tel"
                value={form.contactPhone || ""}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Guardians
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="guardianName1">Guardian 1 name</FieldLabel>
              <Input
                id="guardianName1"
                value={form.guardianName1 || ""}
                onChange={(e) =>
                  setForm({ ...form, guardianName1: e.target.value })
                }
                autoCapitalize="words"
              />
            </div>
            <div>
              <FieldLabel htmlFor="guardianPhone1">Guardian 1 phone</FieldLabel>
              <Input
                id="guardianPhone1"
                type="tel"
                inputMode="tel"
                value={form.guardianPhone1 || ""}
                onChange={(e) =>
                  setForm({ ...form, guardianPhone1: e.target.value })
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="guardianName2">Guardian 2 name</FieldLabel>
              <Input
                id="guardianName2"
                value={form.guardianName2 || ""}
                onChange={(e) =>
                  setForm({ ...form, guardianName2: e.target.value })
                }
                autoCapitalize="words"
              />
            </div>
            <div>
              <FieldLabel htmlFor="guardianPhone2">Guardian 2 phone</FieldLabel>
              <Input
                id="guardianPhone2"
                type="tel"
                inputMode="tel"
                value={form.guardianPhone2 || ""}
                onChange={(e) =>
                  setForm({ ...form, guardianPhone2: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldLabel htmlFor="photoUrl">Photo URL</FieldLabel>
            <Input
              id="photoUrl"
              type="url"
              value={form.photoUrl || ""}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />
          </CardContent>
        </Card>

        {mode === "edit" && id && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentSection
                entityFilter={{ athleteId: id }}
                canUpload={canManage}
                canDelete={role === "SUPERADMIN" || role === "ADMIN"}
              />
            </CardContent>
          </Card>
        )}

        {/* Desktop save row (inline) */}
        <div className="hidden sm:flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => nav("/athletes")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : mode === "create" ? "Create athlete" : "Save changes"}
          </Button>
        </div>

        {/* Mobile sticky save bar */}
        <div
          className="sm:hidden fixed left-0 right-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur px-3 py-3"
          style={{ paddingBottom: "calc(0.75rem + var(--safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto max-w-7xl flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => nav("/athletes")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || loading}
              className="flex-[2]"
            >
              {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  )
}

export default AthleteFormPage
