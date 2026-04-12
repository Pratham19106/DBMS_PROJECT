"use client"

import { TrendingDown, Wallet, Users, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DashboardMetrics } from "./dashboard-data"

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  accent: "danger" | "success" | "info" | "warning"
  isCurrency?: boolean
  showPulse?: boolean
}

function KPICard({ title, value, icon, accent, isCurrency, showPulse }: KPICardProps) {
  const accentStyles = {
    danger: "text-red-500 bg-red-500/10 border-red-500/20",
    success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  }

  const iconBgStyles = {
    danger: "bg-red-500/10",
    success: "bg-emerald-500/10",
    info: "bg-blue-500/10",
    warning: "bg-amber-500/10",
  }

  const iconColorStyles = {
    danger: "text-red-500",
    success: "text-emerald-500",
    info: "text-blue-500",
    warning: "text-amber-500",
  }

  return (
    <Card className={cn("border-border/50 bg-card transition-all hover:border-white/20", accentStyles[accent])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="font-mono text-xl font-bold text-card-foreground">
              {typeof value === "number" && isCurrency
                ? `₹${value.toLocaleString("en-IN")}`
                : value}
            </p>
          </div>
          <div className="relative">
            <div className={cn("rounded-lg p-2", iconBgStyles[accent])}>
              <div className={iconColorStyles[accent]}>{icon}</div>
            </div>
            {showPulse && (
              <span className="pulse-dot absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
        value={loading ? "..." : metrics.totalOutstandingDebt}
        icon={<TrendingDown className="h-5 w-5" />}
        accent="danger"
        isCurrency
      />
      <KPICard
        title="Cash In Hand"
        value={loading ? "..." : metrics.cashInHand}
        icon={<Wallet className="h-5 w-5" />}
        accent="success"
        isCurrency
      />
      <KPICard
        title="Active Vendors"
        value={loading ? "..." : metrics.activeVendors}
        icon={<Users className="h-5 w-5" />}
        accent="info"
      />
      <KPICard
        title="Low Stock Alerts"
        value={loading ? "..." : metrics.lowStockAlerts}
        icon={<AlertTriangle className="h-5 w-5" />}
        accent="warning"
        showPulse={!loading && metrics.lowStockAlerts > 0}
      />
    </div>
  )
}
