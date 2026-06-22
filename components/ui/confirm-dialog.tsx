"use client"

import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmButtonClass = {
    danger:  "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    default: "bg-teal-600 hover:bg-teal-700 text-white",
  }[variant]

  const iconColor = {
    danger:  "text-red-500",
    warning: "text-yellow-500",
    default: "text-teal-500",
  }[variant]

  const iconBg = {
    danger:  "bg-red-50",
    warning: "bg-yellow-50",
    default: "bg-teal-50",
  }[variant]

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150">
          <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {title}
          </h3>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmButtonClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
