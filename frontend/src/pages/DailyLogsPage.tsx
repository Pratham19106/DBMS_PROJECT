import { type FormEvent, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownCircle, ArrowUpCircle, ClipboardList, Plus, RefreshCw, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  addPayment,
  ApiRequestError,
  getCommodities,
  getCurrentUserId,
  getPayments,
  getVendorBills,
  getVendors,
  type BackendBill,
  type BackendCommodity,
  updateCommodityQuantity,
} from "@/lib/api"
import {
  getCommodityTotalsByUser,
  updateTotalsFromCommodities,
  upsertCommodityTotalQuantity,
} from "@/lib/commodity-capacity"
import { addReceivedLog, getReceivedLogs, type ReceivedDailyLog } from "@/lib/daily-logs"
import { cn } from "@/lib/utils"

type LogType = "paid" | "received"

type CommodityUpdateDraft = {
  id: string
  commodityId: string
  quantityChange: string
}

type DailyPreviewLog = {
  id: string
  date: string
  amount: number
  type: LogType
  vendorName: string
  billId: string | null
  note?: string
}

let commodityDraftSeed = 0

function createCommodityDraft(): CommodityUpdateDraft {
  commodityDraftSeed += 1
  return {
    id: `commodity-draft-${commodityDraftSeed}`,
    commodityId: "none",
    quantityChange: "",
  }
}

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function pendingAmount(bill: BackendBill): number {
  return Math.max(asNumber(bill.total_amount) - asNumber(bill.paid_amount), 0)
}

function formatDate(input?: string): string {
  if (!input) return "-"
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function isSameLocalDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function formatDateTime(input?: string): string {
  if (!input) return "-"
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function DailyLogsPage() {
  const queryClient = useQueryClient()
  const userId = getCurrentUserId()

  const [logType, setLogType] = useState<LogType>("received")
  const [amount, setAmount] = useState("")
  const [vendorId, setVendorId] = useState<string>("none")
  const [billId, setBillId] = useState<string>("none")
  const [commodityRows, setCommodityRows] = useState<CommodityUpdateDraft[]>([createCommodityDraft()])
  const [commodityTotals, setCommodityTotals] = useState<Record<string, number>>({})
  const [financeErrorText, setFinanceErrorText] = useState<string | null>(null)
  const [financeSuccessText, setFinanceSuccessText] = useState<string | null>(null)
  const [commodityErrorText, setCommodityErrorText] = useState<string | null>(null)
  const [commoditySuccessText, setCommoditySuccessText] = useState<string | null>(null)

  const vendorsQuery = useQuery({
    queryKey: ["vendors", userId],
    queryFn: () => getVendors(userId),
  })

  const vendorBillsQuery = useQuery({
    queryKey: ["vendor-bills", userId, vendorId],
    enabled: vendorId !== "none",
    queryFn: () => getVendorBills(userId, vendorId),
  })

  const commoditiesQuery = useQuery({
    queryKey: ["commodities", userId],
    queryFn: () => getCommodities(userId),
  })

  const receivedLogsQuery = useQuery({
    queryKey: ["daily-received-logs", userId],
    queryFn: async () => getReceivedLogs(userId),
  })

  const paidLogsQuery = useQuery({
    queryKey: ["payments", userId],
    queryFn: () => getPayments(userId),
  })

  useEffect(() => {
    if (!commoditiesQuery.data) {
      return
    }

    setCommodityTotals(updateTotalsFromCommodities(userId, commoditiesQuery.data))
  }, [userId, commoditiesQuery.data])

  const unpaidBills = useMemo(() => {
    return (vendorBillsQuery.data ?? []).filter((bill) => pendingAmount(bill) > 0)
  }, [vendorBillsQuery.data])

  const logsPreview = useMemo<DailyPreviewLog[]>(() => {
    const vendorNameById = new Map((vendorsQuery.data ?? []).map((vendor) => [vendor.id, vendor.name]))

    const paidLogs: DailyPreviewLog[] = (paidLogsQuery.data ?? []).slice(0, 5).map((log) => ({
      id: `paid-${log.id}`,
      date: log.payment_date ?? "",
      amount: asNumber(log.amount),
      type: "paid",
      vendorName: vendorNameById.get(log.vendor_id) ?? `Vendor #${log.vendor_id}`,
      billId: log.bill_id,
    }))

    const receivedLogs: DailyPreviewLog[] = (receivedLogsQuery.data ?? []).slice(0, 5).map((log: ReceivedDailyLog) => ({
      id: `received-${log.id}`,
      date: log.date,
      amount: log.amount,
      type: "received",
      vendorName: "Cash/Customer",
      billId: null,
      note: log.note,
    }))

    return [...paidLogs, ...receivedLogs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [paidLogsQuery.data, receivedLogsQuery.data, vendorsQuery.data])

  const financialMutation = useMutation({
    mutationFn: async (payload: {
      logType: LogType
      amount: number
      vendorId?: string
      billId?: string
    }) => {
      if (payload.logType === "paid") {
        if (!payload.vendorId || !payload.billId) {
          throw new Error("Vendor and bill are required for paid entries")
        }

        await addPayment(userId, {
          vendorId: payload.vendorId,
          billId: payload.billId,
          amount: payload.amount,
        })
      } else {
        addReceivedLog({
          userId,
          amount: payload.amount,
          date: new Date().toISOString(),
        })
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments", userId] }),
        queryClient.invalidateQueries({ queryKey: ["payment-logs", userId] }),
        queryClient.invalidateQueries({ queryKey: ["vendor-bills", userId] }),
        queryClient.invalidateQueries({ queryKey: ["daily-received-logs", userId] }),
      ])
    },
  })

  const commodityMutation = useMutation({
    mutationFn: async (rows: CommodityUpdateDraft[]) => {
      const commodities = commoditiesQuery.data ?? []
      const commodityById = new Map(commodities.map((commodity) => [commodity.id, commodity]))
      const totalsByCommodity = { ...getCommodityTotalsByUser(userId), ...commodityTotals }

      const deltasByCommodity = new Map<string, number>()
      for (const row of rows) {
        if (row.commodityId === "none") {
          continue
        }

        const delta = Number(row.quantityChange)
        if (!Number.isFinite(delta) || delta === 0) {
          continue
        }

        deltasByCommodity.set(row.commodityId, (deltasByCommodity.get(row.commodityId) ?? 0) + delta)
      }

      for (const [commodityId, delta] of deltasByCommodity.entries()) {
        const commodity = commodityById.get(commodityId)
        if (!commodity) {
          throw new Error("One selected commodity was not found")
        }

        const nextQuantity = commodity.quantity + delta
        if (nextQuantity < 0) {
          throw new Error(`Quantity for ${commodity.name} cannot go below 0`)
        }

        await updateCommodityQuantity(userId, commodityId, nextQuantity)

        const existingTotal = Math.max(Number(totalsByCommodity[commodityId] ?? commodity.quantity), 0)
        const nextTotal = Math.max(existingTotal, nextQuantity)
        upsertCommodityTotalQuantity(userId, commodityId, nextTotal)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["commodities", userId] }),
      ])
    },
  })

  const handleFinancialSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFinanceErrorText(null)
    setFinanceSuccessText(null)

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFinanceErrorText("Amount must be greater than 0")
      return
    }

    if (logType === "paid" && (vendorId === "none" || billId === "none")) {
      setFinanceErrorText("Select vendor and bill for paid entry")
      return
    }

    try {
      await financialMutation.mutateAsync({
        logType,
        amount: numericAmount,
        vendorId: vendorId !== "none" ? vendorId : undefined,
        billId: billId !== "none" ? billId : undefined,
      })

      setAmount("")
      if (logType === "paid") {
        setBillId("none")
      }
      setFinanceSuccessText("Financial log saved successfully")
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to save financial log"
      setFinanceErrorText(message)
    }
  }

  const handleCommoditySubmit = async (event: FormEvent) => {
    event.preventDefault()
    setCommodityErrorText(null)
    setCommoditySuccessText(null)

    const activeRows = commodityRows.filter((row) => row.commodityId !== "none" && row.quantityChange.trim() !== "")
    if (activeRows.length === 0) {
      setCommodityErrorText("Add at least one commodity row with quantity change")
      return
    }

    for (const row of activeRows) {
      const quantityDelta = Number(row.quantityChange)
      if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
        setCommodityErrorText("Each commodity change must be a valid number and not 0")
        return
      }
    }

    try {
      await commodityMutation.mutateAsync(activeRows)
      setCommodityRows([createCommodityDraft()])
      setCommoditySuccessText("Commodity quantities updated successfully")
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to update commodity quantities"
      setCommodityErrorText(message)
    }
  }

  const todayPaidSummary = useMemo(() => {
    const today = new Date()
    const vendorNameById = new Map((vendorsQuery.data ?? []).map((vendor) => [vendor.id, vendor.name]))

    const todayPayments = (paidLogsQuery.data ?? []).filter((payment) => {
      if (!payment.payment_date) {
        return false
      }
      return isSameLocalDate(new Date(payment.payment_date), today)
    })

    const totalAmount = todayPayments.reduce((sum, payment) => sum + asNumber(payment.amount), 0)
    const byVendor = new Map<string, { vendorName: string; amount: number; count: number }>()

    for (const payment of todayPayments) {
      const vendorName = vendorNameById.get(payment.vendor_id) ?? `Vendor #${payment.vendor_id}`
      const current = byVendor.get(payment.vendor_id)

      if (!current) {
        byVendor.set(payment.vendor_id, {
          vendorName,
          amount: asNumber(payment.amount),
          count: 1,
        })
        continue
      }

      current.amount += asNumber(payment.amount)
      current.count += 1
      byVendor.set(payment.vendor_id, current)
    }

    return {
      count: todayPayments.length,
      totalAmount,
      payments: todayPayments,
      vendorBreakdown: Array.from(byVendor.values()).sort((a, b) => b.amount - a.amount),
    }
  }, [paidLogsQuery.data, vendorsQuery.data])

  const upsertCommodityRow = (draftId: string, updater: (draft: CommodityUpdateDraft) => CommodityUpdateDraft) => {
    setCommodityRows((prev) => prev.map((draft) => (draft.id === draftId ? updater(draft) : draft)))
  }

  const addCommodityRow = () => {
    setCommodityRows((prev) => [...prev, createCommodityDraft()])
  }

  const removeCommodityRow = (draftId: string) => {
    setCommodityRows((prev) => {
      if (prev.length === 1) {
        return prev
      }
      return prev.filter((draft) => draft.id !== draftId)
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Logs</h1>
          <p className="text-muted-foreground">
            Track financial entries and manage commodity quantities in separate workflows.
          </p>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
              <ClipboardList className="h-5 w-5 text-cyan-400" />
              Financial Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinancialSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-1">
                  <Label>Entry Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLogType("received")}
                      className={cn(
                        "border-border/60",
                        logType === "received"
                          ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/20"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      Received
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLogType("paid")}
                      className={cn(
                        "border-border/60",
                        logType === "paid"
                          ? "border-rose-500/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/20"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      Paid
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="daily-log-amount">Amount</Label>
                  <Input
                    id="daily-log-amount"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="bg-secondary"
                  />
                </div>
              </div>

              {logType === "paid" && (
                <div className="rounded-lg border border-rose-500/25 bg-rose-500/8 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-rose-200">Today Payment Summary</p>
                    <Badge className="border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/10">
                      {todayPaidSummary.count} payments today
                    </Badge>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-3 text-sm text-rose-100">
                    <span>Total Paid Today: ₹{todayPaidSummary.totalAmount.toLocaleString("en-IN")}</span>
                    <span>Vendors Covered: {todayPaidSummary.vendorBreakdown.length}</span>
                  </div>

                  <div className="space-y-1">
                    {todayPaidSummary.vendorBreakdown.map((vendor) => (
                      <div
                        key={vendor.vendorName}
                        className="flex items-center justify-between rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-1.5 text-xs"
                      >
                        <span className="text-rose-100">{vendor.vendorName}</span>
                        <span className="font-mono text-rose-200">
                          ₹{vendor.amount.toLocaleString("en-IN")} ({vendor.count})
                        </span>
                      </div>
                    ))}
                    {todayPaidSummary.vendorBreakdown.length === 0 && (
                      <p className="text-xs text-rose-200/80">No payments recorded for today yet.</p>
                    )}
                  </div>
                </div>
              )}

              {logType === "paid" && (
                <div className="grid gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select
                      value={vendorId}
                      onValueChange={(value) => {
                        setVendorId(value)
                        setBillId("none")
                      }}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select Vendor</SelectItem>
                        {(vendorsQuery.data ?? []).map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bill</Label>
                    <Select
                      value={billId}
                      onValueChange={setBillId}
                      disabled={vendorId === "none" || vendorBillsQuery.isLoading}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select bill" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select Bill</SelectItem>
                        {unpaidBills.map((bill) => (
                          <SelectItem key={bill.id} value={bill.id}>
                            #{bill.id} • Pending ₹{pendingAmount(bill).toLocaleString("en-IN")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={financialMutation.isPending}
                  className="bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  {financialMutation.isPending ? "Saving..." : "Save Financial Log"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void Promise.all([
                      vendorsQuery.refetch(),
                      vendorBillsQuery.refetch(),
                      paidLogsQuery.refetch(),
                      receivedLogsQuery.refetch(),
                    ])
                  }}
                  className="border-border/60 bg-secondary"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </form>

            {financeErrorText && (
              <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {financeErrorText}
              </div>
            )}

            {financeSuccessText && (
              <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {financeSuccessText}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Commodity Updates</CardTitle>
            <p className="text-sm text-muted-foreground">
              This section is separate from amount received. Add multiple commodity changes in one action.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCommoditySubmit} className="space-y-3">
              {commodityRows.map((row, index) => {
                const selectedCommodity = (commoditiesQuery.data ?? []).find(
                  (commodity) => commodity.id === row.commodityId
                )
                const totalQuantity = selectedCommodity
                  ? Math.max(Number(commodityTotals[selectedCommodity.id] ?? selectedCommodity.quantity), 0)
                  : null

                return (
                  <div
                    key={row.id}
                    className="grid gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 md:grid-cols-[1.6fr_1fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label>Commodity #{index + 1}</Label>
                      <Select
                        value={row.commodityId}
                        onValueChange={(value) =>
                          upsertCommodityRow(row.id, (draft) => ({
                            ...draft,
                            commodityId: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-secondary">
                          <SelectValue placeholder="Select commodity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select commodity</SelectItem>
                          {(commoditiesQuery.data ?? []).map((commodity) => (
                            <SelectItem key={commodity.id} value={commodity.id}>
                              {commodity.name} (Current {commodity.quantity} {commodity.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCommodity && (
                        <p className="text-xs text-muted-foreground">
                          Current: {selectedCommodity.quantity} {selectedCommodity.unit} | Total: {totalQuantity} {selectedCommodity.unit}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity Change</Label>
                      <Input
                        type="number"
                        step={1}
                        placeholder="Use negative to reduce"
                        value={row.quantityChange}
                        onChange={(event) =>
                          upsertCommodityRow(row.id, (draft) => ({
                            ...draft,
                            quantityChange: event.target.value,
                          }))
                        }
                        className="bg-secondary"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeCommodityRow(row.id)}
                        disabled={commodityRows.length === 1}
                        className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCommodityRow}
                  className="border-border/60 bg-secondary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Commodity Row
                </Button>
                <Button
                  type="submit"
                  disabled={commodityMutation.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {commodityMutation.isPending ? "Applying..." : "Apply Commodity Updates"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void commoditiesQuery.refetch()}
                  className="border-border/60 bg-secondary"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Commodities
                </Button>
              </div>
            </form>

            {commodityErrorText && (
              <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {commodityErrorText}
              </div>
            )}

            {commoditySuccessText && (
              <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {commoditySuccessText}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Recent Daily Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logsPreview.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {log.type === "received" ? (
                    <ArrowDownCircle className="h-4 w-4 text-cyan-300" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-rose-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {log.vendorName}
                      {log.billId ? ` • Bill #${log.billId}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.date)}{log.note ? ` • ${log.note}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "border",
                      log.type === "received"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    )}
                  >
                    {log.type === "received" ? "Amount Received" : "Amount Paid"}
                  </Badge>
                  <p
                    className={cn(
                      "font-mono text-sm font-semibold",
                      log.type === "received" ? "text-cyan-300" : "text-rose-300"
                    )}
                  >
                    ₹{log.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}

            {logType === "paid" && todayPaidSummary.payments.length > 0 && (
              <div className="mt-2 rounded-lg border border-rose-500/25 bg-rose-500/8 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-200">
                  Today Detailed Payments
                </p>
                <div className="space-y-1.5">
                  {todayPaidSummary.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-1.5 text-xs"
                    >
                      <span className="text-rose-100">
                        Bill #{payment.bill_id} • {formatDateTime(payment.payment_date)}
                      </span>
                      <span className="font-mono text-rose-200">
                        ₹{asNumber(payment.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {logsPreview.length === 0 && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                No daily logs yet. Add your first entry above.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
