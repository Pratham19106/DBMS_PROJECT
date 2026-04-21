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
import { BarChart3 } from "lucide-react"
import type { DebtDistributionPoint } from "./dashboard-data"

function getBarColor(balance: number) {
  if (balance < 5000) return "#1a3d2a" // forest - healthy
  if (balance <= 15000) return "#d4a574" // amber - caution
  return "#a13b2b" // rust - critical
}

type DebtDistributionChartProps = {
  data: DebtDistributionPoint[]
  loading?: boolean
}

export function DebtDistributionChart({ data, loading = false }: DebtDistributionChartProps) {
  return (
    <section className="kv-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-cream-muted/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-cream">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <p className="kv-microprint-sm text-muted-foreground">Section 05 · Exposure</p>
            <h3
              className="text-lg text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              Debt Distribution
            </h3>
          </div>
        </div>
        <p className="kv-microprint-sm text-muted-foreground">
          {data.length} vendors
        </p>
      </div>
      <div className="p-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#5a6b5e", fontSize: 12 }}
                axisLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                tickLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
              />
              <YAxis
                tick={{ fill: "#5a6b5e", fontSize: 12 }}
                axisLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                tickLine={{ stroke: "rgba(26, 61, 42, 0.2)" }}
                tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(26, 61, 42, 0.05)" }}
                contentStyle={{
                  backgroundColor: "#fbf9f5",
                  border: "1px solid #d6d0c4",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#1a3d2a", fontWeight: 600, fontFamily: "Fraunces, serif" }}
                formatter={(value: number) => [
                  `Rs ${value.toLocaleString("en-IN")}`,
                  "Outstanding",
                ]}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.fullName || label
                }
              />
              <Bar dataKey="balance" radius={[3, 3, 0, 0]}>
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
        <div className="mt-5 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-forest" />
            <span className="kv-microprint-sm text-muted-foreground">&lt; Rs 5,000</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber" />
            <span className="kv-microprint-sm text-muted-foreground">Rs 5,000 &mdash; 15,000</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-destructive" />
            <span className="kv-microprint-sm text-muted-foreground">&gt; Rs 15,000</span>
          </div>
        </div>
      </div>
    </section>
  )
}
