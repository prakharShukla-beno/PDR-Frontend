"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Sparkles, MessageSquare, Layers, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are both required.")
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left Side ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#2D8B8B] to-[#1D6B6B] p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#2D8B8B] font-bold text-lg">
            B
          </div>
          <div>
            <span className="font-semibold text-lg">Beno</span>
            <p className="text-sm text-white/70">by OneB Suite</p>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Find the next<br />
            sales-ready account<br />
            in seconds.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            AI-enriched prospect research, intent signals, ICP-based scoring and
            prompt-driven campaigns — all in one workspace.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Building2,    label: "48k+ accounts" },
              { icon: Sparkles,     label: "AI insights" },
              { icon: MessageSquare,label: "Prompt campaigns" },
              { icon: Layers,       label: "5 connectors" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
                <Icon className="h-5 w-5" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div />
      </div>

      {/* ── Right Side — Login Form ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] p-8">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm">

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your prospect workspace.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              {/* Password label + Forgot link same row mein */}
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            By continuing you agree to Beno&apos;s{" "}
            <a href="#" className="text-primary hover:underline">
              Terms & Confidentiality policy
            </a>
            .
          </p>

        </div>
      </div>
    </div>
  )
}
