"use client"

import { ShoppingCart, CreditCard, AlertCircle, Clock, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SmartBuyRecommendation, SmartPayRecommendation } from "./dashboard-data"

type SmartRecommendationsProps = {
  buyRecommendation: SmartBuyRecommendation
  payRecommendation: SmartPayRecommendation
  loading?: boolean
}

export function SmartRecommendations({
  buyRecommendation,
  payRecommendation,
  loading = false,
}: SmartRecommendationsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Smart Buy Recommendation — amber accent */}
      <article className="kv-glow-amber relative overflow-hidden rounded-lg border border-amber/40 bg-cream-card">
        <div className="border-b border-amber/30 bg-amber/10 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber/30 text-amber-deep">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <p className="kv-microprint-sm text-amber-deep">Smart Buy · Rec 01</p>
                <p
                  className="text-base text-forest"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
                >
                  Buy next
                </p>
              </div>
            </div>
            <span className="kv-microprint-sm text-muted-foreground">AI / 01</span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-deep" />
            <p className="text-sm text-forest/80">
              Stock of{" "}
              <span className="font-semibold text-forest">
                {buyRecommendation?.commodity ?? "—"}
              </span>{" "}
              is running low ({buyRecommendation?.stockLevel ?? 0}{" "}
              {buyRecommendation?.unit ?? "units"} remaining)
            </p>
          </div>

          <div className="kv-divider" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="kv-microprint-sm text-muted-foreground">Vendor</p>
              <p
                className="mt-1 text-lg text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                {buyRecommendation?.vendorName ?? "—"}
              </p>
            </div>
            <div>
              <p className="kv-microprint-sm text-muted-foreground">Signal</p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5">
                <TrendingDown className="h-3 w-3 text-amber-deep" />
                <span className="text-xs font-medium text-amber-deep">
                  {buyRecommendation ? "Low inventory" : "No data"}
                </span>
              </div>
            </div>
          </div>

          <p className="kv-microprint-sm text-muted-foreground">
            {buyRecommendation?.reason ?? "Add stock and vendor links to unlock this insight"}
          </p>

          <Button
            className="w-full rounded-md bg-forest text-cream hover:bg-forest-deep"
            disabled={loading || !buyRecommendation}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </div>
      </article>

      {/* Smart Pay Recommendation — forest accent */}
      <article className="kv-glow-forest relative overflow-hidden rounded-lg border border-forest/40 bg-cream-card">
        <div className="border-b border-forest/25 bg-forest/5 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-cream">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="kv-microprint-sm text-forest/70">Smart Pay · Rec 02</p>
                <p
                  className="text-base text-forest"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
                >
                  Pay next
                </p>
              </div>
            </div>
            <span className="kv-microprint-sm text-muted-foreground">AI / 02</span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="kv-microprint-sm text-muted-foreground">Vendor</p>
            <p
              className="mt-1 text-xl text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
            >
              {payRecommendation?.vendorName ?? "—"}
            </p>
          </div>

          <div className="kv-divider" />

          <div>
            <p className="kv-microprint-sm text-muted-foreground">Outstanding</p>
            <p
              className="mt-1 font-mono text-3xl font-semibold text-forest"
              style={{ letterSpacing: "-0.02em" }}
            >
              Rs {(payRecommendation?.outstandingAmount ?? 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                payRecommendation?.toleranceLevel === "LOW" && "border-destructive/40 bg-destructive/10 text-destructive",
                payRecommendation?.toleranceLevel === "MEDIUM" && "border-amber/40 bg-amber/15 text-amber-deep",
                payRecommendation?.toleranceLevel === "HIGH" && "border-forest/40 bg-forest/10 text-forest",
                !payRecommendation && "border-border bg-muted text-muted-foreground"
              )}
            >
              Tolerance: {payRecommendation?.toleranceLevel ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream-muted px-2.5 py-0.5 text-xs text-forest/80">
              <Clock className="h-3 w-3" />
              {payRecommendation?.daysSinceLastPayment ?? 0} days waiting
            </span>
          </div>

          <Button
            className="w-full rounded-md bg-amber text-forest hover:bg-amber-deep hover:text-cream"
            disabled={loading || !payRecommendation}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </article>
    </div>
  )
}
