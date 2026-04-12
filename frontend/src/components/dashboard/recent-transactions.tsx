"use client"

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Truck, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { CashFlowPoint, DashboardTransaction } from "./dashboard-data"

const MAX_TRANSACTIONS = 8

type RecentTransactionsProps = {
  transactions: DashboardTransaction[]
  cashFlowData: CashFlowPoint[]
  loading?: boolean
}

export function RecentTransactions({ transactions, cashFlowData, loading = false }: RecentTransactionsProps) {
  const boundedTransactions = transactions.slice(0, MAX_TRANSACTIONS)

  return (
    <Card className="flex h-full flex-col border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-2">
        {/* Cash Flow Chart */}
        <div className="mb-4 h-30 w-full">
          <p className="mb-2 text-xs text-muted-foreground">Cash Flow - Last 30 Days</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={{ stroke: "#374151" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#f3f4f6", fontWeight: 500, marginBottom: "4px" }}
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString("en-IN")}`,
                  name === "inflow" ? "Payments Received" : "Supplies Purchased",
                ]}
              />
              <Line
                type="monotone"
                dataKey="inflow"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="outflow"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-1 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Payments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-red-500" />
              <span className="text-muted-foreground">Supplies</span>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {boundedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3 transition-colors hover:border-white/10"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    transaction.type === "supply"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  )}
                >
                  {transaction.type === "supply" ? (
                    <Truck className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {transaction.vendorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.type === "supply"
                      ? `${transaction.commodity ?? "Supply"}${transaction.quantity ? ` - ${transaction.quantity} units` : ""}`
                      : `Payment via ${transaction.mode ?? "Unknown"}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono text-sm font-semibold",
                      transaction.type === "supply"
                        ? "text-red-400"
                        : "text-emerald-400"
                    )}
                  >
                    {transaction.type === "supply" ? "-" : "+"}₹
                    {transaction.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {!loading && boundedTransactions.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent transactions found.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
