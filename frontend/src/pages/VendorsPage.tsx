import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { VendorsTable } from "@/components/vendors/vendors-table"

export default function VendorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <div className="text-muted-foreground">
            Manage your suppliers and track outstanding balances.
          </div>
        </div>

        <VendorsTable />
      </div>
    </DashboardLayout>
  )
}
