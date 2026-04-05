import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DebtDistributionChart } from "@/components/dashboard/debt-distribution-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your supply chain overview.
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards />

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DebtDistributionChart />
          </div>
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>
        </div>

        {/* Smart Recommendations */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            AI-Powered Recommendations
          </h2>
          <SmartRecommendations />
        </div>
      </div>
    </DashboardLayout>
  )
}
