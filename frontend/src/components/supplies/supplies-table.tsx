"use client"

import { useMemo, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ApiRequestError,
  getBillById,
  getBills,
  getCurrentUserId,
  getVendors,
  type BackendBillWithItems,
} from "@/lib/api"
import { AddBillDialog } from "./add-supply-dialog"

const SUPPLY_BILLS_QUERY_KEY = "supply-bills"

type SupplyHistoryRow = {
  id: string
  date?: string
  vendorName: string
  commodityName: string
  quantity: number
  unit: string
  unitPrice: number
  lineAmount: number
  balanceAfter: number
}

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getBalanceColor(balance: number) {
  if (balance < 5000) return "text-emerald-400"
  if (balance <= 15000) return "text-amber-400"
  return "text-red-400"
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

export function SuppliesTable() {
  const queryClient = useQueryClient()
  const userId = getCurrentUserId()
  const [dialogOpen, setDialogOpen] = useState(false)

  const vendorsQuery = useQuery({
    queryKey: ["vendors", userId],
    queryFn: () => getVendors(userId),
  })

  const billsQuery = useQuery({
    queryKey: [SUPPLY_BILLS_QUERY_KEY, userId],
    queryFn: async () => {
      const bills = await getBills(userId)
      const detailedBills = await Promise.all(
        bills.map(async (bill) => {
          try {
            return await getBillById(userId, bill.id)
          } catch (error) {
            if (error instanceof ApiRequestError && error.status === 404) {
              return null
            }
            throw error
          }
        })
      )

      return detailedBills.filter((bill): bill is BackendBillWithItems => bill !== null)
    },
  })

  const rows = useMemo(() => {
    const vendorNameById = new Map((vendorsQuery.data ?? []).map((vendor) => [vendor.id, vendor.name]))
    const bills = billsQuery.data ?? []

    return bills.flatMap((bill) => {
      const pendingAmount = Math.max(asNumber(bill.total_amount) - asNumber(bill.paid_amount), 0)
      const vendorName = vendorNameById.get(bill.vendor_id) ?? `Vendor #${bill.vendor_id}`

      if (!bill.items || bill.items.length === 0) {
        return [
          {
            id: `${bill.id}-empty`,
            date: bill.date,
            vendorName,
            commodityName: "-",
            quantity: 0,
            unit: "-",
            unitPrice: 0,
            lineAmount: asNumber(bill.total_amount),
            balanceAfter: pendingAmount,
          },
        ]
      }

      return bill.items.map((item, index) => {
        const quantity = asNumber(item.supplied_ammount)
        const lineAmount = asNumber(item.cost)
        const unitPrice = quantity > 0 ? Math.round(lineAmount / quantity) : 0

        return {
          id: `${bill.id}-${item.commodity_id}-${index}`,
          date: bill.date,
          vendorName,
          commodityName: item.name,
          quantity,
          unit: item.unit,
          unitPrice,
          lineAmount,
          balanceAfter: pendingAmount,
        }
      })
    })
  }, [billsQuery.data, vendorsQuery.data])

  const isLoading = billsQuery.isLoading || vendorsQuery.isLoading

  const isError = billsQuery.isError || vendorsQuery.isError
  const errorMessage =
    billsQuery.error instanceof ApiRequestError
      ? billsQuery.error.message
      : vendorsQuery.error instanceof ApiRequestError
        ? vendorsQuery.error.message
        : "Failed to load supply history"

  const handleBillCreated = async () => {
    await queryClient.invalidateQueries({ queryKey: [SUPPLY_BILLS_QUERY_KEY, userId] })
  }

  return (
    <>
      {/* Add Button */}
      <div className="mb-6 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void billsQuery.refetch()}
          className="border-border/50 bg-secondary"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", billsQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Bill
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Loading supply history...
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
          <p>{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void vendorsQuery.refetch()
              void billsQuery.refetch()
            }}
            className="mt-3 border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="rounded-lg border border-border/50 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Vendor</TableHead>
                <TableHead className="text-muted-foreground">Commodity</TableHead>
                <TableHead className="text-right text-muted-foreground">Quantity</TableHead>
                <TableHead className="text-right text-muted-foreground">Unit Price</TableHead>
                <TableHead className="text-right text-muted-foreground">Total Amount</TableHead>
                <TableHead className="text-right text-muted-foreground">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/50 transition-colors hover:bg-secondary/50"
                >
                  <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                  <TableCell className="font-medium text-card-foreground">{row.vendorName}</TableCell>
                  <TableCell className="text-card-foreground">{row.commodityName}</TableCell>
                  <TableCell className="text-right font-mono text-card-foreground">
                    {row.quantity > 0 ? `${row.quantity} ${row.unit}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    ₹{row.unitPrice.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-amber-400">
                    ₹{row.lineAmount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      getBalanceColor(row.balanceAfter)
                    )}
                  >
                    ₹{row.balanceAfter.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No supply bills found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Bill Dialog */}
      <AddBillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onBillCreated={handleBillCreated}
      />
    </>
  )
}
