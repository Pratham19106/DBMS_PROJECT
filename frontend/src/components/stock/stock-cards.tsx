"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ApiRequestError,
  getCommodities,
  getCommodityVendors,
  getCurrentUserId,
  getSmartVendorRecommendation,
  type BackendSmartVendor,
} from "@/lib/api"

type UiCommodity = {
  id: string
  name: string
  icon: string
  currentStock: number
  maxStock: number
  unit: string
  reorderThreshold: number
  linkedVendorNames: string[]
}

type VendorPriorityState = {
  loading: boolean
  error: string | null
  vendors: BackendSmartVendor[]
  visible: boolean
}

function getCommodityIcon(name: string): string {
  const key = name.toLowerCase()

  if (key.includes("milk")) return "🥛"
  if (key.includes("rice")) return "🍚"
  if (key.includes("oil")) return "🫒"
  if (key.includes("spice")) return "🌶️"
  if (key.includes("vegetable") || key.includes("veg")) return "🥬"

  return "📦"
}

function getStockColor(percentage: number, threshold: number) {
  if (percentage <= threshold) return "bg-red-500"
  if (percentage <= threshold * 2) return "bg-amber-500"
  return "bg-emerald-500"
}

function getStockStatus(percentage: number, threshold: number) {
  if (percentage <= threshold) return { label: "CRITICAL", color: "text-red-400" }
  if (percentage <= threshold * 2) return { label: "LOW", color: "text-amber-400" }
  return { label: "OK", color: "text-emerald-400" }
}

export function StockCards() {
  const userId = getCurrentUserId()
  const [commodities, setCommodities] = useState<UiCommodity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendorPriorityByCommodity, setVendorPriorityByCommodity] = useState<
    Record<string, VendorPriorityState>
  >({})

  useEffect(() => {
    let ignore = false

    async function loadCommodities() {
      setLoading(true)
      setError(null)

      try {
        const items = await getCommodities(userId)
        const hydrated = await Promise.all(
          items.map(async (item) => {
            const linkedVendors = await getCommodityVendors(userId, item.id)
            return {
              id: item.id,
              name: item.name,
              icon: getCommodityIcon(item.name),
              currentStock: item.quantity,
              maxStock: Math.max(item.quantity * 2, 100),
              unit: item.unit,
              reorderThreshold: 20,
              linkedVendorNames: linkedVendors.map((vendor) => vendor.name),
            }
          })
        )

        if (!ignore) {
          setCommodities(hydrated)
        }
      } catch (loadError) {
        if (ignore) return

        const message =
          loadError instanceof ApiRequestError
            ? loadError.message
            : "Failed to load commodities"
        setError(message)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadCommodities()

    return () => {
      ignore = true
    }
  }, [userId])

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        Loading commodities...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (commodities.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        No commodities found.
      </div>
    )
  }

  const handleBuyNow = async (commodityId: string) => {
    setVendorPriorityByCommodity((prev) => ({
      ...prev,
      [commodityId]: {
        loading: true,
        error: null,
        vendors: prev[commodityId]?.vendors ?? [],
        visible: true,
      },
    }))

    try {
      const data = await getSmartVendorRecommendation(userId, commodityId)
      setVendorPriorityByCommodity((prev) => ({
        ...prev,
        [commodityId]: {
          loading: false,
          error: null,
          vendors: data.all_vendors ?? [],
          visible: true,
        },
      }))
    } catch (requestError) {
      const message =
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Failed to fetch vendor priority"
      setVendorPriorityByCommodity((prev) => ({
        ...prev,
        [commodityId]: {
          loading: false,
          error: message,
          vendors: [],
          visible: true,
        },
      }))
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {commodities.map((commodity) => {
        const percentage = (commodity.currentStock / commodity.maxStock) * 100
        const status = getStockStatus(percentage, commodity.reorderThreshold)
        const priorityState = vendorPriorityByCommodity[commodity.id]
        const shouldShowPriority = priorityState?.visible === true

        return (
          <Card
            key={commodity.id}
            className={cn(
              "border-border/50 bg-card transition-all hover:border-white/20",
              percentage <= commodity.reorderThreshold && "border-amber-500/30"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{commodity.icon}</span>
                  <div>
                    <CardTitle className="text-lg font-semibold text-card-foreground">
                      {commodity.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {commodity.unit}
                    </p>
                  </div>
                </div>
                <span className={cn("text-sm font-semibold", status.color)}>
                  {status.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock</span>
                  <span className="font-mono font-medium text-card-foreground">
                    {commodity.currentStock} / {commodity.maxStock} {commodity.unit}
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className="h-2 bg-secondary"
                  indicatorClassName={getStockColor(
                    percentage,
                    commodity.reorderThreshold
                  )}
                />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Reorder At</p>
                  <p className="font-mono text-sm font-medium text-card-foreground">
                    {commodity.reorderThreshold}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Vendors</p>
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm font-medium text-card-foreground">
                      {commodity.linkedVendorNames.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Vendors */}
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Suppliers:</span>{" "}
                {commodity.linkedVendorNames.join(", ") || "-"}
              </div>

              {/* Buy Button */}
              <Button
                type="button"
                onClick={() => void handleBuyNow(commodity.id)}
                className={cn(
                  "w-full",
                  percentage <= commodity.reorderThreshold
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {percentage <= commodity.reorderThreshold ? "Buy Now" : "Order"}
              </Button>

              {shouldShowPriority && (
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Vendor Priority
                    </p>
                    {priorityState.loading && (
                      <Badge variant="outline" className="text-xs">
                        Loading...
                      </Badge>
                    )}
                  </div>

                  {priorityState.error && (
                    <p className="text-xs text-red-300">{priorityState.error}</p>
                  )}

                  {!priorityState.loading && !priorityState.error && priorityState.vendors.length === 0 && (
                    <p className="text-xs text-muted-foreground">No vendors found for this commodity.</p>
                  )}

                  {!priorityState.loading && !priorityState.error && priorityState.vendors.length > 0 && (
                    <div className="space-y-2">
                      {priorityState.vendors.slice(0, 5).map((vendor, index) => (
                        <div
                          key={`${commodity.id}-${vendor.vendor_id}`}
                          className="flex items-center justify-between rounded-md border border-border/40 bg-card/60 px-2 py-1.5"
                        >
                          <div>
                            <p className="text-xs font-medium text-card-foreground">
                              #{index + 1} {vendor.vendor_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Pending: ₹{Number(vendor.pending_debt || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <Badge className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/20">
                            Score {Number(vendor.overall_score || 0).toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
