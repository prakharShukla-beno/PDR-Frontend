"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setToken, setStoredUser } from "@/lib/api"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function ResetPasswordPage() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const token         = searchParams.get("token")

  const [newPassword, setNewPassword]   = useState("")
  const [confirm, setConfirm]           = useState("")
  const [showPass, setShowPass]         = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [isSuccess, setIsSuccess]       = useState(false)
  const [error, setError]               = useState("")

  // Token not found in URL — invalid link
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset link. Please request a new one.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newPassword) {
      setError("Password is required.")
      return
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Reset failed. Please try again.")
      }

      // Auto login — backend returned a new token
      if (data.data?.token) {
        setToken(data.data.token)
        setStoredUser(data.data.user)
        document.cookie = `beno_token=${data.data.token}; path=/; SameSite=Lax`
      }

      setIsSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getStrength = () => {
    if (!newPassword) return null
    if (newPassword.length < 6)  return { label: "Too short", color: "bg-red-400",    width: "w-1/4" }
    if (newPassword.length < 8)  return { label: "Weak",      color: "bg-orange-400", width: "w-2/4" }
    if (newPassword.length < 12) return { label: "Good",      color: "bg-yellow-400", width: "w-3/4" }
    return                              { label: "Strong",     color: "bg-green-500",  width: "w-full" }
  }
  const strength = getStrength()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] p-8">
      <div className="w-full max-w-md">

        <div className="rounded-xl bg-white p-8 shadow-sm space-y-6">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B2F5C] text-white font-bold text-lg">
              B
            </div>
            <div>
              <span className="font-semibold text-lg">Beno</span>
              <p className="text-xs text-muted-foreground">by OneB Suite</p>
            </div>
          </div>

          {isSuccess ? (
            /* ── Success State ── */
            <div className="space-y-4 py-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Password reset successful!</h2>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to dashboard...
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>

          ) : !token ? (
            /* ── Invalid Token State ── */
            <div className="space-y-4 py-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Invalid reset link</h2>
                <p className="text-sm text-muted-foreground">
                  This link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <Link href="/forgot-password">
                <Button className="w-full bg-[#1B2F5C] hover:bg-[#1B2F5C]/90">
                  Request new reset link
                </Button>
              </Link>
            </div>

          ) : (
            /* ── Form State ── */
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Set new password</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPass ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 pr-10"
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPass(!showPass)}
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {strength && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`h-11 pr-10 ${
                        confirm && confirm !== newPassword
                          ? "border-red-400 focus-visible:ring-red-400"
                          : confirm && confirm === newPassword
                          ? "border-green-400 focus-visible:ring-green-400"
                          : ""
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && confirm !== newPassword && (
                    <p className="text-xs text-red-500">Passwords don't match</p>
                  )}
                  {confirm && confirm === newPassword && (
                    <p className="text-xs text-green-600">Passwords match ✓</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#1B2F5C] hover:bg-[#1B2F5C]/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
