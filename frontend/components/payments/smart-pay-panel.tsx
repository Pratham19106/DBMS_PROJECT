"use client"

import { useState } from "react"
import { Sparkles, Check, AlertCircle, Clock, IndianRupee } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { vendors } from "@/lib/mock-data"

// Sort vendors by urgency (tolerance level + days since last payment)
const sortedVendors = [...vendors].sort((a, b) => {
  const toleranceOrder = { LOW: 3, MEDIUM: 2, HIGH: 1 }
  const aScore =
    toleranceOrder[a.toleranceLevel] * 10 + a.daysSinceLastPayment
  const bScore =
    toleranceOrder[b.toleranceLevel] * 10 + b.daysSinceLastPayment
  return bScore - aScore
})

export function SmartPayPanel() {
  const [cashAvailable, setCashAvailable] = useState<string>("")
  const [showPlan, setShowPlan] = useState(false)
  const [paidVendors, setPaidVendors] = useState<Set<string>>(new Set())

  const handleGeneratePlan = () => {
    if (cashAvailable && Number(cashAvailable) > 0) {
      setShowPlan(true)
      setPaidVendors(new Set())
    }
  }

  const handleMarkPaid = (vendorId: string) => {
    setPaidVendors((prev) => new Set([...prev, vendorId]))
  }

  // Calculate payment plan based on available cash
  const getPaymentPlan = () => {
    const cash = Number(cashAvailable) || 0
    let remaining = cash
    const plan: { vendor: (typeof vendors)[0]; suggestedAmount: number }[] = []

    for (const vendor of sortedVendors) {
      if (remaining <= 0) break
      const suggestedAmount = Math.min(vendor.outstandingBalance, remaining)
      if (suggestedAmount > 0) {
        plan.push({ vendor, suggestedAmount })
        remaining -= suggestedAmount
      }
    }

    return plan
  }

  const paymentPlan = getPaymentPlan()

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Pay Smart
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">
            Cash available today
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter amount..."
                value={cashAvailable}
                onChange={(e) => setCashAvailable(e.target.value)}
                className="bg-secondary pl-9 font-mono"
              />
            </div>
            <Button
              onClick={handleGeneratePlan}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Generate Plan
            </Button>
          </div>
        </div>

        {/* Payment Plan Output */}
        {showPlan && paymentPlan.length > 0 && (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3 pr-4">
              {paymentPlan.map(({ vendor, suggestedAmount }, index) => {
                const isPaid = paidVendors.has(vendor.id)

                return (
                  <div
                    key={vendor.id}
                    className={cn(
                      "rounded-lg border border-border/50 bg-secondary/30 p-4 transition-all",
                      isPaid && "border-emerald-500/30 bg-emerald-500/5 opacity-60"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="font-medium text-card-foreground">
                          {vendor.name}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          vendor.toleranceLevel === "LOW" &&
                            "border-red-500/30 bg-red-500/10 text-red-400",
                          vendor.toleranceLevel === "MEDIUM" &&
                            "border-amber-500/30 bg-amber-500/10 text-amber-400",
                          vendor.toleranceLevel === "HIGH" &&
                            "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        )}
                      >
                        {vendor.toleranceLevel}
                      </Badge>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Suggested</p>
                        <p className="font-mono font-semibold text-emerald-400">
                          ₹{suggestedAmount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="font-mono text-card-foreground">
                          ₹{vendor.outstandingBalance.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Days Unpaid</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-card-foreground">
                            {vendor.daysSinceLastPayment}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isPaid ? "outline" : "default"}
                      className={cn(
                        "w-full",
                        isPaid
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                      onClick={() => handleMarkPaid(vendor.id)}
                      disabled={isPaid}
                    >
                      {isPaid ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Paid
                        </>
                      ) : (
                        "Mark Paid"
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {showPlan && paymentPlan.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 bg-secondary/30 py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Enter an amount to generate a payment plan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
