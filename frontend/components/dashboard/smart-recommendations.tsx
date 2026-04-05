"use client"

import { ShoppingCart, CreditCard, AlertCircle, Clock, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { smartBuyRecommendation, smartPayRecommendation } from "@/lib/mock-data"

export function SmartRecommendations() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Smart Buy Recommendation */}
      <Card className="glow-amber relative overflow-hidden border-amber-500/30 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
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
                  {smartBuyRecommendation.commodity}
                </span>{" "}
                is running low ({smartBuyRecommendation.stockLevel}% remaining)
              </p>
            </div>
            <p className="text-card-foreground">
              Recommended vendor:{" "}
              <span className="font-semibold text-primary">
                {smartBuyRecommendation.vendor.name}
              </span>
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-400"
          >
            <TrendingDown className="mr-1.5 h-3 w-3" />
            {smartBuyRecommendation.reason}
          </Badge>

          <Button className="w-full bg-amber-600 text-white hover:bg-amber-700">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </CardContent>
      </Card>

      {/* Smart Pay Recommendation */}
      <Card className="glow-green relative overflow-hidden border-emerald-500/30 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
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
                {smartPayRecommendation.vendor.name}
              </span>{" "}
              next
            </p>
            <p className="font-mono text-2xl font-bold text-emerald-400">
              ₹{smartPayRecommendation.outstandingAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-red-500/30 bg-red-500/10 text-red-400",
                smartPayRecommendation.toleranceLevel === "MEDIUM" &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-400",
                smartPayRecommendation.toleranceLevel === "HIGH" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              )}
            >
              Tolerance: {smartPayRecommendation.toleranceLevel}
            </Badge>
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-blue-400"
            >
              <Clock className="mr-1.5 h-3 w-3" />
              {smartPayRecommendation.daysSinceLastPayment} days since payment
            </Badge>
          </div>

          <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
