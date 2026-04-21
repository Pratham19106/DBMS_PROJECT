"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Sparkles, Check, AlertCircle, Clock, IndianRupee, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  addPayment,
  ApiRequestError,
  type BackendBill,
  getCurrentUserId,
  getPaymentPriorityList,
  getVendorBills,
} from "@/lib/api"

type PaymentPlanItem = {
  vendorId: string
  vendorName: string
  priority: "urgent" | "high" | "medium" | "low"
  pendingAmount: number
  suggestedAmount: number
  billId: string | null
  daysSinceOldestBill: number
}

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function pendingForBill(bill: BackendBill): number {
  return Math.max(asNumber(bill.total_amount) - asNumber(bill.paid_amount), 0)
}

function selectOldestUnpaidBillId(bills: BackendBill[]): string | null {
  const unpaid = bills.filter((bill) => pendingForBill(bill) > 0)
  if (unpaid.length === 0) return null

  const sorted = [...unpaid].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER
    const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER
    if (aDate !== bDate) return aDate - bDate
    return String(a.id).localeCompare(String(b.id))
  })

  return sorted[0]?.id ?? null
}

function toDaysSince(dateInput: string | null): number {
  if (!dateInput) return 0
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 0
  const diffMs = Date.now() - date.getTime()
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0)
}

function shortBillId(id: string): string {
  return String(id).slice(-6).toUpperCase()
}

export function SmartPayPanel() {
  const queryClient = useQueryClient()
  const userId = getCurrentUserId()
  const [cashAvailable, setCashAvailable] = useState<string>("")
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("upi")
  const [showPlan, setShowPlan] = useState(false)
  const [paidItems, setPaidItems] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState<string | null>(null)

  const suggestionQuery = useQuery({
    queryKey: ["payment-priority", userId],
    queryFn: () => getPaymentPriorityList(userId),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const suggestedVendors = suggestionQuery.data ?? []
  const vendorSignature = suggestedVendors.map((vendor) => vendor.vendor_id).join(",")

  const vendorBillsQuery = useQuery({
    queryKey: ["payment-suggestion-bills", userId, vendorSignature],
    enabled: suggestedVendors.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        suggestedVendors.map(async (vendor) => {
          const bills = await getVendorBills(userId, vendor.vendor_id)
          return [vendor.vendor_id, bills] as const
        })
      )

      return Object.fromEntries(entries) as Record<string, BackendBill[]>
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const addPaymentMutation = useMutation({
    mutationFn: (payload: { vendorId: string; billId: string; amount: number; paymentMode: "cash" | "upi" }) =>
      addPayment(userId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payment-priority", userId] }),
        queryClient.invalidateQueries({ queryKey: ["payment-suggestion-bills", userId] }),
        queryClient.invalidateQueries({ queryKey: ["payments", userId] }),
        queryClient.invalidateQueries({ queryKey: ["daily-paid-entries", userId] }),
        queryClient.invalidateQueries({ queryKey: ["vendor-bills", userId] }),
        queryClient.invalidateQueries({ queryKey: ["vendors-hydrated", userId] }),
      ])
    },
  })

  const handleGeneratePlan = () => {
    setActionError(null)
    if (cashAvailable && Number(cashAvailable) > 0) {
      setShowPlan(true)
      setPaidItems(new Set())
    }
  }

  const handleMarkPaid = async (item: PaymentPlanItem) => {
    setActionError(null)

    if (!item.billId) {
      setActionError(`No unpaid bill found for ${item.vendorName}`)
      return
    }

    try {
      await addPaymentMutation.mutateAsync({
        vendorId: item.vendorId,
        billId: item.billId,
        amount: item.suggestedAmount,
        paymentMode,
      })
      setPaidItems((prev) => new Set([...prev, `${item.vendorId}-${item.billId}`]))
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to record payment"
      setActionError(message)
    }
  }

  const getPaymentPlan = (): PaymentPlanItem[] => {
    const cash = Number(cashAvailable) || 0
    let remaining = cash
    const billsByVendor = vendorBillsQuery.data ?? {}
    const plan: PaymentPlanItem[] = []

    for (const vendor of suggestedVendors) {
      if (remaining <= 0) break

      const pendingAmount = Math.max(asNumber(vendor.pending_amount), 0)
      const suggestedAmount = Math.min(pendingAmount, remaining)
      if (suggestedAmount > 0) {
        const vendorBills = billsByVendor[vendor.vendor_id] ?? []
        plan.push({
          vendorId: vendor.vendor_id,
          vendorName: vendor.vendor_name,
          priority: vendor.priority,
          pendingAmount,
          suggestedAmount,
          billId: selectOldestUnpaidBillId(vendorBills),
          daysSinceOldestBill: toDaysSince(vendor.oldest_bill_date),
        })
        remaining -= suggestedAmount
      }
    }

    return plan
  }

  const paymentPlan = getPaymentPlan()

  if (suggestionQuery.isLoading) {
    return (
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-card-foreground">Pay Smart</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading payment suggestions...</CardContent>
      </Card>
    )
  }

  if (suggestionQuery.isError) {
    const message =
      suggestionQuery.error instanceof ApiRequestError
        ? suggestionQuery.error.message
        : "Failed to load payment suggestions"

    return (
      <Card className="border-red-500/30 bg-red-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-red-300">Pay Smart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-red-300">
          <p>{message}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void suggestionQuery.refetch()}
            className="border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Pay Smart
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">
            Cash available today
          </label>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter amount..."
                value={cashAvailable}
                onChange={(e) => setCashAvailable(e.target.value)}
                className="bg-secondary pl-9 font-mono"
              />
            </div>
            <Select value={paymentMode} onValueChange={(value: "cash" | "upi") => setPaymentMode(value)}>
              <SelectTrigger className="w-35 bg-secondary">
                <SelectValue placeholder="Payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleGeneratePlan}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={suggestedVendors.length === 0 || vendorBillsQuery.isLoading}
            >
              Generate Plan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void suggestionQuery.refetch()
                void vendorBillsQuery.refetch()
              }}
              className="border-border/50 bg-secondary"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", (suggestionQuery.isFetching || vendorBillsQuery.isFetching) && "animate-spin")} />
              Refresh
            </Button>
          </div>
          {actionError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {actionError}
            </div>
          )}
        </div>

        {/* Payment Plan Output */}
        {showPlan && paymentPlan.length > 0 && (
          <ScrollArea className="h-87.5">
            <div className="space-y-3 pr-4 pb-1">
              {paymentPlan.map((item, index) => {
                const paidKey = item.billId ? `${item.vendorId}-${item.billId}` : `${item.vendorId}-none`
                const isPaid = paidItems.has(paidKey)

                return (
                  <div
                    key={`${item.vendorId}-${item.billId ?? "none"}`}
                    className={cn(
                      "rounded-lg border border-border/50 bg-secondary/30 p-4 transition-all",
                      isPaid && "border-emerald-500/30 bg-emerald-500/5 opacity-60"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="font-medium text-card-foreground">
                          {item.vendorName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          item.priority === "urgent" && "border-red-500/30 bg-red-500/10 text-red-400",
                          item.priority === "high" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                          item.priority === "medium" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                          item.priority === "low" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        )}
                      >
                        {item.priority.toUpperCase()} priority
                      </Badge>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Suggested</p>
                        <p className="font-mono font-semibold text-emerald-400">
                          ₹{item.suggestedAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="font-mono text-card-foreground">
                          ₹{item.pendingAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Oldest Due</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-card-foreground">
                            {item.daysSinceOldestBill} days
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mb-3 text-xs text-muted-foreground">
                      {item.billId
                        ? `Will log payment against bill #${shortBillId(item.billId)}`
                        : "No unpaid bill available"}
                    </p>

                    <Button
                      size="sm"
                      variant={isPaid ? "outline" : "default"}
                      className={cn(
                        "w-full",
                        isPaid
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                      onClick={() => void handleMarkPaid(item)}
                      disabled={isPaid || !item.billId || addPaymentMutation.isPending}
                    >
                      {isPaid ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Paid
                        </>
                      ) : (
                        "Record Payment"
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {showPlan && paymentPlan.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 bg-secondary/30 py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {suggestedVendors.length === 0
                ? "No pending payments right now"
                : "Enter an amount to generate a payment plan"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
