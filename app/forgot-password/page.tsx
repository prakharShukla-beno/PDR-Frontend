"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError]       = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email is required.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      // Backend returns the same message regardless of email validity.
      // No need to inspect the response — just mark the form as submitted.
      if (res.ok || res.status === 200) {
        setIsSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.message || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Could not connect to server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] p-8">
      <div className="w-full max-w-md">

        {/* Back to login */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

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

          {isSubmitted ? (
            /* ── Success State ── */
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  If <span className="font-medium text-foreground">{email}</span> is
                  registered, a password reset link has been sent.
                </p>
                <p className="text-xs text-muted-foreground">
                  The link will expire in <strong>15 minutes</strong>.
                </p>
              </div>
              <div className="pt-2 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail("")
                  }}
                >
                  Try a different email
                </Button>
                <Link href="/">
                  <Button className="w-full bg-[#1B2F5C] hover:bg-[#1B2F5C]/90">
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Forgot password?</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gap-2 bg-[#1B2F5C] hover:bg-[#1B2F5C]/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send reset link
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
