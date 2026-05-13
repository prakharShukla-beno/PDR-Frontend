"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Search, Upload, Plus, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import type { Prospect } from "@/types"

export default function AccountsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [industry, setIndustry] = useState("all")
  const [priority, setPriority] = useState("all")
  const [industries, setIndustries] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const limit = 10

  // Prospects fetch karo
  const fetchProspects = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = `/search/prospects?page=${currentPage}&limit=${limit}`
      if (search) url += `&query=${encodeURIComponent(search)}`
      if (industry !== "all") url += `&primaryIndustry=${encodeURIComponent(industry)}`
      if (priority !== "all") url += `&salesPriority=${encodeURIComponent(priority)}`
      const res = await api.get<any>(url)
      setProspects(res.data ||[])
      setTotalPages(res.data?.pagination?.totalPages || res.pagination?.totalPages || 1)
      setTotal(res.data?.pagination?.total || res.pagination?.total || 0)
    } catch (err) {
      console.error("Prospects fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, search, industry, priority])

  // Filter options fetch karo
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

  // Search debounce
  useEffect(() => {
    setCurrentPage(1)
  }, [search, industry, priority])

  // Delete prospect
  const handleDelete = async (id: string) => {
    if (!confirm("Ye prospect delete karna chahte ho?")) return
    try {
      await api.delete(`/prospects/${id}`)
      fetchProspects()
    } catch (err) {
      alert("Delete nahi ho saka.")
    }
  }

  // Excel upload
  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    setUploadMsg("")
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      const res = await api.upload<any>("/import/excel", formData)
      setUploadMsg(`✅ Import complete: ${res.data?.successCount ?? 0} records added`)
      setUploadFile(null)
      fetchProspects()
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadMsg(`❌ Error: ${err.message}`)
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Select all toggle
  const allSelected = prospects.length > 0 && prospects.every(p => selectedIds.includes(p._id))
  const toggleAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(prospects.map(p => p._id))
  }

  const getPriorityColor = (priority?: string) => {
    if (priority === "P1") return "bg-red-100 text-red-700"
    if (priority === "P2") return "bg-orange-100 text-orange-700"
    if (priority === "P3") return "bg-yellow-100 text-yellow-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-muted-foreground">{total} total prospects</p>
        </div>
        <div className="flex gap-2">
          {/* Upload */}
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              accept=".xlsx"
              className="w-48 h-9 text-xs"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              className="h-9 gap-2"
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import
            </Button>
          </div>
          <Link href="/accounts/new">
            <Button className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Upload message */}
      {uploadMsg && (
        <div className="rounded-lg border px-4 py-2 text-sm">{uploadMsg}</div>
      )}

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
            <SelectItem value="P4">P4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-3 w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="p-3 text-left font-medium">Account</th>
              <th className="p-3 text-left font-medium">Industry</th>
              <th className="p-3 text-left font-medium">Country</th>
              <th className="p-3 text-left font-medium">Priority</th>
              <th className="p-3 text-left font-medium">Score</th>
              <th className="p-3 text-left font-medium">Source</th>
              <th className="p-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Koi accounts nahi mile.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr key={prospect._id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(prospect._id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds([...selectedIds, prospect._id])
                        else setSelectedIds(selectedIds.filter(id => id !== prospect._id))
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <Link href={`/accounts/${prospect._id}`} className="hover:underline font-medium">
                      {prospect.accountName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{prospect.website}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{prospect.primaryIndustry || "—"}</td>
                  <td className="p-3 text-muted-foreground">{prospect.country || "—"}</td>
                  <td className="p-3">
                    {prospect.salesPriority ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(prospect.salesPriority)}`}>
                        {prospect.salesPriority}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {prospect.techFitScore ?? "—"}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{prospect.source || "—"}</td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(prospect._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} — {total} total
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}