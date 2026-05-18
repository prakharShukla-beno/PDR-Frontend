"use client"

// ─────────────────────────────────────────────
// Audit Log Page
// Reference: akshayji.lovable.app/app/audit
// Backend mein dedicated audit API nahi hai
// Import history + enrichment activity use karenge
// APIs:
//   GET /api/dashboard/import-history
//   GET /api/interactions → recent interactions
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import { Loader2, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api } from "@/lib/api"

// Audit event type
interface AuditEvent {
  id: string
  time: string
  user: string
  action: string
  record: string
  details: string
  type: "import" | "enrichment" | "merge" | "edit" | "system"
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState("7d")

  useEffect(() => {
    const fetchAuditData = async () => {
      setIsLoading(true)
      try {
        const [importRes] = await Promise.all([
          api.get<any>("/dashboard/import-history"),
        ])

        // Import history ko audit events mein convert karo
        const importEvents: AuditEvent[] = (importRes.data || []).map((imp: any) => ({
          id: imp._id,
          time: new Date(imp.createdAt).toLocaleString("en-IN", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          }),
          user: "System",
          action: "imported",
          record: imp.fileName?.split("-").slice(1).join("-") || imp.fileName || "Excel File",
          details: `${imp.successCount ?? 0} records added, ${imp.failedCount ?? 0} errors`,
          type: "import"
        }))

        setEvents(importEvents)
      } catch (err) {
        console.error("Audit log error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAuditData()
  }, [filterPeriod])

  const getActionBadge = (type: AuditEvent["type"]) => {
    const map = {
      import: "bg-blue-100 text-blue-700",
      enrichment: "bg-purple-100 text-purple-700",
      merge: "bg-green-100 text-green-700",
      edit: "bg-yellow-100 text-yellow-700",
      system: "bg-gray-100 text-gray-600",
    }
    return map[type] || map.system
  }

  const filteredEvents = filterType === "all"
    ? events
    : events.filter(e => e.type === filterType)

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Compliance · BR-04
          </p>
          <h1 className="text-2xl font-bold">Audit Log & Activity</h1>
          <p className="text-sm text-muted-foreground">
            All system actions and user activities.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />Export Log
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="import">Imports</SelectItem>
            <SelectItem value="enrichment">Enrichments</SelectItem>
            <SelectItem value="merge">Merges</SelectItem>
            <SelectItem value="edit">Edits</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Audit Table ── */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Koi audit events nahi hain is period mein.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Record</th>
                  <th className="p-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/20">
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {event.time}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {event.user === "System" ? "S" : event.user.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm">{event.user}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionBadge(event.type)}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium truncate max-w-[200px]">
                      {event.record}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {event.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}