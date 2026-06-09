"use client"

import { useEffect, useState } from "react"

/**
 * Renders children only after the client has mounted.
 * Avoids hydration mismatches caused by browser extensions that inject
 * attributes (e.g. fdprocessedid) into form controls before React hydrates.
 */
export function MountedGate({
  children,
  fallback = <div className="min-h-screen bg-background" aria-hidden="true" />,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return fallback
  return children
}
