"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ApiRequestError,
  getBillPaymentLogs,
  getCurrentUserId,
  getPaymentLogs,
  getVendorBills,
  getVendorPaymentLogs,
  getVendors,
} from "@/lib/api"

const PAYMENT_HISTORY_QUERY_KEY = "payment-logs"

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(input?: string): string {
  if (!input) return "-"
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function PaymentHistory() {
  const userId = getCurrentUserId()
  const [selectedVendor, setSelectedVendor] = useState<string>("all")
  const [selectedBill, setSelectedBill] = useState<string>("all")

  const vendorsQuery = useQuery({
    queryKey: ["vendors", userId],
    queryFn: () => getVendors(userId),
  })

  const vendorBillsQuery = useQuery({
    queryKey: ["vendor-bills", userId, selectedVendor],
    queryFn: () => getVendorBills(userId, selectedVendor),
    enabled: selectedVendor !== "all",
  })

  useEffect(() => {
    setSelectedBill("all")
  }, [selectedVendor])

  const paymentLogsQuery = useQuery({
    queryKey: [PAYMENT_HISTORY_QUERY_KEY, userId, selectedVendor, selectedBill],
    queryFn: async () => {
      if (selectedBill !== "all") {
        return getBillPaymentLogs(userId, selectedBill)
      }

      if (selectedVendor !== "all") {
        return getVendorPaymentLogs(userId, selectedVendor)
      }

      return getPaymentLogs(userId)
    },
  })

  const vendorNameById = useMemo(() => {
    const vendors = vendorsQuery.data ?? []
    return new Map(vendors.map((vendor) => [vendor.id, vendor.name]))
  }, [vendorsQuery.data])

  const logs = paymentLogsQuery.data ?? []
  const isLoading = paymentLogsQuery.isLoading || vendorsQuery.isLoading

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        Loading payment history...
      </div>
    )
  }

  if (paymentLogsQuery.isError) {
    const message =
      paymentLogsQuery.error instanceof ApiRequestError
        ? paymentLogsQuery.error.message
        : "Failed to load payment history"

    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        <p>{message}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void paymentLogsQuery.refetch()}
          className="mt-3 border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
          <SelectTrigger className="w-45 bg-secondary">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {(vendorsQuery.data ?? []).map((vendor) => (
              <SelectItem key={vendor.id} value={String(vendor.id)}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedBill}
          onValueChange={setSelectedBill}
          disabled={selectedVendor === "all" || vendorBillsQuery.isLoading}
        >
          <SelectTrigger className="w-45 bg-secondary">
            <SelectValue placeholder="All bills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bills</SelectItem>
            {(vendorBillsQuery.data ?? []).map((bill) => {
              const pending = asNumber(bill.total_amount) - asNumber(bill.paid_amount)

              return (
                <SelectItem key={bill.id} value={String(bill.id)}>
                  Bill #{bill.id} • ₹{Math.max(pending, 0).toLocaleString("en-IN")}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={() => void paymentLogsQuery.refetch()}
          className="border-border/50 bg-secondary"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", paymentLogsQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Vendor</TableHead>
              <TableHead className="text-muted-foreground">Bill</TableHead>
              <TableHead className="text-right text-muted-foreground">Amount Paid</TableHead>
              <TableHead className="text-muted-foreground">Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const mode = log.payment_mode.toLowerCase()

              return (
                <TableRow
                  key={log.id}
                  className="border-border/50 transition-colors hover:bg-secondary/50"
                >
                  <TableCell className="text-muted-foreground">{formatDate(log.payment_date)}</TableCell>
                  <TableCell className="font-medium text-card-foreground">
                    {vendorNameById.get(log.vendor_id) ?? `Vendor #${log.vendor_id}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">#{log.bill_id}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-400">
                    ₹{asNumber(log.amount_paid).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        mode === "cash" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                        mode === "upi" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                        mode === "cheque" && "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {log.payment_mode}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}

            {logs.length === 0 && (
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No payment logs found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
