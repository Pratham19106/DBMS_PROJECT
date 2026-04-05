"use client"

import { TrendingDown, Wallet, Users, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { dashboardMetrics } from "@/lib/mock-data"

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  accent: "danger" | "success" | "info" | "warning"
  showPulse?: boolean
}

function KPICard({ title, value, icon, accent, showPulse }: KPICardProps) {
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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="font-mono text-2xl font-bold text-card-foreground">
              {typeof value === "number" && title.toLowerCase().includes("debt") || title.toLowerCase().includes("cash")
                ? `₹${value.toLocaleString("en-IN")}`
                : value}
            </p>
          </div>
          <div className="relative">
            <div className={cn("rounded-lg p-2.5", iconBgStyles[accent])}>
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

export function KPICards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Outstanding Debt"
        value={dashboardMetrics.totalOutstandingDebt}
        icon={<TrendingDown className="h-5 w-5" />}
        accent="danger"
      />
      <KPICard
        title="Cash In Hand Today"
        value={dashboardMetrics.cashInHand}
        icon={<Wallet className="h-5 w-5" />}
        accent="success"
      />
      <KPICard
        title="Active Vendors"
        value={dashboardMetrics.activeVendors}
        icon={<Users className="h-5 w-5" />}
        accent="info"
      />
      <KPICard
        title="Low Stock Alerts"
        value={dashboardMetrics.lowStockAlerts}
        icon={<AlertTriangle className="h-5 w-5" />}
        accent="warning"
        showPulse={dashboardMetrics.lowStockAlerts > 0}
      />
    </div>
  )
}
