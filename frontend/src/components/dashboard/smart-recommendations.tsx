"use client"

import { ShoppingCart, CreditCard, AlertCircle, Clock, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      {/* Smart Buy Recommendation */}
      <Card className="glow-amber relative overflow-hidden border-amber-500/30 bg-card">
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-lg font-semibold text-card-foreground">
              Smart Buy Recommendation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                Stock of{" "}
                <span className="font-semibold text-amber-500">
                    {buyRecommendation?.commodity ?? "-"}
                </span>{" "}
                  is running low ({buyRecommendation?.stockLevel ?? 0} {buyRecommendation?.unit ?? "units"} left)
              </p>
            </div>
            <p className="text-card-foreground">
              Recommended vendor:{" "}
              <span className="font-semibold text-primary">
                  {buyRecommendation?.vendorName ?? "No recommendation yet"}
              </span>
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-400"
          >
            <TrendingDown className="mr-1.5 h-3 w-3" />
            {buyRecommendation?.reason ?? "Add more stock and vendor links to unlock this insight"}
          </Badge>

          <Button className="w-full bg-amber-600 text-white hover:bg-amber-700" disabled={loading || !buyRecommendation}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </CardContent>
      </Card>

      {/* Smart Pay Recommendation */}
      <Card className="glow-green relative overflow-hidden border-emerald-500/30 bg-card">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-lg font-semibold text-card-foreground">
              Smart Pay Recommendation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-card-foreground">
              Pay{" "}
              <span className="font-semibold text-primary">
                {payRecommendation?.vendorName ?? "-"}
              </span>{" "}
              next
            </p>
            <p className="font-mono text-2xl font-bold text-emerald-400">
              ₹{(payRecommendation?.outstandingAmount ?? 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-red-500/30 bg-red-500/10 text-red-400",
                payRecommendation?.toleranceLevel === "MEDIUM" &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-400",
                payRecommendation?.toleranceLevel === "HIGH" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              )}
            >
              Tolerance: {payRecommendation?.toleranceLevel ?? "-"}
            </Badge>
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-blue-400"
            >
              <Clock className="mr-1.5 h-3 w-3" />
              {payRecommendation?.daysSinceLastPayment ?? 0} days since payment
            </Badge>
          </div>

          <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={loading || !payRecommendation}>
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
