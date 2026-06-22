"use client"

// New Segment Builder page
// APIs:
//   GET  /api/icp/:id          → load ICP filters if from_icp param present
//   POST /api/segments/preview → live count + top 5 accounts
//   POST /api/segments         → save segment with snapshot

import { useState, useCallback, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Save, Loader2,
  Users, RefreshCw, Brain
} from "lucide-react"
import { Button }            from "@/components/ui/button"
import { Input }             from "@/components/ui/input"
import { Label }             from "@/components/ui/label"
import { Badge }             from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch }            from "@/components/ui/switch"
import { api, ApiError } from "@/lib/api"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"
import { useAuth } from "@/context/AuthContext"
import { canEditContent, isPermissionError, permissionDeniedMessage } from "@/lib/permissions"
import { EditorBlockedState } from "@/components/EditorBlockedState"

const INDUSTRIES      = ["BFSI","IT & ITES","SaaS","Fintech","E-commerce","Healthcare","EdTech","Logistics","Manufacturing","Retail & CPG","Media & Telecom","Real Estate"]
const BUSINESS_MODELS = ["B2B","B2C","B2B2C","D2C","E-Commerce","Marketplace"]
const EMPLOYEE_RANGES = ["1-50","51-200","201-1,000","1,001-5,000","5,000+"]
const REVENUE_RANGES  = ["Seed <$1M","Early $1M-$10M","Scale-Up $10M-$50M","Mid-Market $50M-$250M","Corporate $250M-$1B","Enterprise $1B+"]
const PRIORITIES      = ["P1 (Tier A+Active)","P2 (Tier B+Active)","P3 (Tier A+Cold)","P4 (Tier B+Cold)"]

const COUNTRIES = ["India","UAE","Singapore","USA","UK","Australia","Canada","Germany"]

// Toggle value in array
const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

function NewSegmentPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const fromIcpId    = searchParams.get("from_icp")
  const { user, isLoading: authLoading } = useAuth()
  const canEdit = canEditContent(user?.role)

  // Segment meta
  const [name,        setName]        = useState("")
  const [description, setDescription] = useState("")
  const [isShared,    setIsShared]    = useState(false)
  const [icpName,     setIcpName]     = useState("")

  // Filter state
  const [industries,      setIndustries]      = useState<string[]>([])
  const [businessModels,  setBusinessModels]  = useState<string[]>([])
  const [countries,       setCountries]       = useState<string[]>([])
  const [employeeRanges,  setEmployeeRanges]  = useState<string[]>([])
  const [annualRevenues,  setAnnualRevenues]  = useState<string[]>([])
  const [salesPriorities, setSalesPriorities] = useState<string[]>([])
  // REMOVED: intentSignals state
  // REMOVED: minScore state

  // Preview state
  const [previewCount,  setPreviewCount]  = useState<number | null>(null)
  const [topAccounts,   setTopAccounts]   = useState<any[]>([])
  const [isPreviewing,  setIsPreviewing]  = useState(false)

  // Save state
  const [isSaving,     setIsSaving]     = useState(false)
  const [isLoadingIcp, setIsLoadingIcp] = useState(false)

  const saveMsg = useAutoDismissMessage({
    onAutoDismiss: () => router.push("/segments"),
  })

  // Load ICP filters if coming from ICP page
  useEffect(() => {
    if (!fromIcpId) return
    setIsLoadingIcp(true)
    api.get<any>(`/icp/${fromIcpId}`)
      .then(res => {
        const icp = res.data?.data ?? res.data
        if (!icp) return
        if (icp.industries?.length)     setIndustries(icp.industries)
        if (icp.businessModels?.length) setBusinessModels(icp.businessModels)
        if (icp.countries?.length)      setCountries(icp.countries)
        if (icp.employeeRanges?.length) setEmployeeRanges(icp.employeeRanges)
        if (icp.annualRevenues?.length) setAnnualRevenues(icp.annualRevenues)

        setName(`${icp.name} — Segment`)
        setDescription(icp.description || "")
        setIcpName(icp.name)
      })
      .catch(console.error)
      .finally(() => setIsLoadingIcp(false))
  }, [fromIcpId])

  // Build filters object — only send what is selected
  const buildFilters = () => {
    const f: any = {}
    if (industries.length)      f.industries      = industries
    if (businessModels.length)  f.businessModels  = businessModels
    if (countries.length)       f.countries       = countries
    if (employeeRanges.length)  f.employeeRanges  = employeeRanges
    if (annualRevenues.length)  f.annualRevenues  = annualRevenues
    if (salesPriorities.length) f.salesPriorities = salesPriorities
    // REMOVED: intentSignals
    // REMOVED: minTechFitScore
    return f
  }

  // Check if at least one filter is selected
  const hasFilters =
    industries.length > 0 || businessModels.length > 0 ||
    countries.length  > 0 || employeeRanges.length  > 0 ||
    annualRevenues.length > 0 || salesPriorities.length > 0
    // REMOVED: intentSignals and minScore from hasFilters check

  // POST /api/segments/preview — live count without saving
  const fetchPreview = useCallback(async () => {
    if (!hasFilters) {
      setPreviewCount(null)
      setTopAccounts([])
      return
    }
    setIsPreviewing(true)
    try {
      const res = await api.post<any>("/segments/preview", { filters: buildFilters() })
      setPreviewCount(res.data?.count ?? res.data?.data?.count ?? 0)
      setTopAccounts(res.data?.topAccounts ?? res.data?.data?.topAccounts ?? [])
    } catch (err) {
      console.error("Preview error:", err)
    } finally {
      setIsPreviewing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries, businessModels, countries, employeeRanges, annualRevenues, salesPriorities])

  useEffect(() => {
    const timer = setTimeout(fetchPreview, 600)
    return () => clearTimeout(timer)
  }, [fetchPreview])

  // POST /api/segments — save segment and take snapshot
  const handleSave = async () => {
    if (!name.trim())  { saveMsg.setMessage("❌ Segment name is required."); return }
    if (!hasFilters)   { saveMsg.setMessage("❌ Select at least one filter."); return }
    setIsSaving(true)
    saveMsg.clearMessage()
    try {
      await api.post("/segments", {
        name:        name.trim(),
        description: description.trim() || undefined,
        isShared,
        filters:     buildFilters(),
      })
      saveMsg.setMessage("✅ Segment saved!")
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        saveMsg.setMessage(`❌ ${permissionDeniedMessage("create segments")}`)
      } else if (isPermissionError(err)) {
        saveMsg.setMessage(`❌ ${permissionDeniedMessage("create segments")}`)
      } else {
        const message = err instanceof Error ? err.message : "Save failed."
        saveMsg.setMessage(`❌ ${message}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Reusable chip selector component
  const ChipGroup = ({ label, options, selected, onToggle }: {
    label: string
    options: string[]
    selected: string[]
    onToggle: (v: string) => void
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt} type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(opt)
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  if (authLoading) {
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

      {/* Header */}
      <div className="p-6 pb-4 border-b flex-shrink-0">
        <Link href="/segments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />Back to Segments
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Segment Builder
            </p>
            <h1 className="text-2xl font-bold">New Segment</h1>
            {icpName && (
              <div className="flex items-center gap-2 mt-1">
                <Brain className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-purple-700 font-medium">
                  Prefilled from ICP: {icpName}
                </p>
              </div>
            )}
            {!icpName && (
              <p className="text-sm text-muted-foreground">
                Select filters — matching accounts will be saved in this segment
              </p>
            )}
          </div>
          <Button
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving || !hasFilters || !name.trim()}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Segment"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">

          {/* Left — Filters */}
          <div className="lg:col-span-2 space-y-6">

            {/* Segment details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Segment Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Segment Name *</Label>
                    <Input
                      placeholder="e.g. Q2 APAC Fintech"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="Short description..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
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

            {/* Company filters */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Company Filters
                </p>
                <ChipGroup
                  label="Industries"
                  options={INDUSTRIES}
                  selected={industries}
                  onToggle={v => setIndustries(toggle(industries, v))}
                />
                <ChipGroup
                  label="Business Models"
                  options={BUSINESS_MODELS}
                  selected={businessModels}
                  onToggle={v => setBusinessModels(toggle(businessModels, v))}
                />
                <ChipGroup
                  label="Countries"
                  options={COUNTRIES}
                  selected={countries}
                  onToggle={v => setCountries(toggle(countries, v))}
                />
                <ChipGroup
                  label="Employee Range"
                  options={EMPLOYEE_RANGES}
                  selected={employeeRanges}
                  onToggle={v => setEmployeeRanges(toggle(employeeRanges, v))}
                />
                <ChipGroup
                  label="Annual Revenue"
                  options={REVENUE_RANGES}
                  selected={annualRevenues}
                  onToggle={v => setAnnualRevenues(toggle(annualRevenues, v))}
                />
              </CardContent>
            </Card>

            {/* Sales Priority only — Intent Signals and Min Score removed */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Sales Intelligence
                </p>
                <ChipGroup
                  label="Sales Priority"
                  options={PRIORITIES}
                  selected={salesPriorities}
                  onToggle={v => setSalesPriorities(toggle(salesPriorities, v))}
                />
     
              </CardContent>
            </Card>

          </div>

          {/* Right — Live Preview */}
          <div>
            <Card className="sticky top-0">
              <CardContent className="p-6 space-y-4">

                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Live Preview
                  </p>
                  {isPreviewing && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {!hasFilters ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Select filters to see matching accounts</p>
                  </div>
                ) : isPreviewing && previewCount === null ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Match count */}
                    <div>
                      <p className="text-4xl font-bold text-primary">{previewCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Matching Accounts
                      </p>
                    </div>

                    {/* Active filter badges */}
                    <div className="flex flex-wrap gap-1">
                      {industries.map(v      => (
                        <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                      ))}
                      {countries.map(v       => (
                        <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                      ))}
                      {salesPriorities.map(v => (
                        <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                      ))}
                      {/* REMOVED: minScore badge */}
                    </div>

                    {/* Top 5 matching accounts */}
                    {topAccounts.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Top accounts
                        </p>
                        {topAccounts.map((a: any) => (
                          <div
                            key={a._id}
                            className="flex items-center justify-between py-1.5 border-b last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium leading-tight">{a.accountName}</p>
                              <p className="text-xs text-muted-foreground">
                                {a.primaryIndustry} · {a.country}
                              </p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              (a.techFitScore ?? 0) >= 80 ? "bg-green-100 text-green-700" :
                              (a.techFitScore ?? 0) >= 60 ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {a.techFitScore ?? "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {saveMsg.visible && (
                  <AutoDismissBanner {...saveMsg} className="bg-muted/20" onDismiss={saveMsg.clearMessage} />
                )}

                <Button
                  className="w-full gap-2"
                  onClick={handleSave}
                  disabled={isSaving || !hasFilters || !name.trim()}
                >
                  {isSaving
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />
                  }
                  {isSaving ? "Saving..." : "Save Segment"}
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function NewSegmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewSegmentPageContent />
    </Suspense>
  )
}