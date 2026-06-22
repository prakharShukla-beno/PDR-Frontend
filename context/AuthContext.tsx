"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { useRouter } from "next/navigation"
import {
  api,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  parseFetchJson,
} from "@/lib/apiClient"

export interface AuthUser {
  id: string
  _id?: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  companyId?: string
  company?: {
    id?: string
    _id?: string
    name: string
    slug?: string
    plan?: string
  }
  isFirstLogin?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function normalizeUser(raw: Record<string, unknown>): AuthUser {
  const id = String(raw.id ?? raw._id ?? "")
  const companyRaw = (raw.company ?? raw.companyId) as
    | { _id?: string; id?: string; name?: string; slug?: string; plan?: string }
    | string
    | null
    | undefined

  const company =
    companyRaw && typeof companyRaw === "object"
      ? {
          id: String(companyRaw._id ?? companyRaw.id ?? ""),
          name: String(companyRaw.name ?? ""),
          slug: companyRaw.slug,
          plan: companyRaw.plan,
        }
      : undefined

  return {
    id,
    _id: id,
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    role: (raw.role as AuthUser["role"]) ?? "editor",
    companyId:
      typeof companyRaw === "object" && companyRaw
        ? String(companyRaw._id ?? companyRaw.id ?? "")
        : raw.companyId
          ? String(raw.companyId)
          : undefined,
    company,
    isFirstLogin: Boolean(raw.isFirstLogin),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)
  const router = useRouter()

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        clearTokens()
        return null
      }

      const data = await parseFetchJson<{ data?: { accessToken?: string; refreshToken?: string } }>(res)
      const access = data.data?.accessToken
      const refresh = data.data?.refreshToken
      if (!access) {
        clearTokens()
        return null
      }

      setTokens(access, refresh ?? refreshToken)
      return access
    } catch {
      clearTokens()
      return null
    }
  }, [])

  const fetchUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const data = await api.get<{ data?: Record<string, unknown> }>("/auth/me")
      const raw = data.data ?? data
      const me = normalizeUser(raw as Record<string, unknown>)
      setUser(me)
      localStorage.setItem("pdr_user", JSON.stringify(me))
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("pdr_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser)
      } catch {
        /* ignore */
      }
    }
    fetchUser()
  }, [fetchUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await parseFetchJson<{
        message?: string
        data?: {
          accessToken?: string
          refreshToken?: string
          user?: Record<string, unknown>
        }
      }>(res)

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      const accessToken = data.data?.accessToken
      const refreshToken = data.data?.refreshToken
      if (!accessToken) {
        throw new Error("Login response missing access token")
      }

      setTokens(accessToken, refreshToken ?? "")
      const loggedInUser = normalizeUser(
        (data.data?.user ?? {}) as Record<string, unknown>
      )
      setUser(loggedInUser)
      localStorage.setItem("pdr_user", JSON.stringify(loggedInUser))

      if (loggedInUser.isFirstLogin) {
        router.push("/onboarding")
      } else {
        router.push("/dashboard")
      }
    },
    [router]
  )

  const logout = useCallback(() => {
    const token = getAccessToken()
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    clearTokens()
    setUser(null)
    router.push("/login")
  }, [router])

  const refreshUser = useCallback(async () => {
    setLoading(true)
    await fetchUser()
  }, [fetchUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
