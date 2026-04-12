export type ApiErrorResponse = {
  msg: string
}

export type AuthenticatedUser = {
  id: string
  email: string
  name?: string
}

export class ApiRequestError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
  }
}

export const AUTH_STORAGE_KEYS = {
  user: "user",
  token: "auth_token",
} as const

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
  updated_at?: string | null
  bill_url?: string | null
}

export type BackendBillItem = {
  bill_id?: string
  commodity_id: string
  supplied_ammount: number | string
  unit: string
  cost: number | string
  name: string
}

export type BackendBillWithItems = BackendBill & {
  items: BackendBillItem[]
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

export type AddBillCommodityPayload = {
  commodity_id: string
  supplied_ammount: number
  unit?: string
  cost: number
  name: string
}

export type AddBillPayload = {
  vendor_id: string
  total_amount: number
  paid_amount?: number
  bill_url?: string | null
  commodities: AddBillCommodityPayload[]
}

export type AddBillResponse = {
  success: boolean
  msg: string
  bill: BackendBill
  items: BackendBillItem[]
}

type RegisterResponse = {
  success: boolean
  msg: string
  user: {
    id: string | number
    name?: string
    email: string
  }
}

type LoginResponse = {
  success: boolean
  message: string
  token: string
  user?: {
    id: string | number
    name?: string
    email: string
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function readStorageItem(key: string): string | null {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
}

function parseStoredUser(raw: string | null): AuthenticatedUser | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthenticatedUser>
    const id = String(parsed.id ?? "").trim()
    const email = String(parsed.email ?? "").trim()

    if (!id || !email) {
      return null
    }

    return {
      id,
      email,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
    }
  } catch {
    return null
  }
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return atob(padded)
}

function decodeUserFromJwt(token: string): AuthenticatedUser | null {
  try {
    const tokenParts = token.split(".")
    if (tokenParts.length !== 3) {
      return null
    }

    const payloadJson = base64UrlDecode(tokenParts[1])
    const payload = JSON.parse(payloadJson) as {
      id?: string | number
      email?: string
      name?: string
    }

    const id = String(payload.id ?? "").trim()
    const email = String(payload.email ?? "").trim()
    if (!id || !email) {
      return null
    }

    return {
      id,
      email,
      name: typeof payload.name === "string" ? payload.name : undefined,
    }
  } catch {
    return null
  }
}

function normalizeApiUser(user: { id: string | number; email: string; name?: string }): AuthenticatedUser {
  return {
    id: String(user.id),
    email: user.email,
    name: typeof user.name === "string" ? user.name : undefined,
  }
}

function parseResponsePayload(rawText: string): unknown {
  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(rawText) as unknown
  } catch {
    return rawText
  }
}

function getErrorMessage(fallback: string, payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "msg" in payload &&
    typeof (payload as ApiErrorResponse).msg === "string"
  ) {
    return (payload as ApiErrorResponse).msg
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  return fallback
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {})
  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const token = getStoredAuthToken()
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const rawText = await response.text()
  const payload = parseResponsePayload(rawText)

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

export function getStoredUser(): AuthenticatedUser | null {
  return parseStoredUser(readStorageItem(AUTH_STORAGE_KEYS.user))
}

export function getStoredAuthToken(): string | null {
  const token = readStorageItem(AUTH_STORAGE_KEYS.token)
  if (!token) {
    return null
  }

  const trimmedToken = token.trim()
  return trimmedToken.length > 0 ? trimmedToken : null
}

export function persistAuthSession(user: AuthenticatedUser, token: string, rememberMe = true): void {
  if (!isBrowser()) {
    return
  }

  const userPayload = JSON.stringify(user)

  if (rememberMe) {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.user, userPayload)
    window.localStorage.setItem(AUTH_STORAGE_KEYS.token, token)
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.user)
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.token)
    return
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEYS.user, userPayload)
  window.sessionStorage.setItem(AUTH_STORAGE_KEYS.token, token)
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.user)
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.token)
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEYS.user)
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.token)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.user)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.token)
}

export async function registerUser(payload: {
  name: string
  email: string
  password: string
}): Promise<AuthenticatedUser> {
  const data = await request<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return normalizeApiUser(data.user)
}

export async function loginUser(payload: {
  email: string
  password: string
}): Promise<{ token: string; user: AuthenticatedUser }> {
  const data = await request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const user = data.user ? normalizeApiUser(data.user) : decodeUserFromJwt(data.token)
  if (!user) {
    throw new Error("Login response did not include a valid user profile.")
  }

  return {
    token: data.token,
    user,
  }
}

export function getCurrentUserId(): string {
  const storedUser = getStoredUser()
  if (storedUser?.id) {
    return storedUser.id
  }

  const fromEnv = String(import.meta.env.VITE_DEFAULT_USER_ID ?? "").trim()
  if (fromEnv.length > 0) {
    return fromEnv
  }

  throw new Error("Missing authenticated user. Login first or set VITE_DEFAULT_USER_ID in frontend/.env")
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

export async function getBills(userId: string): Promise<BackendBill[]> {
  return getListOrEmpty(async () => {
    const data = await request<{ bills: BackendBill[] }>(`/users/${userId}/bills`)
    return data.bills
  })
}

export async function getBillById(userId: string, billId: string): Promise<BackendBillWithItems> {
  const data = await request<{ bill: BackendBillWithItems }>(`/users/${userId}/bills/${billId}`)
  return data.bill
}

export async function addBill(userId: string, payload: AddBillPayload): Promise<AddBillResponse> {
  return request<AddBillResponse>(`/users/${userId}/bills`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateBill(
  userId: string,
  billId: string,
  payload: { paid_amount?: number; bill_url?: string | null }
): Promise<BackendBill> {
  const data = await request<{ success: boolean; msg: string; bill: BackendBill }>(
    `/users/${userId}/bills/${billId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  )

  return data.bill
}

export async function deleteBill(userId: string, billId: string): Promise<void> {
  await request<{ success: boolean; msg: string }>(`/users/${userId}/bills/${billId}`, {
    method: "DELETE",
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
