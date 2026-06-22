import { getApiBaseUrl, getFileUploadBaseUrl, setAuthSession, removeToken } from "./api"
import { parseFetchJson, parseApiResponse, readResponseBody, extractErrorMessage } from "./responseUtils"

export { parseFetchJson, parseApiResponse, readResponseBody, extractErrorMessage, API_UNAVAILABLE_MSG } from "./responseUtils"

const ACCESS_KEY = "pdr_access_token"
const REFRESH_KEY = "pdr_refresh_token"

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_KEY) || localStorage.getItem("beno_token")
}

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_KEY) || localStorage.getItem("beno_refresh_token")
}

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
  setAuthSession(access, refresh)
  if (typeof document !== "undefined") {
    document.cookie = "pdr_auth=true; path=/; max-age=604800; SameSite=Lax"
  }
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem("pdr_user")
  removeToken()
  if (typeof document !== "undefined") {
    document.cookie = "pdr_auth=; path=/; max-age=0; SameSite=Lax"
  }
}

const refreshTokens = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) return null

    const data = await parseFetchJson<{ data?: { accessToken?: string; refreshToken?: string } }>(res)
    const access = data.data?.accessToken
    const refresh = data.data?.refreshToken
    if (!access) return null

    setTokens(access, refresh ?? refreshToken)
    return access
  } catch {
    return null
  }
}

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  let token = getAccessToken()

  const makeRequest = (t: string | null) =>
    fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers || {}),
      },
    })

  let res = await makeRequest(token)

  if (res.status === 401 && !endpoint.startsWith("/auth/")) {
    const newToken = await refreshTokens()
    if (newToken) {
      res = await makeRequest(newToken)
    } else {
      clearTokens()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }

  return res
}

export const api = {
  get: async <T = unknown>(url: string) =>
    parseApiResponse<T>(await apiClient(url, { method: "GET" })),

  post: async <T = unknown>(url: string, body?: unknown) =>
    parseApiResponse<T>(
      await apiClient(url, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    ),

  put: async <T = unknown>(url: string, body?: unknown) =>
    parseApiResponse<T>(
      await apiClient(url, {
        method: "PUT",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    ),

  delete: async <T = unknown>(url: string) =>
    parseApiResponse<T>(await apiClient(url, { method: "DELETE" })),

  upload: (url: string, formData: FormData) => {
    const token = getAccessToken()
    return fetch(`${getFileUploadBaseUrl()}${url}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  },
}

/** Cancel import — direct to backend (same as file uploads) */
export const cancelImportJob = async (jobId: string) => {
  const token = getAccessToken()
  const res = await fetch(`${getFileUploadBaseUrl()}/import/jobs/${jobId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: "{}",
    cache: "no-store",
  })
  return parseApiResponse(res)
}
