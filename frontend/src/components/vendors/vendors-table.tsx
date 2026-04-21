"use client"

import { type FormEvent, useMemo, useState } from "react"
import { Filter, Plus, RefreshCw, Search } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  addCommodity,
  addVendor,
  ApiRequestError,
  type BackendBill,
  type BackendCommodity,
  type BackendPayment,
  deleteVendor,
  getCommodities,
  getCurrentUserId,
  getVendorBills,
  getVendorCommodities,
  getVendorPayments,
  getVendors,
  linkCommodityToVendor,
  updateVendor,
} from "@/lib/api"
import { VendorDrawer } from "./vendor-drawer"

type ToleranceLevel = "LOW" | "MEDIUM" | "HIGH"
type Flexibility = "STRICT" | "MODERATE" | "FLEXIBLE"

type UiVendor = {
  id: string
  name: string
  contact: string
  commodities: BackendCommodity[]
  outstandingBalance: number
  toleranceLevel: ToleranceLevel
  flexibility: Flexibility
  lastSupplyDate: string | null
  lastPaymentDate: string | null
  bills: BackendBill[]
  payments: BackendPayment[]
}

type CommodityAssignMode = "existing" | "new"

type CommodityAssignDraft = {
  id: string
  mode: CommodityAssignMode
  existingCommodityId: string
  newCommodityName: string
  unit: string
}

const VENDORS_QUERY_KEY = "vendors-hydrated"
let commodityDraftSeed = 0

function createCommodityAssignDraft(): CommodityAssignDraft {
  commodityDraftSeed += 1
  return {
    id: `vendor-commodity-${commodityDraftSeed}`,
    mode: "existing",
    existingCommodityId: "none",
    newCommodityName: "",
    unit: "kg",
  }
}

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getToleranceLevel(outstandingBalance: number): ToleranceLevel {
  if (outstandingBalance < 5000) return "HIGH"
  if (outstandingBalance <= 15000) return "MEDIUM"
  return "LOW"
}

function toUiToleranceLevel(value?: string): ToleranceLevel {
  const normalized = String(value ?? "").toLowerCase()
  if (normalized === "high") return "HIGH"
  if (normalized === "medium") return "MEDIUM"
  if (normalized === "low") return "LOW"
  return "LOW"
}

function getFlexibility(outstandingBalance: number): Flexibility {
  if (outstandingBalance < 5000) return "FLEXIBLE"
  if (outstandingBalance <= 15000) return "MODERATE"
  return "STRICT"
}

function formatShortDate(input: string | null): string {
  if (!input) return "-"
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

function getBalanceColor(balance: number) {
  if (balance < 5000) return "text-forest"
  if (balance <= 15000) return "text-amber-deep"
  return "text-destructive"
}

async function fetchHydratedVendors(userId: string): Promise<UiVendor[]> {
  const rawVendors = await getVendors(userId)

  return Promise.all(
    rawVendors.map(async (vendor) => {
      const [linkedCommodities, bills, payments] = await Promise.all([
        getVendorCommodities(userId, vendor.id),
        getVendorBills(userId, vendor.id),
        getVendorPayments(userId, vendor.id),
      ])

      const normalizedPayments: BackendPayment[] = payments
        .map((payment) => ({
          ...payment,
          payment_mode: payment.payment_mode,
        }))
        .sort(
        (left, right) => new Date(right.payment_date ?? "").getTime() - new Date(left.payment_date ?? "").getTime()
      )

      const outstandingBalance = bills.reduce((sum, bill) => {
        const pending = asNumber(bill.total_amount) - asNumber(bill.paid_amount)
        return sum + (pending > 0 ? pending : 0)
      }, 0)

      return {
        id: vendor.id,
        name: vendor.name,
        contact: vendor.phone_number,
        commodities: linkedCommodities,
        outstandingBalance,
        toleranceLevel: toUiToleranceLevel(vendor.tolerance_level) ?? getToleranceLevel(outstandingBalance),
        flexibility: getFlexibility(outstandingBalance),
        lastSupplyDate: bills[0]?.date ?? null,
        lastPaymentDate: normalizedPayments[0]?.payment_date ?? null,
        bills,
        payments: normalizedPayments,
      }
    })
  )
}

export function VendorsTable() {
  const queryClient = useQueryClient()
  const userId = getCurrentUserId()
  const [search, setSearch] = useState("")
  const [commodityFilter, setCommodityFilter] = useState<string>("all")
  const [toleranceFilter, setToleranceFilter] = useState<string>("all")
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addToleranceAmount, setAddToleranceAmount] = useState("0")
  const [addToleranceLevel, setAddToleranceLevel] = useState<"low" | "medium" | "high">("low")
  const [addCommodityRows, setAddCommodityRows] = useState<CommodityAssignDraft[]>([
    createCommodityAssignDraft(),
  ])
  const [addError, setAddError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const vendorsQuery = useQuery({
    queryKey: [VENDORS_QUERY_KEY, userId],
    queryFn: () => fetchHydratedVendors(userId),
    staleTime: 2 * 60 * 1000,
    gcTime: 12 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const vendors = vendorsQuery.data ?? []

  const commoditiesQuery = useQuery({
    queryKey: ["commodities", userId],
    queryFn: () => getCommodities(userId),
    enabled: addDialogOpen,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const selectedVendor = useMemo(() => {
    if (!selectedVendorId) return null
    return vendors.find((vendor) => vendor.id === selectedVendorId) ?? null
  }, [vendors, selectedVendorId])

  const allCommodities = useMemo(() => {
    return [...new Set(vendors.flatMap((vendor) => vendor.commodities.map((commodity) => commodity.name)))]
  }, [vendors])

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(search.toLowerCase()) ||
        vendor.commodities.some((commodity) =>
          commodity.name.toLowerCase().includes(search.toLowerCase())
        )
      const matchesCommodity =
        commodityFilter === "all" ||
        vendor.commodities.some((commodity) => commodity.name === commodityFilter)
      const matchesTolerance =
        toleranceFilter === "all" || vendor.toleranceLevel === toleranceFilter

      return matchesSearch && matchesCommodity && matchesTolerance
    })
  }, [vendors, search, commodityFilter, toleranceFilter])

  const addVendorMutation = useMutation({
    mutationFn: (payload: {
      name: string
      phone_number: string
      tolerance_amount: number
      tolerance_level: "low" | "medium" | "high"
    }) => addVendor(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [VENDORS_QUERY_KEY, userId] })
    },
  })

  const updateVendorMutation = useMutation({
    mutationFn: ({ vendorId, payload }: { vendorId: string; payload: { name: string; phone_number: string } }) =>
      updateVendor(userId, vendorId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [VENDORS_QUERY_KEY, userId] })
    },
  })

  const deleteVendorMutation = useMutation({
    mutationFn: (vendorId: string) => deleteVendor(userId, vendorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [VENDORS_QUERY_KEY, userId] })
    },
  })

  const handleViewVendor = (vendorId: string) => {
    setMutationError(null)
    setSelectedVendorId(vendorId)
    setDrawerOpen(true)
  }

  const handleAddVendor = async (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)
    setMutationError(null)

    const name = addName.trim()
    const phone = addPhone.trim()
    const toleranceAmount = Number(addToleranceAmount)

    if (!name || !phone) {
      setAddError("Name and phone number are required")
      return
    }

    if (!Number.isFinite(toleranceAmount) || toleranceAmount < 0) {
      setAddError("Tolerance amount must be 0 or greater")
      return
    }

    try {
      const newVendor = await addVendorMutation.mutateAsync({
        name,
        phone_number: phone,
        tolerance_amount: toleranceAmount,
        tolerance_level: addToleranceLevel,
      })

      const existingCommodities = commoditiesQuery.data ?? []
      const commodityByName = new Map<string, BackendCommodity>()

      existingCommodities.forEach((commodity) => {
        commodityByName.set(commodity.name.trim().toLowerCase(), commodity)
      })

      const activeRows = addCommodityRows.filter((row) =>
        row.mode === "existing"
          ? row.existingCommodityId !== "none"
          : row.newCommodityName.trim().length > 0
      )

      const commodityIdsToLink = new Set<string>()

      for (const row of activeRows) {
        if (row.mode === "existing") {
          commodityIdsToLink.add(row.existingCommodityId)
          continue
        }

        const commodityName = row.newCommodityName.trim().toLowerCase()
        let commodity = commodityByName.get(commodityName)

        if (!commodity) {
          commodity = await addCommodity(userId, {
            name: commodityName,
            quantity: 0,
            unit: row.unit,
          })
          commodityByName.set(commodityName, commodity)
        }

        commodityIdsToLink.add(commodity.id)
      }

      for (const commodityId of commodityIdsToLink) {
        await linkCommodityToVendor(userId, newVendor.id, commodityId)
      }

      setAddDialogOpen(false)
      setAddName("")
      setAddPhone("")
      setAddToleranceAmount("0")
      setAddToleranceLevel("low")
      setAddCommodityRows([createCommodityAssignDraft()])
      await queryClient.invalidateQueries({ queryKey: ["commodities", userId] })
    } catch (submitError) {
      const message =
        submitError instanceof ApiRequestError
          ? submitError.message
          : "Failed to add vendor"
      setAddError(message)
    }
  }

  const updateCommodityRow = (
    draftId: string,
    updater: (row: CommodityAssignDraft) => CommodityAssignDraft
  ) => {
    setAddCommodityRows((prev) => prev.map((row) => (row.id === draftId ? updater(row) : row)))
  }

  const addCommodityRow = () => {
    setAddCommodityRows((prev) => [...prev, createCommodityAssignDraft()])
  }

  const removeCommodityRow = (draftId: string) => {
    setAddCommodityRows((prev) => {
      if (prev.length === 1) {
        return prev
      }

      return prev.filter((row) => row.id !== draftId)
    })
  }

  const handleUpdateVendor = async (vendorId: string, payload: { name: string; phone_number: string }) => {
    setMutationError(null)
    try {
      await updateVendorMutation.mutateAsync({ vendorId, payload })
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to update vendor"
      setMutationError(message)
      throw error
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    setMutationError(null)
    try {
      await deleteVendorMutation.mutateAsync(vendorId)
      if (selectedVendor?.id === vendorId) {
        setDrawerOpen(false)
        setSelectedVendorId(null)
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to delete vendor"
      setMutationError(message)
      throw error
    }
  }

  const handleCommodityChanged = async () => {
    setMutationError(null)
    await queryClient.invalidateQueries({ queryKey: [VENDORS_QUERY_KEY, userId] })
  }

  if (vendorsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        Loading vendors...
      </div>
    )
  }

  if (vendorsQuery.isError) {
    const message =
      vendorsQuery.error instanceof ApiRequestError
        ? vendorsQuery.error.message
        : "Failed to load vendors"

    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        <p>{message}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void vendorsQuery.refetch()}
          className="mt-3 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors or commodities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              setAddError(null)
              setAddDialogOpen(true)
            }}
            className="bg-forest text-cream hover:bg-forest-deep"
          >
            Add Vendor
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void vendorsQuery.refetch()}
            className="border-border/50 bg-secondary"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", vendorsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Select value={commodityFilter} onValueChange={setCommodityFilter}>
            <SelectTrigger className="w-37.5 bg-secondary">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commodities</SelectItem>
              {allCommodities.map((commodity) => (
                <SelectItem key={commodity} value={commodity}>
                  {commodity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={toleranceFilter} onValueChange={setToleranceFilter}>
            <SelectTrigger className="w-37.5 bg-secondary">
              <SelectValue placeholder="Tolerance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mutationError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {mutationError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Vendor</TableHead>
              <TableHead className="text-muted-foreground">Contact</TableHead>
              <TableHead className="text-muted-foreground">Commodities</TableHead>
              <TableHead className="text-right text-muted-foreground">Outstanding</TableHead>
              <TableHead className="text-muted-foreground">Tolerance</TableHead>
              <TableHead className="text-muted-foreground">Last Supply</TableHead>
              <TableHead className="text-muted-foreground">Last Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => (
              <TableRow
                key={vendor.id}
                onClick={() => handleViewVendor(vendor.id)}
                className="cursor-pointer border-border/50 transition-colors hover:bg-secondary/50"
              >
                <TableCell className="font-medium text-card-foreground">{vendor.name}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.contact}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.commodities.slice(0, 2).map((commodity) => (
                      <Badge key={commodity.id} variant="secondary" className="bg-secondary/80 text-xs">
                        {commodity.name}
                      </Badge>
                    ))}
                    {vendor.commodities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{vendor.commodities.length - 2}
                      </Badge>
                    )}
                    {vendor.commodities.length === 0 && (
                      <span className="text-xs text-muted-foreground">No commodities linked</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={cn("text-right font-mono font-semibold", getBalanceColor(vendor.outstandingBalance))}>
                  Rs {vendor.outstandingBalance.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      vendor.toleranceLevel === "LOW" &&
                        "border-destructive/30 bg-destructive/10 text-destructive",
                      vendor.toleranceLevel === "MEDIUM" &&
                        "border-amber/30 bg-amber/12 text-amber-deep",
                      vendor.toleranceLevel === "HIGH" &&
                        "border-forest/30 bg-forest/10 text-forest"
                    )}
                  >
                    {vendor.toleranceLevel}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatShortDate(vendor.lastSupplyDate)}</TableCell>
                <TableCell className="text-muted-foreground">{formatShortDate(vendor.lastPaymentDate)}</TableCell>
              </TableRow>
            ))}

            {filteredVendors.length === 0 && (
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  No vendors match your current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VendorDrawer
        vendor={selectedVendor}
        userId={userId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedVendorId(null)
        }}
        onUpdateVendor={handleUpdateVendor}
        onDeleteVendor={handleDeleteVendor}
        onCommodityChanged={handleCommodityChanged}
      />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="border-border/50 bg-card sm:max-w-115">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-card-foreground">
              Add New Vendor
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Vendor Name</Label>
              <Input
                id="vendor-name"
                value={addName}
                onChange={(event) => setAddName(event.target.value)}
                placeholder="Enter vendor name"
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Phone Number</Label>
              <Input
                id="vendor-phone"
                value={addPhone}
                onChange={(event) => setAddPhone(event.target.value)}
                placeholder="Enter phone number"
                className="bg-secondary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vendor-tolerance-amount">Tolerance Amount</Label>
                <Input
                  id="vendor-tolerance-amount"
                  type="number"
                  min={0}
                  value={addToleranceAmount}
                  onChange={(event) => setAddToleranceAmount(event.target.value)}
                  placeholder="0"
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-tolerance-level">Tolerance Level</Label>
                <Select
                  value={addToleranceLevel}
                  onValueChange={(value: "low" | "medium" | "high") => setAddToleranceLevel(value)}
                >
                  <SelectTrigger id="vendor-tolerance-level" className="bg-secondary">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Assign Commodities (Optional)
              </p>

              <div className="space-y-3">
                {addCommodityRows.map((row, index) => (
                  <div key={row.id} className="rounded-lg border border-border/50 bg-card/35 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-card-foreground">Commodity {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={addCommodityRows.length === 1}
                        onClick={() => removeCommodityRow(row.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateCommodityRow(row.id, (draft) => ({
                            ...draft,
                            mode: "existing",
                            newCommodityName: "",
                          }))
                        }
                        className={cn(
                          "border-border/60 transition-all",
                          row.mode === "existing"
                            ? "border-forest/40 bg-forest/10 text-forest hover:bg-forest/15"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                      >
                        Use Existing
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateCommodityRow(row.id, (draft) => ({
                            ...draft,
                            mode: "new",
                            existingCommodityId: "none",
                          }))
                        }
                        className={cn(
                          "border-border/60 transition-all",
                          row.mode === "new"
                            ? "border-amber/40 bg-amber/15 text-amber-deep hover:bg-amber/20"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                      >
                        Create New
                      </Button>
                    </div>

                    {row.mode === "existing" && (
                      <div className="mt-3 space-y-2">
                        <Label>Existing Commodity</Label>
                        <Select
                          value={row.existingCommodityId}
                          onValueChange={(value) =>
                            updateCommodityRow(row.id, (draft) => ({
                              ...draft,
                              existingCommodityId: value,
                            }))
                          }
                          disabled={commoditiesQuery.isLoading}
                        >
                          <SelectTrigger className="bg-secondary">
                            <SelectValue placeholder="Select commodity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Do not assign now</SelectItem>
                            {(commoditiesQuery.data ?? []).map((commodity) => (
                              <SelectItem key={commodity.id} value={commodity.id}>
                                {commodity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {row.mode === "new" && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Commodity Name</Label>
                          <Input
                            value={row.newCommodityName}
                            onChange={(event) =>
                              updateCommodityRow(row.id, (draft) => ({
                                ...draft,
                                newCommodityName: event.target.value,
                              }))
                            }
                            placeholder="e.g. turmeric"
                            className="bg-secondary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select
                            value={row.unit}
                            onValueChange={(value) =>
                              updateCommodityRow(row.id, (draft) => ({
                                ...draft,
                                unit: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-secondary">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="liter">liter</SelectItem>
                              <SelectItem value="pcs">pcs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCommodityRow}
                  className="w-full border-border/50 bg-secondary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Commodity Row
                </Button>
              </div>
            </div>
            {addError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {addError}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="border-border/50 bg-secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addVendorMutation.isPending}
                className="bg-forest text-cream hover:bg-forest-deep"
              >
                {addVendorMutation.isPending ? "Saving..." : "Save Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
