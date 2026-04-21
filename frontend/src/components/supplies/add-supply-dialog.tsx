"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { CircleX, Plus, ReceiptText, Trash2 } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import {
  addBill,
  addCommodity,
  ApiRequestError,
  getCommodities,
  getCurrentUserId,
  getVendorCommodities,
  getVendors,
  linkCommodityToVendor,
  type AddBillCommodityPayload,
  type AddBillPayload,
  type BackendCommodity,
} from "@/lib/api"

type CommodityMode = "existing" | "new"

type DraftBillItem = {
  id: string
  commodityMode: CommodityMode
  commodityId: string
  newCommodityName: string
  suppliedAmmount: string
  unit: string
  rate: string
}

const UNIT_OPTIONS = ["kg", "liter", "pcs"] as const

interface AddBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBillCreated?: () => Promise<void> | void
}

let draftItemSeed = 0

function createDraftItem(): DraftBillItem {
  draftItemSeed += 1
  return {
    id: `item-${draftItemSeed}`,
    commodityMode: "existing",
    commodityId: "",
    newCommodityName: "",
    suppliedAmmount: "",
    unit: "kg",
    rate: "",
  }
}

function asNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: number): string {
  return `₹${Math.max(value, 0).toLocaleString("en-IN")}`
}

export function AddBillDialog({
  open,
  onOpenChange,
  onBillCreated,
}: AddBillDialogProps) {
  const userId = getCurrentUserId()
  const [selectedVendorId, setSelectedVendorId] = useState("")
  const [paidAmount, setPaidAmount] = useState("0")
  const [billUrl, setBillUrl] = useState("")
  const [items, setItems] = useState<DraftBillItem[]>([createDraftItem()])
  const [formError, setFormError] = useState<string | null>(null)

  const vendorsQuery = useQuery({
    queryKey: ["vendors", userId],
    queryFn: () => getVendors(userId),
    enabled: open,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const vendorCommoditiesQuery = useQuery({
    queryKey: ["vendor-commodities", userId, selectedVendorId],
    queryFn: () => getVendorCommodities(userId, selectedVendorId),
    enabled: open && selectedVendorId.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const userCommoditiesQuery = useQuery({
    queryKey: ["commodities", userId],
    queryFn: () => getCommodities(userId),
    enabled: open,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const vendorCommodities = vendorCommoditiesQuery.data ?? []
  const allUserCommodities = userCommoditiesQuery.data ?? []

  useEffect(() => {
    if (!open) {
      setSelectedVendorId("")
      setPaidAmount("0")
      setBillUrl("")
      setItems([createDraftItem()])
      setFormError(null)
    }
  }, [open])

  useEffect(() => {
    if (!selectedVendorId) return
    setItems([createDraftItem()])
    setFormError(null)
  }, [selectedVendorId])

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const quantity = asNumber(item.suppliedAmmount)
      const rate = asNumber(item.rate)
      const lineCost = Math.round(quantity * rate)

      return {
        ...item,
        quantity,
        rate,
        lineCost,
      }
    })
  }, [items])

  const billTotalAmount = useMemo(() => {
    return normalizedItems.reduce((sum, item) => sum + (item.lineCost > 0 ? item.lineCost : 0), 0)
  }, [normalizedItems])

  const paidAmountNumber = asNumber(paidAmount)
  const pendingAmount = Math.max(billTotalAmount - paidAmountNumber, 0)

  const createBillMutation = useMutation({
    mutationFn: (payload: AddBillPayload) => addBill(userId, payload),
    onSuccess: async () => {
      if (onBillCreated) {
        await onBillCreated()
      }
      onOpenChange(false)
    },
  })

  const isAlreadyLinkedError = (error: unknown): boolean => {
    if (!(error instanceof ApiRequestError)) {
      return false
    }

    return error.status === 409 || /already linked/i.test(error.message)
  }

  const handleDraftCommodityModeChange = (draftId: string, mode: CommodityMode) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== draftId) return item
        return {
          ...item,
          commodityMode: mode,
          commodityId: mode === "existing" ? item.commodityId : "",
          newCommodityName: mode === "new" ? item.newCommodityName : "",
        }
      })
    )
  }

  const handleDraftCommodityChange = (draftId: string, commodityId: string) => {
    const selectedCommodity = vendorCommodities.find((commodity) => commodity.id === commodityId)

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== draftId) return item
        return {
          ...item,
          commodityMode: "existing",
          commodityId,
          newCommodityName: "",
          unit: selectedCommodity?.unit ?? item.unit,
        }
      })
    )
  }

  const handleDraftNewCommodityChange = (draftId: string, commodityName: string) => {
    const existingCommodity = allUserCommodities.find(
      (commodity) => commodity.name.trim().toLowerCase() === commodityName.trim().toLowerCase()
    )

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== draftId) return item
        return {
          ...item,
          commodityMode: "new",
          commodityId: "",
          newCommodityName: commodityName,
          unit: existingCommodity?.unit ?? item.unit,
        }
      })
    )
  }

  const updateDraftItem = (draftId: string, updater: (draft: DraftBillItem) => DraftBillItem) => {
    setItems((prev) => prev.map((draft) => (draft.id === draftId ? updater(draft) : draft)))
  }

  const addDraftItem = () => {
    setItems((prev) => [createDraftItem(), ...prev])
  }

  const removeDraftItem = (draftId: string) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return prev
      }
      return prev.filter((draft) => draft.id !== draftId)
    })
  }

  const buildCommodityPayload = async (): Promise<AddBillCommodityPayload[]> => {
    const billItems = normalizedItems.filter(
      (item) => item.commodityId || item.newCommodityName || item.suppliedAmmount || item.rate
    )

    const commodityByName = new Map<string, BackendCommodity>()
    allUserCommodities.forEach((commodity) => {
      commodityByName.set(commodity.name.trim().toLowerCase(), commodity)
    })

    const payload: AddBillCommodityPayload[] = []

    for (const item of billItems) {
      if (item.commodityMode === "existing") {
        const commodity = vendorCommodities.find((entry) => entry.id === item.commodityId)
        payload.push({
          commodity_id: item.commodityId,
          supplied_ammount: Math.round(item.quantity),
          unit: item.unit.trim() || commodity?.unit || "kg",
          cost: item.lineCost,
          name: commodity?.name ?? "",
        })
        continue
      }

      const desiredName = item.newCommodityName.trim()
      const normalizedName = desiredName.toLowerCase()

      let commodity = commodityByName.get(normalizedName)
      if (!commodity) {
        commodity = await addCommodity(userId, {
          name: desiredName,
          quantity: 0,
          unit: item.unit.trim() || "kg",
        })
        commodityByName.set(normalizedName, commodity)
      }

      try {
        await linkCommodityToVendor(userId, selectedVendorId, commodity.id)
      } catch (error) {
        if (!isAlreadyLinkedError(error)) {
          throw error
        }
      }

      payload.push({
        commodity_id: commodity.id,
        supplied_ammount: Math.round(item.quantity),
        unit: item.unit.trim() || commodity.unit || "kg",
        cost: item.lineCost,
        name: commodity.name,
      })
    }

    return payload
  }

  const validateDraftItems = (): string | null => {
    const billItems = normalizedItems.filter(
      (item) => item.commodityId || item.newCommodityName || item.suppliedAmmount || item.rate
    )

    if (billItems.length === 0) {
      return "Add at least one commodity item to this bill"
    }

    for (const item of billItems) {
      if (item.commodityMode === "existing" && !item.commodityId) {
        return "Select an existing commodity for each active row"
      }

      if (item.commodityMode === "new" && !item.newCommodityName.trim()) {
        return "Select a commodity name in Create New mode"
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return "Supplied amount must be greater than 0"
      }

      if (!Number.isFinite(item.lineCost) || item.lineCost <= 0) {
        return "Rate must be greater than 0 for all rows"
      }
    }

    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!selectedVendorId) {
      setFormError("Select a vendor first")
      return
    }

    const commodityValidationError = validateDraftItems()

    if (commodityValidationError) {
      setFormError(commodityValidationError)
      return
    }

    if (!Number.isFinite(paidAmountNumber) || paidAmountNumber < 0) {
      setFormError("Paid amount cannot be negative")
      return
    }

    if (paidAmountNumber > billTotalAmount) {
      setFormError("Paid amount cannot be greater than the bill total")
      return
    }

    try {
      const commodities = await buildCommodityPayload()
      const payload: AddBillPayload = {
        vendor_id: selectedVendorId,
        total_amount: billTotalAmount,
        paid_amount: paidAmountNumber,
        bill_url: billUrl.trim().length > 0 ? billUrl.trim() : null,
        commodities,
      }

      await createBillMutation.mutateAsync(payload)
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to create bill"
      setFormError(message)
    }
  }

  const renderCommodityOptionLabel = (commodity: BackendCommodity) => {
    return `${commodity.name} (${commodity.unit})`
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && createBillMutation.isPending) {
      return
    }
    onOpenChange(nextOpen)
  }

  const latestItemId = items[0]?.id ?? null

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/45 backdrop-blur-md"
        className="h-[90vh] w-[96vw] max-w-[96vw]! overflow-hidden border-border/50 bg-card p-0 sm:w-[94vw] sm:max-w-[94vw]! lg:w-[92vw] lg:max-w-[92vw]! xl:w-[88vw]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-border/50 px-6 py-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
                  <ReceiptText className="h-6 w-6 text-forest" />
                  Add New Bill
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a supply bill with item-wise quantities. Bill total updates automatically.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <CircleX className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="bill-modal-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 pr-4">
              <div className="grid gap-5 xl:grid-cols-[1.9fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-linear-to-br from-secondary/35 via-card/40 to-secondary/15 p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-card-foreground">Vendor</Label>
                        <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                          <SelectTrigger className="bg-secondary">
                            <SelectValue
                              placeholder={vendorsQuery.isLoading ? "Loading vendors..." : "Select vendor"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(vendorsQuery.data ?? []).map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bill-paid-amount" className="text-card-foreground">
                          Paid Amount (Optional)
                        </Label>
                        <Input
                          id="bill-paid-amount"
                          type="number"
                          min="0"
                          step="1"
                          value={paidAmount}
                          onChange={(event) => setPaidAmount(event.target.value)}
                          className="bg-secondary font-mono"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bill-url" className="text-card-foreground">
                          Bill URL (Optional)
                        </Label>
                        <Input
                          id="bill-url"
                          value={billUrl}
                          onChange={(event) => setBillUrl(event.target.value)}
                          placeholder="https://example.com/bill.pdf"
                          className="bg-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-linear-to-br from-secondary/35 via-card/40 to-secondary/15 p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">Bill Items</p>
                        <p className="text-xs text-muted-foreground">
                          Use one guided flow per item: pick existing commodity or create a new one.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addDraftItem}
                        disabled={!selectedVendorId || vendorCommoditiesQuery.isLoading}
                        className="border-border/50 bg-secondary"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>

                    {selectedVendorId && vendorCommoditiesQuery.isLoading && (
                      <div className="rounded-lg border border-border/50 bg-card/40 p-3 text-sm text-muted-foreground">
                        Loading vendor commodities...
                      </div>
                    )}

                    {selectedVendorId && !vendorCommoditiesQuery.isLoading && vendorCommodities.length === 0 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                        This vendor has no linked commodities yet. Link commodities in Vendor Management first.
                      </div>
                    )}

                    <div className="space-y-3">
                      {normalizedItems.map((item, index) => {
                        const itemCostPreview = item.lineCost
                        const isActiveItem = item.id === latestItemId
                        const existingCommodity = vendorCommodities.find((entry) => entry.id === item.commodityId)
                        const summaryCommodityName =
                          item.commodityMode === "existing"
                            ? existingCommodity?.name ?? "Not selected"
                            : item.newCommodityName || "Not selected"

                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/50 bg-card/35 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <Badge variant="outline" className="border-amber/30 bg-amber/12 text-amber-deep">
                                Item {index + 1}
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDraftItem(item.id)}
                                disabled={items.length === 1}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {isActiveItem ? (
                                <div className="rounded-lg border border-border/50 bg-card/45 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Assign Commodity
                                  </p>

                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => handleDraftCommodityModeChange(item.id, "existing")}
                                      className={cn(
                                        "border-border/60",
                                        item.commodityMode === "existing"
                                          ? "border-forest/50 bg-forest/12 text-forest"
                                          : "bg-secondary"
                                      )}
                                    >
                                      Use Existing
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => handleDraftCommodityModeChange(item.id, "new")}
                                      className={cn(
                                        "border-border/60",
                                        item.commodityMode === "new"
                                          ? "border-amber/50 bg-amber/20 text-amber-deep"
                                          : "bg-secondary"
                                      )}
                                    >
                                      Create New
                                    </Button>
                                  </div>

                                  {item.commodityMode === "existing" ? (
                                    <div className="mt-3 space-y-1">
                                      <Label className="text-xs text-muted-foreground">Existing Commodity</Label>
                                      <Select
                                        value={item.commodityId || "none"}
                                        onValueChange={(value) =>
                                          handleDraftCommodityChange(item.id, value === "none" ? "" : value)
                                        }
                                        disabled={!selectedVendorId || vendorCommodities.length === 0}
                                      >
                                        <SelectTrigger className="bg-secondary">
                                          <SelectValue
                                            placeholder={
                                              vendorCommodities.length === 0
                                                ? "No linked commodities"
                                                : "Select commodity"
                                            }
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Do not assign now</SelectItem>
                                          {vendorCommodities.map((commodity) => (
                                            <SelectItem key={commodity.id} value={commodity.id}>
                                              {renderCommodityOptionLabel(commodity)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ) : (
                                    <div className="mt-3 space-y-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">New Commodity</Label>
                                        <Input
                                          value={item.newCommodityName}
                                          onChange={(event) =>
                                            handleDraftNewCommodityChange(item.id, event.target.value)
                                          }
                                          placeholder="Type commodity name"
                                          className="bg-secondary"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Unit</Label>
                                        <Select
                                          value={item.unit}
                                          onValueChange={(value) =>
                                            updateDraftItem(item.id, (draft) => ({
                                              ...draft,
                                              unit: value,
                                            }))
                                          }
                                        >
                                          <SelectTrigger className="bg-secondary">
                                            <SelectValue placeholder="Select unit" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {UNIT_OPTIONS.map((unit) => (
                                              <SelectItem key={unit} value={unit}>
                                                {unit}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <p className="text-[11px] text-muted-foreground">
                                        If missing, commodity will be created with opening stock 0 and auto-linked to this vendor.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                                  <span className="font-medium text-card-foreground">Commodity:</span>{" "}
                                  {summaryCommodityName} ({item.unit})
                                </div>
                              )}

                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.suppliedAmmount}
                                    onChange={(event) =>
                                      updateDraftItem(item.id, (draft) => ({
                                        ...draft,
                                        suppliedAmmount: event.target.value,
                                      }))
                                    }
                                    className="bg-secondary font-mono"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.rate}
                                    onChange={(event) =>
                                      updateDraftItem(item.id, (draft) => ({
                                        ...draft,
                                        rate: event.target.value,
                                      }))
                                    }
                                    className="bg-secondary font-mono"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Line Total</Label>
                                  <div className="rounded-md border border-border/50 bg-secondary px-3 py-2 font-mono text-sm text-amber-300">
                                    {formatCurrency(itemCostPreview)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-linear-to-br from-card via-secondary/30 to-card p-4 shadow-sm">
                    <p className="text-sm font-semibold text-card-foreground">Bill Summary</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Items</span>
                        <span className="font-mono">{normalizedItems.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Total Amount</span>
                        <span className="font-mono font-semibold text-amber-300">
                          {formatCurrency(billTotalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Paid Amount</span>
                        <span className="font-mono text-forest">
                          {formatCurrency(paidAmountNumber)}
                        </span>
                      </div>
                      <div className="mt-2 border-t border-border/50 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-card-foreground">Pending Amount</span>
                          <span className="font-mono font-bold text-card-foreground">
                            {formatCurrency(pendingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                    <p className="text-xs text-muted-foreground">
                    </p>
                  </div>

                  {formError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {formError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 px-6 py-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-border/50 bg-secondary"
                  disabled={createBillMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-forest text-cream hover:bg-forest-deep"
                  disabled={createBillMutation.isPending || !selectedVendorId}
                >
                  {createBillMutation.isPending ? "Creating Bill..." : "Create Bill"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
