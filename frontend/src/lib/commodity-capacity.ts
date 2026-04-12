import type { BackendCommodity } from "@/lib/api"

const COMMODITY_TOTALS_KEY = "commodity_total_quantities_v1"

type CommodityTotalsStore = Record<string, Record<string, number>>

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function readStore(): CommodityTotalsStore {
  if (!isBrowser()) {
    return {}
  }

  const raw = window.localStorage.getItem(COMMODITY_TOTALS_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) {
      return {}
    }
    return parsed as CommodityTotalsStore
  } catch {
    return {}
  }
}

function writeStore(store: CommodityTotalsStore): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(COMMODITY_TOTALS_KEY, JSON.stringify(store))
}

export function getCommodityTotalsByUser(userId: string): Record<string, number> {
  const store = readStore()
  return store[userId] ?? {}
}

export function upsertCommodityTotalQuantity(
  userId: string,
  commodityId: string,
  totalQuantity: number
): void {
  const normalizedTotal = Math.max(Number(totalQuantity) || 0, 0)
  const store = readStore()
  const userTotals = { ...(store[userId] ?? {}) }
  userTotals[commodityId] = normalizedTotal
  store[userId] = userTotals
  writeStore(store)
}

export function updateTotalsFromCommodities(
  userId: string,
  commodities: BackendCommodity[]
): Record<string, number> {
  const store = readStore()
  const userTotals = { ...(store[userId] ?? {}) }

  for (const commodity of commodities) {
    const currentQty = Math.max(Number(commodity.quantity) || 0, 0)
    const existingTotal = Math.max(Number(userTotals[commodity.id] ?? 0), 0)

    // Keep total as the max quantity reached so far.
    userTotals[commodity.id] = Math.max(existingTotal, currentQty)
  }

  store[userId] = userTotals
  writeStore(store)
  return userTotals
}