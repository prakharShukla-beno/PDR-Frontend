"use client"

import { Badge } from "@/components/ui/badge"

export default function AuditLogPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <Badge>Coming Soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-2">View system events, changes, and audit trails.</p>
    </div>
  )
}
