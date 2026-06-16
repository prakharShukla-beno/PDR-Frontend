"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageTone } from "@/hooks/useAutoDismissMessage"

const toneClasses: Record<MessageTone, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  error:   "bg-red-50 text-red-700 border-red-200",
}

type AutoDismissBannerProps = {
  message: string
  visible: boolean
  fading: boolean
  tone?: MessageTone
  onDismiss?: () => void
  className?: string
  inline?: boolean
}

export function AutoDismissBanner({
  message,
  visible,
  fading,
  tone = "info",
  onDismiss,
  className,
  inline = false,
}: AutoDismissBannerProps) {
  if (!visible || !message) return null

  const isError = tone === "error"

  return (
    <div
      className={cn(
        "transition-opacity duration-500",
        fading ? "opacity-0" : "opacity-100",
        inline
          ? "text-xs text-muted-foreground max-w-xs"
          : "text-sm px-3 py-2 rounded-lg border flex items-start gap-2",
        !inline && toneClasses[tone],
        className,
      )}
    >
      <span className={inline ? undefined : "flex-1"}>{message}</span>
      {isError && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 hover:bg-black/5"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
