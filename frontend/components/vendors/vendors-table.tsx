"use client"

import { useState } from "react"
import { Eye, Wallet, Truck, Search, Filter } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Vendor, ToleranceLevel } from "@/lib/mock-data"
import { vendors as allVendors, commodities } from "@/lib/mock-data"
import { VendorDrawer } from "./vendor-drawer"

const allCommodities = [...new Set(allVendors.flatMap((v) => v.commodities))]

function getBalanceColor(balance: number) {
  if (balance < 5000) return "text-emerald-400"
  if (balance <= 15000) return "text-amber-400"
  return "text-red-400"
}

export function VendorsTable() {
  const [search, setSearch] = useState("")
  const [commodityFilter, setCommodityFilter] = useState<string>("all")
  const [toleranceFilter, setToleranceFilter] = useState<string>("all")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredVendors = allVendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.commodities.some((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      )
    const matchesCommodity =
      commodityFilter === "all" ||
      vendor.commodities.includes(commodityFilter)
    const matchesTolerance =
      toleranceFilter === "all" || vendor.toleranceLevel === toleranceFilter

    return matchesSearch && matchesCommodity && matchesTolerance
  })

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setDrawerOpen(true)
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors or commodities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={commodityFilter} onValueChange={setCommodityFilter}>
            <SelectTrigger className="w-[150px] bg-secondary">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commodities</SelectItem>
              {allCommodities.map((commodity) => (
                <SelectItem key={commodity} value={commodity}>
                  {commodity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={toleranceFilter} onValueChange={setToleranceFilter}>
            <SelectTrigger className="w-[150px] bg-secondary">
              <SelectValue placeholder="Tolerance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Vendor Name</TableHead>
              <TableHead className="text-muted-foreground">Commodities</TableHead>
              <TableHead className="text-right text-muted-foreground">Outstanding</TableHead>
              <TableHead className="text-muted-foreground">Tolerance</TableHead>
              <TableHead className="text-muted-foreground">Flexibility</TableHead>
              <TableHead className="text-muted-foreground">Last Supply</TableHead>
              <TableHead className="text-muted-foreground">Last Payment</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => (
              <TableRow
                key={vendor.id}
                className="cursor-pointer border-border/50 transition-colors hover:bg-secondary/50"
                onClick={() => handleViewVendor(vendor)}
              >
                <TableCell className="font-medium text-card-foreground">
                  {vendor.name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.commodities.map((commodity) => (
                      <Badge
                        key={commodity}
                        variant="secondary"
                        className="bg-secondary/80 text-xs"
                      >
                        {commodity}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono font-semibold",
                    getBalanceColor(vendor.outstandingBalance)
                  )}
                >
                  ₹{vendor.outstandingBalance.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      vendor.flexibility === "STRICT" &&
                        "border-red-500/30 bg-red-500/10 text-red-400",
                      vendor.flexibility === "MODERATE" &&
                        "border-amber-500/30 bg-amber-500/10 text-amber-400",
                      vendor.flexibility === "FLEXIBLE" &&
                        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    )}
                  >
                    {vendor.flexibility}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(vendor.lastSupplyDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(vendor.lastPaymentDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewVendor(vendor)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Wallet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Truck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vendor Drawer */}
      <VendorDrawer
        vendor={selectedVendor}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
