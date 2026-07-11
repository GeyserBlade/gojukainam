import { ListFilter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { Belt } from "@/lib/belts"
import type { Club } from "@/lib/clubs"

export interface AthletesFilters {
  clubId: string
  beltId: string
  minAge: string
  maxAge: string
  showInactive: boolean
}

export const defaultFilters = (clubId?: string | null): AthletesFilters => ({
  clubId: clubId ?? "",
  beltId: "",
  minAge: "",
  maxAge: "",
  showInactive: false,
})

interface AthletesFiltersSheetProps {
  filters: AthletesFilters
  onChange: (next: AthletesFilters) => void
  clubs: Club[]
  belts: Belt[]
  showClubFilter: boolean
}

export function AthletesFiltersSheet({
  filters,
  onChange,
  clubs,
  belts,
  showClubFilter,
}: AthletesFiltersSheetProps) {
  const activeCount =
    (filters.clubId ? 1 : 0) +
    (filters.beltId ? 1 : 0) +
    (filters.minAge ? 1 : 0) +
    (filters.maxAge ? 1 : 0) +
    (filters.showInactive ? 1 : 0)

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

          <div className="space-y-2">
            <Label htmlFor="filter-belt">Belt</Label>
            <Select
              value={filters.beltId || "all"}
              onValueChange={(v) =>
                onChange({ ...filters, beltId: v === "all" ? "" : v })
              }
            >
              <SelectTrigger id="filter-belt" className="w-full">
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

          <div className="space-y-2">
            <Label>Age range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Min age"
                value={filters.minAge}
                onChange={(e) => onChange({ ...filters, minAge: e.target.value })}
              />
              <Input
                type="number"
                min="0"
                placeholder="Max age"
                value={filters.maxAge}
                onChange={(e) => onChange({ ...filters, maxAge: e.target.value })}
              />
            </div>
          </div>

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
            onClick={() => onChange(defaultFilters())}
          >
            Clear filters
          </Button>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
