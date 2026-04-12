"use client"

import { useEffect, useState } from "react"
import { Pencil, Phone, Trash2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ApiRequestError,
  type BackendBill,
  type BackendCommodity,
  type BackendPaymentLog,
} from "@/lib/api"
import { VendorCommodityManager } from "./vendor-commodity-manager"

function shortBillId(id: string): string {
  return String(id).slice(-6).toUpperCase()
}

type UiVendor = {
  id: string
  name: string
  contact: string
  commodities: BackendCommodity[]
  outstandingBalance: number
  toleranceLevel: "LOW" | "MEDIUM" | "HIGH"
  bills: BackendBill[]
  payments: BackendPaymentLog[]
}

interface VendorDrawerProps {
  vendor: UiVendor | null
  userId: string
  open: boolean
  onClose: () => void
  onUpdateVendor: (vendorId: string, payload: { name: string; phone_number: string }) => Promise<void>
  onDeleteVendor: (vendorId: string) => Promise<void>
  onCommodityChanged: () => Promise<void>
}

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

export function VendorDrawer({
  vendor,
  userId,
  open,
  onClose,
  onUpdateVendor,
  onDeleteVendor,
  onCommodityChanged,
}: VendorDrawerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!vendor) return
    setName(vendor.name)
    setPhone(vendor.contact)
    setSaveError(null)
    setDeleteError(null)
    setIsEditing(false)
  }, [vendor])

  if (!vendor) return null

  const handleSave = async () => {
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName || !trimmedPhone) {
      setSaveError("Name and phone number are required")
      return
    }

    try {
      setSaving(true)
      setSaveError(null)
      await onUpdateVendor(vendor.id, {
        name: trimmedName,
        phone_number: trimmedPhone,
      })
      setIsEditing(false)
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to update vendor"
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const shouldDelete = window.confirm(
      `Delete ${vendor.name}? This cannot be undone.`
    )
    if (!shouldDelete) return

    try {
      setDeleting(true)
      setDeleteError(null)
      await onDeleteVendor(vendor.id)
      onClose()
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to delete vendor"
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/45 backdrop-blur-md"
        className="h-[90vh] w-11/12 sm:w-11/12 sm:max-w-none overflow-hidden border-border/50 bg-card p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-border/50 px-6 py-5 text-left">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-card-foreground">
                  {vendor.name}
                </DialogTitle>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {vendor.contact}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setName(vendor.name)
                    setPhone(vendor.contact)
                    setSaveError(null)
                    setIsEditing((prev) => !prev)
                  }}
                  className="border-border/50 bg-secondary"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {isEditing ? "Cancel Edit" : "Edit Vendor"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete Vendor"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
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
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
                Outstanding: ₹{vendor.outstandingBalance.toLocaleString("en-IN")}
              </Badge>
            </div>

            {isEditing && (
              <div className="mt-4 rounded-lg border border-border/50 bg-secondary/20 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-vendor-name">Vendor Name</Label>
                    <Input
                      id="edit-vendor-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-vendor-phone">Phone Number</Label>
                    <Input
                      id="edit-vendor-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {saveError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                {saveError}
              </div>
            )}

            {deleteError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                {deleteError}
              </div>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-0 [scrollbar-width:thin] [scrollbar-color:var(--sidebar-border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border/80">
            <div className="space-y-6 px-6 py-5">
              <section className="grid items-start gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Active Commodities
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Currently linked commodities for this vendor.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {vendor.commodities.map((commodity) => (
                      <Card key={commodity.id} className="border-border/50 bg-card/60 py-0">
                        <CardContent className="px-3 py-3">
                          <p className="truncate text-sm font-medium text-card-foreground">{commodity.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {commodity.quantity} {commodity.unit}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {vendor.commodities.length === 0 && (
                      <p className="text-sm text-muted-foreground">No commodities linked yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Add and Assign Commodities
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose existing commodities or create a new one and assign it.
                  </p>
                  <div className="mt-3">
                    <VendorCommodityManager
                      userId={userId}
                      vendorId={vendor.id}
                      linkedCommodities={vendor.commodities}
                      onChanged={onCommodityChanged}
                      showLinkedActions={false}
                      compact
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <ScrollArea className="h-72 pr-2 **:data-[slot=scroll-area-scrollbar]:w-2 **:data-[slot=scroll-area-thumb]:bg-sidebar-border">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Payments To Vendor
                      </h3>
                      <div className="mt-3 space-y-2">
                        {vendor.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="rounded-lg border border-border/50 bg-card/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-card-foreground">
                                {payment.payment_mode.toUpperCase()} payment
                              </p>
                              <p className="font-mono text-sm text-red-300">
                                -₹{asNumber(payment.amount_paid).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(payment.payment_date)}</span>
                              <span>Bill #{shortBillId(payment.bill_id)}</span>
                            </div>
                          </div>
                        ))}
                        {vendor.payments.length === 0 && (
                          <p className="text-sm text-muted-foreground">No payments found for this vendor.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Supplies By Vendor
                      </h3>
                      <div className="mt-3 space-y-2">
                        {vendor.bills.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-lg border border-border/50 bg-card/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-card-foreground">Bill #{shortBillId(entry.id)}</p>
                              <p className="font-mono text-sm text-emerald-400">
                                ₹{asNumber(entry.total_amount).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(entry.date)}</span>
                              <span>
                                Pending ₹
                                {Math.max(
                                  asNumber(entry.total_amount) - asNumber(entry.paid_amount),
                                  0
                                ).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ))}
                        {vendor.bills.length === 0 && (
                          <p className="text-sm text-muted-foreground">No supplies found for this vendor.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
