"use client"

// ─────────────────────────────────────────────
// Accounts Page — Master View
// Figma design same to same rakha hai
// Real API calls:
//   GET /api/search/prospects — list with filters + pagination
//   GET /api/search/filters   — industry dropdown options
//   DELETE /api/prospects/:id — row delete
//   POST /api/import/excel    — Excel file upload
// ─────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Search, Upload, Download, Plus, Filter,
  Columns, X, Pencil, ChevronLeft, ChevronRight, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import type { Prospect } from "@/types"

export default function AccountsPage() {
  // ── Data state ──────────────────────────────
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // ── Filter state ────────────────────────────
  const [search, setSearch] = useState("")
  const [industry, setIndustry] = useState("all")
  const [status, setStatus] = useState("all")
  const [industries, setIndustries] = useState<string[]>([])

  // ── Pagination state ────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)

  // ── Selection state ─────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // ── Upload state ────────────────────────────
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")

  // ── GET /api/search/prospects ───────────────
  const fetchProspects = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = `/prospects?page=${currentPage}&limit=${recordsPerPage}`
      if (search) url += `&query=${encodeURIComponent(search)}`
      if (industry !== "all") url += `&primaryIndustry=${encodeURIComponent(industry)}`
      if (status !== "all") url += `&salesPriority=${encodeURIComponent(status)}`

      const res = await api.get<any>(url)
      console.log("API Response========================================: ", res)
      setProspects(res.data || res.prospects || [])
      setTotal(res.data?.pagination?.total || res.pagination?.total || 0)
      setTotalPages(res.data?.pagination?.totalPages || res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Prospects fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, recordsPerPage, search, industry, status])

  // ── GET /api/search/filters ─────────────────
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await api.get<any>("/search/filters")
        setIndustries(res.data?.primaryIndustry || res.primaryIndustry || [])
      } catch (err) {
        console.error("Filters fetch error:", err)
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchProspects()
  }, [fetchProspects])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, industry, status, recordsPerPage])

  // ── DELETE /api/prospects/:id ───────────────
  const handleDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`${selectedIds.length} prospect(s) delete karna chahte ho?`)) return
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/prospects/${id}`)))
      setSelectedIds([])
      fetchProspects()
    } catch {
      alert("Delete nahi ho saka.")
    }
  }

  // ── POST /api/import/excel ──────────────────
  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    setUploadMsg("")
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      const res = await api.upload<any>("/import/excel", formData)
      setUploadMsg(`✅ ${res.data?.successCount ?? 0} records imported`)
      setUploadFile(null)
      fetchProspects()
    } catch (err) {
      if (err instanceof ApiError) setUploadMsg(`❌ ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  // ── Selection helpers ───────────────────────
  const allPageSelected = prospects.length > 0 && prospects.every(p => selectedIds.includes(p._id))
  const allSelected = selectedIds.length === total && total > 0
  const hasSelection = selectedIds.length > 0

  const toggleAll = () => {
    if (allPageSelected) setSelectedIds(ids => ids.filter(id => !prospects.map(p => p._id).includes(id)))
    else {
      const newIds = [...selectedIds]
      prospects.forEach(p => { if (!newIds.includes(p._id)) newIds.push(p._id) })
      setSelectedIds(newIds)
    }
  }

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(prospects.map(p => p._id))
  }

  const toggleOne = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  // ── Score circle color ──────────────────────
  const getScoreColor = (score?: number) => {
    if (!score) return "border-gray-300 text-gray-400"
    if (score >= 90) return "border-primary text-primary"
    if (score >= 70) return "border-yellow-500 text-yellow-600"
    return "border-gray-400 text-gray-500"
  }

  // ── Pagination numbers ──────────────────────
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (currentPage > 4) pages.push("...")
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
      if (currentPage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* ── Header ── */}
      <div className="p-6 pb-0 space-y-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Master View</p>
            <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
            <p className="text-sm text-muted-foreground">{total} of {total} accounts</p>
          </div>
          <div className="flex gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) { setUploadFile(file); setUploadMsg("") }
                }}
              />
              <Button variant="outline" className="gap-2" asChild>
                <span><Upload className="h-4 w-4" />Import</span>
              </Button>
            </label>
            {uploadFile && (
              <Button
                variant="outline"
                className="gap-2 text-primary border-primary"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload: {uploadFile.name.slice(0, 15)}...
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />Export
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />Add Account
            </Button>
          </div>
        </div>

        {uploadMsg && <div className="text-sm px-3 py-2 rounded-lg border">{uploadMsg}</div>}

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or domain..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="P1">Sales-Ready</SelectItem>
              <SelectItem value="P2">Nurturing</SelectItem>
              <SelectItem value="P3">New</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-white">
            <Filter className="h-4 w-4" />Build Segment
          </Button>
          <Button variant="outline" className="gap-2 bg-white">
            <Columns className="h-4 w-4" />Columns
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-10">
                  <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} />
                </th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">Employees</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Lead Score ↑↓</th>
                <th className="p-4 font-medium">Source</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: recordsPerPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-4 bg-muted rounded" /></td>
                    <td className="p-4">
                      <div className="h-4 w-32 bg-muted rounded mb-1" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </td>
                    <td className="p-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-10 w-10 bg-muted rounded-full" /></td>
                    <td className="p-4"><div className="h-6 w-16 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                  </tr>
                ))
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    Koi accounts nahi mile. Import karo ya search change karo.
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr key={prospect._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.includes(prospect._id)}
                        onCheckedChange={() => toggleOne(prospect._id)}
                      />
                    </td>
                    <td className="p-4">
                      <Link href={`/accounts/${prospect._id}`} className="hover:underline">
                        <div className="font-medium text-foreground">{prospect.accountName}</div>
                        <div className="text-sm text-muted-foreground">{prospect.website}</div>
                      </Link>
                    </td>
                    <td className="p-4 text-sm">{prospect.primaryIndustry || "—"}</td>
                    <td className="p-4 text-sm">{prospect.noOfEmployees || "—"}</td>
                    <td className="p-4 text-sm">
                      {[prospect.hqLocationCity, prospect.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm ${getScoreColor(prospect.techFitScore)}`}>
                        {prospect.techFitScore ?? "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-md border bg-white px-2.5 py-1 text-xs font-medium">
                        {prospect.source || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">
                          {prospect.salesPriority === "P1" ? "Sales-Ready" :
                           prospect.salesPriority === "P2" ? "Nurturing" :
                           prospect.salesPriority ? prospect.salesPriority : "New"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">
              SELECTED: <span className="font-medium text-foreground">{selectedIds.length}/{total}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              TOTAL: <span className="text-primary font-medium">{total} accounts</span>
            </span>
          </div>
          <Button variant="outline" size="sm" className="bg-white">SHOW MORE</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-white" : ""}`}
                  onClick={() => setCurrentPage(Number(page))}
                >
                  {page}
                </Button>
              )
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-4">RECORDS:</span>
            <Select value={recordsPerPage.toString()} onValueChange={(v) => setRecordsPerPage(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="h-20" />
      </div>

      {/* ── Fixed Bottom Bar ── */}
      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-center gap-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50 cursor-not-allowed"}`} disabled={!hasSelection} onClick={handleDelete}>
          <X className="h-4 w-4" />DELETE
        </Button>
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50 cursor-not-allowed"}`} disabled={!hasSelection}>
          <Pencil className="h-4 w-4" />EDIT
        </Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>START DIALING</Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>SEND WHATSAPP MESSAGE</Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={`gap-2 ${!hasSelection ? "opacity-50" : ""}`}>
          SELECT ACTION <Download className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 ml-4 border-l pl-4">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          <span className="text-sm font-medium">SELECT ALL</span>
        </div>
      </div>

    </div>
  )
}