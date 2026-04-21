"use client"

import { TrendingDown, Wallet, Users, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardMetrics } from "./dashboard-data"

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  accent: "danger" | "success" | "info" | "warning"
  isCurrency?: boolean
  showPulse?: boolean
  fieldCode: string
}

function KPICard({ title, value, icon, accent, isCurrency, showPulse, fieldCode }: KPICardProps) {
  const accentRing = {
    danger: "before:bg-destructive",
    success: "before:bg-forest",
    info: "before:bg-forest-soft",
    warning: "before:bg-amber",
  }

  const iconStyle = {
    danger: "bg-destructive/10 text-destructive",
    success: "bg-forest text-cream",
    info: "bg-forest-soft/15 text-forest",
    warning: "bg-amber/20 text-amber-deep",
  }

  return (
    <div
      className={cn(
        "kv-card relative overflow-hidden p-4",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1",
        accentRing[accent]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 pl-2">
          <div className="flex items-center gap-2">
            <p className="kv-microprint-sm text-muted-foreground">{title}</p>
            <span className="kv-microprint-sm text-forest/40">&middot; {fieldCode}</span>
          </div>
          <p
            className="text-2xl text-forest"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            {typeof value === "number" && isCurrency
              ? `Rs ${value.toLocaleString("en-IN")}`
              : value}
          </p>
        </div>
        <div className="relative">
          <div className={cn("rounded-md p-2", iconStyle[accent])}>{icon}</div>
          {showPulse && (
            <span className="kv-pulse-dot absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber" />
          )}
        </div>
      </div>
    </div>
  )
}

type KPICardsProps = {
  metrics: DashboardMetrics
  loading?: boolean
}

export function KPICards({ metrics, loading = false }: KPICardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KPICard
        title="Total Debt"
        fieldCode="M01"
        value={loading ? "..." : metrics.totalOutstandingDebt}
        icon={<TrendingDown className="h-4 w-4" />}
        accent="danger"
        isCurrency
      />
      <KPICard
        title="Cash In Hand"
        fieldCode="M02"
        value={loading ? "..." : metrics.cashInHand}
        icon={<Wallet className="h-4 w-4" />}
        accent="success"
        isCurrency
      />
      <KPICard
        title="Active Vendors"
        fieldCode="M03"
        value={loading ? "..." : metrics.activeVendors}
        icon={<Users className="h-4 w-4" />}
        accent="info"
      />
      <KPICard
        title="Low Stock Alerts"
        fieldCode="M04"
        value={loading ? "..." : metrics.lowStockAlerts}
        icon={<AlertTriangle className="h-4 w-4" />}
        accent="warning"
        showPulse={!loading && metrics.lowStockAlerts > 0}
      />
    </div>
  )
}
