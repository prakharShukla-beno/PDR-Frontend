"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSearchParams } from "next/navigation"  // For reading URL params
import {
  Search, Upload, Download, Plus, SlidersHorizontal,
  X, Pencil, ChevronLeft, ChevronRight, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { api, ApiError } from "@/lib/api"
import type { Prospect } from "@/types"
import { FilterPanel, FilterState, EMPTY_FILTERS, buildFilterQuery, countActiveFilters } from "@/components/filters/FilterPanel"

export default function AccountsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()  // Segment URL parameters

  const [prospects, setProspects]           = useState<Prospect[]>([])
  const [total, setTotal]                   = useState(0)
  const [totalPages, setTotalPages]         = useState(1)
  const [isLoading, setIsLoading]           = useState(true)
  const [search, setSearch]                 = useState("")
  const [showFilters, setShowFilters]       = useState(false)
  const [filters, setFilters]               = useState<FilterState>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [currentPage, setCurrentPage]       = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [selectedIds, setSelectedIds]       = useState<string[]>([])
  const [uploadFile, setUploadFile]         = useState<File | null>(null)
  const [isUploading, setIsUploading]       = useState(false)
  const [uploadMsg, setUploadMsg]           = useState("")
  const [showAddModal, setShowAddModal]     = useState(false)
  const [isAdding, setIsAdding]             = useState(false)
  const [addMsg, setAddMsg]                 = useState("")
  const [segmentName, setSegmentName]       = useState("")  // ← Segment name header mein
  const [newAccount, setNewAccount] = useState({
    accountName: "", website: "", primaryIndustry: "",
    businessModel: "", country: "", hqLocationCity: "", source: "",
  })

  // ── Load filters from URL params for segment links ──────────
  // Update filters whenever URL params change
  useEffect(() => {
    if (!searchParams) return

    // Segment name — display in the header
    const name = searchParams.get("segmentName")
    if (name) setSegmentName(name)

    // Check if a segment filter is present
    const hasSegmentFilter =
      searchParams.has("industryInclude[]") ||
      searchParams.has("countryInclude[]") ||
      searchParams.has("techFitScoreMin") ||
      searchParams.has("employeesInclude[]") ||
      searchParams.has("revenueInclude[]") ||
      searchParams.has("intentSignalInclude[]") ||
      searchParams.has("businessModelInclude[]")

    if (!hasSegmentFilter) return

    // Build FilterState from URL params
    const newFilters: FilterState = {
      ...EMPTY_FILTERS,
      // Industries
      industryInclude:      searchParams.getAll("industryInclude[]"),
      // Countries
      countryInclude:       searchParams.getAll("countryInclude[]"),
      // Employees
      employeesInclude:     searchParams.getAll("employeesInclude[]"),
      // Revenue
      revenueInclude:       searchParams.getAll("revenueInclude[]"),
      // Intent signals
      intentSignalInclude:  searchParams.getAll("intentSignalInclude[]"),
      // Business models
      businessModelInclude: searchParams.getAll("businessModelInclude[]"),
      // Tech fit score
      techFitScoreMin: searchParams.get("techFitScoreMin")
        ? Number(searchParams.get("techFitScoreMin"))
        : 0,
      techFitScoreMax: 100,
    }

    // Apply filters
    setAppliedFilters(newFilters)
    setFilters(newFilters)
    setCurrentPage(1)
  }, [searchParams])

  const activeCount = countActiveFilters(appliedFilters)

  const fetchProspects = useCallback(async () => {
    setIsLoading(true)
    try {
      const filterQuery = buildFilterQuery(appliedFilters, "accounts")
      const hasFilters  = filterQuery.length > 0 || search
      let url: string
      if (hasFilters) {
        url = `/search/prospects?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${recordsPerPage}`
        if (filterQuery) url += `&${filterQuery}`
      } else {
        url = `/prospects?page=${currentPage}&limit=${recordsPerPage}`
      }
      const res = await api.get<any>(url)
      setProspects(res.data?.prospects || res.data || res.prospects || [])
      setTotal(res.data?.pagination?.total || res.pagination?.total || 0)
      setTotalPages(res.data?.pagination?.totalPages || res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Prospects fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, recordsPerPage, search, appliedFilters])

  useEffect(() => { fetchProspects() }, [fetchProspects])
  useEffect(() => { setCurrentPage(1) }, [search, appliedFilters, recordsPerPage])

  const getActiveChips = () => {
    const chips: { label: string; onRemove: () => void }[] = []
    const f = appliedFilters
    const rem = (key: keyof FilterState, val: string) =>
      setAppliedFilters(p => ({ ...p, [key]: (p[key] as string[]).filter(v => v !== val) }))
    f.industryInclude.forEach(v      => chips.push({ label: `Industry: ${v}`,      onRemove: () => rem("industryInclude", v) }))
    f.industryExclude.forEach(v      => chips.push({ label: `NOT Industry: ${v}`,  onRemove: () => rem("industryExclude", v) }))
    f.countryInclude.forEach(v       => chips.push({ label: `Country: ${v}`,       onRemove: () => rem("countryInclude", v) }))
    f.countryExclude.forEach(v       => chips.push({ label: `NOT Country: ${v}`,   onRemove: () => rem("countryExclude", v) }))
    f.cityInclude.forEach(v          => chips.push({ label: `City: ${v}`,          onRemove: () => rem("cityInclude", v) }))
    f.cityExclude.forEach(v          => chips.push({ label: `NOT City: ${v}`,      onRemove: () => rem("cityExclude", v) }))
    f.salesPriorityInclude.forEach(v => chips.push({ label: `Priority: ${v}`,      onRemove: () => rem("salesPriorityInclude", v) }))
    f.intentSignalInclude.forEach(v  => chips.push({ label: `Intent: ${v}`,        onRemove: () => rem("intentSignalInclude", v) }))
    f.clvRankingInclude.forEach(v    => chips.push({ label: `CLV: ${v}`,           onRemove: () => rem("clvRankingInclude", v) }))
    f.employeesInclude.forEach(v     => chips.push({ label: `Employees: ${v}`,     onRemove: () => rem("employeesInclude", v) }))
    f.revenueInclude.forEach(v       => chips.push({ label: `Revenue: ${v}`,       onRemove: () => rem("revenueInclude", v) }))
    if (f.techFitScoreMin > 0 || f.techFitScoreMax < 100)
      chips.push({ label: `Score: ${f.techFitScoreMin}-${f.techFitScoreMax}`, onRemove: () => setAppliedFilters(p => ({ ...p, techFitScoreMin: 0, techFitScoreMax: 100 })) })
    return chips
  }

  const handleDelete = async () => {
    if (!selectedIds.length || !confirm(`Do you want to delete ${selectedIds.length} selected prospect(s)?`)) return
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/prospects/${id}`)))
      setSelectedIds([]); fetchProspects()
    } catch { alert("Delete failed.") }
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    try {
      const formData = new FormData(); formData.append("file", uploadFile)
      const res = await api.upload<any>("/import/excel", formData)

      // Response check — are there duplicates?
      const result = res?.data || res
      const duplicates = result?.duplicates || []

      if (duplicates.length > 0) {
        setUploadMsg(`✅ ${result?.successCount || 0} records saved. ${duplicates.length} duplicates need review.`)
        setTimeout(() => router.push("/duplicates"), 1200)
      } else {
        setUploadMsg(`✅ Import complete — ${result?.successCount || 0} records saved.`)
        setTimeout(fetchProspects, 1500)
      }
      setUploadFile(null)
    } catch (err) {
      if (err instanceof ApiError) setUploadMsg(`❌ ${err.message}`)
    } finally { setIsUploading(false) }
  }

  const handleAddAccount = async () => {
    if (!newAccount.accountName.trim()) { setAddMsg("❌ Account name is required."); return }
    setIsAdding(true); setAddMsg("")
    try {
      const payload: any = { ...newAccount, source: newAccount.source || "manual" }
      Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k] })
      await api.post("/prospects", payload)
      setAddMsg("✅ Account created successfully!")
      setTimeout(() => {
        setShowAddModal(false); setAddMsg("")
        setNewAccount({ accountName: "", website: "", primaryIndustry: "", businessModel: "", country: "", hqLocationCity: "", source: "" })
        fetchProspects()
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) setAddMsg(`❌ ${err.message}`)
    } finally { setIsAdding(false) }
  }

  const allPageSelected = prospects.length > 0 && prospects.every(p => selectedIds.includes(p._id))
  const hasSelection    = selectedIds.length > 0
  const chips           = getActiveChips()

  const getScoreColor = (score?: number) => {
    if (!score) return "border-gray-300 text-gray-400"
    if (score >= 90) return "border-green-500 text-green-600"
    if (score >= 70) return "border-yellow-500 text-yellow-600"
    return "border-gray-400 text-gray-500"
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 6) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
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
      <div className="p-6 pb-0 space-y-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Master View
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Accounts
              {/* If segment context exists, show the segment name */}
              {segmentName && (
                <span className="ml-2 text-base font-normal text-primary">
                  — {segmentName}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{total} accounts</p>
          </div>
          <div className="flex gap-3">
            {/* Show clear button if a segment filter is applied */}
            {segmentName && (
              <Button
                variant="outline"
                className="gap-2 text-muted-foreground"
                onClick={() => {
                  setSegmentName("")
                  setAppliedFilters(EMPTY_FILTERS)
                  setFilters(EMPTY_FILTERS)
                  // Clean the URL
                  window.history.replaceState({}, "", "/accounts")
                }}
              >
                <X className="h-4 w-4" />
                Clear Segment Filter
              </Button>
            )}
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadMsg("") } }} />
              <Button variant="outline" className="gap-2" asChild>
                <span><Upload className="h-4 w-4" />Import</span>
              </Button>
            </label>
            {uploadFile && (
              <Button variant="outline" className="gap-2 text-primary border-primary" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload: {uploadFile.name.slice(0, 15)}...
              </Button>
            )}
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={async () => {
                try {
                  await api.post(`/prospects/re-tier`, {})
                  alert("Re-tiering all accounts...")
                  await new Promise(r => setTimeout(r, 1000))
                  fetchProspects()
                } catch (err) {
                  console.error("Re-tier error:", err)
                  alert("Error re-tiering accounts")
                }
              }}
            >
              <Loader2 className="h-4 w-4" />Re-Tier All
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />Add Account
            </Button>
          </div>
        </div>

        {uploadMsg && <div className="text-sm px-3 py-2 rounded-lg border">{uploadMsg}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or domain..." className="pl-9 bg-white"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button
            variant="outline"
            className={`gap-2 bg-white ${activeCount > 0 ? "border-primary text-primary" : ""}`}
            onClick={() => { setFilters(appliedFilters); setShowFilters(true) }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge className="bg-primary text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                {activeCount}
              </Badge>
            )}
          </Button>
          {activeCount > 0 && (
            <Button
              variant="ghost" size="sm"
              className="text-muted-foreground gap-1"
              onClick={() => {
                setAppliedFilters(EMPTY_FILTERS)
                setSegmentName("")
                window.history.replaceState({}, "", "/accounts")
              }}
            >
              <X className="h-3 w-3" />Clear all
            </Button>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                {chip.label}
                <button onClick={chip.onRemove}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-10">
                  <Checkbox checked={allPageSelected}
                    onCheckedChange={() => {
                      if (allPageSelected) setSelectedIds(ids => ids.filter(id => !prospects.map(p => p._id).includes(id)))
                      else { const n = [...selectedIds]; prospects.forEach(p => { if (!n.includes(p._id)) n.push(p._id) }); setSelectedIds(n) }
                    }} />
                </th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">Employees</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">TechFit Score</th>
                <th className="p-4 font-medium">Final Score</th>
                <th className="p-4 font-medium">Tier</th>
                <th className="p-4 font-medium">CLV</th>
                <th className="p-4 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-muted rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : prospects.length === 0 ? (
                <tr><td colSpan={10} className="p-12 text-center text-muted-foreground">
                  {activeCount > 0 ? "No accounts match the filter criteria." : "No accounts available."}
                </td></tr>
              ) : (
                prospects.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <Checkbox checked={selectedIds.includes(p._id)}
                        onCheckedChange={() => setSelectedIds(ids => ids.includes(p._id) ? ids.filter(i => i !== p._id) : [...ids, p._id])} />
                    </td>
                    <td className="p-4">
                      <Link href={`/accounts/${p._id}`} className="hover:underline">
                        <div className="font-medium text-foreground">{p.accountName}</div>
                        <div className="text-sm text-muted-foreground">{p.website}</div>
                      </Link>
                    </td>
                    <td className="p-4 text-sm">{p.primaryIndustry || "—"}</td>
                    <td className="p-4 text-sm">{p.noOfEmployees || "—"}</td>
                    <td className="p-4 text-sm">{[p.hqLocationCity, p.country].filter(Boolean).join(", ") || "—"}</td>
                    <td className="p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm ${getScoreColor(p.techFitScore)}`}>
                        {p.techFitScore ?? "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm ${
                        p.finalScore && p.finalScore >= 60 ? "bg-green-50 text-green-700 border-green-200" :
                        p.finalScore && p.finalScore >= 30 ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>
                        {p.finalScore !== undefined ? Math.round(p.finalScore) : "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border
                        ${p.finalScore && p.finalScore >= 60 ? "bg-green-50 text-green-700 border-green-200" :
                          p.finalScore && p.finalScore >= 30 ? "bg-blue-50 text-blue-700 border-blue-200" :
                          p.finalScore !== undefined ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {p.finalScore && p.finalScore >= 60 ? "Tier A" :
                         p.finalScore && p.finalScore >= 30 ? "Tier B" :
                         p.finalScore !== undefined ? "Tier C" : "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border
                        ${p.clvRanking?.includes("A") ? "bg-green-50 text-green-700 border-green-200" :
                          p.clvRanking?.includes("B") ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {p.clvRanking?.split(" ")[0] || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full
                          ${p.salesPriority?.startsWith("P1") ? "bg-green-500" :
                            p.salesPriority?.startsWith("P2") ? "bg-yellow-500" : "bg-gray-400"}`} />
                        <span className="text-sm">
                          {p.salesPriority?.startsWith("P1") ? "Sales-Ready" :
                           p.salesPriority?.startsWith("P2") ? "Nurturing" : p.salesPriority ?? "New"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between py-4">
          <span className="text-sm text-muted-foreground">
            TOTAL: <span className="text-primary font-medium">{total} accounts</span>
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? <span key={`d${i}`} className="px-1 text-muted-foreground">...</span> :
              <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm"
                className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-white" : ""}`}
                onClick={() => setCurrentPage(Number(page))}>{page}</Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            <Select value={recordsPerPage.toString()} onValueChange={(v) => setRecordsPerPage(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 bg-white ml-2"><SelectValue /></SelectTrigger>
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

      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-center gap-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50"}`} disabled={!hasSelection} onClick={handleDelete}>
          <X className="h-4 w-4" />DELETE
        </Button>
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50"}`} disabled={!hasSelection}>
          <Pencil className="h-4 w-4" />EDIT
        </Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>ADD TO SEGMENT</Button>
        <div className="flex items-center gap-2 ml-4 border-l pl-4">
          <Checkbox
            checked={selectedIds.length === total && total > 0}
            onCheckedChange={() => selectedIds.length === total ? setSelectedIds([]) : setSelectedIds(prospects.map(p => p._id))}
          />
          <span className="text-sm font-medium">SELECT ALL</span>
        </div>
      </div>

      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
        onApply={() => setAppliedFilters(filters)}
        mode="accounts"
      />

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogDescription className="sr-only">Create a new account.</DialogDescription>
          <DialogHeader><DialogTitle>Add New Account</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Account Name *</Label>
              <Input placeholder="e.g. Acme Corp" value={newAccount.accountName}
                onChange={(e) => setNewAccount(p => ({ ...p, accountName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Website</Label>
                <Input placeholder="acme.com" value={newAccount.website}
                  onChange={(e) => setNewAccount(p => ({ ...p, website: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Country</Label>
                <Input placeholder="e.g. India" value={newAccount.country}
                  onChange={(e) => setNewAccount(p => ({ ...p, country: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Industry</Label>
                <Select value={newAccount.primaryIndustry} onValueChange={(v) => setNewAccount(p => ({ ...p, primaryIndustry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["SaaS","Fintech","Healthcare","E-commerce","Logistics","Manufacturing","EdTech","BFSI","IT & ITES"].map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Business Model</Label>
                <Select value={newAccount.businessModel} onValueChange={(v) => setNewAccount(p => ({ ...p, businessModel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["B2B","B2C","B2B2C","D2C","E-Commerce","Marketplace"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select></div>
            </div>
            {addMsg && <div className="text-sm px-3 py-2 rounded-lg border">{addMsg}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddAccount} disabled={isAdding} className="gap-2">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAdding ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Review Modal — shown after upload */}
    </div>
  )
}
