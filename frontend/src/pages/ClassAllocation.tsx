import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Search, Users } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { EmptyState, ErrorState } from "@/components/UIState"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { listAthletes } from "@/lib/athletes"
import { listClubs } from "@/lib/clubs"
import { allocateMembers, listClasses, listCurrentEnrolments, todayIso } from "@/lib/classes"
import { cn } from "@/lib/utils"

/**
 * Put a dojo's members into its classes, many at a time.
 *
 * Changes are staged on screen and saved together, all from one date: "from
 * 1 November these twelve train in Seniors". The save is all or nothing, so a
 * refused move (dated before that member's current class began) leaves every
 * member where they were rather than half the dojo reorganised.
 */

/** Radix Select has no empty value, so "no class" needs a stand-in. */
const NONE = "__none__"
/** Filter value for members not in any class. */
const UNPLACED = "__unplaced__"
const ALL = "__all__"

function ageOn(dob: string, today = new Date()): number | null {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

const ClassAllocationPage = () => {
  const { role, clubId: ownClubId } = useAuth()
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN"
  const canManage = isAdmin || role === "CLUB_MANAGER"
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()

  const [pickedClubId, setPickedClubId] = useState("")
  const clubId = isAdmin ? pickedClubId : ownClubId ?? ""

  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => listClubs(),
    enabled: isAdmin,
  })
  useEffect(() => {
    if (isAdmin && !pickedClubId && clubs.length > 0) setPickedClubId(clubs[0]!.id)
  }, [isAdmin, pickedClubId, clubs])

  const athletesQuery = useQuery({
    queryKey: ["athletes", clubId, role, false],
    queryFn: () => listAthletes(clubId, false),
    enabled: canManage && !!clubId,
  })
  const classesQuery = useQuery({
    queryKey: ["classes", clubId, "active"],
    queryFn: () => listClasses(clubId),
    enabled: canManage && !!clubId,
  })
  const enrolmentsQuery = useQuery({
    queryKey: ["class-enrolments", clubId],
    queryFn: () => listCurrentEnrolments(clubId),
    enabled: canManage && !!clubId,
  })

  // Staged moves, keyed by athlete. A member put back in their current class
  // is dropped from here, so the count is always of real changes.
  const [draft, setDraft] = useState<Map<string, string | null>>(new Map())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [from, setFrom] = useState(todayIso())
  const [q, setQ] = useState("")
  const [show, setShow] = useState(ALL)
  const [bulkClass, setBulkClass] = useState("")

  // A different club is a different roster; nothing staged carries over.
  useEffect(() => {
    setDraft(new Map())
    setSelected(new Set())
    setShow(ALL)
  }, [clubId])

  const classes = classesQuery.data ?? []
  const current = useMemo(
    () => new Map((enrolmentsQuery.data ?? []).map((e) => [e.athleteId, e])),
    [enrolmentsQuery.data],
  )

  const members = useMemo(
    () =>
      [...(athletesQuery.data ?? [])].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName, undefined, { numeric: true }) ||
          a.firstName.localeCompare(b.firstName, undefined, { numeric: true }),
      ),
    [athletesQuery.data],
  )

  const currentClassOf = (athleteId: string) => current.get(athleteId)?.classId ?? null
  const plannedClassOf = (athleteId: string) =>
    draft.has(athleteId) ? draft.get(athleteId)! : currentClassOf(athleteId)

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    return members.filter((a) => {
      const planned = draft.has(a.id) ? draft.get(a.id)! : current.get(a.id)?.classId ?? null
      if (show === UNPLACED && planned !== null) return false
      if (show !== ALL && show !== UNPLACED && planned !== show) return false
      if (s && !`${a.firstName} ${a.lastName}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [members, q, show, draft, current])

  function stage(athleteIds: string[], classId: string | null) {
    setDraft((prev) => {
      const next = new Map(prev)
      for (const id of athleteIds) {
        if ((current.get(id)?.classId ?? null) === classId) next.delete(id)
        else next.set(id, classId)
      }
      return next
    })
  }

  // Head counts per class, now and once the staged moves land.
  const counts = useMemo(() => {
    const now = new Map<string | null, number>()
    const after = new Map<string | null, number>()
    for (const a of members) {
      const was = current.get(a.id)?.classId ?? null
      const will = draft.has(a.id) ? draft.get(a.id)! : was
      now.set(was, (now.get(was) ?? 0) + 1)
      after.set(will, (after.get(will) ?? 0) + 1)
    }
    return { now, after }
  }, [members, current, draft])

  const save = useMutation({
    mutationFn: () =>
      allocateMembers(clubId, {
        from,
        assignments: [...draft].map(([athleteId, classId]) => ({ athleteId, classId })),
      }),
    onSuccess: (r) => {
      setDraft(new Map())
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ["class-enrolments"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success(`${r.changed} member${r.changed === 1 ? "" : "s"} moved from ${r.from}`)
    },
    onError: (e) => showApiError(e, "Nothing was saved"),
  })

  if (!canManage) {
    return (
      <AppShell title="Allocate members">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          You don't have permission to manage classes.
        </CardContent></Card>
      </AppShell>
    )
  }

  const loading = athletesQuery.isLoading || classesQuery.isLoading || enrolmentsQuery.isLoading
  const loadError = athletesQuery.error ?? classesQuery.error ?? enrolmentsQuery.error
  const visibleIds = visible.map((a) => a.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  function toggleAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of visibleIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function applyBulk() {
    if (!bulkClass) return
    stage([...selected], bulkClass === NONE ? null : bulkClass)
    setSelected(new Set())
    setBulkClass("")
  }

  return (
    <AppShell title="Allocate members">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <Link to="/classes" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" />Classes
          </Link>
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">ALLOCATE MEMBERS</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose each member's class, then save every change together from one date.
          </p>
        </div>
        {isAdmin && (
          <div className="w-full sm:w-64">
            <Label htmlFor="allocate-club" className="mb-1 block text-xs">Club</Label>
            <Select
              value={pickedClubId}
              onValueChange={async (v) => {
                if (draft.size > 0) {
                  const ok = await confirm({
                    title: "Discard unsaved changes?",
                    description: `${draft.size} member${draft.size === 1 ? "" : "s"} in this club have a class change that has not been saved.`,
                    confirmText: "Discard",
                  })
                  if (!ok) return
                }
                setPickedClubId(v)
              }}
            >
              <SelectTrigger id="allocate-club"><SelectValue placeholder="Choose a club" /></SelectTrigger>
              <SelectContent>
                {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!clubId ? (
        <EmptyState icon={<Users />} title="No club selected" description="Choose a club to allocate its members." />
      ) : loadError ? (
        <ErrorState
          title="Couldn't load the members"
          message={(loadError as Error).message}
          onRetry={() => {
            athletesQuery.refetch()
            classesQuery.refetch()
            enrolmentsQuery.refetch()
          }}
        />
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No classes yet"
          description="Add this club's classes first, then come back to put members in them."
        />
      ) : (
        <div className="space-y-4 pb-40 sm:pb-24">
          {/* Who is where, now and after saving. Click one to show just those members. */}
          <div className="flex flex-wrap gap-2">
            {[...classes.map((c) => ({ key: c.id as string | null, filter: c.id, name: c.name })),
              { key: null, filter: UNPLACED, name: "No class" }].map((c) => {
              const now = counts.now.get(c.key) ?? 0
              const after = counts.after.get(c.key) ?? 0
              const active = show === c.filter
              return (
                <button
                  key={c.filter}
                  type="button"
                  onClick={() => setShow(active ? ALL : c.filter)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className={cn("font-medium", c.key === null && "text-muted-foreground")}>{c.name}</div>
                  <div className="tabular-nums text-xs text-muted-foreground">
                    {now}
                    {after !== now && <span className="font-semibold text-foreground"> → {after}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative min-w-48 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" aria-label="Search members" />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="allocate-show" className="mb-1 block text-xs">Show</Label>
                  <Select value={show} onValueChange={setShow}>
                    <SelectTrigger id="allocate-show"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All members</SelectItem>
                      <SelectItem value={UNPLACED}>No class</SelectItem>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Always on screen, so ticking the first member doesn't push the table down. */}
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-2 text-sm">
                <span className={cn("font-medium", selected.size === 0 && "text-muted-foreground")}>
                  {selected.size === 0 ? "Tick members to move several at once" : `${selected.size} selected`}
                </span>
                <span className="text-muted-foreground">— put in</span>
                <Select value={bulkClass} onValueChange={setBulkClass} disabled={selected.size === 0}>
                  <SelectTrigger className="h-8 w-44" aria-label="Class for the selected members">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    <SelectItem value={NONE}>No class</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={selected.size === 0 || !bulkClass} onClick={applyBulk}>Apply</Button>
                {selected.size > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                )}
              </div>

              {members.length === 0 ? (
                <EmptyState icon={<Users />} title="No members" description="This club has no active members yet." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            aria-label="Select every member shown"
                            checked={allVisibleSelected}
                            onChange={(e) => toggleAllVisible(e.target.checked)}
                          />
                        </TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead className="hidden sm:table-cell">Belt</TableHead>
                        <TableHead className="hidden md:table-cell">Current class</TableHead>
                        <TableHead>Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((a) => {
                        const now = current.get(a.id)
                        const planned = plannedClassOf(a.id)
                        const changed = draft.has(a.id)
                        const age = ageOn(a.dob)
                        return (
                          <TableRow key={a.id} className={cn(changed && "bg-primary/5")}>
                            <TableCell>
                              <input
                                type="checkbox"
                                className="size-4 accent-primary"
                                aria-label={`Select ${a.firstName} ${a.lastName}`}
                                checked={selected.has(a.id)}
                                onChange={(e) =>
                                  setSelected((prev) => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(a.id)
                                    else next.delete(a.id)
                                    return next
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="whitespace-normal">
                              <div className="font-medium">{a.firstName} {a.lastName}</div>
                              {age !== null && <div className="text-xs text-muted-foreground">{age} yrs</div>}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {a.belt ? <BeltBadge name={a.belt.name} colour={a.belt.colour} /> : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {now ? (
                                <div>
                                  <div className="text-sm">{now.className}</div>
                                  <div className="text-xs text-muted-foreground">since {now.since}</div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">No class</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={planned ?? NONE}
                                  onValueChange={(v) => stage([a.id], v === NONE ? null : v)}
                                >
                                  <SelectTrigger className="h-8 w-32 sm:w-40" aria-label={`Class for ${a.firstName} ${a.lastName}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    <SelectItem value={NONE}>No class</SelectItem>
                                  </SelectContent>
                                </Select>
                                {changed && <Badge variant="secondary" className="hidden sm:inline-flex">changed</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {visible.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                            No members match.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {draft.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-4 py-3">
            <div className="text-sm">
              <div className="font-medium">
                {draft.size} change{draft.size === 1 ? "" : "s"} not saved
              </div>
              <div className="text-xs text-muted-foreground">
                Each member leaves their old class the day before. Months already paid keep their class.
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor="allocate-from" className="mb-1 block text-xs">From</Label>
                <Input id="allocate-from" type="date" className="h-9 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <Button variant="outline" disabled={save.isPending} onClick={() => setDraft(new Map())}>Discard</Button>
              <Button disabled={!from || save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default ClassAllocationPage
