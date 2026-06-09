/** Normalize API base URL — handles trailing slashes and missing /api suffix */
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  let base = raw.trim().replace(/\/+$/, "")
  if (!base.endsWith("/api")) {
    base = `${base}/api`
  }
  return base
}

const BASE_URL = getBaseUrl()
// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("beno_token")
}

export const setToken = (token: string): void => {
  localStorage.setItem("beno_token", token)
}

export const removeToken = (): void => {
  localStorage.removeItem("beno_token")
  localStorage.removeItem("beno_user")
}

export const getStoredUser = () => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("beno_user")
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const setStoredUser = (user: object): void => {
  localStorage.setItem("beno_user", JSON.stringify(user))
}

// ─── Error class ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number
  data: unknown
  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function request<T>(endpoint: string, options: {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: object | FormData
  headers?: Record<string, string>
  isFormData?: boolean
} = {}): Promise<T> {
  const { method = "GET", body, headers = {}, isFormData = false } = options
  const token = getToken()

  const requestHeaders: Record<string, string> = {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body) {
    config.body = isFormData ? (body as FormData) : JSON.stringify(body)
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config)

  let data: unknown
  try { data = await res.json() } catch { data = null }

  if (res.status === 401) {
    const isAuthAttempt = /^\/auth\/(login|register)/.test(endpoint)
    if (!isAuthAttempt && getToken()) {
      removeToken()
      if (typeof window !== "undefined") window.location.href = "/"
      throw new ApiError("Session expired. Please login again.", 401)
    }
  }

  if (!res.ok) {
    const message = (data as { message?: string })?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

// ─── HTTP methods ─────────────────────────────────────────────────────────────
export const api = {
  get:    <T>(endpoint: string) =>
    request<T>(endpoint, { method: "GET" }),

  post:   <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, { method: "POST", body }),

  put:    <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, { method: "PUT", body }),

  patch:  <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, { method: "PATCH", body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: "POST", body: formData, isFormData: true }),
}

// ─── Prospects: Scoring & Tiering ─────────────────────────────────────────────

/**
 * Calculate and update score for a single prospect
 */
export const calculateProspectScore = (prospectId: string) =>
  api.post(`/prospects/${prospectId}/calculate-score`)

/**
 * Recalculate scores for all prospects (bulk re-tier)
 */
export const reTierAllAccounts = () =>
  api.post(`/prospects/re-tier`, {})

/**
 * Get detailed scoring breakdown for a prospect
 */
export const getScoreBreakdown = (prospectId: string) =>
  api.get(`/prospects/${prospectId}/score-breakdown`)

/**
 * Manually override tier assignment with audit trail
 */
export const overrideTier = (prospectId: string, data: {
  newTier: string
  reason: string
  overriddenBy?: string
}) =>
  api.put(`/prospects/${prospectId}/override-tier`, data)

/**
 * Get prospects filtered by tier (for dashboard filters)
 */
export const getProspectsByTier = (tier: string, page = 1, limit = 20) =>
  api.get(`/prospects?tier=${tier}&page=${page}&limit=${limit}`)

/**
 * Get prospects filtered by priority (for war room matrix)
 */
export const getProspectsByPriority = (priority: string, page = 1, limit = 20) =>
  api.get(`/prospects?priority=${priority}&page=${page}&limit=${limit}`)