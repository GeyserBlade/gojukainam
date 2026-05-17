import { MoreVertical } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BeltBadge } from "@/components/athletes/BeltBadge"
import { cn } from "@/lib/utils"
import type { Athlete } from "@/lib/athletes"

interface AthleteCardProps {
  athlete: Athlete
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

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
  value ? new Date(value).toLocaleDateString() : null

export function AthleteCard({ athlete, onEdit, onDelete, isDeleting }: AthleteCardProps) {
  const age = calculateAge(athlete.dob)
  const inactive = athlete.isActive === false

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onEdit()
        }
      }}
      className={cn(
        "p-4 gap-3 cursor-pointer transition-all",
        "hover:border-foreground/20 hover:shadow-sm active:scale-[0.99]",
        inactive && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium leading-tight">
              {athlete.firstName} {athlete.lastName}
            </h3>
            {inactive && (
              <Badge variant="secondary" className="text-[10px]">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {athlete.club?.name ?? "No club"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={onDelete}
              disabled={isDeleting}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="font-normal">
          {athlete.gender}
        </Badge>
        {age !== null && (
          <Badge variant="outline" className="font-normal">
            {age} yrs
          </Badge>
        )}
        {athlete.weightKg && (
          <Badge variant="outline" className="font-normal">
            {athlete.weightKg} kg
          </Badge>
        )}
        <BeltBadge name={athlete.belt?.name} colour={athlete.belt?.colour} />
      </div>

      {(athlete.nationality || formatDate(athlete.joinDate)) && (
        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap pt-1 border-t">
          {athlete.nationality && <span>{athlete.nationality}</span>}
          {athlete.nationality && formatDate(athlete.joinDate) && (
            <span aria-hidden>·</span>
          )}
          {formatDate(athlete.joinDate) && (
            <span>Joined {formatDate(athlete.joinDate)}</span>
          )}
        </div>
      )}
    </Card>
  )
}
