"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import {
  Loader2, GitMerge, SkipForward, Copy, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, Filter, ChevronDown, ChevronUp,
  CheckSquare, Square
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api }      from "@/lib/api"
import type { Duplicate, Prospect } from "@/types"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"

const LIMIT = 100

const ACCOUNT_FIELDS = [
  { key: "accountName",      label: "Account Name"   },
  { key: "primaryIndustry",  label: "Industry"       },
  { key: "businessModel",    label: "Business Model" },
  { key: "country",          label: "Country"        },
  { key: "hqLocationCity",   label: "City"           },
  { key: "noOfEmployees",    label: "Employees"      },
  { key: "annualRevenue",    label: "Revenue"        },
  { key: "website",          label: "Website"        },
  { key: "primaryTechStack", label: "Tech Stack"     },
  { key: "salesPriority",    label: "Sales Priority" },
  { key: "clvRanking",       label: "CLV Ranking"    },
  { key: "intentSignal",     label: "Intent Signal"  },
  { key: "techFitScore",     label: "TechFit Score"  },
]

const CONTACT_FIELDS = [
  { key: "firstName",         label: "First Name"  },
  { key: "lastName",          label: "Last Name"   },
  { key: "email",             label: "Email"       },
  { key: "primaryPhone",      label: "Phone 1"     },
  { key: "secondaryPhone",    label: "Phone 2"     },
  { key: "standardizedRoles", label: "Role"        },
  { key: "functionalDomain",  label: "Department"  },
  { key: "accountName",       label: "Account"     },
  { key: "linkedIn",          label: "LinkedIn"    },
  { key: "country",           label: "Country"     },
]

const CONTACT_KEYS = ["email","firstName","lastName","primaryPhone","secondaryPhone","standardizedRoles","functionalDomain","linkedIn"]
const ACCOUNT_KEYS = ["accountName","primaryIndustry","businessModel","country","hqLocationCity","noOfEmployees","annualRevenue","website"]

const isContactDup = (dup: Duplicate) => {
  if (dup.entityType === "Contact") return true
  if (dup.entityType === "Prospect") return false
  const fields = new Set(dup.matchFields || [])
  if (fields.has("email") && !fields.has("accountName")) return true
  if (fields.has("accountName") && !fields.has("email")) return false
  const obj = typeof dup.prospectId1 === "object" ? dup.prospectId1 as any : {}
  const inc  = dup.newData as any || {}
  const hasC = CONTACT_KEYS.some(k => obj[k] || inc[k])
  const hasA = ACCOUNT_KEYS.some(k => obj[k] || inc[k])
  if (hasC && !hasA) return true
  if (hasA && !hasC) return false
  return fields.has("email")
}

const getVal = (obj: any, key: string) => obj?.[key] ?? "—"

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    merged:    "bg-green-50 text-green-700 border-green-200",
    skipped:   "bg-gray-50 text-gray-600 border-gray-200",
    kept_both: "bg-blue-50 text-blue-700 border-blue-200",
    dismissed: "bg-gray-50 text-gray-400 border-gray-200",
  }
  const label: Record<string, string> = {
    pending: "Pending", merged: "Merged", skipped: "Skipped",
    kept_both: "Kept Both", dismissed: "Dismissed",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {label[status] ?? status}
    </span>
  )
}

function DuplicateRow({
  dup, onAction, actionId, selected, onSelect,
}: {
  dup: Duplicate
  onAction: (id: string, action: "merge" | "skip" | "keep-both" | "delete") => void
  actionId: string | null
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const fields    = isContactDup(dup) ? CONTACT_FIELDS : ACCOUNT_FIELDS
  const existing  = dup.prospectId1 as any
  const incoming  = dup.newData as any
  const loading   = actionId === dup._id
  const isPending = dup.status === "pending"

  const existingName = existing?.accountName ||
    [existing?.firstName, existing?.lastName].filter(Boolean).join(" ") ||
    "Existing Record"

  const incomingName = incoming?.accountName ||
    [incoming?.firstName, incoming?.lastName].filter(Boolean).join(" ") ||
    "New Record"

  return (
    <div className={`border rounded-xl overflow-hidden bg-white transition-shadow ${selected ? "border-primary shadow-sm" : "border-border"}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {isPending && (
          <div onClick={e => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={v => onSelect(dup._id, !!v)} />
          </div>
        )}

        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{existingName}</span>
              <span className="text-muted-foreground text-xs">vs</span>
              <span className="font-medium text-sm truncate text-blue-700">{incomingName}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {dup.matchFields?.map(f => (
                <Badge key={f} variant="secondary" className="text-xs py-0">matched: {f}</Badge>
              ))}
              <Badge variant="outline" className={`text-xs py-0 ${isContactDup(dup) ? "text-purple-700 border-purple-200 bg-purple-50" : "text-blue-700 border-blue-200 bg-blue-50"}`}>
                {isContactDup(dup) ? "Contact" : "Account"}
              </Badge>
            </div>
          </div>
          <StatusBadge status={dup.status} />
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        </div>

        {isPending && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
            <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white h-7 px-2.5 text-xs" disabled={loading} onClick={() => onAction(dup._id, "merge")}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitMerge className="h-3 w-3" />}Merge
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 px-2.5 text-xs" disabled={loading} onClick={() => onAction(dup._id, "skip")}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <SkipForward className="h-3 w-3" />}Skip
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50" disabled={loading} onClick={() => onAction(dup._id, "keep-both")}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}Keep Both
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50" disabled={loading} onClick={() => onAction(dup._id, "delete")}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}Delete
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border">
          <div className="grid grid-cols-2 border-b border-border">
            <div className="px-4 py-2.5 bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Existing (in DB)</p>
            </div>
            <div className="px-4 py-2.5 bg-blue-50">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New (from file)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="divide-y divide-border">
              {fields.map(({ key, label }) => {
                const oldVal = getVal(existing, key)
                const newVal = incoming ? getVal(incoming, key) : "—"
                const diff   = oldVal !== newVal && oldVal !== "—" && newVal !== "—"
                if (oldVal === "—" && newVal === "—") return null
                return (
                  <div key={`old-${key}`} className={`px-4 py-2.5 ${diff ? "bg-amber-50/40" : ""}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-sm font-medium ${diff ? "text-amber-800" : "text-foreground"}`}>{oldVal}</p>
                  </div>
                )
              })}
            </div>
            <div className="divide-y divide-border">
              {fields.map(({ key, label }) => {
                const oldVal = getVal(existing, key)
                const newVal = incoming ? getVal(incoming, key) : "—"
                const diff   = oldVal !== newVal && oldVal !== "—" && newVal !== "—"
                if (oldVal === "—" && newVal === "—") return null
                return (
                  <div key={`new-${key}`} className={`px-4 py-2.5 ${diff ? "bg-blue-50/40" : ""}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-sm font-medium ${diff ? "text-blue-800" : "text-foreground"}`}>
                      {newVal}
                      {diff && newVal !== "—" && <span className="ml-1.5 text-xs text-blue-500 font-normal">(updated)</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          {!isPending && (
            <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Reviewed — <StatusBadge status={dup.status} /></span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DuplicatesPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const refreshKey = searchParams.get("refresh")
  const entityFromUrl = searchParams.get("entityType")
  const [duplicates,    setDuplicates]    = useState<Duplicate[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [total,         setTotal]         = useState(0)
  const [totalPages,    setTotalPages]    = useState(1)
  const [currentPage,   setCurrentPage]   = useState(1)
  const [statusFilter,  setStatusFilter]  = useState("pending")
  const [entityFilter,  setEntityFilter]  = useState<"all" | "Prospect" | "Contact">("all")
  const [accountCount,  setAccountCount]  = useState(0)
  const [contactCount,  setContactCount]  = useState(0)
  const [actionId,      setActionId]      = useState<string | null>(null)
  const toastMsg = useAutoDismissMessage()
  const [selectedIds,   setSelectedIds]   = useState<string[]>([])
  const [allPagesSelected, setAllPagesSelected] = useState(false) // ← selection across all pages
  const [fetchingAllIds,   setFetchingAllIds]   = useState(false) // ← loading state
  const [bulkLoading,   setBulkLoading]   = useState(false)

  const pageRef       = useRef(currentPage)
  const statusRef     = useRef(statusFilter)
  const entityRef     = useRef(entityFilter)
  pageRef.current     = currentPage
  statusRef.current   = statusFilter
  entityRef.current   = entityFilter

  const showToast = (msg: string) => toastMsg.setMessage(msg)

  const fetchDuplicates = useCallback(async (
    page: number,
    status: string,
    entity: "all" | "Prospect" | "Contact" = "all"
  ) => {
    setIsLoading(true)
    setSelectedIds([])
    setAllPagesSelected(false)
    try {
      const entityParam = entity !== "all" ? `&entityType=${entity}` : ""
      const res = await api.get<any>(
        `/duplicates?status=${status}&page=${page}&limit=${LIMIT}${entityParam}`
      )
      const raw = res.data?.data || res.data?.duplicates || res.data || []
      const valid = Array.isArray(raw)
        ? raw.filter((d: any) => d?.prospectId1 != null || d?.newData)
        : []
      const nextTotal = res.data?.pagination?.total || res.pagination?.total || 0
      const nextAccounts = res.data?.counts?.accounts ?? res.counts?.accounts ?? 0
      const nextContacts = res.data?.counts?.contacts ?? res.counts?.contacts ?? 0
      setDuplicates(valid)
      setTotal(nextTotal)
      setTotalPages(res.data?.pagination?.totalPages || res.pagination?.totalPages || 1)
      setAccountCount(nextAccounts)
      setContactCount(nextContacts)
      return { total: nextTotal, accounts: nextAccounts, contacts: nextContacts }
    } catch (err) {
      console.error("Duplicates fetch error:", err)
      return { total: 0, accounts: 0, contacts: 0 }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const entity: "all" | "Prospect" | "Contact" =
      entityFromUrl === "Contact" || entityFromUrl === "Prospect"
        ? entityFromUrl
        : "all"

    setEntityFilter(entity)
    setCurrentPage(1)

    let cancelled = false

    const load = async (attempt = 0) => {
      if (cancelled) return
      const result = await fetchDuplicates(1, "pending", entity)
      const found =
        (entity === "Prospect" && result.accounts > 0) ||
        (entity === "Contact" && result.contacts > 0) ||
        (entity === "all" && result.total > 0)

      if (refreshKey && !found && attempt < 10) {
        await new Promise((r) => setTimeout(r, 600))
        if (!cancelled) await load(attempt + 1)
      }
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, entityFromUrl, pathname])

  const handleStatusChange = (val: string) => {
    setStatusFilter(val)
    setCurrentPage(1)
    fetchDuplicates(1, val, entityRef.current)
  }

  const handleEntityChange = (val: "all" | "Prospect" | "Contact") => {
    setEntityFilter(val)
    setCurrentPage(1)
    fetchDuplicates(1, statusRef.current, val)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchDuplicates(newPage, statusRef.current, entityRef.current)
  }

  // ── Select All on current page ────────────────────────────────────────────
  const pendingDups  = duplicates.filter(d => d.status === "pending")
  const pageAllSelected = pendingDups.length > 0 && pendingDups.every(d => selectedIds.includes(d._id))
  const someSelected    = selectedIds.length > 0

  const togglePageSelect = () => {
    if (pageAllSelected) {
      setSelectedIds([])
      setAllPagesSelected(false)
    } else {
      setSelectedIds(pendingDups.map(d => d._id))
    }
  }

  // ── Select ALL records across all pages ───────────────────────────────────
  const selectAllPages = async () => {
    setFetchingAllIds(true)
    try {
      // Fetch all IDs from backend — only _id field
      const res = await api.get<any>(
        `/duplicates?status=${statusRef.current}&page=1&limit=999999&fields=_id`
      )
      const raw = res.data?.data || res.data?.duplicates || res.data || []
      const allIds = raw
        .filter((d: any) => d?.prospectId1 != null)
        .map((d: any) => d._id)
      setSelectedIds(allIds)
      setAllPagesSelected(true)
      showToast(`✅ All ${allIds.length} records selected`)
    } catch (err) {
      showToast("❌ Could not select all records")
    } finally {
      setFetchingAllIds(false)
    }
  }

  const clearSelection = () => {
    setSelectedIds([])
    setAllPagesSelected(false)
  }

  const handleAction = async (id: string, action: "merge" | "skip" | "keep-both" | "delete") => {
    setActionId(id)
    try {
      if (action === "delete") {
        await api.delete(`/duplicates/${id}`)
      } else {
        await api.put(`/duplicates/${id}/${action}`, {})
      }
      const labels: Record<string, string> = {
        merge: "Merged", skip: "Skipped",
        "keep-both": "Saved as new record", delete: "Deleted",
      }
      showToast(`✅ ${labels[action]} successfully`)
      fetchDuplicates(pageRef.current, statusRef.current, entityRef.current)
    } catch (err: any) {
      showToast(`❌ Action failed — ${err?.message || "try again"}`)
    } finally {
      setActionId(null)
    }
  }

  const handleBulkAction = async (action: "merge" | "skip" | "keep-both" | "delete") => {
    if (!selectedIds.length) return
    setBulkLoading(true)
    try {
      const res = await api.post<any>("/duplicates/bulk", { ids: selectedIds, action })
      const result  = res?.data?.data || res?.data
      const success = result?.success ?? selectedIds.length
      const failed  = result?.failed  ?? 0
      showToast(`✅ Bulk ${action}: ${success} done${failed > 0 ? `, ${failed} failed` : ""}`)
      fetchDuplicates(pageRef.current, statusRef.current, entityRef.current)
    } catch (err: any) {
      showToast(`❌ Bulk action failed — ${err?.message || "try again"}`)
    } finally {
      setBulkLoading(false)
      setSelectedIds([])
      setAllPagesSelected(false)
    }
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {toastMsg.visible && (
        <AutoDismissBanner
          {...toastMsg}
          className="fixed top-4 right-4 z-50 shadow-lg font-medium bg-white"
          onDismiss={toastMsg.clearMessage}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Admin</p>
          <h1 className="text-2xl font-bold">Duplicates</h1>
          <p className="text-sm text-muted-foreground">
            {total} shown · {accountCount} accounts · {contactCount} contacts · Page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
              <SelectItem value="kept_both">Kept Both</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Entity type tabs */}
      <div className="flex items-center gap-2">
        {([
          ["all", `All (${accountCount + contactCount})`],
          ["Prospect", `Accounts (${accountCount})`],
          ["Contact", `Contacts (${contactCount})`],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={entityFilter === value ? "default" : "outline"}
            className="h-8"
            onClick={() => handleEntityChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Info banner */}
      {statusFilter === "pending" && !isLoading && duplicates.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>{total} duplicate records</strong> need your review ({totalPages} pages × {LIMIT}/page).
            Click any row to expand and compare.
          </div>
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {statusFilter === "pending" && pendingDups.length > 0 && (
        <div className={`rounded-lg border px-4 py-2.5 space-y-2 transition-colors ${someSelected ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}>

          {/* Row 1 — Select controls */}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={togglePageSelect}
            >
              {pageAllSelected
                ? <CheckSquare className="h-4 w-4 text-primary" />
                : <Square className="h-4 w-4" />}
              {pageAllSelected
                ? `Deselect Page (${pendingDups.length})`
                : `Select Page (${pendingDups.length})`}
            </button>

            {/* "Select all N" banner — Apollo style */}
            {pageAllSelected && !allPagesSelected && total > LIMIT && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">
                  Only {pendingDups.length} on this page are selected.
                </span>
                <button
                  className="text-primary font-medium hover:underline flex items-center gap-1"
                  onClick={selectAllPages}
                  disabled={fetchingAllIds}
                >
                  {fetchingAllIds
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Fetching...</>
                    : `Select all ${total}`
                  }
                </button>
              </div>
            )}

            {/* All pages selected indicator */}
            {allPagesSelected && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">|</span>
                <span className="text-primary font-medium">
                  ✓ All {selectedIds.length} records selected
                </span>
                <button
                  className="text-muted-foreground hover:text-foreground underline text-xs"
                  onClick={clearSelection}
                >
                  Clear
                </button>
              </div>
            )}

            {someSelected && !allPagesSelected && !pageAllSelected && (
              <span className="text-sm font-medium text-primary ml-1">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* Row 2 — Bulk action buttons */}
          {someSelected && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                for selected records:
              </span>
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("merge")}
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitMerge className="h-3 w-3" />}
                Merge Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("skip")}
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <SkipForward className="h-3 w-3" />}
                Skip Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("keep-both")}
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
                Keep Both Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("delete")}
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Delete Selected
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                onClick={clearSelection}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && duplicates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <CheckCircle className="h-12 w-12 text-green-400" />
          <p className="font-medium">
            {statusFilter === "pending" ? "No pending duplicates" : `No ${statusFilter} duplicates`}
          </p>
          <p className="text-sm text-muted-foreground">
            {statusFilter === "pending" ? "All reviewed!" : "Try a different status filter."}
          </p>
        </div>
      )}

      {/* Rows */}
      {!isLoading && duplicates.length > 0 && (
        <div className="space-y-3">
          {duplicates.map(dup => (
            <DuplicateRow
              key={dup._id}
              dup={dup}
              onAction={handleAction}
              actionId={actionId}
              selected={selectedIds.includes(dup._id)}
              onSelect={(id, checked) =>
                setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * LIMIT) + 1}–{Math.min(currentPage * LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span key={`d${i}`} className="px-2 text-muted-foreground text-sm">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-white" : ""}`}
                  onClick={() => handlePageChange(Number(page))}
                >
                  {page}
                </Button>
              )
            )}

            <Button variant="outline" size="icon" className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
