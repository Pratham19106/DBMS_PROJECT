import { Package } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StockCards } from "@/components/stock/stock-cards"

export default function StockPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="kv-page-reveal kv-section-shell flex flex-wrap items-end justify-between gap-4 border-b border-border p-4 pb-6 sm:p-5 sm:pb-6">
          <div>
            <p className="kv-microprint text-muted-foreground">Section 02 · Inventory Registry</p>
            <h1
              className="mt-2 text-5xl text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em" }}
            >
              Stock &amp; Commodities
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Monitor inventory levels, capacity, and reorder thresholds. Every commodity is
              time-stamped and linked to its sourcing vendors.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-cream-card px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="kv-microprint-sm text-muted-foreground">Module</p>
              <p
                className="text-sm text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
              >
                SK · Commodity Control
              </p>
            </div>
          </div>
        </div>

        <div className="kv-page-reveal">
          <StockCards />
        </div>
      </div>
    </DashboardLayout>
  )
}
