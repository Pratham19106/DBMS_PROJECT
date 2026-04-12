import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PaymentHistory } from "@/components/payments/payment-history"
import { SmartPayPanel } from "@/components/payments/smart-pay-panel"

export default function PaymentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <div className="text-muted-foreground">
            Track payment history and plan your daily payments.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Payment History
            </h2>
            <PaymentHistory />
          </div>

          <div className="lg:col-span-2">
            <SmartPayPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
