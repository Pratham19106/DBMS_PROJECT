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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  fullBillId: string
  date?: string
  vendorName: string
  itemCount: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  status: string
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
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)

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

    return bills.map((bill) => {
      const totalAmount = asNumber(bill.total_amount)
      const paidAmount = asNumber(bill.paid_amount)
      const pendingAmount = Math.max(totalAmount - paidAmount, 0)
      const vendorName = vendorNameById.get(bill.vendor_id) ?? `Vendor #${bill.vendor_id}`
      const itemCount = Array.isArray(bill.items) ? bill.items.length : 0

      return {
        id: String(bill.id).slice(-6).toUpperCase(),
        fullBillId: bill.id,
        date: bill.date,
        vendorName,
        itemCount,
        totalAmount,
        paidAmount,
        pendingAmount,
        status: bill.status,
      }
    })
  }, [billsQuery.data, vendorsQuery.data])

  const selectedBill = useMemo(() => {
    if (!selectedBillId) return null
    return (billsQuery.data ?? []).find((bill) => bill.id === selectedBillId) ?? null
  }, [billsQuery.data, selectedBillId])

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
                <TableHead className="text-muted-foreground">Bill ID</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Vendor</TableHead>
                <TableHead className="text-right text-muted-foreground">Items</TableHead>
                <TableHead className="text-right text-muted-foreground">Total Amount</TableHead>
                <TableHead className="text-right text-muted-foreground">Paid</TableHead>
                <TableHead className="text-right text-muted-foreground">Pending</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.fullBillId}
                  onClick={() => setSelectedBillId(row.fullBillId)}
                  className="cursor-pointer border-border/50 transition-colors hover:bg-secondary/50"
                >
                  <TableCell className="font-mono font-semibold text-card-foreground">#{row.id}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                  <TableCell className="font-medium text-card-foreground">{row.vendorName}</TableCell>
                  <TableCell className="text-right font-mono text-card-foreground">{row.itemCount}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-amber-400">
                    ₹{row.totalAmount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-400">
                    ₹{row.paidAmount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      getBalanceColor(row.pendingAmount)
                    )}
                  >
                    ₹{row.pendingAmount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No supply bills found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={selectedBillId !== null} onOpenChange={(open) => !open && setSelectedBillId(null)}>
        <DialogContent className="h-[85vh] w-[94vw] max-w-none overflow-hidden border-border/50 bg-card p-0 sm:w-[90vw] lg:w-[84vw] lg:max-w-245">
          {selectedBill && (
            <div className="flex h-full min-h-0 flex-col">
              <DialogHeader className="border-b border-border/50 px-6 py-4 text-left">
                <DialogTitle className="text-xl text-card-foreground">
                  Bill #{String(selectedBill.id).slice(-6).toUpperCase()}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedBill.date)} • {(vendorsQuery.data ?? []).find((v) => v.id === selectedBill.vendor_id)?.name ?? `Vendor #${selectedBill.vendor_id}`}
                </p>
              </DialogHeader>

              <div className="bill-modal-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div className="mb-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-mono font-semibold text-amber-300">₹{asNumber(selectedBill.total_amount).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-mono font-semibold text-emerald-300">₹{asNumber(selectedBill.paid_amount).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="font-mono font-semibold text-card-foreground">₹{Math.max(asNumber(selectedBill.total_amount) - asNumber(selectedBill.paid_amount), 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize text-card-foreground">{selectedBill.status}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Commodity</TableHead>
                        <TableHead className="text-right text-muted-foreground">Quantity</TableHead>
                        <TableHead className="text-right text-muted-foreground">Unit Price</TableHead>
                        <TableHead className="text-right text-muted-foreground">Line Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedBill.items ?? []).map((item, index) => {
                        const quantity = asNumber(item.supplied_ammount)
                        const lineAmount = asNumber(item.cost)
                        const unitPrice = quantity > 0 ? Math.round(lineAmount / quantity) : 0

                        return (
                          <TableRow key={`${item.commodity_id}-${index}`} className="border-border/50">
                            <TableCell className="text-card-foreground">{item.name}</TableCell>
                            <TableCell className="text-right font-mono text-card-foreground">{quantity} {item.unit}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">₹{unitPrice.toLocaleString("en-IN")}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-amber-400">₹{lineAmount.toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        )
                      })}

                      {(selectedBill.items ?? []).length === 0 && (
                        <TableRow className="border-border/50">
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                            No bill items found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bill Dialog */}
      <AddBillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onBillCreated={handleBillCreated}
      />
    </>
  )
}
