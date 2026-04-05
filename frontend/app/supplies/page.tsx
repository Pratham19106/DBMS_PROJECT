import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SuppliesTable } from "@/components/supplies/supplies-table"

export default function SuppliesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Supplies</h1>
          <p className="text-muted-foreground">
            Track incoming supply entries and manage purchase orders.
          </p>
        </div>

        {/* Supplies Table */}
        <SuppliesTable />
      </div>
    </DashboardLayout>
  )
}
