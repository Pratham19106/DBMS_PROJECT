"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DebtDistributionPoint } from "./dashboard-data"

function getBarColor(balance: number) {
  if (balance < 5000) return "#22c55e" // green
  if (balance <= 15000) return "#f59e0b" // amber
  return "#ef4444" // red
}

type DebtDistributionChartProps = {
  data: DebtDistributionPoint[]
  loading?: boolean
}

export function DebtDistributionChart({ data, loading = false }: DebtDistributionChartProps) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Debt Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151" }}
                tickLine={{ stroke: "#374151" }}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151" }}
                tickLine={{ stroke: "#374151" }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelStyle={{ color: "#f3f4f6", fontWeight: 600 }}
                formatter={(value: number) => [
                  `₹${value.toLocaleString("en-IN")}`,
                  "Outstanding",
                ]}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.fullName || label
                }
              />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.balance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!loading && data.length === 0 && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            No vendor debt data available yet.
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">{"< ₹5,000"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber-500" />
            <span className="text-muted-foreground">₹5,000 - ₹15,000</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">{"> ₹15,000"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
