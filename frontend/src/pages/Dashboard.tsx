import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  Eye,
  ListChecks,
  PlusCircle,
  Shield,
  Upload,
  UserCog,
  Users,
  Users2,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import {
  deleteAthlete,
  listAllAthletes,
  listAthletes,
  type Athlete,
} from "@/lib/athletes"
import { listClubs, type Club } from "@/lib/clubs"
import { useHoverPrefetch } from "@/lib/prefetch"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { StatCard } from "@/components/dashboard/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/UIState"

function calculateAge(dob: string) {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

type QuickAction = {
  label: string
  to: string
  icon: LucideIcon
  variant?: "default" | "secondary" | "outline"
}

const Dashboard = () => {
  const { role, clubId, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()

  const canManage = role === "ADMIN" || role === "SUPERADMIN" || role === "CLUB_MANAGER"

  const { data: versionInfo } = useQuery({
    queryKey: ["version"],
    queryFn: async () => {
      const res = await api.get("/version")
      return res.data as { backend: string; db: number }
    },
    staleTime: Infinity,
  })

  const {
    data: events = [],
    isLoading: loadingEvents,
  } = useQuery<Array<{ id: string; name: string; startDate: string; venue?: string; city?: string }>>({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events")).data,
  })

  const { data: club } = useQuery<Club>({
    queryKey: ["club", clubId],
    queryFn: async () => (await api.get(`/clubs/${clubId}`)).data,
    enabled: !!clubId,
  })

  const canSeeAllClubs = role === "SUPERADMIN" || role === "ADMIN"

  const { data: clubs = [], isLoading: loadingClubs } = useQuery<Club[]>({
    queryKey: ["clubs"],
    queryFn: listClubs,
    enabled: canSeeAllClubs,
  })

  const clubsForCard = useMemo<Club[]>(() => {
    if (canSeeAllClubs) {
      return [...clubs].sort(
        (a, b) => (b._count?.athletes ?? 0) - (a._count?.athletes ?? 0),
      )
    }
    return club ? [club] : []
  }, [canSeeAllClubs, clubs, club])

  const totalAthletesAcrossClubs = useMemo(() => {
    if (!canSeeAllClubs) return club?._count?.athletes ?? null
    return clubs.reduce((sum, c) => sum + (c._count?.athletes ?? 0), 0)
  }, [canSeeAllClubs, clubs, club])

  const {
    data: athletes = [],
    isLoading: loadingAthletes,
    error: errorAthletes,
    refetch: refetchAthletes,
  } = useQuery<Athlete[]>({
    queryKey: ["athletes", clubId, role],
    queryFn: async () => {
      const canListAll = role === "SUPERADMIN"
      if (!clubId && !canListAll) return []
      if (clubId) return listAthletes(clubId)
      return listAllAthletes()
    },
    enabled: !!clubId || role === "SUPERADMIN",
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] })
      toast.success("Athlete deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete athlete"),
  })

  async function onDeleteAthlete(id: string, label: string) {
    const ok = await confirm({
      title: `Delete ${label}?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    deleteMutation.mutate(id)
  }

  const upcomingEvents = useMemo(() => {
    const now = Date.now()
    return [...events]
      .filter((e) => new Date(e.startDate).getTime() >= now - 86_400_000)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
  }, [events])

  const recentAthletes = useMemo(() => athletes.slice(0, 6), [athletes])

  // Cache warm-up on hover.
  const prefetchAthletes = useHoverPrefetch({
    queryKey: ["athletes", "", role, false],
    queryFn: () => (role === "SUPERADMIN" ? listAllAthletes() : Promise.resolve([])),
  })

  const quickActions: QuickAction[] = []
  if (canManage) {
    quickActions.push(
      { label: "New athlete", to: "/athletes/new", icon: PlusCircle },
      { label: "Manage athletes", to: "/athletes", icon: Users, variant: "secondary" },
      { label: "Entry management", to: "/events", icon: ListChecks, variant: "secondary" },
      { label: "Event admin", to: "/events/manage", icon: CalendarDays, variant: "secondary" },
      { label: "View entries", to: "/entries/view", icon: Eye, variant: "outline" },
    )
    if (role === "SUPERADMIN") {
      quickActions.push({ label: "Import", to: "/athletes/import", icon: Upload, variant: "outline" })
    }
    quickActions.push(
      { label: "Users", to: "/users", icon: UserCog, variant: "outline" },
      { label: "Clubs", to: "/clubs", icon: Shield, variant: "outline" },
    )
  }

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  return (
    <AppShell title="Dashboard">
      {/* Hero */}
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
          {greeting.toUpperCase()}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.email ?? "Welcome back"}
          {club?.name ? ` · ${club.name}` : ""}
          {club?.region ? ` · ${club.region}` : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatCard
          label="Athletes"
          value={athletes.length}
          icon={Users}
          accent="primary"
          hint={canManage ? "Manage your roster" : "Athletes in your club"}
          href={canManage ? "/athletes" : undefined}
          loading={loadingAthletes}
        />
        <StatCard
          label="Events"
          value={events.length}
          icon={CalendarDays}
          accent="belt-orange"
          hint={upcomingEvents[0]?.name ?? "No upcoming events"}
          href={canManage ? "/events" : undefined}
          loading={loadingEvents}
        />
        <StatCard
          label="Role"
          value={role ?? "—"}
          icon={Users2}
          accent="flag-blue"
          hint={club?.name ? club.name : clubId ? "(club set)" : "No club assigned"}
        />
      </div>

      {/* Quick actions */}
      {canManage && quickActions.length > 0 && (
        <Card className="mb-5 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon
              const prefetch = a.to === "/athletes" ? prefetchAthletes : undefined
              return (
                <Button
                  key={a.to}
                  variant={a.variant ?? "default"}
                  size="sm"
                  onClick={() => navigate(a.to)}
                  onMouseEnter={prefetch?.onMouseEnter}
                  onFocus={prefetch?.onFocus}
                >
                  <Icon />
                  {a.label}
                </Button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Upcoming events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Upcoming events</CardTitle>
            {canManage && (
              <Button asChild variant="ghost" size="sm">
                <a href="/events/manage">
                  Manage
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingEvents && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
            {!loadingEvents && upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No upcoming events.
              </p>
            )}
            {!loadingEvents && upcomingEvents.length > 0 && (
              <ul className="divide-y">
                {upcomingEvents.map((ev) => {
                  const date = new Date(ev.startDate)
                  return (
                    <li
                      key={ev.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-10 flex-col items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                        <span className="text-xs font-medium leading-none">
                          {date.toLocaleString(undefined, { month: "short" }).toUpperCase()}
                        </span>
                        <span className="font-display text-lg leading-none mt-0.5">
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{ev.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[ev.venue, ev.city].filter(Boolean).join(" · ") || date.toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Clubs</CardTitle>
              {!loadingClubs && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canSeeAllClubs ? `${clubs.length} club${clubs.length === 1 ? "" : "s"}` : "Your club"}
                  {totalAthletesAcrossClubs !== null &&
                    ` · ${totalAthletesAcrossClubs} athlete${totalAthletesAcrossClubs === 1 ? "" : "s"}`}
                </p>
              )}
            </div>
            {canSeeAllClubs && (
              <Button asChild variant="ghost" size="sm">
                <a href="/clubs">Manage</a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingClubs && canSeeAllClubs && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {!loadingClubs && clubsForCard.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {canSeeAllClubs ? "No clubs yet." : "No club assigned."}
              </p>
            )}
            {!loadingClubs && clubsForCard.length > 0 && (
              <ul className="divide-y -my-2 max-h-72 overflow-y-auto">
                {clubsForCard.map((c) => {
                  const count = c._count?.athletes ?? 0
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        {c.region && (
                          <p className="text-xs text-muted-foreground truncate">
                            {c.region}
                          </p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="font-display text-xl tracking-wide leading-none tabular-nums">
                          {count}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          athlete{count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent athletes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Athletes</CardTitle>
            {!loadingAthletes && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {athletes.length} total
                {recentAthletes.length < athletes.length && ` · showing latest ${recentAthletes.length}`}
              </p>
            )}
          </div>
          {canManage && (
            <Button asChild variant="ghost" size="sm">
              <a href="/athletes">View all</a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingAthletes && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}
          {errorAthletes && !loadingAthletes && (
            <ErrorState
              title="Couldn't load athletes"
              message={errorAthletes instanceof Error ? errorAthletes.message : "Please try again."}
              onRetry={() => refetchAthletes()}
            />
          )}
          {!loadingAthletes && !errorAthletes && recentAthletes.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {!clubId && role !== "SUPERADMIN"
                ? "Set a club to view athletes."
                : "No athletes yet."}
            </p>
          )}
          {!loadingAthletes && !errorAthletes && recentAthletes.length > 0 && (
            <ul className="divide-y -my-2">
              {recentAthletes.map((a) => {
                const age = calculateAge(a.dob)
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[
                          a.gender,
                          age !== null ? `${age} yrs` : null,
                          a.belt?.name,
                          a.club?.name,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {canManage && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          onDeleteAthlete(a.id, `${a.firstName} ${a.lastName}`)
                        }
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <footer className="pt-8 pb-2 text-center">
        <span className="text-xs text-muted-foreground/60">
          fe {__APP_VERSION__} · api {versionInfo?.backend ?? "…"} · db {versionInfo?.db ?? "…"}
        </span>
      </footer>
    </AppShell>
  )
}

export { Dashboard }
