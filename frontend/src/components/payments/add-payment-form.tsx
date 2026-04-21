"use client"

import { type FormEvent, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { IndianRupee, PlusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addPayment,
  ApiRequestError,
  type BackendBill,
  getCurrentUserId,
  getVendorBills,
  getVendors,
} from "@/lib/api"

function asNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function pendingAmount(bill: BackendBill): number {
  return Math.max(asNumber(bill.total_amount) - asNumber(bill.paid_amount), 0)
}

function shortBillId(id: string): string {
  return String(id).slice(-6).toUpperCase()
}

export function AddPaymentForm() {
  const queryClient = useQueryClient()
  const userId = getCurrentUserId()

  const [vendorId, setVendorId] = useState<string>("none")
  const [billId, setBillId] = useState<string>("none")
  const [amount, setAmount] = useState<string>("")
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("upi")
  const [errorText, setErrorText] = useState<string | null>(null)
  const [successText, setSuccessText] = useState<string | null>(null)

  const vendorsQuery = useQuery({
    queryKey: ["vendors", userId],
    queryFn: () => getVendors(userId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const vendorBillsQuery = useQuery({
    queryKey: ["vendor-bills", userId, vendorId],
    enabled: vendorId !== "none",
    queryFn: () => getVendorBills(userId, vendorId),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const unpaidBills = useMemo(() => {
    return (vendorBillsQuery.data ?? []).filter((bill) => pendingAmount(bill) > 0)
  }, [vendorBillsQuery.data])

  const addPaymentMutation = useMutation({
    mutationFn: (payload: { vendorId: string; billId: string; amount: number; paymentMode: "cash" | "upi" }) =>
      addPayment(userId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments", userId] }),
        queryClient.invalidateQueries({ queryKey: ["vendor-bills", userId] }),
        queryClient.invalidateQueries({ queryKey: ["payment-suggestion", userId] }),
        queryClient.invalidateQueries({ queryKey: ["payment-suggestion-bills", userId] }),
        queryClient.invalidateQueries({ queryKey: ["daily-paid-entries", userId] }),
        queryClient.invalidateQueries({ queryKey: ["vendors-hydrated", userId] }),
      ])
    },
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorText(null)
    setSuccessText(null)

    if (vendorId === "none" || billId === "none") {
      setErrorText("Please select a vendor and bill")
      return
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorText("Amount must be greater than 0")
      return
    }

    const selectedBill = unpaidBills.find((bill) => bill.id === billId)
    if (selectedBill) {
      const pending = pendingAmount(selectedBill)
      if (numericAmount > pending) {
        setErrorText(`Amount exceeds pending bill amount (₹${pending.toLocaleString("en-IN")})`)
        return
      }
    }

    try {
      await addPaymentMutation.mutateAsync({
        vendorId,
        billId,
        amount: numericAmount,
        paymentMode,
      })
      setSuccessText("Payment added successfully")
      setAmount("")
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : "Failed to add payment"
      setErrorText(message)
    }
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
          <PlusCircle className="h-5 w-5 text-forest" />
          Add New Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-1">
            <Select
              value={vendorId}
              onValueChange={(value) => {
                setVendorId(value)
                setBillId("none")
              }}
              disabled={vendorsQuery.isLoading}
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Vendor</SelectItem>
                {(vendorsQuery.data ?? []).map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <Select
              value={billId}
              onValueChange={setBillId}
              disabled={vendorId === "none" || vendorBillsQuery.isLoading}
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select bill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Bill</SelectItem>
                {unpaidBills.map((bill) => (
                  <SelectItem key={bill.id} value={bill.id}>
                    #{shortBillId(bill.id)} • Pending ₹{pendingAmount(bill).toLocaleString("en-IN")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative md:col-span-1">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="Amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="bg-secondary pl-9"
            />
          </div>

          <div className="md:col-span-1">
            <Select value={paymentMode} onValueChange={(value: "cash" | "upi") => setPaymentMode(value)}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={addPaymentMutation.isPending}
            className="md:col-span-1 bg-forest text-cream hover:bg-forest-deep"
          >
            {addPaymentMutation.isPending ? "Adding..." : "Add Payment"}
          </Button>
        </form>

        {errorText && (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </div>
        )}

        {successText && (
          <div className="mt-3 rounded-md border border-forest/30 bg-forest/10 px-3 py-2 text-sm text-forest">
            {successText}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
