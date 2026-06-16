"use client"

import { useCallback, useEffect, useState } from "react"

export const AUTO_DISMISS_MS = 3000
export const AUTO_DISMISS_FADE_MS = 2500

export type MessageTone = "success" | "info" | "warning" | "error"

export function getMessageTone(message: string): MessageTone {
  const t = message.trim()
  if (t.startsWith("❌")) return "error"
  if (/sync failed|enrichment failed|failed to |save failed|upload failed|delete failed/i.test(t)) {
    return "error"
  }
  if (t.startsWith("⚠️") || t.startsWith("⚠")) return "warning"
  if (
    t.startsWith("✅") ||
    t.startsWith("Done") ||
    /complete|successfully|synced —/i.test(t)
  ) {
    return "success"
  }
  return "info"
}

type Options = {
  onAutoDismiss?: () => void
}

export function useAutoDismissMessage(options: Options = {}) {
  const { onAutoDismiss } = options
  const [message, setMessageState] = useState("")
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  const clearMessage = useCallback(() => {
    setVisible(false)
    setFading(false)
    setMessageState("")
  }, [])

  const setMessage = useCallback((msg: string) => {
    setMessageState(msg)
    if (!msg) {
      setVisible(false)
      setFading(false)
      return
    }
    setVisible(true)
    setFading(false)
  }, [])

  useEffect(() => {
    if (!message || !visible) return
    if (getMessageTone(message) === "error") return
    if (message.trim().startsWith("⏳")) return

    const fadeTimer = window.setTimeout(() => setFading(true), AUTO_DISMISS_FADE_MS)
    const hideTimer = window.setTimeout(() => {
      onAutoDismiss?.()
      clearMessage()
    }, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [message, visible, clearMessage, onAutoDismiss])

  const tone = message ? getMessageTone(message) : "info"

  return {
    message,
    visible: visible && !!message,
    fading,
    tone,
    setMessage,
    clearMessage,
  }
}
