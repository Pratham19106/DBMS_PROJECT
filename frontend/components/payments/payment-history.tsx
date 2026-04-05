"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { recentTransactions } from "@/lib/mock-data"

const paymentTransactions = recentTransactions.filter((t) => t.type === "payment")

export function PaymentHistory() {
  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Date</TableHead>
            <TableHead className="text-muted-foreground">Vendor</TableHead>
            <TableHead className="text-right text-muted-foreground">Amount Paid</TableHead>
            <TableHead className="text-muted-foreground">Mode</TableHead>
            <TableHead className="text-right text-muted-foreground">Balance After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentTransactions.map((transaction) => (
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
              <TableCell className="text-right font-mono font-semibold text-emerald-400">
                ₹{transaction.amount.toLocaleString("en-IN")}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    transaction.mode === "Cash" &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                    transaction.mode === "UPI" &&
                      "border-blue-500/30 bg-blue-500/10 text-blue-400",
                    transaction.mode === "Cheque" &&
                      "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  )}
                >
                  {transaction.mode}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                ₹{transaction.balanceAfter.toLocaleString("en-IN")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
