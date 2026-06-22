"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"

interface EditorBlockedStateProps {
  role: string
  resourceLabel: string
  backHref?: string
  backLabel?: string
}

export function EditorBlockedState({
  role,
  resourceLabel,
  backHref = "/segments",
  backLabel = "Back to Segments & ICP",
}: EditorBlockedStateProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        You don&apos;t have access to this
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Your role is <strong className="capitalize">{role}</strong>. Only Admins and
        Editors can {resourceLabel}. Contact your workspace admin if you need access.
      </p>
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {backLabel}
      </button>
    </div>
  )
}
