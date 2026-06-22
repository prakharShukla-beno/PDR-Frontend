"use client"

import { useState, useCallback } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export type ConfirmVariant = "danger" | "warning" | "default"

type ConfirmConfig = {
  title: string
  message: string
  confirmLabel?: string
  variant?: ConfirmVariant
  onConfirm: () => void | Promise<void>
}

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    confirmLabel: string
    variant: ConfirmVariant
    onConfirm: () => void
  } | null>(null)

  const showConfirm = useCallback((config: ConfirmConfig) => {
    setConfirmDialog({
      open: true,
      title: config.title,
      message: config.message,
      confirmLabel: config.confirmLabel || "Confirm",
      variant: config.variant || "danger",
      onConfirm: () => {
        setConfirmDialog(null)
        void config.onConfirm()
      },
    })
  }, [])

  const ConfirmDialogHost = confirmDialog ? (
    <ConfirmDialog
      open={confirmDialog.open}
      title={confirmDialog.title}
      message={confirmDialog.message}
      confirmLabel={confirmDialog.confirmLabel}
      variant={confirmDialog.variant}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog(null)}
    />
  ) : null

  return { showConfirm, ConfirmDialogHost }
}
