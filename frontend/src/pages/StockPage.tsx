import { AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StockCards } from "@/components/stock/stock-cards"

export default function StockPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Stock & Commodities
          </h1>
          <div className="text-muted-foreground">
            Monitor inventory levels and reorder when needed.
          </div>
        </div>

        <div className="glow-amber flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-200">
            Live commodity data is now loaded from backend inventory endpoints.
          </div>
        </div>

        <StockCards />
      </div>
    </DashboardLayout>
  )
}
