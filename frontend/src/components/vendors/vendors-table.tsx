"use client"

import { type FormEvent, useMemo, useState } from "react"
import { Filter, RefreshCw, Search } from "lucide-react"
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
  addVendor,
  ApiRequestError,
  type BackendBill,
  type BackendCommodity,
  type BackendPaymentLog,
  deleteVendor,
  getCurrentUserId,
  getVendorBills,
  getVendorCommodities,
  getVendorPaymentLogs,
  getVendors,
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
  payments: BackendPaymentLog[]
}

const VENDORS_QUERY_KEY = "vendors-hydrated"

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getToleranceLevel(outstandingBalance: number): ToleranceLevel {
  if (outstandingBalance < 5000) return "HIGH"
  if (outstandingBalance <= 15000) return "MEDIUM"
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
  if (balance < 5000) return "text-emerald-400"
  if (balance <= 15000) return "text-amber-400"
  return "text-red-400"
}

async function fetchHydratedVendors(userId: string): Promise<UiVendor[]> {
  const rawVendors = await getVendors(userId)

  return Promise.all(
    rawVendors.map(async (vendor) => {
      const [linkedCommodities, bills, payments] = await Promise.all([
        getVendorCommodities(userId, vendor.id),
        getVendorBills(userId, vendor.id),
        getVendorPaymentLogs(userId, vendor.id),
      ])

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
        toleranceLevel: getToleranceLevel(outstandingBalance),
        flexibility: getFlexibility(outstandingBalance),
        lastSupplyDate: bills[0]?.date ?? null,
        lastPaymentDate: payments[0]?.payment_date ?? null,
        bills,
        payments,
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
  const [addError, setAddError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const vendorsQuery = useQuery({
    queryKey: [VENDORS_QUERY_KEY, userId],
    queryFn: () => fetchHydratedVendors(userId),
  })

  const vendors = vendorsQuery.data ?? []

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
    mutationFn: (payload: { name: string; phone_number: string }) => addVendor(userId, payload),
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
    if (!name || !phone) {
      setAddError("Name and phone number are required")
      return
    }

    try {
      await addVendorMutation.mutateAsync({ name, phone_number: phone })
      setAddDialogOpen(false)
      setAddName("")
      setAddPhone("")
    } catch (submitError) {
      const message =
        submitError instanceof ApiRequestError
          ? submitError.message
          : "Failed to add vendor"
      setAddError(message)
    }
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
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        <p>{message}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void vendorsQuery.refetch()}
          className="mt-3 border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Filters */}
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
            className="bg-emerald-600 text-white hover:bg-emerald-700"
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
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {mutationError}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
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
                  ₹{vendor.outstandingBalance.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      vendor.toleranceLevel === "LOW" &&
                        "border-red-500/30 bg-red-500/10 text-red-400",
                      vendor.toleranceLevel === "MEDIUM" &&
                        "border-amber-500/30 bg-amber-500/10 text-amber-400",
                      vendor.toleranceLevel === "HIGH" &&
                        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
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

      {/* Vendor Drawer */}
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
            {addError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
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
                className="bg-emerald-600 text-white hover:bg-emerald-700"
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
