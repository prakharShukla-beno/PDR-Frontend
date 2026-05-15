"use client"

// ─────────────────────────────────────────────
// Duplicates Page
// APIs:
//   GET /api/duplicates?status=pending  → pending pairs
//   POST /api/duplicates/:id/merge      → merge karo
//   POST /api/duplicates/:id/dismiss    → dismiss karo
// ─────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import { Loader2, Copy, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Duplicate, Prospect } from "@/types"

export default function DuplicatesPage() {

  // ── Data state ──────────────────────────────
  const [duplicates, setDuplicates] = useState<Duplicate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("pending")

  // ── Action loading ──────────────────────────
  const [actionId, setActionId] = useState<string | null>(null)

  // ── GET /api/duplicates ─────────────────────
  const fetchDuplicates = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>(
        `/duplicates?status=${statusFilter}&page=${currentPage}&limit=10`
      )
      setDuplicates(res.data?.duplicates || res.data || res.duplicates || [])
      setTotal(res.data?.pagination?.total || res.pagination?.total || 0)
      setTotalPages(res.data?.pagination?.totalPages || res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Duplicates fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, currentPage])

  useEffect(() => { fetchDuplicates() }, [fetchDuplicates])
  useEffect(() => { setCurrentPage(1) }, [statusFilter])

  // ── POST /api/duplicates/:id/merge ──────────
  const handleMerge = async (id: string) => {
    if (!confirm("Dono prospects merge karna chahte ho? Ek delete ho jaayega.")) return
    setActionId(id)
    try {
      await api.post(`/duplicates/${id}/merge`, {})
      fetchDuplicates()
    } catch {
      alert("Merge nahi ho saka.")
    } finally {
      setActionId(null)
    }
  }

  // ── POST /api/duplicates/:id/dismiss ────────
  const handleDismiss = async (id: string) => {
    setActionId(id)
    try {
      await api.post(`/duplicates/${id}/dismiss`, {})
      fetchDuplicates()
    } catch {
      alert("Dismiss nahi ho saka.")
    } finally {
      setActionId(null)
    }
  }

  // ── Prospect name helper ────────────────────
  const getProspectName = (p: Prospect | string) => {
    if (typeof p === "string") return p
    return p.accountName ?? "Unknown"
  }

  const getProspectDetail = (p: Prospect | string, field: keyof Prospect) => {
    if (typeof p === "string") return "—"
    return (p[field] as string) ?? "—"
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Admin</p>
          <h1 className="text-2xl font-bold">Duplicates</h1>
          <p className="text-sm text-muted-foreground">{total} duplicate pairs</p>
        </div>
        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="merged">Merged</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && duplicates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Copy className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Koi duplicate nahi {statusFilter === "pending" ? "pending" : statusFilter} mein</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "pending" ? "Saare duplicates review ho gaye hain." : "Is status mein koi entry nahi."}
            </p>
          </div>
        </div>
      )}

      {/* ── Duplicates List ── */}
      {!isLoading && duplicates.length > 0 && (
        <>
          <div className="space-y-4">
            {duplicates.map((dup) => (
              <Card key={dup._id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Duplicate Pair</span>
                      {dup.matchFields && dup.matchFields.length > 0 && (
                        <div className="flex gap-1">
                          {dup.matchFields.map(f => (
                            <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        dup.status === "pending" ? "border-yellow-300 text-yellow-700 bg-yellow-50" :
                        dup.status === "merged" ? "border-green-300 text-green-700 bg-green-50" :
                        "border-gray-300 text-gray-600"
                      }
                    >
                      {dup.status}
                    </Badge>
                  </div>

                  {/* Side by side comparison */}
                  <div className="grid grid-cols-2 divide-x">
                    {/* Prospect 1 */}
                    <div className="p-4 space-y-2">
                      <p className="font-semibold text-sm">
                        {getProspectName(dup.prospectId1 as Prospect | string)}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Industry: <span className="text-foreground">{getProspectDetail(dup.prospectId1 as Prospect | string, "primaryIndustry")}</span></p>
                        <p>Website: <span className="text-foreground">{getProspectDetail(dup.prospectId1 as Prospect | string, "website")}</span></p>
                        <p>Country: <span className="text-foreground">{getProspectDetail(dup.prospectId1 as Prospect | string, "country")}</span></p>
                        <p>Source: <span className="text-foreground">{getProspectDetail(dup.prospectId1 as Prospect | string, "source")}</span></p>
                      </div>
                    </div>

                    {/* Prospect 2 */}
                    <div className="p-4 space-y-2">
                      <p className="font-semibold text-sm">
                        {getProspectName(dup.prospectId2 as Prospect | string)}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Industry: <span className="text-foreground">{getProspectDetail(dup.prospectId2 as Prospect | string, "primaryIndustry")}</span></p>
                        <p>Website: <span className="text-foreground">{getProspectDetail(dup.prospectId2 as Prospect | string, "website")}</span></p>
                        <p>Country: <span className="text-foreground">{getProspectDetail(dup.prospectId2 as Prospect | string, "country")}</span></p>
                        <p>Source: <span className="text-foreground">{getProspectDetail(dup.prospectId2 as Prospect | string, "source")}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Actions — sirf pending mein dikhenge */}
                  {dup.status === "pending" && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-t">
                      <Button
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionId === dup._id}
                        onClick={() => handleMerge(dup._id)}
                      >
                        {actionId === dup._id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCircle className="h-4 w-4" />
                        }
                        Merge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={actionId === dup._id}
                        onClick={() => handleDismiss(dup._id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </Button>
                      <p className="text-xs text-muted-foreground ml-auto">
                        Merge karoge to pehla account rakhega, doosra delete hoga.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}