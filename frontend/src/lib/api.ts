export type ApiErrorResponse = {
  msg: string
}

export class ApiRequestError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
  }
}

export type BackendVendor = {
  id: string
  user_id: string
  name: string
  phone_number: string
}

export type BackendCommodity = {
  id: string
  user_id: string
  name: string
  quantity: number
  unit: string
}

export type BackendBill = {
  id: string
  vendor_id: string
  user_id: string
  total_amount: number | string
  paid_amount: number | string
  status: string
  date?: string
}

export type BackendPaymentLog = {
  id: string
  user_id: string
  vendor_id: string
  bill_id: string
  amount_paid: number | string
  payment_mode: string
  payment_date?: string
}

export type BackendPaymentSuggestionVendor = {
  id: string
  name: string
  phone_number: string
  pending_amount: number | string
  oldest_bill_date: string | null
  unpaid_bill_count: number | string
}

export type AddPaymentLogPayload = {
  vendor_id: string
  bill_id: string
  amount_paid: number
  payment_mode: string
}

export type AddPaymentLogResponse = {
  success: boolean
  msg: string
  payment_log: BackendPaymentLog
  bill: BackendBill
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

function getErrorMessage(fallback: string, payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "msg" in payload &&
    typeof (payload as ApiErrorResponse).msg === "string"
  ) {
    return (payload as ApiErrorResponse).msg
  }

  return fallback
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const rawText = await response.text()
  const payload = rawText ? (JSON.parse(rawText) as unknown) : null

  if (!response.ok) {
    const message = getErrorMessage(`Request failed with status ${response.status}`, payload)
    throw new ApiRequestError(response.status, message)
  }

  return payload as T
}

async function getListOrEmpty<T>(loader: () => Promise<T[]>): Promise<T[]> {
  try {
    return await loader()
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return []
    }

    throw error
  }
}

export function getCurrentUserId(): string {
  const fromEnv = String(import.meta.env.VITE_DEFAULT_USER_ID ?? "").trim()
  if (fromEnv.length > 0) {
    return fromEnv
  }

  throw new Error("Missing VITE_DEFAULT_USER_ID in react_frontend/.env")
}

export async function getVendors(userId: string): Promise<BackendVendor[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ vendors: BackendVendor[] }>(`/users/${userId}/vendors`)
    return data.vendors
  })
}

export async function addVendor(
  userId: string,
  payload: { name: string; phone_number: string }
): Promise<BackendVendor> {
  const data = await request<{ vendor: BackendVendor }>(`/users/${userId}/vendors`, {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return data.vendor
}

export async function updateVendor(
  userId: string,
  vendorId: string,
  payload: { name?: string; phone_number?: string }
): Promise<void> {
  await request<{ success: boolean; msg: string }>(`/users/${userId}/vendors/${vendorId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteVendor(userId: string, vendorId: string): Promise<void> {
  await request<{ success: boolean; msg: string }>(`/users/${userId}/vendors/${vendorId}`, {
    method: "DELETE",
  })
}

export async function getVendorCommodities(userId: string, vendorId: string): Promise<BackendCommodity[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ commodities: BackendCommodity[] }>(`/users/${userId}/vendors/${vendorId}/commodities`)
    return data.commodities
  })
}

export async function getVendorBills(userId: string, vendorId: string): Promise<BackendBill[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ bills: BackendBill[] }>(`/users/${userId}/vendors/${vendorId}/bills`)
    return data.bills
  })
}

export async function getVendorPaymentLogs(userId: string, vendorId: string): Promise<BackendPaymentLog[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ payment_logs: BackendPaymentLog[] }>(
      `/users/${userId}/vendors/${vendorId}/payment-logs`
    )
    return data.payment_logs
  })
}

export async function getPaymentLogs(userId: string): Promise<BackendPaymentLog[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ payment_logs: BackendPaymentLog[] }>(`/users/${userId}/payment-logs`)
    return data.payment_logs
  })
}

export async function getBillPaymentLogs(userId: string, billId: string): Promise<BackendPaymentLog[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ payment_logs: BackendPaymentLog[] }>(
      `/users/${userId}/bills/${billId}/payment-logs`
    )
    return data.payment_logs
  })
}

export async function addPaymentLog(
  userId: string,
  payload: AddPaymentLogPayload
): Promise<AddPaymentLogResponse> {
  return request<AddPaymentLogResponse>(`/users/${userId}/payment-logs`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getPaymentSuggestion(
  userId: string
): Promise<BackendPaymentSuggestionVendor[]> {
  return getListOrEmpty(async () => {
    const data = await request<{
      suggested_vendor?: BackendPaymentSuggestionVendor
      all_pending_vendors?: BackendPaymentSuggestionVendor[]
      vendors?: BackendPaymentSuggestionVendor[]
      msg?: string
    }>(`/users/${userId}/payment-suggestion`)

    if (Array.isArray(data.all_pending_vendors)) {
      return data.all_pending_vendors
    }

    if (Array.isArray(data.vendors)) {
      return data.vendors
    }

    return []
  })
}

export async function getCommodities(userId: string): Promise<BackendCommodity[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ commodities: BackendCommodity[] }>(`/users/${userId}/commodities`)
    return data.commodities
  })
}

export async function addCommodity(
  userId: string,
  payload: { name: string; quantity: number; unit: string }
): Promise<BackendCommodity> {
  const data = await request<{ success: boolean; commodity: BackendCommodity }>(
    `/users/${userId}/commodities`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )

  return data.commodity
}

export async function getCommodityVendors(userId: string, commodityId: string): Promise<BackendVendor[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ vendors: BackendVendor[] }>(
      `/users/${userId}/commodities/${commodityId}/vendors`
    )
    return data.vendors
  })
}

export async function linkCommodityToVendor(
  userId: string,
  vendorId: string,
  commodityId: string
): Promise<void> {
  const normalizedCommodityId = String(commodityId ?? "").trim()
  if (!normalizedCommodityId) {
    throw new Error(`commodityId is required (received: ${String(commodityId)})`)
  }

  await request<{ success: boolean; msg: string }>(`/users/${userId}/vendors/${vendorId}/commodities`, {
    method: "POST",
    body: JSON.stringify({
      commodity_id: normalizedCommodityId,
      commodityId: normalizedCommodityId,
    }),
  })
}

export async function unlinkCommodityFromVendor(
  userId: string,
  vendorId: string,
  commodityId: string
): Promise<void> {
  await request<{ success: boolean; msg: string }>(
    `/users/${userId}/vendors/${vendorId}/commodities/${commodityId}`,
    {
      method: "DELETE",
    }
  )
}
