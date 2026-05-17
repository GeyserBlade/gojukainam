import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusCircle, Search, Users } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { AppShell } from "@/components/layout/AppShell"
import { AthletesDataTable } from "@/components/athletes/AthletesDataTable"
import { AthleteCard } from "@/components/athletes/AthleteCard"
import {
  AthletesFiltersSheet,
  type AthletesFilters,
} from "@/components/athletes/AthletesFiltersSheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState } from "@/components/UIState"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  type Athlete,
  deleteAthlete,
  listAllAthletes,
  listAthletes,
} from "@/lib/athletes"
import { listClubs } from "@/lib/clubs"

const AthletesListPage = () => {
  const { role, clubId } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()
  const canManage =
    role === "CLUB_MANAGER" || role === "ADMIN" || role === "SUPERADMIN"
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const showClubFilter = role === "SUPERADMIN" || role === "ADMIN"

  const [q, setQ] = useState("")
  const [filters, setFilters] = useState<AthletesFilters>({
    clubId: clubId || "",
    showInactive: false,
  })

  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: listClubs,
    enabled: canManage && showClubFilter,
  })

  const {
    data: athletes = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchAthletes,
  } = useQuery<Athlete[]>({
    queryKey: ["athletes", filters.clubId, role, filters.showInactive],
    queryFn: async () => {
      if (role === "SUPERADMIN" && !filters.clubId) {
        return listAllAthletes(filters.showInactive)
      }
      const cid = filters.clubId || clubId || ""
      if (!cid) return []
      return listAthletes(cid, filters.showInactive)
    },
    enabled: canManage,
  })

  const error = queryError
    ? (queryError as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (queryError as Error).message ??
      "Failed to load athletes"
    : null

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return athletes
    return athletes.filter((a) => {
      const nm = `${a.firstName} ${a.lastName}`.toLowerCase()
      const clubName = a.club?.name?.toLowerCase() ?? ""
      const beltName = a.belt?.name?.toLowerCase() ?? ""
      return (
        nm.includes(s) ||
        clubName.includes(s) ||
        beltName.includes(s) ||
        (a.nationality ?? "").toLowerCase().includes(s)
      )
    })
  }, [athletes, q])

  const deleteMutation = useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] })
      toast.success("Athlete deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete athlete"),
  })

  async function onDelete(a: Athlete) {
    const ok = await confirm({
      title: `Delete ${a.firstName} ${a.lastName}?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    deleteMutation.mutate(a.id)
  }

  if (!canManage) {
    return (
      <AppShell title="Athletes">
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

  const searchAndFilters = (
    <div className="flex items-center gap-2 w-full sm:max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search name, club, belt, nationality..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <AthletesFiltersSheet
        filters={filters}
        onChange={setFilters}
        clubs={clubs}
        showClubFilter={showClubFilter}
      />
    </div>
  )

  return (
    <AppShell title="Athletes">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">
            ATHLETES
          </h1>
          {!loading && !error && (
            <p className="text-xs text-muted-foreground mt-1">
              {filtered.length === athletes.length
                ? `${athletes.length} total`
                : `${filtered.length} of ${athletes.length}`}
            </p>
          )}
        </div>
        <Button onClick={() => navigate("/athletes/new")} className="shrink-0">
          <PlusCircle />
          <span className="hidden sm:inline">New athlete</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Couldn't load athletes"
          message={error}
          onRetry={() => refetchAthletes()}
        />
      )}

      {!loading && !error && (
        <>
          {isDesktop ? (
            <AthletesDataTable
              athletes={filtered}
              onDelete={onDelete}
              isDeleting={deleteMutation.isPending}
              toolbar={searchAndFilters}
              emptyState={
                q.trim() ? (
                  <span>No athletes match "{q}".</span>
                ) : (
                  <span>No athletes yet.</span>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {searchAndFilters}
              {filtered.length === 0 ? (
                <EmptyState
                  icon={q.trim() ? <Search /> : <Users />}
                  title={q.trim() ? "No matches" : "No athletes yet"}
                  description={
                    q.trim()
                      ? `No athletes match "${q}".`
                      : "Add your first athlete to get started."
                  }
                  action={
                    !q.trim() ? (
                      <Button onClick={() => navigate("/athletes/new")}>
                        <PlusCircle />
                        Add athlete
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                filtered.map((a) => (
                  <AthleteCard
                    key={a.id}
                    athlete={a}
                    onEdit={() => navigate(`/athletes/${a.id}/edit`)}
                    onDelete={() => onDelete(a)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

export default AthletesListPage
