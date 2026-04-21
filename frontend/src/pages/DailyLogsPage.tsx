import { type FormEvent, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownCircle, ArrowUpCircle, ClipboardList, Plus, RefreshCw, Trash2, TrendingUp } from "lucide-react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
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
  ApiRequestError,
  getCommodities,
  getCurrentUserId,
  getDailyLogAnalytics,
  getPayments,
  getVendors,
  type BackendPayment,
  type BackendDailyLogAnalyticsResponse,
  type DailyLogAnalyticsView,
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

type AnalyticsView = DailyLogAnalyticsView

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

type TodayPaidEntry = {
  id: string
  vendorName: string
  billId: string
  amount: number
  method: string
  paymentDate: string
}

type UnifiedPaidEntry = {
  id: string
  vendor_id: string
  bill_id: string
  amount: number
  payment_date?: string
  payment_mode: string
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

function shortBillId(id: string): string {
  return String(id).slice(-6).toUpperCase()
}

function normalizePayment(entry: BackendPayment): UnifiedPaidEntry {
  return {
    id: `payment-${entry.id}`,
    vendor_id: entry.vendor_id,
    bill_id: entry.bill_id,
    amount: asNumber(entry.amount),
    payment_date: entry.payment_date,
    payment_mode: String(entry.payment_mode).toUpperCase(),
  }
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

function getLocalDateValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getLocalMonthValue(date = new Date()): string {
  return getLocalDateValue(date).slice(0, 7)
}

function getTrendTone(trend: BackendDailyLogAnalyticsResponse["summary"]["trend_direction"]): string {
  if (trend === "improving") return "text-emerald-300"
  if (trend === "declining") return "text-rose-300"
  return "text-amber-300"
}

function getInsightStyle(type: "good" | "warning" | "neutral"): string {
  if (type === "good") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  }
  if (type === "warning") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200"
  }
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
}

export default function DailyLogsPage() {
  const queryClient = useQueryClient()
  const userId = getCurrentUserId()

  const [logType, setLogType] = useState<LogType>("received")
  const [amount, setAmount] = useState("")
  const [commodityRows, setCommodityRows] = useState<CommodityUpdateDraft[]>([createCommodityDraft()])
  const [commodityTotals, setCommodityTotals] = useState<Record<string, number>>({})
  const [financeErrorText, setFinanceErrorText] = useState<string | null>(null)
  const [financeSuccessText, setFinanceSuccessText] = useState<string | null>(null)
  const [commodityErrorText, setCommodityErrorText] = useState<string | null>(null)
  const [commoditySuccessText, setCommoditySuccessText] = useState<string | null>(null)
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>("monthly")
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateValue())
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthValue())
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()))
  const parsedSelectedYear = Number(selectedYear)
  const isYearValid = Number.isInteger(parsedSelectedYear) && parsedSelectedYear >= 2000 && parsedSelectedYear <= 2200

  const vendorsQuery = useQuery({
    queryKey: ["vendors", userId],
    queryFn: () => getVendors(userId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const commoditiesQuery = useQuery({
    queryKey: ["commodities", userId],
    queryFn: () => getCommodities(userId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const receivedLogsQuery = useQuery({
    queryKey: ["daily-received-logs", userId],
    queryFn: async () => getReceivedLogs(userId),
    staleTime: 45 * 1000,
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const paidLogsQuery = useQuery({
    queryKey: ["daily-paid-entries", userId],
    queryFn: async () => getPayments(userId).then((payments) =>
      payments
        .map(normalizePayment)
        .sort((a, b) => new Date(b.payment_date ?? "").getTime() - new Date(a.payment_date ?? "").getTime())
    ),
    staleTime: 45 * 1000,
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const analyticsQuery = useQuery({
    queryKey: ["daily-log-analytics", userId, analyticsView, selectedDate, selectedMonth, selectedYear],
    enabled: analyticsView !== "yearly" || isYearValid,
    queryFn: async () =>
      getDailyLogAnalytics(userId, {
        view: analyticsView,
        date: analyticsView === "daily" ? selectedDate : undefined,
        month: analyticsView === "monthly" ? selectedMonth : undefined,
        year: analyticsView === "yearly" && isYearValid ? parsedSelectedYear : undefined,
        limit: analyticsView === "yearly" ? 5000 : 2500,
      }),
      staleTime: 30 * 1000,
      gcTime: 6 * 60 * 1000,
      refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!commoditiesQuery.data) {
      return
    }

    setCommodityTotals(updateTotalsFromCommodities(userId, commoditiesQuery.data))
  }, [userId, commoditiesQuery.data])

  const logsPreview = useMemo<DailyPreviewLog[]>(() => {
    const vendorNameById = new Map((vendorsQuery.data ?? []).map((vendor) => [vendor.id, vendor.name]))

    const paidLogs: DailyPreviewLog[] = (paidLogsQuery.data ?? []).slice(0, 5).map((log) => ({
      id: `paid-${log.id}`,
      date: log.payment_date ?? "",
      amount: asNumber(log.amount),
      type: "paid",
      vendorName: vendorNameById.get(log.vendor_id) ?? `Vendor #${log.vendor_id}`,
      billId: log.bill_id,
      note: `Method: ${log.payment_mode}`,
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
    mutationFn: async (payload: { amount: number }) => {
      return addReceivedLog({
        userId,
        amount: payload.amount,
        date: new Date().toISOString(),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["daily-paid-entries", userId] }),
        queryClient.invalidateQueries({ queryKey: ["payments", userId] }),
        queryClient.invalidateQueries({ queryKey: ["daily-received-logs", userId] }),
        queryClient.invalidateQueries({ queryKey: ["daily-log-analytics", userId] }),
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

    if (logType === "paid") {
      setFinanceErrorText("Paid logs are auto-fetched from payment logs. Use Received to add entries.")
      return
    }

    try {
      await financialMutation.mutateAsync({
        amount: numericAmount,
      })

      setAmount("")
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

    const totalOutflow = todayPayments.reduce((sum, payment) => sum + asNumber(payment.amount), 0)
    const byVendor = new Map<string, { vendorName: string; amount: number; count: number }>()
    const byMethod = new Map<string, { method: string; amount: number; count: number }>()
    const payments: TodayPaidEntry[] = []

    for (const payment of todayPayments) {
      const vendorName = vendorNameById.get(payment.vendor_id) ?? `Vendor #${payment.vendor_id}`
      const current = byVendor.get(payment.vendor_id)
      const method = String(payment.payment_mode).toUpperCase()
      const methodCurrent = byMethod.get(method)
      const paymentAmount = asNumber(payment.amount)

      payments.push({
        id: payment.id,
        vendorName,
        billId: payment.bill_id,
        amount: paymentAmount,
        method,
        paymentDate: payment.payment_date ?? "",
      })

      if (!current) {
        byVendor.set(payment.vendor_id, {
          vendorName,
          amount: paymentAmount,
          count: 1,
        })
      } else {
        current.amount += paymentAmount
        current.count += 1
        byVendor.set(payment.vendor_id, current)
      }

      if (!methodCurrent) {
        byMethod.set(method, {
          method,
          amount: paymentAmount,
          count: 1,
        })
      } else {
        methodCurrent.amount += paymentAmount
        methodCurrent.count += 1
        byMethod.set(method, methodCurrent)
      }
    }

    return {
      count: todayPayments.length,
      totalOutflow,
      payments: payments.sort(
        (left, right) => new Date(right.paymentDate).getTime() - new Date(left.paymentDate).getTime()
      ),
      vendorBreakdown: Array.from(byVendor.values()).sort((a, b) => b.amount - a.amount),
      methodBreakdown: Array.from(byMethod.values()).sort((a, b) => b.amount - a.amount),
    }
  }, [paidLogsQuery.data, vendorsQuery.data])

  const analyticsSeries = analyticsQuery.data?.series ?? []
  const analyticsLogs = analyticsQuery.data?.logs ?? []

  const analyticsChartData = useMemo(
    () =>
      analyticsSeries.map((entry) => ({
        bucketLabel: entry.bucket_label,
        received: entry.received,
        paid: entry.paid,
        net: entry.net,
        transactions: entry.transactions,
      })),
    [analyticsSeries]
  )

  const analyticsErrorText =
    analyticsQuery.error instanceof ApiRequestError
      ? analyticsQuery.error.message
      : analyticsQuery.error instanceof Error
        ? analyticsQuery.error.message
        : "Unable to load insights for the selected period"

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
        <div className="kv-page-reveal flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="kv-microprint text-muted-foreground">Section 05 · Operator Timeline</p>
            <h1
              className="mt-2 text-5xl text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em" }}
            >
              Daily Logs
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Track financial entries and manage commodity quantities in a unified, notarized daily
              timeline.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-cream-card px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="kv-microprint-sm text-muted-foreground">Module</p>
              <p
                className="text-sm text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
              >
                DL &middot; Daily Timeline
              </p>
            </div>
          </div>
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

                {logType === "received" && (
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
                )}
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
                    <span>Total Outflow Today: ₹{todayPaidSummary.totalOutflow.toLocaleString("en-IN")}</span>
                    <span>Vendors Covered: {todayPaidSummary.vendorBreakdown.length}</span>
                    <span>Methods Used: {todayPaidSummary.methodBreakdown.length}</span>
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

                  <div className="mt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-200">
                      By Payment Method
                    </p>
                    <div className="space-y-1">
                      {todayPaidSummary.methodBreakdown.map((method) => (
                        <div
                          key={method.method}
                          className="flex items-center justify-between rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-1.5 text-xs"
                        >
                          <span className="text-rose-100">{method.method}</span>
                          <span className="font-mono text-rose-200">
                            ₹{method.amount.toLocaleString("en-IN")} ({method.count})
                          </span>
                        </div>
                      ))}
                      {todayPaidSummary.methodBreakdown.length === 0 && (
                        <p className="text-xs text-rose-200/80">No method data found for today.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {logType === "received" && (
                  <Button
                    type="submit"
                    disabled={financialMutation.isPending}
                    className="bg-cyan-600 text-white hover:bg-cyan-700"
                  >
                    {financialMutation.isPending ? "Saving..." : "Save Financial Log"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void Promise.all([
                      vendorsQuery.refetch(),
                      paidLogsQuery.refetch(),
                      receivedLogsQuery.refetch(),
                      analyticsQuery.refetch(),
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
            <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
              <TrendingUp className="h-5 w-5 text-indigo-300" />
              Past Logs Analytics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select a period to view meaningful trends, grouped charts, and actionable insights from real cashflow logs.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
              <div className="space-y-2">
                <Label>View</Label>
                <Select value={analyticsView} onValueChange={(value) => setAnalyticsView(value as AnalyticsView)}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Period</Label>
                {analyticsView === "daily" && (
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="bg-secondary"
                  />
                )}
                {analyticsView === "monthly" && (
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="bg-secondary"
                  />
                )}
                {analyticsView === "yearly" && (
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min={2000}
                      max={2200}
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      className="bg-secondary"
                    />
                    {!isYearValid && (
                      <p className="text-xs text-rose-300">Enter a year between 2000 and 2200.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void analyticsQuery.refetch()}
                  className="border-border/60 bg-secondary"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Period
                </Button>
              </div>
            </div>

            {analyticsQuery.isLoading && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                Loading chart data and insights...
              </div>
            )}

            {analyticsQuery.isError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {analyticsErrorText}
              </div>
            )}

            {!analyticsQuery.isLoading && !analyticsQuery.isError && analyticsQuery.data && (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-cyan-200/90">Received</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-cyan-200">
                      Rs {analyticsQuery.data.summary.total_received.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-rose-200/90">Paid</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-rose-200">
                      Rs {analyticsQuery.data.summary.total_paid.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-indigo-200/90">Net Balance</p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-lg font-semibold",
                        analyticsQuery.data.summary.net_balance >= 0 ? "text-emerald-300" : "text-rose-300"
                      )}
                    >
                      Rs {analyticsQuery.data.summary.net_balance.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-amber-200/90">Transactions</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-amber-200">
                      {analyticsQuery.data.summary.transaction_count.toLocaleString("en-IN")}
                    </p>
                    <p className={cn("mt-1 text-xs", getTrendTone(analyticsQuery.data.summary.trend_direction))}>
                      Trend: {analyticsQuery.data.summary.trend_direction}
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full rounded-lg border border-border/50 bg-secondary/15 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analyticsChartData} margin={{ top: 12, right: 16, left: 0, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis
                        dataKey="bucketLabel"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      <YAxis
                        yAxisId="amount"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                        tickFormatter={(value) => `Rs ${Number(value).toLocaleString("en-IN")}`}
                      />
                      <YAxis
                        yAxisId="count"
                        orientation="right"
                        allowDecimals={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid rgba(148,163,184,0.35)",
                          borderRadius: "10px",
                        }}
                        formatter={(value, name) => {
                          if (name === "Transactions") {
                            return [Number(value).toLocaleString("en-IN"), name]
                          }
                          return [`Rs ${Number(value).toLocaleString("en-IN")}`, name]
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="amount" dataKey="paid" name="Paid" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Line
                        yAxisId="amount"
                        type="monotone"
                        dataKey="received"
                        name="Received"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="amount"
                        type="monotone"
                        dataKey="net"
                        name="Net"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="transactions"
                        name="Transactions"
                        stroke="#a78bfa"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-2">
                  {analyticsQuery.data.insights.map((insight, index) => (
                    <div
                      key={`${insight.title}-${index}`}
                      className={cn("rounded-lg border px-3 py-2 text-sm", getInsightStyle(insight.type))}
                    >
                      <p className="font-semibold">{insight.title}</p>
                      <p className="text-xs opacity-90">{insight.detail}</p>
                    </div>
                  ))}
                  {analyticsQuery.data.insights.length === 0 && (
                    <div className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
                      Not enough data in this period yet for insights.
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border/50 bg-secondary/15 p-3">
                  <p className="mb-2 text-sm font-semibold text-card-foreground">Logs In Selected Period</p>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {analyticsLogs.slice(0, 30).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 bg-secondary/30 px-2 py-1.5 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {formatDateTime(entry.log_date)}
                          {entry.vendor_name ? ` • ${entry.vendor_name}` : ""}
                          {entry.bill_id ? ` • Bill #${shortBillId(entry.bill_id)}` : ""}
                          {entry.payment_mode ? ` • ${String(entry.payment_mode).toUpperCase()}` : ""}
                          {entry.note ? ` • ${entry.note}` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "border",
                              entry.log_type === "received"
                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                            )}
                          >
                            {entry.log_type}
                          </Badge>
                          <span
                            className={cn(
                              "font-mono",
                              entry.log_type === "received" ? "text-cyan-300" : "text-rose-300"
                            )}
                          >
                            Rs {Number(entry.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))}

                    {analyticsLogs.length === 0 && (
                      <p className="text-xs text-muted-foreground">No logs found for this selection.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Recent Daily Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
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
                      {log.billId ? ` • Bill #${shortBillId(log.billId)}` : ""}
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
                <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {todayPaidSummary.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-1.5 text-xs"
                    >
                      <span className="text-rose-100">
                        {payment.vendorName} • {payment.method} • Bill #{shortBillId(payment.billId)} • {formatDateTime(payment.paymentDate)}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
