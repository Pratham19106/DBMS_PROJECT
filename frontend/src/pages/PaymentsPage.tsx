import { Wallet } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AddPaymentForm } from "@/components/payments/add-payment-form"
import { PaymentHistory } from "@/components/payments/payment-history"
import { SmartPayPanel } from "@/components/payments/smart-pay-panel"

export default function PaymentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="kv-page-reveal kv-section-shell flex flex-wrap items-end justify-between gap-4 border-b border-border p-4 pb-6 sm:p-5 sm:pb-6">
          <div>
            <p className="kv-microprint text-muted-foreground">Section 03 · Payment Ledger</p>
            <h1
              className="mt-2 text-5xl text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em" }}
            >
              Payments
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Track payment history, record new entries, and plan tomorrow&apos;s disbursements
              using AI-ranked priority signals.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-cream-card px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="kv-microprint-sm text-muted-foreground">Module</p>
              <p
                className="text-sm text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
              >
                PY · Disbursement
              </p>
            </div>
          </div>
        </div>

        <div className="kv-page-reveal">
          <AddPaymentForm />
        </div>

        <div className="kv-page-reveal grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="kv-microprint text-muted-foreground">Section 03.A</p>
                <h2
                  className="mt-1 text-2xl text-forest"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  Payment History
                </h2>
              </div>
            </div>
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
