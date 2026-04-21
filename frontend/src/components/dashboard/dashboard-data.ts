"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ApiRequestError,
  getCommodities,
  getCurrentUserId,
  getLowStockCommodities,
  getPaymentPriorityList,
  getSmartVendorRecommendation,
  getVendorBills,
  getVendorPayments,
  getVendors,
  type BackendBill,
  type BackendCommodity,
  type BackendPayment,
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

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [vendors, commodities, lowStockItems, paymentPriorities] = await Promise.all([
    getVendors(userId),
    getCommodities(userId),
    getLowStockCommodities(userId),
    getPaymentPriorityList(userId),
  ])

  const billsByVendor = new Map<string, BackendBill[]>()
  const paymentsByVendor = new Map<string, BackendPayment[]>()

  await Promise.all(
    vendors.map(async (vendor) => {
      const [bills, payments] = await Promise.all([
        getVendorBills(userId, vendor.id),
        getVendorPayments(userId, vendor.id),
      ])
      billsByVendor.set(vendor.id, bills)
      paymentsByVendor.set(vendor.id, payments)
    })
  )

  const vendorOutstanding = new Map<string, number>()
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

    for (const payment of payments) {
      const paymentDate = new Date(normalizeDate(payment.payment_date))
      allTransactions.push({
        id: `payment-${payment.id}`,
        type: "payment",
        vendorName: vendor.name,
        amount: toNumber(payment.amount),
        date: paymentDate.toISOString(),
        mode: payment.payment_mode,
      })
    }

    vendorOutstanding.set(vendor.id, outstanding)
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

  const lowStockCommodity = lowStockItems[0] ?? null

  let smartBuyRecommendation: SmartBuyRecommendation = null

  if (lowStockCommodity) {
    const smartVendorData = await getSmartVendorRecommendation(userId, lowStockCommodity.commodity_id)
    const recommendedVendor = smartVendorData.recommended_vendor
    const shortage = toNumber(lowStockCommodity.shortage)
    const currentQuantity = toNumber(lowStockCommodity.current_quantity)

    smartBuyRecommendation = {
      commodity: lowStockCommodity.commodity_name,
      stockLevel: currentQuantity,
      unit: "units",
      vendorName: recommendedVendor?.vendor_name ?? "No linked vendor",
      reason:
        recommendedVendor?.recommendation_reason ??
        `Short by ${shortage.toLocaleString("en-IN")} units. Link commodity to vendors for smarter recommendations.`,
    }
  }

  let smartPayRecommendation: SmartPayRecommendation = null

  const topPriorityVendor = paymentPriorities[0]
  if (topPriorityVendor) {
    const normalizedTolerance = String(topPriorityVendor.tolerance_level ?? "medium").toUpperCase()
    const toleranceLevel: "LOW" | "MEDIUM" | "HIGH" =
      normalizedTolerance === "LOW" || normalizedTolerance === "MEDIUM" || normalizedTolerance === "HIGH"
        ? normalizedTolerance
        : "MEDIUM"

    smartPayRecommendation = {
      vendorName: topPriorityVendor.vendor_name,
      outstandingAmount: toNumber(topPriorityVendor.pending_amount),
      toleranceLevel,
      daysSinceLastPayment: Math.max(toNumber(topPriorityVendor.days_waiting), 0),
    }
  }

  return {
    metrics: {
      totalOutstandingDebt,
      cashInHand: Math.max(totalInflow - totalOutflow, 0),
      activeVendors: vendors.length,
      lowStockAlerts: lowStockItems.length,
    },
    transactions: sortedTransactions,
    cashFlowData,
    debtDistribution,
    smartBuyRecommendation,
    smartPayRecommendation,
  }
}

export function useDashboardData() {
  const userId = useMemo(() => {
    try {
      return getCurrentUserId()
    } catch {
      return null
    }
  }, [])

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-data", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchDashboardData(String(userId)),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const data = dashboardQuery.data ?? DEFAULT_DASHBOARD_DATA

  const error = useMemo(() => {
    if (!userId) {
      return "Missing authenticated user. Login first."
    }
    if (!dashboardQuery.error) {
      return null
    }

    if (dashboardQuery.error instanceof ApiRequestError) {
      return dashboardQuery.error.message
    }
    if (dashboardQuery.error instanceof Error) {
      return dashboardQuery.error.message
    }

    return "Failed to load dashboard"
  }, [dashboardQuery.error, userId])

  const loading = dashboardQuery.isLoading

  const hasData = useMemo(() => {
    return (
      data.metrics.activeVendors > 0 ||
      data.transactions.length > 0 ||
      data.debtDistribution.length > 0
    )
  }, [data])

  return { data, loading, error, hasData }
}
