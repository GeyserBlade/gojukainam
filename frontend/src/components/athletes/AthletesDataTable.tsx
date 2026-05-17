import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { cn } from "@/lib/utils"
import type { Athlete } from "@/lib/athletes"

function calculateAge(dob?: string | null) {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : ""

interface AthletesDataTableProps {
  athletes: Athlete[]
  onDelete: (athlete: Athlete) => void
  isDeleting?: boolean
  toolbar?: React.ReactNode
  emptyState?: React.ReactNode
}

export function AthletesDataTable({
  athletes,
  onDelete,
  isDeleting,
  toolbar,
  emptyState,
}: AthletesDataTableProps) {
  const navigate = useNavigate()

  const columns = useMemo<ColumnDef<Athlete>[]>(
    () => [
      {
        id: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-1.5 opacity-50" />
          </Button>
        ),
        accessorFn: (a) => `${a.lastName} ${a.firstName}`,
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="flex flex-col">
              <span
                className={cn(
                  "font-medium",
                  a.isActive === false && "text-muted-foreground",
                )}
              >
                {a.firstName} {a.lastName}
              </span>
              {a.isActive === false && (
                <Badge
                  variant="secondary"
                  className="mt-1 w-fit text-[10px]"
                >
                  Inactive
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "gender",
        header: "Gender",
        accessorKey: "gender",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.gender}
          </Badge>
        ),
      },
      {
        id: "age",
        header: "Age",
        accessorFn: (a) => calculateAge(a.dob) ?? 0,
        sortingFn: "basic",
        cell: ({ row }) => {
          const age = calculateAge(row.original.dob)
          return (
            <span className="tabular-nums text-muted-foreground">
              {age ?? "—"}
            </span>
          )
        },
      },
      {
        id: "belt",
        header: "Belt",
        accessorFn: (a) => a.belt?.name ?? "",
        cell: ({ row }) => (
          <BeltBadge
            name={row.original.belt?.name}
            colour={row.original.belt?.colour}
          />
        ),
      },
      {
        id: "club",
        header: "Club",
        accessorFn: (a) => a.club?.name ?? "",
        cell: ({ row }) => (
          <span className="text-muted-foreground truncate max-w-[12rem] inline-block align-middle">
            {row.original.club?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "weight",
        header: "Weight",
        accessorFn: (a) => a.weightKg ?? 0,
        sortingFn: "basic",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.weightKg ? `${row.original.weightKg} kg` : "—"}
          </span>
        ),
      },
      {
        id: "nationality",
        header: "Nationality",
        accessorFn: (a) => a.nationality ?? "",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.nationality ?? "—"}
          </span>
        ),
      },
      {
        id: "joined",
        header: "Joined",
        accessorFn: (a) => a.joinDate ?? "",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDate(row.original.joinDate)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${a.firstName} ${a.lastName}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => navigate(`/athletes/${a.id}/edit`)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDelete(a)}
                    disabled={isDeleting}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [navigate, onDelete, isDeleting],
  )

  return (
    <DataTable
      columns={columns}
      data={athletes}
      toolbar={toolbar}
      emptyState={emptyState}
      pageSize={25}
    />
  )
}
