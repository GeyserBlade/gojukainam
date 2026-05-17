import { ListFilter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Club } from "@/lib/clubs"

export interface AthletesFilters {
  clubId: string
  showInactive: boolean
}

interface AthletesFiltersSheetProps {
  filters: AthletesFilters
  onChange: (next: AthletesFilters) => void
  clubs: Club[]
  showClubFilter: boolean
}

export function AthletesFiltersSheet({
  filters,
  onChange,
  clubs,
  showClubFilter,
}: AthletesFiltersSheetProps) {
  const activeCount =
    (filters.clubId ? 1 : 0) + (filters.showInactive ? 1 : 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ListFilter />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm gap-0">
        <SheetHeader>
          <SheetTitle>Filter athletes</SheetTitle>
          <SheetDescription>
            Narrow down which athletes are shown in the list.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {showClubFilter && (
            <div className="space-y-2">
              <Label htmlFor="filter-club">Club</Label>
              <Select
                value={filters.clubId || "all"}
                onValueChange={(v) =>
                  onChange({ ...filters, clubId: v === "all" ? "" : v })
                }
              >
                <SelectTrigger id="filter-club" className="w-full">
                  <SelectValue placeholder="All clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clubs</SelectItem>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="flex items-center gap-3 rounded-md border bg-card p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showInactive}
              onChange={(e) =>
                onChange({ ...filters, showInactive: e.target.checked })
              }
              className="size-4 rounded border-input accent-primary"
            />
            <div>
              <p className="text-sm font-medium leading-none">Show inactive</p>
              <p className="text-xs text-muted-foreground mt-1">
                Include athletes flagged as inactive.
              </p>
            </div>
          </label>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onChange({ clubId: "", showInactive: false })}
          >
            Reset
          </Button>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
