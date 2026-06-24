"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Clock, Sparkles, CheckCircle2, X,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { api }      from "@/lib/api"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"
import { useConfirmDialog } from "@/hooks/useConfirmDialog"
import { useAppAlert } from "@/hooks/useAppAlert"

export default function SegmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { showConfirm, ConfirmDialogHost } = useConfirmDialog()
  const { showAlert, AlertHost } = useAppAlert()

  const [segment,     setSegment]     = useState<any>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  const [accounts,    setAccounts]    = useState<any[]>([])
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [acLoading,   setAcLoading]   = useState(false)
  const LIMIT = 10

  const [isSyncing, setIsSyncing] = useState(false)

  const [isEnriching,  setIsEnriching]  = useState(false)
  const prevEnrichStatus = useRef<string | null>(null)

  // Selection state
  const [selectedIds,    setSelectedIds]    = useState<string[]>([])
  const [isAllSelected,  setIsAllSelected]  = useState(false)
  const [isBulkEnriching, setIsBulkEnriching] = useState(false)
  const [isDeleting,      setIsDeleting]      = useState(false)

  const fetchSegment = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>(`/segments/${id}`)
      setSegment(res.data?.data ?? res.data)
    } catch (err) {
      console.error("Segment fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const fetchAccounts = useCallback(async (page = 1) => {
    setAcLoading(true)
    try {
      const res = await api.get<any>(`/segments/${id}/accounts?page=${page}&limit=${LIMIT}`)
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

  const syncMsg = useAutoDismissMessage()
  const enrichMsg = useAutoDismissMessage()
  const enrichDoneBanner = useAutoDismissMessage({
    onAutoDismiss: () => fetchAccounts(currentPage),
  })
  const bulkEnrichMsg = useAutoDismissMessage({
    onAutoDismiss: () => fetchAccounts(currentPage),
  })

  useEffect(() => {
    fetchSegment()
    fetchAccounts(1)
  }, [fetchSegment, fetchAccounts])

  // Re-fetch live scores when returning to this page (e.g. after enriching on Account detail)
  useEffect(() => {
    const refresh = () => {
      fetchSegment()
      fetchAccounts(currentPage)
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh()
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh()
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pageshow", onPageShow)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [currentPage, fetchSegment, fetchAccounts])

  useEffect(() => {
    if (segment?.enrichStatus !== "running") return
    setIsEnriching(true)
    const timer = setInterval(async () => {
      try {
        const res = await api.get<any>(`/segments/${id}`)
        const seg = res.data?.data ?? res.data
        setSegment(seg)
        if (seg.enrichStatus !== "running") {
          clearInterval(timer)
          setIsEnriching(false)
          const status = seg.enrichStatus
          if (status === "done" || status === "partial") {
            enrichDoneBanner.setMessage(
              status === "partial"
                ? `Enrichment partial — ${seg.enrichedCount ?? 0} enriched, ${seg.scoredCount ?? 0} scored`
                : `Enrichment done — ${seg.enrichedCount ?? 0} enriched, ${seg.scoredCount ?? 0} scored`
            )
          }
          await fetchAccounts(currentPage)
        }
      } catch (err) {
        console.error("Enrich poll error:", err)
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [segment?.enrichStatus, id, currentPage, fetchAccounts])

  useEffect(() => {
    if (!segment) return
    const prev = prevEnrichStatus.current
    const curr = segment.enrichStatus
    if (prev === "running" && (curr === "done" || curr === "partial")) {
      enrichDoneBanner.setMessage(
        curr === "partial"
          ? `Enrichment partial — ${segment.enrichedCount ?? 0} enriched, ${segment.scoredCount ?? 0} scored`
          : `Enrichment done — ${segment.enrichedCount ?? 0} enriched, ${segment.scoredCount ?? 0} scored`
      )
    }
    prevEnrichStatus.current = curr ?? null
  }, [segment?.enrichStatus, segment?.enrichedCount, segment?.scoredCount, segment])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchAccounts(newPage)
    setSelectedIds([])
    setIsAllSelected(false)
  }

  const handleSync = async () => {
    setIsSyncing(true)
    syncMsg.clearMessage()
    try {
      const res = await api.post<any>(`/segments/${id}/sync`, {})
      const count = res.data?.data?.matchCount ?? res.data?.matchCount
      syncMsg.setMessage(`Synced — ${count} accounts found`)
      await fetchSegment()
      await fetchAccounts(1)
      setCurrentPage(1)
    } catch {
      syncMsg.setMessage("Sync failed. Please try again.")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleEnrich = async () => {
    setIsEnriching(true)
    enrichMsg.clearMessage()
    try {
      await api.post<any>(`/segments/${id}/enrich-score`, {})
      enrichMsg.setMessage("Enrichment started — running in background...")
      const segRes = await api.get<any>(`/segments/${id}`)
      setSegment(segRes.data?.data ?? segRes.data)
      setCurrentPage(1)
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Enrichment failed. Please try again."
      enrichMsg.setMessage(msg)
      setIsEnriching(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedIds.length) return
    let ids = selectedIds
    if (isAllSelected) {
      try {
        const res = await api.get<any>(`/segments/${id}/accounts?page=1&limit=99999`)
        const data = res.data?.data ?? res.data
        ids = (data?.accounts || []).map((a: any) => a._id)
        if (!ids.length) ids = selectedIds
      } catch { ids = selectedIds }
    }
    showConfirm({
      title: `Delete ${ids.length} account(s)?`,
      message: "This action cannot be undone. All selected accounts will be permanently deleted.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          await Promise.all(ids.map(accountId => api.delete(`/prospects/${accountId}`)))
          setSelectedIds([])
          setIsAllSelected(false)
          await fetchAccounts(currentPage)
          await fetchSegment()
          showAlert({
            title: "Deleted",
            message: `${ids.length} account(s) deleted successfully.`,
            variant: "success",
          })
        } catch {
          showAlert({ message: "Delete failed.", variant: "error" })
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const handleBulkEnrich = async () => {
    let ids = selectedIds
    if (isAllSelected) {
      try {
        const res = await api.get<any>(`/segments/${id}/accounts?page=1&limit=99999`)
        const data = res.data?.data ?? res.data
        ids = (data?.accounts || []).map((a: any) => a._id)
        if (!ids.length) ids = selectedIds
      } catch { ids = selectedIds }
    }
    setIsBulkEnriching(true)
    bulkEnrichMsg.setMessage(`⏳ Enriching ${ids.length} account${ids.length > 1 ? "s" : ""}... (this may take a minute)`)
    try {
      const res = await api.post<any>("/enrichment/bulk", { prospectIds: ids })
      const { success = 0, failed = 0 } = res?.data || res || {}
      if (failed > 0 && success === 0) {
        bulkEnrichMsg.setMessage(`❌ Enrichment failed for all accounts. Check Gemini API key.`)
      } else if (failed > 0) {
        bulkEnrichMsg.setMessage(`⚠️ ${success} enriched, ${failed} failed`)
      } else {
        bulkEnrichMsg.setMessage(`✅ ${ids.length} account${ids.length > 1 ? "s" : ""} enriched successfully!`)
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Unknown error"
      bulkEnrichMsg.setMessage(`❌ Enrichment failed — ${msg}`)
    } finally {
      setIsBulkEnriching(false)
    }
  }

  const allPageSelected = accounts.length > 0 && accounts.every(a => selectedIds.includes(a._id))
  const hasSelection    = selectedIds.length > 0

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
        <Button variant="link" onClick={() => router.push("/segments")}>Back to Segments</Button>
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

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline" className="gap-2"
                onClick={handleSync}
                disabled={isSyncing || isEnriching}
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>

              <Button
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleEnrich}
                disabled={isEnriching || isSyncing}
              >
                {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isEnriching ? "Enriching..." : "Enrich & Score"}
              </Button>
            </div>

            <AutoDismissBanner
              {...syncMsg}
              className="text-xs text-muted-foreground border-0 bg-transparent px-0 py-0"
            />
            <AutoDismissBanner
              {...enrichMsg}
              className={`text-xs flex items-center gap-1 border-0 bg-transparent px-0 py-0 ${enrichMsg.message.startsWith("Done") ? "text-green-600" : ""}`}
            />
          </div>
        </div>

        {segment.enrichStatus === "running" && (
          <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI Enrichment running in background...
          </div>
        )}

        <AutoDismissBanner
          {...enrichDoneBanner}
          className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
        />

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
                <th className="p-4 w-10">
                  <Checkbox
                    checked={allPageSelected}
                    ref={(el) => { if (el) { const input = el.querySelector('input'); if (input) input.indeterminate = hasSelection && !allPageSelected } }}
                    onCheckedChange={() => {
                      setIsAllSelected(false)
                      if (allPageSelected) setSelectedIds(ids => ids.filter(id => !accounts.map(a => a._id).includes(id)))
                      else { const n = [...selectedIds]; accounts.forEach(a => { if (!n.includes(a._id)) n.push(a._id) }); setSelectedIds(n) }
                    }}
                  />
                </th>
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
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-muted rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No accounts in this segment. Click Sync to refresh.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr
                    key={account._id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.includes(account._id)}
                        onCheckedChange={() => setSelectedIds(ids =>
                          ids.includes(account._id)
                            ? ids.filter(i => i !== account._id)
                            : [...ids, account._id]
                        )}
                      />
                    </td>
                    <td className="p-4 cursor-pointer" onClick={() => router.push(`/accounts/${account._id}`)}>
                      <div className="font-medium text-sm">{account.accountName}</div>
                      {account.website && (
                        <div className="text-xs text-muted-foreground">{account.website}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm">{account.primaryIndustry || "—"}</td>
                    <td className="p-4 text-sm">{account.country || "—"}</td>
                    <td className="p-4 text-sm">{account.noOfEmployees || "—"}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm ${
                          (account.finalScore ?? 0) > 60
                            ? "border-green-500 text-green-600 bg-green-50"
                            : (account.finalScore ?? 0) >= 30
                            ? "border-yellow-500 text-yellow-600 bg-yellow-50"
                            : account.finalScore != null
                            ? "border-red-400 text-red-500 bg-red-50"
                            : "border-gray-300 text-gray-400"
                        }`}>
                          {account.finalScore ?? "—"}
                        </div>
                        {account.clvRanking && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            account.clvRanking.includes("A")
                              ? "bg-green-100 text-green-700"
                              : account.clvRanking.includes("B")
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {account.clvRanking.includes("A") ? "Tier A"
                              : account.clvRanking.includes("B") ? "Tier B"
                              : "Tier C"}
                          </span>
                        )}
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
        {!acLoading && (
          <div className="flex items-center justify-between py-4">
            <span className="text-sm text-muted-foreground">
              TOTAL: <span className="text-primary font-medium">{total} accounts</span>
              {hasSelection && (
                <span className="ml-2 text-muted-foreground">
                  • <span className="text-foreground font-medium">
                    {isAllSelected ? `All ${total}` : selectedIds.length} selected
                  </span>
                </span>
              )}
            </span>
            {total > LIMIT && (
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
            )}
          </div>
        )}

        <div className="h-20" />
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-between z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="sm"
            className={`gap-2 ${hasSelection ? "text-destructive hover:text-destructive" : "text-muted-foreground/40"}`}
            disabled={!hasSelection || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            DELETE
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={!hasSelection || isBulkEnriching}
            className={`gap-2 ${!hasSelection ? "opacity-40" : "border-primary text-primary hover:bg-primary/5"}`}
            onClick={handleBulkEnrich}
          >
            {isBulkEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isBulkEnriching ? "Enriching..." : "AI ENRICH"}
          </Button>
          {bulkEnrichMsg.visible && (
            <AutoDismissBanner {...bulkEnrichMsg} inline />
          )}
        </div>
        <Button
          variant={isAllSelected ? "default" : "outline"}
          size="sm"
          className={isAllSelected ? "bg-primary text-white" : ""}
          onClick={() => {
            if (isAllSelected) { setIsAllSelected(false); setSelectedIds([]) }
            else { setIsAllSelected(true); setSelectedIds(accounts.map(a => a._id)) }
          }}
        >
          {isAllSelected ? `✓ All ${total} Selected` : `Select All `}
        </Button>
      </div>

      {ConfirmDialogHost}
      {AlertHost}
    </div>
  )
}
