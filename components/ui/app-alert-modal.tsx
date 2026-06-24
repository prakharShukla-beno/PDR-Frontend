"use client"

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

export type AppAlertVariant = "success" | "error" | "warning" | "info"

interface AppAlertModalProps {
  open: boolean
  title: string
  message: string
  okLabel?: string
  variant?: AppAlertVariant
  onClose: () => void
}

const styles: Record<
  AppAlertVariant,
  { icon: typeof CheckCircle2; iconColor: string; iconBg: string; button: string }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-600",
    iconBg: "bg-green-50",
    button: "bg-teal-600 hover:bg-teal-700 text-white",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-50",
    button: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
  info: {
    icon: Info,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
    button: "bg-teal-600 hover:bg-teal-700 text-white",
  },
}

export function AppAlertModal({
  open,
  title,
  message,
  okLabel = "OK",
  variant = "info",
  onClose,
}: AppAlertModalProps) {
  if (!open) return null

  const { icon: Icon, iconColor, iconBg, button } = styles[variant]

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="app-alert-title"
          aria-describedby="app-alert-message"
        >
          <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>

          <h3 id="app-alert-title" className="text-base font-semibold text-gray-900 mb-1">
            {title}
          </h3>

          <p id="app-alert-message" className="text-sm text-gray-500 mb-6 leading-relaxed">
            {message}
          </p>

          <button
            type="button"
            onClick={onClose}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${button}`}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </>
  )
}
