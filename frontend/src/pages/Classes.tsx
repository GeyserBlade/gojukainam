import { useEffect, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { GraduationCap, PlusCircle, Users } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { EmptyState, ErrorState } from "@/components/UIState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { listClubs } from "@/lib/clubs"
import {
  createClass, createInstructor, listClasses, listInstructors, setClassInstructors, todayIso,
  updateClass, updateInstructor, type ClassRow,
} from "@/lib/classes"

/**
 * Classes and who teaches them.
 *
 * This is what monthly fee income is split by: a member's class on the 1st of
 * the month they paid for, and that class's instructors on that day. So every
 * change here is DATED — "Bruno and Ryan share Seniors from 1 March" — and
 * changing who teaches a class never re-splits the months before. A shared
 * class is two instructors; the split is always even, so there is nothing to
 * set beyond who.
 */

const ClassesPage = () => {
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

  const classesQuery = useQuery({
    queryKey: ["classes", clubId, "all"],
    queryFn: () => listClasses(clubId, true),
    enabled: canManage && !!clubId,
  })
  const instructorsQuery = useQuery({
    queryKey: ["instructors", clubId, "all"],
    queryFn: () => listInstructors(clubId, true),
    enabled: canManage && !!clubId,
  })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["classes"] })
    queryClient.invalidateQueries({ queryKey: ["instructors"] })
    queryClient.invalidateQueries({ queryKey: ["class-enrolments"] })
  }

  // ── Instructors ──────────────────────────────────────────────────────────
  const [instructorName, setInstructorName] = useState("")
  const addInstructor = useMutation({
    mutationFn: () => createInstructor({ clubId, name: instructorName.trim() }),
    onSuccess: () => {
      setInstructorName("")
      refresh()
      toast.success("Instructor added")
    },
    onError: (e) => showApiError(e, "Could not add the instructor"),
  })
  const toggleInstructor = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => updateInstructor(clubId, v.id, { active: v.active }),
    onSuccess: refresh,
    onError: (e) => showApiError(e, "Could not update the instructor"),
  })

  // ── Classes ──────────────────────────────────────────────────────────────
  const [className, setClassName] = useState("")
  const [classSchedule, setClassSchedule] = useState("")
  const addClass = useMutation({
    mutationFn: () => createClass({ clubId, name: className.trim(), schedule: classSchedule.trim() || null }),
    onSuccess: () => {
      setClassName("")
      setClassSchedule("")
      refresh()
      toast.success("Class added")
    },
    onError: (e) => showApiError(e, "Could not add the class"),
  })
  const setActive = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => updateClass(clubId, v.id, { active: v.active }),
    onSuccess: refresh,
    onError: (e) => showApiError(e, "Could not update the class"),
  })

  // ── Who teaches a class, from a date ─────────────────────────────────────
  const [teaching, setTeaching] = useState<ClassRow | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [from, setFrom] = useState(todayIso())
  const saveTeaching = useMutation({
    mutationFn: () => setClassInstructors(clubId, teaching!.id, { instructorIds: picked, from }),
    onSuccess: () => {
      setTeaching(null)
      refresh()
      toast.success("Instructors updated")
    },
    onError: (e) => showApiError(e, "Could not change the instructors"),
  })
  function openTeaching(c: ClassRow) {
    setTeaching(c)
    setPicked(c.instructors.map((i) => i.id))
    setFrom(todayIso())
  }

  async function deactivate(c: ClassRow) {
    const ok = await confirm({
      title: `Deactivate ${c.name}?`,
      description: "It will no longer be offered when assigning members. Its history is kept.",
      confirmText: "Deactivate",
    })
    if (ok) setActive.mutate({ id: c.id, active: false })
  }

  if (!canManage) {
    return (
      <AppShell title="Classes">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          You don't have permission to manage classes.
        </CardContent></Card>
      </AppShell>
    )
  }

  const instructors = instructorsQuery.data ?? []
  const activeInstructors = instructors.filter((i) => i.active)
  const classes = classesQuery.data ?? []

  return (
    <AppShell title="Classes">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wider sm:text-4xl">CLASSES</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Monthly fees are split by a member's class and its instructors. A shared class splits evenly.
          </p>
        </div>
        {isAdmin && (
          <div className="w-full sm:w-64">
            <Label htmlFor="classes-club" className="mb-1 block text-xs">Club</Label>
            <Select value={pickedClubId} onValueChange={setPickedClubId}>
              <SelectTrigger id="classes-club"><SelectValue placeholder="Choose a club" /></SelectTrigger>
              <SelectContent>
                {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!clubId ? (
        <EmptyState icon={<Users />} title="No club selected" description="Choose a club to manage its classes." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {/* Instructors */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="text-sm font-semibold">Instructors</h2>
              <form
                className="flex gap-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault()
                  if (instructorName.trim()) addInstructor.mutate()
                }}
              >
                <Input
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Name"
                  aria-label="Instructor name"
                />
                <Button type="submit" disabled={!instructorName.trim() || addInstructor.isPending}>
                  <PlusCircle />Add
                </Button>
              </form>
              {instructorsQuery.isLoading && <Skeleton className="h-10 w-full" />}
              {instructorsQuery.error && (
                <ErrorState title="Couldn't load instructors" message={(instructorsQuery.error as Error).message} onRetry={() => instructorsQuery.refetch()} />
              )}
              <ul className="divide-y divide-border">
                {instructors.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className={i.active ? "" : "text-muted-foreground line-through"}>{i.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={toggleInstructor.isPending}
                      onClick={() => toggleInstructor.mutate({ id: i.id, active: !i.active })}
                    >
                      {i.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </li>
                ))}
                {instructors.length === 0 && !instructorsQuery.isLoading && (
                  <li className="py-2 text-sm text-muted-foreground">No instructors yet.</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Classes */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="text-sm font-semibold">Classes</h2>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault()
                  if (className.trim()) addClass.mutate()
                }}
              >
                <Input className="min-w-40 flex-1" value={className} onChange={(e) => setClassName(e.target.value)}
                  placeholder="Class name, e.g. Juniors" aria-label="Class name" />
                <Input className="min-w-40 flex-1" value={classSchedule} onChange={(e) => setClassSchedule(e.target.value)}
                  placeholder="Schedule, e.g. Mon & Wed 17:00" aria-label="Schedule" />
                <Button type="submit" disabled={!className.trim() || addClass.isPending}>
                  <PlusCircle />Add
                </Button>
              </form>

              {classesQuery.isLoading && <Skeleton className="h-24 w-full" />}
              {classesQuery.error && (
                <ErrorState title="Couldn't load classes" message={(classesQuery.error as Error).message} onRetry={() => classesQuery.refetch()} />
              )}
              {!classesQuery.isLoading && classes.length === 0 && (
                <EmptyState icon={<GraduationCap />} title="No classes yet" description="Add a class, then choose who teaches it." />
              )}
              {classes.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Taught by</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((c) => (
                        <TableRow key={c.id} className={c.active ? "" : "opacity-60"}>
                          <TableCell>
                            <div className="font-medium">{c.name}</div>
                            {c.schedule && <div className="text-xs text-muted-foreground">{c.schedule}</div>}
                            {!c.active && <Badge variant="outline" className="mt-1">Inactive</Badge>}
                          </TableCell>
                          <TableCell>
                            {c.instructors.length === 0 ? (
                              <span className="text-sm text-muted-foreground">Nobody — fees go unassigned</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1">
                                {c.instructors.map((i) => <Badge key={i.id} variant="secondary">{i.name}</Badge>)}
                                {c.shared && <span className="text-xs text-muted-foreground">shared, 50/50</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.memberCount}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {c.active && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => openTeaching(c)}>Instructors</Button>
                                <Button variant="ghost" size="sm" onClick={() => deactivate(c)}>Deactivate</Button>
                              </>
                            )}
                            {!c.active && (
                              <Button variant="ghost" size="sm" onClick={() => setActive.mutate({ id: c.id, active: true })}>
                                Reactivate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!teaching} onOpenChange={(open) => { if (!open) setTeaching(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Who teaches {teaching?.name}</DialogTitle>
            <DialogDescription>
              From the date below. Months before it keep the instructors they had. Two instructors share the
              class's fees evenly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Instructors</legend>
              {activeInstructors.length === 0 && (
                <p className="text-sm text-muted-foreground">Add an instructor first.</p>
              )}
              {activeInstructors.map((i) => (
                <label key={i.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={picked.includes(i.id)}
                    onChange={(e) =>
                      setPicked((prev) => (e.target.checked ? [...prev, i.id] : prev.filter((id) => id !== i.id)))
                    }
                  />
                  {i.name}
                </label>
              ))}
            </fieldset>
            <div>
              <Label htmlFor="teaching-from" className="mb-1 block">From</Label>
              <Input id="teaching-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeaching(null)}>Cancel</Button>
            <Button disabled={!from || saveTeaching.isPending} onClick={() => saveTeaching.mutate()}>
              {saveTeaching.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default ClassesPage
