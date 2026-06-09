"use client"

import { useEffect } from "react"
import { startKeepAlive } from "@/lib/keepAlive"

export function KeepAliveInit() {
  useEffect(() => {
    startKeepAlive()
  }, [])

  return null
}
