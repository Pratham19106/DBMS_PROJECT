"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ApiRequestError,
  getCommodities,
  getCommodityVendors,
  getCurrentUserId,
  getVendorBills,
  getVendorPaymentLogs,
  getVendors,
  type BackendBill,
  type BackendCommodity,
  type BackendPaymentLog,
  type BackendVendor,
} from "@/lib/api"

export type DashboardMetrics = {
  totalOutstandingDebt: number
  cashInHand: number
  activeVendors: number
  lowStockAlerts: number
}

export type DashboardTransaction = {
  id: string
  type: "supply" | "payment"
  vendorName: string
  amount: number
  date: string
  commodity?: string
  quantity?: number
  mode?: string
}

export type CashFlowPoint = {
  date: string
  inflow: number
  outflow: number
}

export type DebtDistributionPoint = {
  name: string
  fullName: string
  balance: number
}

export type SmartBuyRecommendation = {
  commodity: string
  stockLevel: number
  unit: string
  vendorName: string
  reason: string
} | null

export type SmartPayRecommendation = {
  vendorName: string
  outstandingAmount: number
  toleranceLevel: "LOW" | "MEDIUM" | "HIGH"
  daysSinceLastPayment: number
} | null

export type DashboardData = {
  metrics: DashboardMetrics
  transactions: DashboardTransaction[]
  cashFlowData: CashFlowPoint[]
  debtDistribution: DebtDistributionPoint[]
  smartBuyRecommendation: SmartBuyRecommendation
  smartPayRecommendation: SmartPayRecommendation
}

const DEFAULT_DASHBOARD_DATA: DashboardData = {
  metrics: {
    totalOutstandingDebt: 0,
    cashInHand: 0,
    activeVendors: 0,
    lowStockAlerts: 0,
  },
  transactions: [],
  cashFlowData: [],
  debtDistribution: [],
  smartBuyRecommendation: null,
  smartPayRecommendation: null,
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeDate(value?: string): string {
  if (!value) return new Date().toISOString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function getToleranceLevel(daysSinceLastPayment: number): "LOW" | "MEDIUM" | "HIGH" {
  if (daysSinceLastPayment >= 14) return "LOW"
  if (daysSinceLastPayment >= 7) return "MEDIUM"
  return "HIGH"
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function buildLast30DaysFlow(transactions: DashboardTransaction[]): CashFlowPoint[] {
  const now = new Date()
  const days: Date[] = []

  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    days.push(date)
  }

  const seeded = new Map<string, CashFlowPoint>()
  for (const day of days) {
    const key = day.toISOString().slice(0, 10)
    seeded.set(key, {
      date: formatShortDate(day),
      inflow: 0,
      outflow: 0,
    })
  }

  for (const tx of transactions) {
    const txDate = new Date(tx.date)
    const key = txDate.toISOString().slice(0, 10)
    const point = seeded.get(key)
    if (!point) continue

    if (tx.type === "payment") {
      point.inflow += tx.amount
    } else {
      point.outflow += tx.amount
    }
  }

  return Array.from(seeded.values())
}

function buildDebtDistribution(vendors: BackendVendor[], balances: Map<string, number>): DebtDistributionPoint[] {
  return vendors
    .map((vendor) => ({
      name: vendor.name.split(" ")[0] ?? vendor.name,
      fullName: vendor.name,
      balance: balances.get(vendor.id) ?? 0,
    }))
    .sort((a, b) => b.balance - a.balance)
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(DEFAULT_DASHBOARD_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const userId = getCurrentUserId()

        const [vendors, commodities] = await Promise.all([
          getVendors(userId),
          getCommodities(userId),
        ])

        const billsByVendor = new Map<string, BackendBill[]>()
        const paymentsByVendor = new Map<string, BackendPaymentLog[]>()

        await Promise.all(
          vendors.map(async (vendor) => {
            const [bills, payments] = await Promise.all([
              getVendorBills(userId, vendor.id),
              getVendorPaymentLogs(userId, vendor.id),
            ])
            billsByVendor.set(vendor.id, bills)
            paymentsByVendor.set(vendor.id, payments)
          })
        )

        const vendorOutstanding = new Map<string, number>()
        const latestPaymentDateByVendor = new Map<string, Date | null>()
        const allTransactions: DashboardTransaction[] = []

        for (const vendor of vendors) {
          const bills = billsByVendor.get(vendor.id) ?? []
          const payments = paymentsByVendor.get(vendor.id) ?? []

          let outstanding = 0

          for (const bill of bills) {
            const total = toNumber(bill.total_amount)
            const paid = toNumber(bill.paid_amount)
            const due = Math.max(total - paid, 0)
            outstanding += due

            allTransactions.push({
              id: `bill-${bill.id}`,
              type: "supply",
              vendorName: vendor.name,
              amount: total,
              date: normalizeDate(bill.date),
              commodity: "Supply Bill",
            })
          }

          let latestPaymentDate: Date | null = null

          for (const payment of payments) {
            const paymentDate = new Date(normalizeDate(payment.payment_date))
            if (!latestPaymentDate || paymentDate > latestPaymentDate) {
              latestPaymentDate = paymentDate
            }

            allTransactions.push({
              id: `payment-${payment.id}`,
              type: "payment",
              vendorName: vendor.name,
              amount: toNumber(payment.amount_paid),
              date: paymentDate.toISOString(),
              mode: payment.payment_mode,
            })
          }

          vendorOutstanding.set(vendor.id, outstanding)
          latestPaymentDateByVendor.set(vendor.id, latestPaymentDate)
        }

        const sortedTransactions = allTransactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)

        const cashFlowData = buildLast30DaysFlow(allTransactions)
        const totalInflow = cashFlowData.reduce((sum, item) => sum + item.inflow, 0)
        const totalOutflow = cashFlowData.reduce((sum, item) => sum + item.outflow, 0)

        const totalOutstandingDebt = Array.from(vendorOutstanding.values()).reduce(
          (sum, value) => sum + value,
          0
        )

        const debtDistribution = buildDebtDistribution(vendors, vendorOutstanding)

        const lowStockCommodity = [...commodities]
          .sort((a, b) => a.quantity - b.quantity)
          .find((commodity) => commodity.quantity <= 10)

        let smartBuyRecommendation: SmartBuyRecommendation = null

        if (lowStockCommodity) {
          const commodityVendors = await getCommodityVendors(userId, lowStockCommodity.id)
          const bestVendor = [...commodityVendors].sort(
            (a, b) => (vendorOutstanding.get(a.id) ?? 0) - (vendorOutstanding.get(b.id) ?? 0)
          )[0]

          smartBuyRecommendation = {
            commodity: lowStockCommodity.name,
            stockLevel: lowStockCommodity.quantity,
            unit: lowStockCommodity.unit,
            vendorName: bestVendor?.name ?? "No linked vendor",
            reason: bestVendor
              ? "Lowest outstanding balance among linked vendors"
              : "Link this commodity to a vendor for better recommendations",
          }
        }

        const topDebtVendor = [...vendors].sort(
          (a, b) => (vendorOutstanding.get(b.id) ?? 0) - (vendorOutstanding.get(a.id) ?? 0)
        )[0]

        let smartPayRecommendation: SmartPayRecommendation = null

        if (topDebtVendor) {
          const latestPaymentDate = latestPaymentDateByVendor.get(topDebtVendor.id)
          const daysSinceLastPayment = latestPaymentDate
            ? Math.max(
                0,
                Math.floor((Date.now() - latestPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
              )
            : 30

          smartPayRecommendation = {
            vendorName: topDebtVendor.name,
            outstandingAmount: vendorOutstanding.get(topDebtVendor.id) ?? 0,
            toleranceLevel: getToleranceLevel(daysSinceLastPayment),
            daysSinceLastPayment,
          }
        }

        if (!ignore) {
          setData({
            metrics: {
              totalOutstandingDebt,
              cashInHand: Math.max(totalInflow - totalOutflow, 0),
              activeVendors: vendors.length,
              lowStockAlerts: commodities.filter((commodity) => commodity.quantity <= 10).length,
            },
            transactions: sortedTransactions,
            cashFlowData,
            debtDistribution,
            smartBuyRecommendation,
            smartPayRecommendation,
          })
        }
      } catch (loadError) {
        if (ignore) return
        const message =
          loadError instanceof ApiRequestError
            ? loadError.message
            : loadError instanceof Error
              ? loadError.message
              : "Failed to load dashboard"
        setError(message)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [])

  const hasData = useMemo(() => {
    return (
      data.metrics.activeVendors > 0 ||
      data.transactions.length > 0 ||
      data.debtDistribution.length > 0
    )
  }, [data])

  return { data, loading, error, hasData }
}
