import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, PlusCircle, Sparkles } from "lucide-react"

import { useToast, useApiErrorToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  getDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  getWeightClasses,
  createWeightClass,
  updateWeightClass,
  deleteWeightClass,
  listTemplates,
  applyTemplate,
  type Division,
  type WeightClass,
  type CreateDivisionDto,
  type CreateWeightClassDto,
  type TemplateId,
} from "@/lib/events"

const CATEGORY_STYLES = {
  KATA: "bg-belt-blue/15 text-belt-blue border-belt-blue/30",
  KUMITE: "bg-flag-red/15 text-flag-red border-flag-red/30",
}

const emptyDivision = (eventId: string): CreateDivisionDto => ({
  eventId,
  key: "",
  name: "",
  minAge: 0,
  maxAge: 0,
  gender: "Male",
  category: "KATA",
})

const emptyWeight = (eventId: string): CreateWeightClassDto => ({
  eventId,
  gender: "Male",
  name: "",
  minKg: undefined,
  maxKg: undefined,
})

export function DivisionsWeights({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const showApiError = useApiErrorToast()
  const confirm = useConfirm()

  const [showDivisionModal, setShowDivisionModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [editingWeight, setEditingWeight] = useState<WeightClass | null>(null)
  const [templateToApply, setTemplateToApply] = useState<TemplateId | "">("")
  const [divisionForm, setDivisionForm] = useState<CreateDivisionDto>(emptyDivision(eventId))
  const [weightForm, setWeightForm] = useState<CreateWeightClassDto>(emptyWeight(eventId))

  useEffect(() => {
    setDivisionForm(emptyDivision(eventId))
    setWeightForm(emptyWeight(eventId))
  }, [eventId])

  const { data: templates = [] } = useQuery({
    queryKey: ["eventTemplates"],
    queryFn: listTemplates,
    staleTime: 1000 * 60 * 60,
  })

  const { data: divisions = [], isLoading: loadingDivisions } = useQuery({
    queryKey: ["divisions", eventId],
    queryFn: () => getDivisions(eventId),
    enabled: !!eventId,
  })

  const { data: weightClasses = [], isLoading: loadingWeights } = useQuery({
    queryKey: ["weightClasses", eventId],
    queryFn: () => getWeightClasses(eventId),
    enabled: !!eventId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["divisions", eventId] })
    queryClient.invalidateQueries({ queryKey: ["weightClasses", eventId] })
  }

  const applyTemplateMutation = useMutation({
    mutationFn: (template: TemplateId) => applyTemplate(eventId, template),
    onSuccess: (result) => {
      invalidate()
      setShowTemplateModal(false)
      setTemplateToApply("")
      toast.success(result.message)
    },
    onError: (e) => showApiError(e, "Failed to apply template"),
  })

  const createDivisionMutation = useMutation({
    mutationFn: createDivision,
    onSuccess: () => {
      invalidate()
      setShowDivisionModal(false)
      setDivisionForm(emptyDivision(eventId))
      toast.success("Division created")
    },
    onError: (e) => showApiError(e, "Failed to create division"),
  })

  const updateDivisionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreateDivisionDto, "eventId">> }) =>
      updateDivision(id, data),
    onSuccess: () => {
      invalidate()
      setShowDivisionModal(false)
      setEditingDivision(null)
      setDivisionForm(emptyDivision(eventId))
      toast.success("Division updated")
    },
    onError: (e) => showApiError(e, "Failed to update division"),
  })

  const deleteDivisionMutation = useMutation({
    mutationFn: deleteDivision,
    onSuccess: () => {
      invalidate()
      toast.success("Division deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete division"),
  })

  const createWeightMutation = useMutation({
    mutationFn: createWeightClass,
    onSuccess: () => {
      invalidate()
      setShowWeightModal(false)
      setWeightForm(emptyWeight(eventId))
      toast.success("Weight class created")
    },
    onError: (e) => showApiError(e, "Failed to create weight class"),
  })

  const updateWeightMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreateWeightClassDto, "eventId">> }) =>
      updateWeightClass(id, data),
    onSuccess: () => {
      invalidate()
      setShowWeightModal(false)
      setEditingWeight(null)
      setWeightForm(emptyWeight(eventId))
      toast.success("Weight class updated")
    },
    onError: (e) => showApiError(e, "Failed to update weight class"),
  })

  const deleteWeightMutation = useMutation({
    mutationFn: deleteWeightClass,
    onSuccess: () => {
      invalidate()
      toast.success("Weight class deleted")
    },
    onError: (e) => showApiError(e, "Failed to delete weight class"),
  })

  const handleCreateDivision = () => {
    setEditingDivision(null)
    setDivisionForm(emptyDivision(eventId))
    setShowDivisionModal(true)
  }

  const handleEditDivision = (division: Division) => {
    setEditingDivision(division)
    setDivisionForm({
      eventId,
      key: division.key,
      name: division.name,
      minAge: division.minAge,
      maxAge: division.maxAge,
      gender: division.gender,
      category: division.category,
      notes: division.notes || undefined,
    })
    setShowDivisionModal(true)
  }

  const handleSaveDivision = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...divisionForm, eventId }
    if (editingDivision) {
      const { eventId: _ignore, ...updateData } = data
      void _ignore
      updateDivisionMutation.mutate({ id: editingDivision.id, data: updateData })
    } else {
      createDivisionMutation.mutate(data)
    }
  }

  const handleDeleteDivision = async (division: Division) => {
    const ok = await confirm({
      title: `Delete division "${division.name}"?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) deleteDivisionMutation.mutate(division.id)
  }

  const handleCreateWeight = () => {
    setEditingWeight(null)
    setWeightForm(emptyWeight(eventId))
    setShowWeightModal(true)
  }

  const handleEditWeight = (weight: WeightClass) => {
    setEditingWeight(weight)
    setWeightForm({
      eventId,
      divisionId: weight.divisionId || undefined,
      gender: weight.gender,
      name: weight.name,
      minKg: weight.minKg || undefined,
      maxKg: weight.maxKg || undefined,
    })
    setShowWeightModal(true)
  }

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...weightForm, eventId }
    if (editingWeight) {
      const { eventId: _ignore, ...updateData } = data
      void _ignore
      updateWeightMutation.mutate({ id: editingWeight.id, data: updateData })
    } else {
      createWeightMutation.mutate(data)
    }
  }

  const handleDeleteWeight = async (weight: WeightClass) => {
    const ok = await confirm({
      title: `Delete weight class "${weight.name}"?`,
      description: "This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) deleteWeightMutation.mutate(weight.id)
  }

  return (
    <div className="space-y-6">
      {/* Divisions */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">Divisions</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTemplateToApply("")
                setShowTemplateModal(true)
              }}
            >
              <Sparkles />
              Apply template
            </Button>
            <Button size="sm" onClick={handleCreateDivision}>
              <PlusCircle />
              Add division
            </Button>
          </div>
        </div>

        {loadingDivisions ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : divisions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No divisions yet. Add one or apply a template.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {divisions.map((division) => (
              <Card key={division.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium">{division.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {division.gender} · Ages {division.minAge}-{division.maxAge}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn("font-normal text-[10px]", CATEGORY_STYLES[division.category])}
                        >
                          {division.category}
                        </Badge>
                        <Badge variant="outline" className="font-normal text-[10px]">
                          {division.key}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditDivision(division)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteDivision(division)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Weight classes */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">Weight classes</h3>
          <Button size="sm" onClick={handleCreateWeight}>
            <PlusCircle />
            Add weight class
          </Button>
        </div>

        {loadingWeights ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : weightClasses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No weight classes yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {weightClasses.map((weight) => (
              <Card key={weight.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium">{weight.name}</h4>
                      <p className="text-sm text-muted-foreground">{weight.gender}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {weight.minKg ?? "0"}kg – {weight.maxKg ?? "∞"}kg
                      </p>
                      {weight.division && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Division: {weight.division.name}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditWeight(weight)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteWeight(weight)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Division modal */}
      <Dialog open={showDivisionModal} onOpenChange={setShowDivisionModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingDivision ? "Edit division" : "Add division"}</DialogTitle>
          </DialogHeader>
          <form id="div-form" onSubmit={handleSaveDivision} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="div-key" className="mb-1.5">Key <span className="text-destructive">*</span></Label>
                <Input
                  id="div-key"
                  value={divisionForm.key}
                  onChange={(e) => setDivisionForm({ ...divisionForm, key: e.target.value })}
                  placeholder="CADET"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="div-name" className="mb-1.5">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="div-name"
                  value={divisionForm.name}
                  onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
                  placeholder="Cadet (14-15)"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="div-category" className="mb-1.5">Category <span className="text-destructive">*</span></Label>
                <Select
                  value={divisionForm.category}
                  onValueChange={(v) => setDivisionForm({ ...divisionForm, category: v as "KATA" | "KUMITE" })}
                >
                  <SelectTrigger id="div-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KATA">Kata</SelectItem>
                    <SelectItem value="KUMITE">Kumite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="div-gender" className="mb-1.5">Gender <span className="text-destructive">*</span></Label>
                <Select
                  value={divisionForm.gender}
                  onValueChange={(v) => setDivisionForm({ ...divisionForm, gender: v as "Male" | "Female" })}
                >
                  <SelectTrigger id="div-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="div-min" className="mb-1.5">Min age <span className="text-destructive">*</span></Label>
                <Input
                  id="div-min"
                  type="number"
                  value={divisionForm.minAge}
                  onChange={(e) => setDivisionForm({ ...divisionForm, minAge: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="div-max" className="mb-1.5">Max age <span className="text-destructive">*</span></Label>
                <Input
                  id="div-max"
                  type="number"
                  value={divisionForm.maxAge}
                  onChange={(e) => setDivisionForm({ ...divisionForm, maxAge: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="div-notes" className="mb-1.5">Notes</Label>
              <Input
                id="div-notes"
                value={divisionForm.notes || ""}
                onChange={(e) => setDivisionForm({ ...divisionForm, notes: e.target.value })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDivisionModal(false)}>Cancel</Button>
            <Button
              type="submit"
              form="div-form"
              disabled={createDivisionMutation.isPending || updateDivisionMutation.isPending}
            >
              {editingDivision ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply division template</DialogTitle>
            <DialogDescription>
              Populate this event with divisions and weight classes from a preset. Existing divisions with
              matching keys are skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "block cursor-pointer rounded-md border p-3 transition-colors",
                  templateToApply === t.id ? "border-primary bg-primary/5" : "hover:border-foreground/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={templateToApply === t.id}
                    onChange={() => setTemplateToApply(t.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{t.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.divisionCount} divisions · {t.weightClassCount} weights
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
              disabled={applyTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => templateToApply && applyTemplateMutation.mutate(templateToApply)}
              disabled={!templateToApply || applyTemplateMutation.isPending}
            >
              {applyTemplateMutation.isPending ? "Applying..." : "Apply template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weight modal */}
      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingWeight ? "Edit weight class" : "Add weight class"}</DialogTitle>
          </DialogHeader>
          <form id="wt-form" onSubmit={handleSaveWeight} className="space-y-4">
            <div>
              <Label htmlFor="wt-name" className="mb-1.5">Name <span className="text-destructive">*</span></Label>
              <Input
                id="wt-name"
                value={weightForm.name}
                onChange={(e) => setWeightForm({ ...weightForm, name: e.target.value })}
                placeholder="e.g. -57kg or 57-62kg"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="wt-gender" className="mb-1.5">Gender <span className="text-destructive">*</span></Label>
              <Select
                value={weightForm.gender}
                onValueChange={(v) => setWeightForm({ ...weightForm, gender: v as "Male" | "Female" })}
              >
                <SelectTrigger id="wt-gender"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="wt-min" className="mb-1.5">Min (kg)</Label>
                <Input
                  id="wt-min"
                  type="number"
                  step="0.1"
                  value={weightForm.minKg ?? ""}
                  onChange={(e) =>
                    setWeightForm({ ...weightForm, minKg: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="wt-max" className="mb-1.5">Max (kg)</Label>
                <Input
                  id="wt-max"
                  type="number"
                  step="0.1"
                  value={weightForm.maxKg ?? ""}
                  onChange={(e) =>
                    setWeightForm({ ...weightForm, maxKg: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="wt-division" className="mb-1.5">Link to division (optional)</Label>
              <Select
                value={weightForm.divisionId || "none"}
                onValueChange={(v) => setWeightForm({ ...weightForm, divisionId: v === "none" ? undefined : v })}
              >
                <SelectTrigger id="wt-division" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked to a specific division</SelectItem>
                  {divisions
                    .filter((d) => d.gender === weightForm.gender)
                    .map((div) => (
                      <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowWeightModal(false)}>Cancel</Button>
            <Button
              type="submit"
              form="wt-form"
              disabled={createWeightMutation.isPending || updateWeightMutation.isPending}
            >
              {editingWeight ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
