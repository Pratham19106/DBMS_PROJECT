import { AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StockCards } from "@/components/stock/stock-cards"
import { commodities } from "@/lib/mock-data"

export default function StockPage() {
  const criticalStock = commodities.filter(
    (c) => (c.currentStock / c.maxStock) * 100 <= c.reorderThreshold
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Stock & Commodities
          </h1>
          <p className="text-muted-foreground">
            Monitor inventory levels and reorder when needed.
          </p>
        </div>

        {/* Critical Alert Banner */}
        {criticalStock.length > 0 && (
          <div className="glow-amber flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-200">
              <span className="font-semibold">
                {criticalStock.length} commodit{criticalStock.length === 1 ? "y is" : "ies are"} critically low
              </span>{" "}
              — {criticalStock.map((c) => c.name).join(", ")}. View recommendations
              on the dashboard.
            </p>
          </div>
        )}

        {/* Stock Cards Grid */}
        <StockCards />
      </div>
    </DashboardLayout>
  )
}
