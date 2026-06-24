"use client"

import { useState, useCallback } from "react"
import { AppAlertModal, type AppAlertVariant } from "@/components/ui/app-alert-modal"

type AlertConfig = {
  title?: string
  message: string
  okLabel?: string
  variant?: AppAlertVariant
}

function variantFromMessage(message: string): AppAlertVariant {
  const t = message.trim()
  if (t.startsWith("✅")) return "success"
  if (t.startsWith("❌")) return "error"
  if (t.startsWith("⚠️") || t.startsWith("⚠")) return "warning"
  if (t.startsWith("⏳")) return "info"
  if (/failed|error/i.test(t)) return "error"
  if (/success|complete|added|deleted|removed|created|exported|re-tiered/i.test(t)) return "success"
  return "info"
}

function titleFromVariant(variant: AppAlertVariant): string {
  switch (variant) {
    case "success":
      return "Success"
    case "error":
      return "Something went wrong"
    case "warning":
      return "Warning"
    default:
      return "Notice"
  }
}

function stripEmoji(message: string): string {
  return message.replace(/^[✅❌⚠️⚠⏳]\s*/, "").trim()
}

export function useAppAlert() {
  const [alert, setAlert] = useState<{
    open: boolean
    title: string
    message: string
    okLabel: string
    variant: AppAlertVariant
  } | null>(null)

  const showAlert = useCallback((config: AlertConfig) => {
    const variant = config.variant ?? variantFromMessage(config.message)
    setAlert({
      open: true,
      title: config.title ?? titleFromVariant(variant),
      message: stripEmoji(config.message),
      okLabel: config.okLabel ?? "OK",
      variant,
    })
  }, [])

  const AlertHost = alert ? (
    <AppAlertModal
      open={alert.open}
      title={alert.title}
      message={alert.message}
      okLabel={alert.okLabel}
      variant={alert.variant}
      onClose={() => setAlert(null)}
    />
  ) : null

  return { showAlert, AlertHost }
}
