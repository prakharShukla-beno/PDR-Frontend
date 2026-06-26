"use client"

import { useCallback, useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Brain, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, ApiError } from "@/lib/api"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"
import { useAuth } from "@/context/AuthContext"
import { canEditContent, isPermissionError, permissionDeniedMessage } from "@/lib/permissions"
import { EditorBlockedState } from "@/components/EditorBlockedState"
import { SegmentSearchTab } from "@/components/segments/segment-search-tab"
import { SegmentFilterTab } from "@/components/segments/segment-filter-tab"
import {
  SegmentRightPanel,
  type SegmentAccount,
} from "@/components/segments/segment-right-panel"
import {
  EMPTY_SEGMENT_FILTERS,
  SEGMENT_SECTION_HEADER_CLASS,
  buildSavedFilters,
  hasActiveSegmentFilters,
  type SegmentFilterState,
} from "@/lib/segment-builder-constants"
import { buildSegmentFilterQuery } from "@/lib/segment-filter-query"
import { parseProspectListResponse } from "@/lib/segment-api-utils"

interface SegmentBuilderProps {
  mode: "create" | "edit"
  segmentId?: string
}

function SegmentBuilderContent({ mode, segmentId }: SegmentBuilderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromIcpId = searchParams.get("from_icp")
  const { user, isLoading: authLoading } = useAuth()
  const canEdit = canEditContent(user?.role)

  const [activeTab, setActiveTab] = useState<"search" | "filter">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isShared, setIsShared] = useState(false)
  const [icpName, setIcpName] = useState("")
  const [filters, setFilters] = useState<SegmentFilterState>(EMPTY_SEGMENT_FILTERS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<SegmentAccount[]>([])
  const [previewAccounts, setPreviewAccounts] = useState<SegmentAccount[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingIcp, setIsLoadingIcp] = useState(false)
  const [isLoadingSegment, setIsLoadingSegment] = useState(mode === "edit")

  const saveMsg = useAutoDismissMessage({
    onAutoDismiss: () => router.push("/segments"),
  })

  const mergeSelectedAccounts = useCallback(
    (prev: SegmentAccount[], incoming: SegmentAccount[]) => {
      const seen = new Set(prev.map((a) => String(a._id)))
      const added = incoming.filter((a) => {
        const id = String(a._id)
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
      return added.length ? [...prev, ...added] : prev
    },
    []
  )

  const mergeSelectedIds = useCallback((prev: string[], incoming: string[]) => {
    const seen = new Set(prev.map(String))
    const added = incoming.filter((id) => {
      const key = String(id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return added.length ? [...prev, ...added] : prev
  }, [])

  const addMultiple = useCallback(
    (accounts: SegmentAccount[]) => {
      const valid = accounts.filter((a) => a._id != null && String(a._id) !== "")
      if (!valid.length) return
      setSelectedAccounts((prev) => mergeSelectedAccounts(prev, valid))
      setSelectedIds((prev) =>
        mergeSelectedIds(
          prev,
          valid.map((a) => String(a._id))
        )
      )
    },
    [mergeSelectedAccounts, mergeSelectedIds]
  )

  const removeAccount = useCallback((accountId: string) => {
    const id = String(accountId)
    setSelectedIds((prev) => prev.filter((existing) => String(existing) !== id))
    setSelectedAccounts((prev) => prev.filter((a) => String(a._id) !== id))
  }, [])

  const clearAll = useCallback(() => {
    setSelectedIds([])
    setSelectedAccounts([])
  }, [])

  useEffect(() => {
    setPreviewAccounts([])
    setPreviewTotal(0)
    setCheckedIds([])
    setSearchQuery("")
  }, [activeTab])

  // Search tab → live preview
  useEffect(() => {
    if (activeTab !== "search") return
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setPreviewAccounts([])
      setPreviewTotal(0)
      return
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const res = await api.get<any>(
          `/prospects?search=${encodeURIComponent(trimmed)}&limit=10`
        )
        const { rows, total } = parseProspectListResponse(res)
        setPreviewAccounts(rows as SegmentAccount[])
        setPreviewTotal(total)
      } catch (err) {
        console.error("Search preview error:", err)
        setPreviewAccounts([])
        setPreviewTotal(0)
      } finally {
        setPreviewLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [activeTab, searchQuery])

  // Filter tab → live preview
  useEffect(() => {
    if (activeTab !== "filter") return
    if (!hasActiveSegmentFilters(filters)) {
      setPreviewAccounts([])
      setPreviewTotal(0)
      return
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const qs = buildSegmentFilterQuery(filters, { page: 1, limit: 10 })
        const res = await api.get<any>(`/search/prospects?${qs}`)
        const { rows, total } = parseProspectListResponse(res)
        setPreviewAccounts(rows as SegmentAccount[])
        setPreviewTotal(total)
      } catch (err) {
        console.error("Filter preview error:", err)
        setPreviewAccounts([])
        setPreviewTotal(0)
      } finally {
        setPreviewLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [activeTab, filters])

  const handleAddSelected = useCallback(() => {
    const toAdd = previewAccounts.filter(
      (a) =>
        checkedIds.includes(String(a._id)) &&
        !selectedIds.includes(String(a._id))
    )
    addMultiple(toAdd)
    setCheckedIds([])
  }, [previewAccounts, checkedIds, selectedIds, addMultiple])

  const handleAddAll = useCallback(async () => {
    if (previewTotal === 0) return
    setIsAddingAll(true)
    try {
      let rows: SegmentAccount[] = []
      if (activeTab === "search") {
        const trimmed = searchQuery.trim()
        if (trimmed.length < 2) return
        const res = await api.get<any>(
          `/prospects?search=${encodeURIComponent(trimmed)}&limit=500`
        )
        rows = parseProspectListResponse(res).rows as SegmentAccount[]
      } else {
        const qs = buildSegmentFilterQuery(filters, { page: 1, limit: 500 })
        const res = await api.get<any>(`/search/prospects?${qs}`)
        rows = parseProspectListResponse(res).rows as SegmentAccount[]
      }
      addMultiple(Array.isArray(rows) ? rows : [])
      setCheckedIds([])
    } catch (err) {
      console.error("Add all error:", err)
    } finally {
      setIsAddingAll(false)
    }
  }, [activeTab, searchQuery, filters, previewTotal, addMultiple])

  // Load existing segment for edit
  useEffect(() => {
    if (mode !== "edit" || !segmentId) return
    setIsLoadingSegment(true)
    api.get<any>(`/segments/${segmentId}`)
      .then(async (res) => {
        const seg = res.data?.data ?? res.data
        if (!seg) return
        setName(seg.name || "")
        setDescription(seg.description || "")
        setIsShared(!!seg.isShared)

        const ids: string[] = (seg.matchedAccountIds || []).map((id: string) => String(id))
        if (ids.length) {
          const params = new URLSearchParams()
          ids.forEach((id) => params.append("ids", id))
          params.set("limit", String(ids.length))
          const accRes = await api.get<any>(`/prospects?${params.toString()}`)
          const { rows } = parseProspectListResponse(accRes)
          const accounts = rows as SegmentAccount[]
          const uniqueIds = [...new Set(ids)]
          const uniqueAccounts = accounts.filter(
            (a, i, arr) =>
              arr.findIndex((x) => String(x._id) === String(a._id)) === i
          )
          setSelectedIds(uniqueIds)
          setSelectedAccounts(uniqueAccounts)
        }

        if (seg.filters) {
          setFilters((prev) => ({
            ...prev,
            industries: seg.filters.industries || [],
            employeeRanges: seg.filters.employeeRanges || [],
            annualRevenues: seg.filters.annualRevenues || [],
            countriesInclude: seg.filters.countries || [],
            regionsInclude: seg.filters.regionsInclude || [],
            techStackInclude: seg.filters.techStackInclude || [],
            techStackExclude: seg.filters.techStackExclude || [],
            designations: seg.filters.designations || [],
            seniorityLevels: seg.filters.seniorityLevels || [],
            techFitScores: seg.filters.techFitScores || [],
            finalScoreMin: seg.filters.minFinalScore ?? 0,
            finalScoreMax: seg.filters.maxFinalScore ?? 100,
          }))
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSegment(false))
  }, [mode, segmentId])

  // Load ICP filters when creating from ICP
  useEffect(() => {
    if (mode !== "create" || !fromIcpId) return
    setIsLoadingIcp(true)
    api.get<any>(`/icp/${fromIcpId}`)
      .then((res) => {
        const icp = res.data?.data ?? res.data
        if (!icp) return
        setFilters((prev) => ({
          ...prev,
          industries: icp.industries?.length ? icp.industries : prev.industries,
          countriesInclude: icp.countries?.length ? icp.countries : prev.countriesInclude,
          employeeRanges: icp.employeeRanges?.length ? icp.employeeRanges : prev.employeeRanges,
          annualRevenues: icp.annualRevenues?.length ? icp.annualRevenues : prev.annualRevenues,
          regionsInclude: icp.targetRegionsInclude?.length ? icp.targetRegionsInclude : prev.regionsInclude,
        }))
        setName(`${icp.name} — Segment`)
        setDescription(icp.description || "")
        setIcpName(icp.name)
      })
      .catch(console.error)
      .finally(() => setIsLoadingIcp(false))
  }, [fromIcpId, mode])

  const handleSave = async () => {
    if (!name.trim()) {
      saveMsg.setMessage("❌ Segment name is required.")
      return
    }
    if (selectedIds.length === 0) {
      saveMsg.setMessage("❌ Select at least one account.")
      return
    }
    setIsSaving(true)
    saveMsg.clearMessage()
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        isShared,
        prospectIds: selectedIds,
        filters: buildSavedFilters(filters),
      }
      if (mode === "edit" && segmentId) {
        await api.put(`/segments/${segmentId}`, payload)
        saveMsg.setMessage("✅ Segment updated!")
      } else {
        await api.post("/segments", payload)
        saveMsg.setMessage("✅ Segment saved!")
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        saveMsg.setMessage(`❌ ${permissionDeniedMessage("save segments")}`)
      } else if (isPermissionError(err)) {
        saveMsg.setMessage(`❌ ${permissionDeniedMessage("save segments")}`)
      } else {
        const message = err instanceof Error ? err.message : "Save failed."
        saveMsg.setMessage(`❌ ${message}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoadingSegment) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user && !canEdit) {
    return (
      <EditorBlockedState
        role={user.role}
        resourceLabel="create or edit segments"
      />
    )
  }

  if (isLoadingIcp) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="p-6 pb-4 border-b flex-shrink-0">
        <Link
          href="/segments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Segments
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Segment Builder
          </p>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? "Edit Segment" : "New Segment"}
          </h1>
          {icpName && (
            <div className="flex items-center gap-2 mt-1">
              <Brain className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-purple-700 font-medium">
                Prefilled from ICP: {icpName}
              </p>
            </div>
          )}
          {!icpName && (
            <p className="text-sm text-muted-foreground mt-1">
              Search or filter accounts, then save your segment
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className={SEGMENT_SECTION_HEADER_CLASS}>Segment Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Segment Name *</Label>
                    <Input
                      placeholder="e.g. Q2 APAC Fintech"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="Short description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">Share with Team</p>
                    <p className="text-xs text-muted-foreground">
                      All team members can see this segment
                    </p>
                  </div>
                  <Switch checked={isShared} onCheckedChange={setIsShared} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <p className={SEGMENT_SECTION_HEADER_CLASS}>Add Accounts</p>
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "search" | "filter")}
                >
                  <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/40 rounded-lg">
                    <TabsTrigger
                      value="search"
                      className="rounded-md py-2 text-sm text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Search & Add
                    </TabsTrigger>
                    <TabsTrigger
                      value="filter"
                      className="rounded-md py-2 text-sm text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Filter & Add
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="search" className="mt-4">
                    <SegmentSearchTab
                      query={searchQuery}
                      onQueryChange={setSearchQuery}
                    />
                  </TabsContent>
                  <TabsContent value="filter" className="mt-4">
                    <SegmentFilterTab
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div>
            {saveMsg.visible && (
              <AutoDismissBanner
                {...saveMsg}
                className="mb-4 bg-muted/20"
                onDismiss={saveMsg.clearMessage}
              />
            )}
            <SegmentRightPanel
              activeTab={activeTab}
              searchQuery={searchQuery}
              previewAccounts={previewAccounts}
              previewTotal={previewTotal}
              previewLoading={previewLoading}
              checkedIds={checkedIds}
              onCheckedIdsChange={setCheckedIds}
              selectedIds={selectedIds}
              selectedAccounts={selectedAccounts}
              onAddSelected={handleAddSelected}
              onAddAll={handleAddAll}
              isAddingAll={isAddingAll}
              onRemove={removeAccount}
              onClearAll={clearAll}
              onSave={handleSave}
              isSaving={isSaving}
              segmentName={name}
              saveLabel={mode === "edit" ? "Update Segment" : "Save Segment"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SegmentBuilder(props: SegmentBuilderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SegmentBuilderContent {...props} />
    </Suspense>
  )
}
