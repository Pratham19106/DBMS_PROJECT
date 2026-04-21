"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ApiRequestError,
  getCurrentUserId,
  getDailyLogAnalytics,
  type DailyLogAnalyticsView,
} from "@/lib/api"
import { cn } from "@/lib/utils"

function getLocalDateValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getLocalMonthValue(date = new Date()): string {
  return getLocalDateValue(date).slice(0, 7)
}

function getInsightStyle(type: "good" | "warning" | "neutral"): string {
  if (type === "good") {
    return "border-forest/30 bg-forest/5 text-forest"
  }
  if (type === "warning") {
    return "border-destructive/30 bg-destructive/5 text-destructive"
  }
  return "border-amber/40 bg-amber/10 text-amber-deep"
}

function formatDateTime(value?: string): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shortBillId(id?: string | null): string {
  if (!id) return "-"
  return String(id).slice(-6).toUpperCase()
}

export function FinancialAnalysis() {
  const userId = getCurrentUserId()
  const [view, setView] = useState<DailyLogAnalyticsView>("monthly")
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateValue())
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthValue())
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()))

  const parsedSelectedYear = Number(selectedYear)
  const isYearValid = Number.isInteger(parsedSelectedYear) && parsedSelectedYear >= 2000 && parsedSelectedYear <= 2200

  const analyticsQuery = useQuery({
    queryKey: ["dashboard-financial-analysis", userId, view, selectedDate, selectedMonth, selectedYear],
    enabled: view !== "yearly" || isYearValid,
    queryFn: () =>
      getDailyLogAnalytics(userId, {
        view,
        date: view === "daily" ? selectedDate : undefined,
        month: view === "monthly" ? selectedMonth : undefined,
        year: view === "yearly" && isYearValid ? parsedSelectedYear : undefined,
        limit: view === "yearly" ? 5000 : 2500,
      }),
    staleTime: 30 * 1000,
    gcTime: 6 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const summary = analyticsQuery.data?.summary
  const series = analyticsQuery.data?.series ?? []

  const errorMessage =
    analyticsQuery.error instanceof ApiRequestError
      ? analyticsQuery.error.message
      : analyticsQuery.error instanceof Error
        ? analyticsQuery.error.message
        : "Unable to load dashboard analysis"

  return (
    <section className="kv-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-cream-muted/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-cream">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="kv-microprint-sm text-muted-foreground">Section 03 · Ledger</p>
            <h3
              className="text-lg text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              Financial Analysis
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={view} onValueChange={(value) => setView(value as DailyLogAnalyticsView)}>
            <SelectTrigger className="w-32 border-border bg-background">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          {view === "daily" && (
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-40 border-border bg-background"
            />
          )}
          {view === "monthly" && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-40 border-border bg-background"
            />
          )}
          {view === "yearly" && (
            <Input
              type="number"
              min={2000}
              max={2200}
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-28 border-border bg-background"
            />
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {view === "yearly" && !isYearValid && (
          <p className="kv-microprint-sm text-destructive">
            Enter a year between 2000 and 2200.
          </p>
        )}

        {analyticsQuery.isLoading && (
          <div className="rounded-md border border-border bg-cream-muted/50 p-3 text-sm text-muted-foreground">
            Loading analysis...
          </div>
        )}

        {analyticsQuery.isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {!analyticsQuery.isLoading && !analyticsQuery.isError && summary && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "RECEIVED", value: summary.total_received, tone: "forest" as const },
                { label: "PAID", value: summary.total_paid, tone: "destructive" as const },
                { label: "NET BALANCE", value: summary.net_balance, tone: summary.net_balance >= 0 ? "forest" : "destructive" },
                { label: "TRANSACTIONS", value: summary.transaction_count, tone: "amber" as const, noCurrency: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "kv-card relative overflow-hidden p-4",
                    "before:absolute before:left-0 before:top-0 before:h-full before:w-1",
                    stat.tone === "forest" && "before:bg-forest",
                    stat.tone === "destructive" && "before:bg-destructive",
                    stat.tone === "amber" && "before:bg-amber"
                  )}
                >
                  <p className="kv-microprint-sm text-muted-foreground">{stat.label}</p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-xl font-semibold",
                      stat.tone === "forest" && "text-forest",
                      stat.tone === "destructive" && "text-destructive",
                      stat.tone === "amber" && "text-amber-deep"
                    )}
                  >
                    {stat.noCurrency
                      ? Number(stat.value).toLocaleString("en-IN")
                      : `Rs ${Number(stat.value).toLocaleString("en-IN")}`}
                  </p>
                </div>
              ))}
            </div>

            <div className="kv-card h-72 w-full overflow-hidden p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 10, right: 14, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 61, 42, 0.1)" />
                  <XAxis
                    dataKey="bucket_label"
                    tick={{ fill: "#5a6b5e", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                    tickLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                  />
                  <YAxis
                    yAxisId="amount"
                    tick={{ fill: "#5a6b5e", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                    tickLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fbf9f5",
                      border: "1px solid #d6d0c4",
                      borderRadius: "6px",
                      color: "#1a3d2a",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => {
                      if (name === "transactions") {
                        return [Number(value).toLocaleString("en-IN"), "Transactions"]
                      }
                      return [`Rs ${Number(value).toLocaleString("en-IN")}`, name]
                    }}
                  />
                  <Bar yAxisId="amount" dataKey="paid" fill="#a13b2b" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="amount" dataKey="received" stroke="#1a3d2a" strokeWidth={2} dot={false} />
                  <Line yAxisId="amount" dataKey="net" stroke="#d4a574" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-2">
              {analyticsQuery.data?.insights.map((insight, index) => (
                <div
                  key={`${insight.title}-${index}`}
                  className={cn("rounded-md border px-3 py-2 text-sm", getInsightStyle(insight.type))}
                >
                  <p
                    className="font-semibold"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {insight.title}
                  </p>
                  <p className="text-xs opacity-90">{insight.detail}</p>
                </div>
              ))}
            </div>

            <div className="kv-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p
                  className="text-sm text-forest"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
                >
                  Daily Log Transactions
                </p>
                <p className="kv-microprint-sm text-muted-foreground">
                  {(analyticsQuery.data?.logs?.length ?? 0)} entries
                </p>
              </div>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1 bill-modal-scrollbar">
                {(analyticsQuery.data?.logs ?? []).slice(0, 40).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {formatDateTime(entry.log_date)}
                      {entry.vendor_name ? ` · ${entry.vendor_name}` : ""}
                      {entry.bill_id ? ` · Bill #${shortBillId(entry.bill_id)}` : ""}
                      {entry.payment_mode ? ` · ${String(entry.payment_mode).toUpperCase()}` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          entry.log_type === "received"
                            ? "border-forest/40 bg-forest/5 text-forest"
                            : "border-destructive/40 bg-destructive/5 text-destructive"
                        )}
                      >
                        {entry.log_type}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          entry.log_type === "received" ? "text-forest" : "text-destructive"
                        )}
                      >
                        Rs {Number(entry.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}

                {(analyticsQuery.data?.logs?.length ?? 0) === 0 && (
                  <p className="kv-microprint-sm text-muted-foreground">
                    No transactions for selected period.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
