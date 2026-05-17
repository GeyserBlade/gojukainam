import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react"
import { Download, FileSpreadsheet, GripVertical, Plus, Search, X } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { listBelts, type Belt } from "@/lib/belts"
import { listClubs, type Club } from "@/lib/clubs"
import { listAllAthletes, listAthletes, type Athlete } from "@/lib/athletes"

type Filters = {
  search: string
  clubId: string
  beltId: string
  gender: string
  minAge: string
  maxAge: string
}

const calculateAge = (dob: string, refDate = new Date()) => {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  let age = refDate.getFullYear() - birth.getFullYear()
  const m = refDate.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

const AthleteExtractPage = () => {
  const { role, clubId } = useAuth()

  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [belts, setBelts] = useState<Belt[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [filters, setFilters] = useState<Filters>({
    search: "",
    clubId: clubId ?? "",
    beltId: "",
    gender: "",
    minAge: "",
    maxAge: "",
  })
  const [ageRefDate, setAgeRefDate] = useState(() => new Date().toISOString().split("T")[0])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropActive, setDropActive] = useState(false)

  const canExtract =
    role === "SUPERADMIN" || role === "ADMIN" || role === "CLUB_MANAGER" || role === "COACH"
  const canSeeAll = role === "SUPERADMIN"

  const columns = useMemo(() => {
    const refDate = new Date(ageRefDate)
    return [
      { label: "First Name", get: (a: Athlete) => a.firstName },
      { label: "Last Name", get: (a: Athlete) => a.lastName },
      { label: "Gender", get: (a: Athlete) => a.gender },
      { label: "DOB", get: (a: Athlete) => new Date(a.dob).toLocaleDateString() },
      { label: "Age", get: (a: Athlete) => String(calculateAge(a.dob, refDate) ?? "") },
      { label: "Club", get: (a: Athlete) => a.club?.name ?? "" },
      { label: "Belt", get: (a: Athlete) => a.belt?.name ?? "" },
      { label: "Nationality", get: (a: Athlete) => a.nationality ?? "" },
      { label: "Weight (kg)", get: (a: Athlete) => (a.weightKg ? String(a.weightKg) : "") },
      { label: "Instructor", get: (a: Athlete) => (a.isInstructor ? "Yes" : "No") },
      { label: "Contact Email", get: (a: Athlete) => a.contactEmail ?? "" },
      { label: "Contact Phone", get: (a: Athlete) => a.contactPhone ?? "" },
    ]
  }, [ageRefDate])

  useEffect(() => {
    setFilters((prev) => ({ ...prev, clubId: clubId ?? "" }))
  }, [clubId])

  useEffect(() => {
    if (!canExtract) return
    if (!clubId && !canSeeAll) {
      setError("A club needs to be associated with your session before generating extracts.")
      setAthletes([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const load = async () => {
      try {
        const [athleteRows, beltRows, clubRows] = await Promise.all([
          canSeeAll ? listAllAthletes() : listAthletes(clubId as string),
          listBelts().catch(() => [] as Belt[]),
          canSeeAll ? listClubs().catch(() => [] as Club[]) : Promise.resolve([] as Club[]),
        ])
        if (!cancelled) {
          setAthletes(athleteRows)
          setBelts(beltRows)
          setClubs(clubRows)
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            (e as Error)?.message ??
            "Failed to load athletes"
          setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [canExtract, canSeeAll, clubId])

  const filteredAthletes = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const minAge = filters.minAge ? Number(filters.minAge) : null
    const maxAge = filters.maxAge ? Number(filters.maxAge) : null
    const refDate = new Date(ageRefDate)

    return athletes.filter((a) => {
      if (filters.clubId && a.clubId !== filters.clubId) return false
      if (filters.beltId && a.beltId !== filters.beltId) return false
      if (filters.gender && a.gender !== filters.gender) return false
      const age = calculateAge(a.dob, refDate)
      if (minAge !== null && (age ?? Infinity) < minAge) return false
      if (maxAge !== null && (age ?? -Infinity) > maxAge) return false
      if (search) {
        const tokens = [
          a.firstName,
          a.lastName,
          `${a.firstName} ${a.lastName}`,
          a.club?.name ?? "",
          a.belt?.name ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!tokens.includes(search)) return false
      }
      return true
    })
  }, [athletes, filters, ageRefDate])

  const availableAthletes = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    return filteredAthletes.filter((a) => !selectedSet.has(a.id))
  }, [filteredAthletes, selectedIds])

  const selectedAthletes = useMemo(() => {
    const map = new Map(athletes.map((a) => [a.id, a]))
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as Athlete[]
  }, [athletes, selectedIds])

  const addSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const addManySelections = useCallback((ids: string[]) => {
    if (!ids.length) return
    setSelectedIds((prev) => {
      const set = new Set(prev)
      let changed = false
      ids.forEach((id) => {
        if (!set.has(id)) {
          set.add(id)
          changed = true
        }
      })
      return changed ? Array.from(set) : prev
    })
  }, [])

  const removeSelection = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const clearSelection = () => setSelectedIds([])

  const handleDrop = (evt: DragEvent<HTMLDivElement>) => {
    evt.preventDefault()
    const id = evt.dataTransfer.getData("text/athlete-id")
    if (id) addSelection(id)
    setDraggingId(null)
    setDropActive(false)
  }

  const download = (format: "csv" | "excel") => {
    if (!selectedAthletes.length) return
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    if (format === "csv") {
      const lines = [
        columns.map((c) => `"${c.label}"`).join(","),
        ...selectedAthletes.map((a) =>
          columns
            .map((c) => {
              const raw = c.get(a) ?? ""
              const v = typeof raw === "string" ? raw : String(raw ?? "")
              return `"${v.replace(/"/g, '""')}"`
            })
            .join(","),
        ),
      ]
      const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `athlete-extract-${stamp}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    const header = `<tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>`
    const body = selectedAthletes
      .map((a) => `<tr>${columns.map((c) => `<td>${c.get(a) ?? ""}</td>`).join("")}</tr>`)
      .join("")
    const html = `<table>${header}${body}</table>`
    const blob = new Blob([`﻿${html}`], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `athlete-extract-${stamp}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!canExtract) {
    return (
      <AppShell title="Athlete extract">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Your role doesn't allow exporting athletes.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title="Athlete extract">
      <div className="mb-4 sm:mb-6">
        <p className="text-xs uppercase tracking-wider text-primary font-medium">
          Data tools
        </p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider mt-1">
          EXTRACT BUILDER
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Filter and curate athletes, then export to CSV or Excel.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search name, club, belt..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-9"
              />
            </div>
            <Select
              value={filters.clubId || "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, clubId: v === "all" ? "" : v }))
              }
              disabled={!canSeeAll}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={canSeeAll ? "All clubs" : "My club"}
                />
              </SelectTrigger>
              <SelectContent>
                {canSeeAll ? (
                  <>
                    <SelectItem value="all">All clubs</SelectItem>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem value={clubId ?? ""}>
                    {clubId ? "My club" : "No club"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select
              value={filters.beltId || "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, beltId: v === "all" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All belts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All belts</SelectItem>
                {belts.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name ?? `Belt ${b.order}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Select
              value={filters.gender || "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, gender: v === "all" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              placeholder="Min age"
              value={filters.minAge}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, minAge: e.target.value }))
              }
            />
            <Input
              type="number"
              min="0"
              placeholder="Max age"
              value={filters.maxAge}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, maxAge: e.target.value }))
              }
            />
            <Input
              type="date"
              title="Age reference date"
              value={ageRefDate}
              onChange={(e) => setAgeRefDate(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters({
                search: "",
                clubId: clubId ?? "",
                beltId: "",
                gender: "",
                minAge: "",
                maxAge: "",
              })
              setAgeRefDate(new Date().toISOString().split("T")[0])
            }}
          >
            Reset filters
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          onDragOver={(e) => {
            e.preventDefault()
            setDropActive(true)
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}
          className={cn(
            "transition-colors",
            dropActive && "border-primary bg-primary/5",
          )}
        >
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Selection</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedAthletes.length} athletes
              </p>
            </div>
            {selectedAthletes.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {selectedAthletes.length === 0 ? (
                <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                  Drag athletes here or use Add to build your extract.
                </div>
              ) : (
                selectedAthletes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.club?.name ?? "—"} · {a.belt?.name ?? "—"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeSelection(a.id)}
                      aria-label={`Remove ${a.firstName}`}
                    >
                      <X />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                onClick={() => download("csv")}
                disabled={!selectedAthletes.length}
                className="w-full"
              >
                <Download />
                Download CSV
              </Button>
              <Button
                onClick={() => download("excel")}
                disabled={!selectedAthletes.length}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet />
                Download Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Available</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {availableAthletes.length} match filters
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => addManySelections(availableAthletes.map((a) => a.id))}
              disabled={!availableAthletes.length}
            >
              Add all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {loading && (
                <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
              )}
              {!loading && availableAthletes.length === 0 && (
                <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                  No athletes match your filters.
                </div>
              )}
              {availableAthletes.map((a) => {
                const age = calculateAge(a.dob, new Date(ageRefDate))
                return (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(evt) => {
                      evt.dataTransfer.setData("text/athlete-id", a.id)
                      setDraggingId(a.id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border bg-card px-3 py-2 cursor-grab active:cursor-grabbing transition-colors",
                      "hover:border-foreground/20",
                      draggingId === a.id && "opacity-50",
                    )}
                  >
                    <GripVertical className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {a.firstName} {a.lastName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {a.gender}
                          {age !== null && ` · ${age}y`}
                        </span>
                        <BeltBadge name={a.belt?.name} colour={a.belt?.colour} />
                      </div>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => addSelection(a.id)}
                      aria-label={`Add ${a.firstName}`}
                    >
                      <Plus />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default AthleteExtractPage
