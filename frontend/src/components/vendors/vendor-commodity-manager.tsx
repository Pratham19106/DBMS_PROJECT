"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link2, PackagePlus, Unlink2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  addCommodity,
  ApiRequestError,
  getCommodities,
  linkCommodityToVendor,
  type BackendCommodity,
  unlinkCommodityFromVendor,
} from "@/lib/api"

type VendorCommodityManagerProps = {
  userId: string
  vendorId: string
  linkedCommodities: BackendCommodity[]
  onChanged: () => Promise<void>
  showLinkedActions?: boolean
  compact?: boolean
}

export function VendorCommodityManager({
  userId,
  vendorId,
  linkedCommodities,
  onChanged,
  showLinkedActions = true,
  compact = false,
}: VendorCommodityManagerProps) {
  const queryClient = useQueryClient()
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>("")
  const [newCommodityName, setNewCommodityName] = useState("")
  const [newCommodityQuantity, setNewCommodityQuantity] = useState("0")
  const [newCommodityUnit, setNewCommodityUnit] = useState("kg")
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [removingCommodityId, setRemovingCommodityId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const commoditiesQuery = useQuery({
    queryKey: ["commodities", userId],
    queryFn: () => getCommodities(userId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const allCommodities = commoditiesQuery.data ?? []
  const loading = commoditiesQuery.isLoading
  const commoditiesLoadError =
    commoditiesQuery.error instanceof ApiRequestError
      ? commoditiesQuery.error.message
      : commoditiesQuery.error
        ? "Failed to load commodities"
        : null
  const combinedError = error ?? commoditiesLoadError

  const availableCommodities = useMemo(() => {
    const linkedSet = new Set(linkedCommodities.map((commodity) => commodity.id))
    return allCommodities.filter((commodity) => !linkedSet.has(commodity.id))
  }, [allCommodities, linkedCommodities])

  const commodityAlreadyLinked = (commodityId: string) => {
    return linkedCommodities.some((commodity) => commodity.id === commodityId)
  }

  const handleAddCommodity = async () => {
    if (!selectedCommodityId) {
      setError("Select a commodity first")
      return
    }

    try {
      setAdding(true)
      setError(null)
      await linkCommodityToVendor(userId, vendorId, selectedCommodityId)
      setSelectedCommodityId("")
      await Promise.all([
        onChanged(),
        queryClient.invalidateQueries({ queryKey: ["commodities", userId] }),
      ])
    } catch (saveError) {
      console.error("[VendorCommodityManager] Quick Assign failed", {
        userId,
        vendorId,
        selectedCommodityId,
        error: saveError,
      })

      const message =
        saveError instanceof ApiRequestError
          ? saveError.message
          : saveError instanceof Error
            ? saveError.message
            : "Failed to link commodity"
      setError(message)
    } finally {
      setAdding(false)
    }
  }

  const handleCreateAndAssignCommodity = async () => {
    const trimmedName = newCommodityName.trim()
    if (!trimmedName) {
      setError("Commodity name is required")
      return
    }

    const quantity = Number(newCommodityQuantity)
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError("Quantity must be 0 or greater")
      return
    }

    try {
      setCreating(true)
      setError(null)

      let commodity = allCommodities.find(
        (item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )

      if (!commodity) {
        commodity = await addCommodity(userId, {
          name: trimmedName,
          quantity,
          unit: newCommodityUnit,
        })
      }

      if (!commodity) {
        throw new Error("Commodity creation failed")
      }

      const commodityToAssign = commodity

      if (commodityAlreadyLinked(commodityToAssign.id)) {
        setError("Commodity is already linked to this vendor")
        return
      }

      await linkCommodityToVendor(userId, vendorId, commodityToAssign.id)
      setNewCommodityName("")
      setNewCommodityQuantity("0")
      setNewCommodityUnit("kg")
      await Promise.all([
        onChanged(),
        queryClient.invalidateQueries({ queryKey: ["commodities", userId] }),
      ])
    } catch (createError) {
      console.error("[VendorCommodityManager] Create & Assign failed", {
        userId,
        vendorId,
        newCommodityName,
        error: createError,
      })

      const message =
        createError instanceof ApiRequestError
          ? createError.message
          : createError instanceof Error
            ? createError.message
            : "Failed to create and assign commodity"
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  const handleUnlinkCommodity = async (commodityId: string) => {
    try {
      setRemovingCommodityId(commodityId)
      setError(null)
      await unlinkCommodityFromVendor(userId, vendorId, commodityId)
      await Promise.all([
        onChanged(),
        queryClient.invalidateQueries({ queryKey: ["commodities", userId] }),
      ])
    } catch (removeError) {
      const message =
        removeError instanceof ApiRequestError
          ? removeError.message
          : "Failed to unlink commodity"
      setError(message)
    } finally {
      setRemovingCommodityId(null)
    }
  }

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-border/60 bg-linear-to-br from-secondary/35 via-card/40 to-secondary/15 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-card-foreground">Commodity Assignment</p>
          {!compact && (
            <p className="text-xs text-muted-foreground">
              Link existing commodities or create and assign a new one.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-forest/30 bg-forest/10 px-2 py-0.5 text-forest">
            Linked: {linkedCommodities.length}
          </span>
          <span className="rounded-full border border-amber/30 bg-amber/12 px-2 py-0.5 text-amber-deep">
            Available: {availableCommodities.length}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/35 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-forest" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Assign Existing Commodity
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {loading && (
              <p className="rounded-md border border-border/50 bg-secondary/60 px-2 py-1 text-xs text-muted-foreground">
                Loading commodities...
              </p>
            )}
            {!loading &&
              availableCommodities.map((commodity) => (
                <Button
                  key={commodity.id}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedCommodityId(String(commodity.id))
                    if (combinedError) setError(null)
                  }}
                  className={
                    selectedCommodityId === String(commodity.id)
                      ? "border-forest/50 bg-forest/12 text-forest hover:bg-forest/18"
                      : "border-border/60 bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }
                >
                  {commodity.name}
                </Button>
              ))}
            {!loading && availableCommodities.length === 0 && (
              <p className="rounded-md border border-forest/20 bg-forest/5 px-2 py-1 text-xs text-forest">
                All commodities are already linked.
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAddCommodity}
            disabled={loading || adding || availableCommodities.length === 0}
            className="bg-forest text-cream hover:bg-forest-deep"
          >
            {adding ? "Adding..." : "Assign Selected Commodity"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/35 p-3">
        <div className="mb-2 flex items-center gap-2">
          <PackagePlus className="h-4 w-4 text-amber-deep" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Create and Assign Commodity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-end">
          <div className="min-w-0 space-y-1 md:col-span-1">
            <Label htmlFor="new-commodity-name" className="text-xs text-muted-foreground">
              Name
            </Label>
            <Input
              id="new-commodity-name"
              value={newCommodityName}
              onChange={(event) => {
                setNewCommodityName(event.target.value)
                if (combinedError) setError(null)
              }}
              placeholder="e.g. Turmeric"
              className="w-full bg-secondary"
            />
          </div>
          <div className="min-w-0 space-y-1 md:col-span-1">
            <Label htmlFor="new-commodity-quantity" className="text-xs text-muted-foreground">
              Opening Quantity
            </Label>
            <Input
              id="new-commodity-quantity"
              type="number"
              min="0"
              value={newCommodityQuantity}
              onChange={(event) => {
                setNewCommodityQuantity(event.target.value)
                if (combinedError) setError(null)
              }}
              className="w-full bg-secondary"
            />
          </div>
          <div className="min-w-0 space-y-1 md:col-span-1">
            <Label className="text-xs text-muted-foreground">Unit</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "kg", value: "kg" },
                { label: "liters", value: "liter" },
                { label: "pcs", value: "pcs" },
              ].map((unit) => (
                <Button
                  key={unit.value}
                  type="button"
                  variant="outline"
                  onClick={() => setNewCommodityUnit(unit.value)}
                  className={
                    newCommodityUnit === unit.value
                      ? "border-amber/50 bg-amber/20 text-amber-deep hover:bg-amber/25"
                      : "border-border/60 bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }
                >
                  {unit.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-end md:col-span-1">
            <Button
              type="button"
              onClick={handleCreateAndAssignCommodity}
              disabled={creating}
              className="w-full bg-amber text-forest hover:bg-amber-deep"
            >
              {creating ? "Creating..." : "Create & Assign"}
            </Button>
          </div>
        </div>
      </div>

      {showLinkedActions && (
        <div className="max-h-28 min-w-0 overflow-y-auto rounded-lg border border-border/50 bg-card/30 p-2">
          <div className="mb-2 flex items-center gap-2">
            <Unlink2 className="h-3.5 w-3.5 text-amber-300" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Linked Commodity Actions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {linkedCommodities.map((commodity) => (
              <Button
                key={commodity.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleUnlinkCommodity(commodity.id)}
                disabled={removingCommodityId === commodity.id}
                className="border-border/60 bg-secondary/60 text-xs"
              >
                {removingCommodityId === commodity.id ? "Removing..." : `Remove ${commodity.name}`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {combinedError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {combinedError}
        </p>
      )}
    </div>
  )
}
