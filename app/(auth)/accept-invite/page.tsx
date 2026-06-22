"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { setTokens, parseFetchJson } from "@/lib/apiClient"
import { useAuth } from "@/context/AuthContext"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const token = searchParams.get("token")

  const [inviteInfo, setInviteInfo] = useState<{
    email: string
    name: string
    role: string
    company: { name: string }
  } | null>(null)

  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link")
      setVerifying(false)
      return
    }

    const verifyInvite = async () => {
      try {
        const res = await fetch(
          `/api/users/invite/verify?token=${encodeURIComponent(token)}`
        )
        const data = await parseFetchJson<{
          success?: boolean
          message?: string
          data?: {
            email: string
            name: string
            role: string
            company: { name: string }
          }
        }>(res)

        if (data.success && data.data) {
          setInviteInfo(data.data)
          setForm((prev) => ({
            ...prev,
            name: data.data?.name || "",
          }))
        } else {
          setError(data.message || "Invalid invite link")
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to verify invite")
      } finally {
        setVerifying(false)
      }
    }

    verifyInvite()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/users/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          name: form.name,
        }),
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
        throw new Error(data.message || "Failed to accept invite")
      }

      const accessToken = data.data?.accessToken
      if (!accessToken) {
        throw new Error("Invite response missing access token")
      }

      setTokens(accessToken, data.data?.refreshToken ?? "")
      localStorage.setItem("pdr_user", JSON.stringify(data.data?.user))

      await refreshUser()

      router.push("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Verifying invite...</p>
      </div>
    )
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Link href="/login" className="text-teal-600 text-sm mt-2 block hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re invited!</h1>
          {inviteInfo && (
            <p className="text-gray-500 mt-1 text-sm">
              Join{" "}
              <span className="font-medium text-gray-700">{inviteInfo.company.name}</span>{" "}
              as{" "}
              <span className="capitalize font-medium text-teal-600">{inviteInfo.role}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {inviteInfo && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-500">Invited as</p>
              <p className="font-medium text-gray-900">{inviteInfo.email}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading ? "Joining..." : "Accept & Join"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
