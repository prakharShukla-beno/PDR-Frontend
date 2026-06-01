"use client"

// Segment detail page — shows stored accounts (no fresh query on every open)
// APIs:
//   GET  /api/segments/:id          → segment info + filter details
//   GET  /api/segments/:id/accounts → paginated stored accounts
//   POST /api/segments/:id/sync     → sync fresh data from DB

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Clock,
} from "lucide-react"
import { Button }            from "@/components/ui/button"
import { Badge }             from "@/components/ui/badge"
import { api }               from "@/lib/api"

export default function SegmentDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  // Segment meta
  const [segment,     setSegment]     = useState<any>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  // Accounts
  const [accounts,    setAccounts]    = useState<any[]>([])
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [acLoading,   setAcLoading]   = useState(false)
  const LIMIT = 10

  // Sync
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMsg,   setSyncMsg]   = useState("")

  // GET /api/segments/:id — fetch segment info
  // Backend returns { success: true, data: segmentObject }
  const fetchSegment = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>(`/segments/${id}`)
      // Handle both wrapped and unwrapped responses
      setSegment(res.data?.data ?? res.data)
    } catch (err) {
      console.error("Segment fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // GET /api/segments/:id/accounts — fetch stored accounts (no fresh query)
  // Backend returns { success: true, data: { accounts, total, page, totalPages } }
  const fetchAccounts = useCallback(async (page = 1) => {
    setAcLoading(true)
    try {
      const res = await api.get<any>(
        `/segments/${id}/accounts?page=${page}&limit=${LIMIT}`
      )
      // Response shape: { success, data: { accounts[], total, page, totalPages } }
      const data = res.data?.data ?? res.data
      setAccounts(data?.accounts || [])
      setTotal(data?.total || 0)
      setTotalPages(data?.totalPages || 1)
    } catch (err) {
      console.error("Accounts fetch error:", err)
    } finally {
      setAcLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSegment()
    fetchAccounts(1)
  }, [fetchSegment, fetchAccounts])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchAccounts(newPage)
  }

  // POST /api/segments/:id/sync — run fresh query, update snapshot
  const handleSync = async () => {
    setIsSyncing(true)
    setSyncMsg("")
    try {
      const res = await api.post<any>(`/segments/${id}/sync`, {})
      // Response: { success, message, data: updatedSegment }
      const count = res.data?.data?.matchCount ?? res.data?.matchCount
      setSyncMsg(`Synced — ${count} accounts found`)
      await fetchSegment()
      await fetchAccounts(1)
      setCurrentPage(1)
    } catch {
      setSyncMsg("Sync failed. Please try again.")
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncMsg(""), 4000)
    }
  }

  // Format last synced time
  const formatSyncTime = (dateStr?: string) => {
    if (!dateStr) return "Never synced"
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return "Just now"
    if (mins < 60) return `${mins} minutes ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs} hours ago`
    return `${Math.floor(hrs / 24)} days ago`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!segment) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Segment not found.</p>
        <Button variant="link" onClick={() => router.push("/segments")}>
          Back to Segments
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* ── Header ── */}
      <div className="p-6 pb-4 border-b flex-shrink-0">
        <Link
          href="/segments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />Back to Segments
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{segment.name}</h1>
              {segment.isShared && <Badge variant="secondary">Shared</Badge>}
            </div>
            {segment.description && (
              <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3" />
              <span>Last synced: {formatSyncTime(segment.lastSyncedAt)}</span>
            </div>
          </div>

          {/* Sync button */}
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline" className="gap-2"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
              {isSyncing ? "Syncing..." : "Sync"}
            </Button>
            {syncMsg && <p className="text-xs text-muted-foreground">{syncMsg}</p>}
          </div>
        </div>

        {/* Stats + filter badges */}
        <div className="flex items-center gap-6 mt-4">
          <div>
            <p className="text-2xl font-bold text-primary">{segment.matchCount ?? 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Accounts</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {segment.filters?.industries?.map((ind: string) => (
              <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
            ))}
            {segment.filters?.countries?.map((c: string) => (
              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
            ))}
            {segment.filters?.salesPriorities?.map((sp: string) => (
              <Badge key={sp} variant="outline" className="text-xs">{sp}</Badge>
            ))}
            {segment.filters?.minTechFitScore && (
              <Badge variant="outline" className="text-xs">
                Score ≥ {segment.filters.minTechFitScore}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Accounts table ── */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">Country</th>
                <th className="p-4 font-medium">Employees</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {acLoading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-8 w-8 bg-muted rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    No accounts in this segment. Click Sync to refresh.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr
                    key={account._id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/accounts/${account._id}`)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-sm">{account.accountName}</div>
                      {account.website && (
                        <div className="text-xs text-muted-foreground">{account.website}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm">{account.primaryIndustry || "—"}</td>
                    <td className="p-4 text-sm">{account.country || "—"}</td>
                    <td className="p-4 text-sm">{account.noOfEmployees || "—"}</td>
                    <td className="p-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm ${
                        (account.techFitScore ?? 0) >= 80
                          ? "border-green-500 text-green-600"
                          : (account.techFitScore ?? 0) >= 60
                          ? "border-yellow-500 text-yellow-600"
                          : "border-gray-300 text-gray-400"
                      }`}>
                        {account.techFitScore ?? "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          account.salesPriority?.startsWith("P1") ? "default" :
                          account.salesPriority?.startsWith("P2") ? "secondary" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {account.salesPriority?.split(" ")[0] || "—"}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {account.intentSignal || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!acLoading && total > LIMIT && (
          <div className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * LIMIT) + 1}–
              {Math.min(currentPage * LIMIT, total)} of {total} accounts
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">{currentPage} / {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
