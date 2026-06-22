"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full text-center p-8">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎉</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Beno PDR!</h1>
        <p className="text-gray-500 mb-8">
          Your workspace is ready. The next step is to set up your Ideal Customer Profile (ICP)
          so the system can score and match prospects for you.
        </p>

        <div className="space-y-3">
          <Link
            href="/segments/icp-builder"
            className="block w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
          >
            Set up my ICP Benchmark →
          </Link>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="block w-full py-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip for now, go to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
