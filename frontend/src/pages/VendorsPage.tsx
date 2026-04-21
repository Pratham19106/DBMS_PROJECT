import { Store } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { VendorsTable } from "@/components/vendors/vendors-table"

export default function VendorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="kv-page-reveal kv-section-shell flex flex-wrap items-end justify-between gap-4 border-b border-border p-4 pb-6 sm:p-5 sm:pb-6">
          <div>
            <p className="kv-microprint text-muted-foreground">Section 01 · Vendor Registry</p>
            <h1
              className="mt-2 text-5xl text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em" }}
            >
              Vendors
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Manage your suppliers and track outstanding balances. Every vendor is entered into
              the ledger with tolerance tier, linked commodities, and payment posture.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-cream-card px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="kv-microprint-sm text-muted-foreground">Module</p>
              <p
                className="text-sm text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
              >
                VN · Vendor Management
              </p>
            </div>
          </div>
        </div>

        <div className="kv-page-reveal">
          <VendorsTable />
        </div>
      </div>
    </DashboardLayout>
  )
}
