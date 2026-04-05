"use client"

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Phone, MapPin, Truck, Wallet } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Vendor } from "@/lib/mock-data"
import { vendorLedgers, vendorBalanceHistory } from "@/lib/mock-data"

interface VendorDrawerProps {
  vendor: Vendor | null
  open: boolean
  onClose: () => void
}

export function VendorDrawer({ vendor, open, onClose }: VendorDrawerProps) {
  if (!vendor) return null

  const ledger = vendorLedgers[vendor.id] || []
  const balanceHistory = vendorBalanceHistory[vendor.id] || []

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full border-border/50 bg-card sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-left text-xl font-bold text-card-foreground">
            {vendor.name}
          </SheetTitle>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{vendor.contact}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{vendor.location}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {vendor.commodities.map((commodity) => (
              <Badge key={commodity} variant="secondary" className="bg-secondary text-secondary-foreground">
                {commodity}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className={cn(
                vendor.toleranceLevel === "LOW" &&
                  "border-red-500/30 bg-red-500/10 text-red-400",
                vendor.toleranceLevel === "MEDIUM" &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-400",
                vendor.toleranceLevel === "HIGH" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              )}
            >
              Tolerance: {vendor.toleranceLevel}
            </Badge>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="font-mono text-2xl font-bold text-card-foreground">
              ₹{vendor.outstandingBalance.toLocaleString("en-IN")}
            </p>
          </div>
        </SheetHeader>

        <Tabs defaultValue="ledger" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="ledger" className="data-[state=active]:bg-background">Ledger</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {ledger.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="relative flex items-start gap-3 pb-3"
                  >
                    {/* Timeline line */}
                    {index < ledger.length - 1 && (
                      <div className="absolute left-4 top-9 h-full w-0.5 bg-border/50" />
                    )}

                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        entry.type === "supply"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {entry.type === "supply" ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-card-foreground">
                          {entry.type === "supply"
                            ? `Supply: ${entry.commodity}`
                            : `Payment via ${entry.mode}`}
                        </p>
                        <p
                          className={cn(
                            "font-mono text-sm font-semibold",
                            entry.type === "supply"
                              ? "text-emerald-400"
                              : "text-red-400"
                          )}
                        >
                          {entry.type === "supply" ? "+" : "-"}₹
                          {entry.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {entry.quantity && ` • ${entry.quantity} units`}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          Balance: ₹{entry.runningBalance.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Balance Over Time
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={balanceHistory}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                      formatter={(value: number) => [
                        `₹${value.toLocaleString("en-IN")}`,
                        "Balance",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#balanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
