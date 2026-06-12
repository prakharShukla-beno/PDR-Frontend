const DEFAULT_BACKEND = "http://localhost:5000"

/** Backend origin without /api suffix */
export function getDirectBackendUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    DEFAULT_BACKEND
  return raw.trim().replace(/\/+$/, "")
}

function toApiBase(origin: string): string {
  const base = origin.trim().replace(/\/+$/, "")
  return base.endsWith("/api") ? base : `${base}/api`
}

/** Regular JSON API — browser uses Next.js proxy; SSR uses BACKEND_URL */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return "/api"
  return toApiBase(
    process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      DEFAULT_BACKEND
  )
}

/**
 * File uploads — always hit backend directly (bypasses Vercel 4.5MB proxy limit).
 * Browser CORS must allow the frontend origin on the backend.
 */
export function getFileUploadBaseUrl(): string {
  return toApiBase(getDirectBackendUrl())
}
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
async function request<T>(
  baseUrl: string,
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    body?: object | FormData
    headers?: Record<string, string>
    isFormData?: boolean
    connectionHint?: string
  } = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    isFormData = false,
    connectionHint,
  } = options
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

  let res: Response
  try {
    res = await fetch(`${baseUrl}${endpoint}`, config)
  } catch {
    const hint =
      connectionHint ??
      (typeof window !== "undefined"
        ? "Check BACKEND_URL in .env and restart npm run dev."
        : "Set BACKEND_URL in .env to your backend origin.")
    throw new ApiError(`Cannot connect to API. ${hint}`, 0)
  }

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
    const proxyHint =
      res.status === 500 && typeof window !== "undefined"
        ? " Backend may be unreachable — check BACKEND_URL in .env and restart npm run dev."
        : ""
    const message =
      (data as { message?: string })?.message ||
      `Request failed (${res.status}).${proxyHint}`
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

function createClient(baseUrl: string, connectionHint?: string) {
  return {
    get: <T>(endpoint: string) =>
      request<T>(baseUrl, endpoint, { method: "GET", connectionHint }),

    post: <T>(endpoint: string, body?: object) =>
      request<T>(baseUrl, endpoint, { method: "POST", body, connectionHint }),

    put: <T>(endpoint: string, body?: object) =>
      request<T>(baseUrl, endpoint, { method: "PUT", body, connectionHint }),

    patch: <T>(endpoint: string, body?: object) =>
      request<T>(baseUrl, endpoint, { method: "PATCH", body, connectionHint }),

    delete: <T>(endpoint: string) =>
      request<T>(baseUrl, endpoint, { method: "DELETE", connectionHint }),

    upload: <T>(endpoint: string, formData: FormData) =>
      request<T>(baseUrl, endpoint, {
        method: "POST",
        body: formData,
        isFormData: true,
        connectionHint,
      }),
  }
}

// ─── HTTP methods ─────────────────────────────────────────────────────────────
/** JSON API — proxied through Next.js in the browser */
export const api = createClient(getApiBaseUrl())

/** File uploads — direct to backend (avoids Vercel payload limit) */
export const fileApi = createClient(
  getFileUploadBaseUrl(),
  "Check NEXT_PUBLIC_BACKEND_URL points to your Render backend."
)

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