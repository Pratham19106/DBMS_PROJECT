"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
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
import { recentTransactions } from "@/lib/mock-data"
import { AddSupplyDialog } from "./add-supply-dialog"

const supplyTransactions = recentTransactions.filter((t) => t.type === "supply")

function getBalanceColor(balance: number) {
  if (balance < 5000) return "text-emerald-400"
  if (balance <= 15000) return "text-amber-400"
  return "text-red-400"
}

export function SuppliesTable() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      {/* Add Button */}
      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Supply Entry
        </Button>
      </div>

      {/* Table */}
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
            {supplyTransactions.map((transaction) => {
              const unitPrice = transaction.quantity
                ? Math.round(transaction.amount / transaction.quantity)
                : 0

              return (
                <TableRow
                  key={transaction.id}
                  className="border-border/50 transition-colors hover:bg-secondary/50"
                >
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">
                    {transaction.vendorName}
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {transaction.commodity}
                  </TableCell>
                  <TableCell className="text-right font-mono text-card-foreground">
                    {transaction.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    ₹{unitPrice.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-amber-400">
                    ₹{transaction.amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      getBalanceColor(transaction.balanceAfter)
                    )}
                  >
                    ₹{transaction.balanceAfter.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Supply Dialog */}
      <AddSupplyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
