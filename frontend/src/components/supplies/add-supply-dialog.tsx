"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { vendors, commodities } from "@/lib/mock-data"

interface AddSupplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSupplyDialog({ open, onOpenChange }: AddSupplyDialogProps) {
  const [formData, setFormData] = useState({
    vendorId: "",
    commodity: "",
    quantity: "",
    unit: "",
    rate: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to an API
    console.log("Submitting supply entry:", formData)
    onOpenChange(false)
    setFormData({
      vendorId: "",
      commodity: "",
      quantity: "",
      unit: "",
      rate: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  const totalAmount =
    Number(formData.quantity) * Number(formData.rate) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 bg-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-card-foreground">
            Add New Supply Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Select */}
          <div className="space-y-2">
            <Label htmlFor="vendor" className="text-card-foreground">
              Vendor
            </Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, vendorId: value }))
              }
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commodity Select */}
          <div className="space-y-2">
            <Label htmlFor="commodity" className="text-card-foreground">
              Commodity
            </Label>
            <Select
              value={formData.commodity}
              onValueChange={(value) => {
                const selectedCommodity = commodities.find(
                  (c) => c.name === value
                )
                setFormData((prev) => ({
                  ...prev,
                  commodity: value,
                  unit: selectedCommodity?.unit || "",
                }))
              }}
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select commodity..." />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((commodity) => (
                  <SelectItem key={commodity.id} value={commodity.name}>
                    {commodity.icon} {commodity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-card-foreground">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="bg-secondary font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-card-foreground">
                Unit
              </Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="kg, liters, etc."
                className="bg-secondary"
              />
            </div>
          </div>

          {/* Rate per Unit */}
          <div className="space-y-2">
            <Label htmlFor="rate" className="text-card-foreground">
              Rate per Unit (₹)
            </Label>
            <Input
              id="rate"
              type="number"
              placeholder="Enter rate"
              value={formData.rate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rate: e.target.value }))
              }
              className="bg-secondary font-mono"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-card-foreground">
              Date of Supply
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="bg-secondary pl-9"
              />
            </div>
          </div>

          {/* Total Amount Preview */}
          {totalAmount > 0 && (
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-mono text-2xl font-bold text-amber-400">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border/50 bg-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Add Supply Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
