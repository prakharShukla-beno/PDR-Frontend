import { readResponseBody, extractErrorMessage, API_UNAVAILABLE_MSG } from "./responseUtils"

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
const TOKEN_KEY = "beno_token"
const REFRESH_TOKEN_KEY = "beno_refresh_token"
const USER_KEY = "beno_user"

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const setAuthSession = (accessToken: string, refreshToken?: string): void => {
  setToken(accessToken)
  if (refreshToken) setRefreshToken(refreshToken)
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=${accessToken}; path=/; SameSite=Lax`
  }
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
  }
}

export const getStoredUser = () => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const setStoredUser = (user: object): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** Normalize login/register/reset responses (accessToken or legacy token). */
export const extractAuthTokens = (data: {
  accessToken?: string
  refreshToken?: string
  token?: string
} | null | undefined) => {
  const accessToken = data?.accessToken ?? data?.token ?? null
  const refreshToken = data?.refreshToken ?? null
  return { accessToken, refreshToken }
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
    body: requestBody,
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
    cache: "no-store",
  }

  if (requestBody) {
    config.body = isFormData ? (requestBody as FormData) : JSON.stringify(requestBody)
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${endpoint}`, config)
  } catch {
    const hint =
      connectionHint ??
      (typeof window !== "undefined"
        ? API_UNAVAILABLE_MSG
        : "Set BACKEND_URL in .env to your backend origin.")
    throw new ApiError(`Cannot connect to API. ${hint}`, 0)
  }

  const responseBody = await readResponseBody(res)
  const data = responseBody.data

  if (res.status === 401) {
    const isAuthAttempt = /^\/auth\/(login|register|refresh)/.test(endpoint)
    if (!isAuthAttempt && getToken()) {
      removeToken()
      if (typeof window !== "undefined") window.location.href = "/"
      throw new ApiError("Session expired. Please login again.", 401)
    }
  }

  if (!res.ok) {
    const message = extractErrorMessage(res, responseBody, `Request failed (${res.status})`)
    throw new ApiError(message, res.status, data)
  }

  if (!responseBody.isJson) {
    throw new ApiError(
      extractErrorMessage(res, responseBody, "Invalid response from server"),
      res.status
    )
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