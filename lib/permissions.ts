export type AppRole = "admin" | "editor" | "viewer"

export function canEditContent(role?: string | null): boolean {
  return role === "admin" || role === "editor"
}

export function isPermissionError(err: unknown): boolean {
  const e = err as { status?: number; message?: string }
  if (e.status === 403) return true
  const msg = (e.message ?? "").toLowerCase()
  return (
    msg.includes("permission") ||
    msg.includes("forbidden") ||
    msg.includes("not authorized") ||
    msg.includes("admin or editor")
  )
}

export function permissionDeniedMessage(action: string): string {
  return (
    `You don't have permission to ${action}. ` +
    "This action requires Admin or Editor access."
  )
}
