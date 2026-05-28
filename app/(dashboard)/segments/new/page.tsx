"use client"

// ─────────────────────────────────────────────
// New Segment Page — Apollo Style
// APIs:
//   POST /api/segments/preview  → live count + top accounts
//   POST /api/segments          → save segment
// ─────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Save, Loader2, Users,
  Building2, TrendingUp, RefreshCw
} from "lucide-react"
import { Button }       from "@/components/ui/button"
import { Input }        from "@/components/ui/input"
import { Label }        from "@/components/ui/label"
import { Badge }        from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox }     from "@/components/ui/checkbox"
import { Switch }       from "@/components/ui/switch"
import { api }          from "@/lib/api"

// ── Filter options — must match backend enum values exactly ──────────────────
const INDUSTRY_OPTIONS = [
  "BFSI", "IT & ITES", "SaaS", "Fintech", "E-commerce",
  "Healthcare", "EdTech", "Logistics", "Manufacturing",
  "Retail & CPG", "Media & Telecom", "Real Estate",
]
const BUSINESS_MODEL_OPTIONS = ["B2B", "B2C", "B2B2C", "D2C", "E-Commerce", "Marketplace"]
const EMPLOYEE_RANGES        = ["1-50", "51-200", "201-500", "501-1,000", "1,001-5,000", "5,000+"]
const REVENUE_RANGES         = [
  "Seed <$1M", "Early $1M-$10M", "Scale-Up $10M-$50M",
  "Mid-Market $50M-$250M", "Corporate $250M-$1B", "Enterprise $1B+",
]
const SALES_PRIORITIES       = [
  "P1 (Tier A+Active)", "P2 (Tier B+Active)",
  "P3 (Tier A+Cold)",   "P4 (Tier B+Cold)",
]
const INTENT_SIGNALS         = [
  "Hyper-Growth Mode", "Cost Containment", "Risk Mitigation",
  "Modernization Mandate", "Hiring for Data role",
  "Capital Event", "Strategic Pivot", "Regulatory Action",
]
const COUNTRY_OPTIONS        = [
  "India", "UAE", "Singapore", "USA", "UK",
  "Australia", "Canada", "Germany",
]

// Toggle helper — add or remove value from array
const toggle = (list: string[], val: string) =>
  list.includes(val) ? list.filter(v => v !== val) : [...list, val]

export default function NewSegmentPage() {
  const router = useRouter()

  // ── Segment meta ──────────────────────────────────────────────────────────
  const [name,        setName]        = useState("")
  const [description, setDescription] = useState("")
  const [isShared,    setIsShared]    = useState(false)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [industries,      setIndustries]      = useState<string[]>([])
  const [businessModels,  setBusinessModels]  = useState<string[]>([])
  const [countries,       setCountries]       = useState<string[]>([])
  const [employeeRanges,  setEmployeeRanges]  = useState<string[]>([])
  const [annualRevenues,  setAnnualRevenues]  = useState<string[]>([])
  const [salesPriorities, setSalesPriorities] = useState<string[]>([])
  const [intentSignals,   setIntentSignals]   = useState<string[]>([])
  const [minTechFitScore, setMinTechFitScore] = useState("")

  // ── Preview state ─────────────────────────────────────────────────────────
  const [previewCount,    setPreviewCount]    = useState<number | null>(null)
  const [topProspects,    setTopProspects]    = useState<any[]>([])
  const [isPreviewing,    setIsPreviewing]    = useState(false)

  // ── Save state ────────────────────────────────────────────────────────────
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveMsg,   setSaveMsg]   = useState("")

  // Build filters object from current state
  const buildFilters = () => {
    const filters: any = {}
    if (industries.length)      filters.industries      = industries
    if (businessModels.length)  filters.businessModels  = businessModels
    if (countries.length)       filters.countries       = countries
    if (employeeRanges.length)  filters.employeeRanges  = employeeRanges
    if (annualRevenues.length)  filters.annualRevenues  = annualRevenues
    if (salesPriorities.length) filters.salesPriorities = salesPriorities
    if (intentSignals.length)   filters.intentSignals   = intentSignals
    if (minTechFitScore)        filters.minTechFitScore = Number(minTechFitScore)
    return filters
  }

  // Check if any filter is selected
  const hasFilters =
    industries.length > 0 || businessModels.length > 0 ||
    countries.length > 0  || employeeRanges.length > 0 ||
    annualRevenues.length > 0 || salesPriorities.length > 0 ||
    intentSignals.length > 0  || minTechFitScore !== ""

  // POST /api/segments/preview — get live count and top accounts
  const fetchPreview = useCallback(async () => {
    if (!hasFilters) {
      setPreviewCount(null)
      setTopProspects([])
      return
    }
    setIsPreviewing(true)
    try {
      const res = await api.post<any>("/segments/preview", {
        filters: buildFilters(),
      })
      setPreviewCount(res.data?.count ?? 0)
      setTopProspects(res.data?.topProspects ?? [])
    } catch (err) {
      console.error("Preview error:", err)
    } finally {
      setIsPreviewing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    industries, businessModels, countries, employeeRanges,
    annualRevenues, salesPriorities, intentSignals, minTechFitScore,
  ])

  // Auto-fetch preview whenever filters change
  useEffect(() => {
    const timer = setTimeout(fetchPreview, 600) // debounce 600ms
    return () => clearTimeout(timer)
  }, [fetchPreview])

  // POST /api/segments — save the segment
  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMsg("❌ Segment name zaroori hai.")
      return
    }
    if (!hasFilters) {
      setSaveMsg("❌ Kam se kam ek filter select karo.")
      return
    }
    setIsSaving(true)
    setSaveMsg("")
    try {
      await api.post("/segments", {
        name:        name.trim(),
        description: description.trim() || undefined,
        isShared,
        filters:     buildFilters(),
      })
      setSaveMsg("✅ Segment save ho gaya!")
      setTimeout(() => router.push("/segments"), 1000)
    } catch (err: any) {
      setSaveMsg(`❌ ${err?.message || "Save nahi ho saka."}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Reusable chip selector — renders toggle chips for any list
  const ChipGroup = ({
    label, options, selected, onToggle,
  }: {
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
            key={opt}
            type="button"
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

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* ── Header ── */}
      <div className="p-6 pb-4 border-b flex-shrink-0">
        <Link
          href="/segments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Segments
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Segment Builder
            </p>
            <h1 className="text-2xl font-bold">New Segment</h1>
            <p className="text-sm text-muted-foreground">
              Filters lagao — matching accounts real-time dikhenge
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving || !hasFilters || !name.trim()}
          >
            {isSaving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />
            }
            {isSaving ? "Saving..." : "Save Segment"}
          </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">

          {/* ── Left — Filters ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Segment Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Segment Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Segment Name *</Label>
                    <Input
                      placeholder="e.g. Q2 APAC Fintech Outreach"
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

                {/* Share with team toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">Share with Team</p>
                    <p className="text-xs text-muted-foreground">
                      All team members ko yeh segment dikhega
                    </p>
                  </div>
                  <Switch checked={isShared} onCheckedChange={setIsShared} />
                </div>
              </CardContent>
            </Card>

            {/* Company Filters */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Company Filters
                </p>

                <ChipGroup
                  label="Industries"
                  options={INDUSTRY_OPTIONS}
                  selected={industries}
                  onToggle={v => setIndustries(toggle(industries, v))}
                />

                <ChipGroup
                  label="Business Models"
                  options={BUSINESS_MODEL_OPTIONS}
                  selected={businessModels}
                  onToggle={v => setBusinessModels(toggle(businessModels, v))}
                />

                <ChipGroup
                  label="Countries"
                  options={COUNTRY_OPTIONS}
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

            {/* Sales Intelligence Filters */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Sales Intelligence
                </p>

                <ChipGroup
                  label="Sales Priority"
                  options={SALES_PRIORITIES}
                  selected={salesPriorities}
                  onToggle={v => setSalesPriorities(toggle(salesPriorities, v))}
                />

                <ChipGroup
                  label="Intent Signals"
                  options={INTENT_SIGNALS}
                  selected={intentSignals}
                  onToggle={v => setIntentSignals(toggle(intentSignals, v))}
                />

                {/* Min Tech Fit Score */}
                <div className="space-y-1.5">
                  <Label>Minimum Tech Fit Score</Label>
                  <p className="text-xs text-muted-foreground">
                    0-100 ke beech — is score se upar ke prospects match honge
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 70"
                    className="w-32"
                    value={minTechFitScore}
                    onChange={e => setMinTechFitScore(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── Right — Live Preview ── */}
          <div className="space-y-4">
            <Card className="sticky top-0">
              <CardContent className="p-6 space-y-4">

                {/* Preview header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Live Preview
                  </p>
                  {isPreviewing && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Count */}
                {!hasFilters ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Filter lagao — accounts dikhenge</p>
                  </div>
                ) : isPreviewing && previewCount === null ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-4xl font-bold text-primary">
                        {previewCount ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Matching Accounts
                      </p>
                    </div>

                    {/* Active filters summary */}
                    {hasFilters && (
                      <div className="flex flex-wrap gap-1">
                        {industries.map(v       => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
                        {businessModels.map(v   => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
                        {countries.map(v        => <Badge key={v} variant="outline"   className="text-xs">{v}</Badge>)}
                        {salesPriorities.map(v  => <Badge key={v} variant="outline"   className="text-xs">{v}</Badge>)}
                        {minTechFitScore         && <Badge variant="outline" className="text-xs">Score ≥ {minTechFitScore}</Badge>}
                      </div>
                    )}

                    {/* Top 5 accounts */}
                    {topProspects.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-medium">
                          Top accounts
                        </p>
                        {topProspects.map((p: any) => (
                          <div
                            key={p._id}
                            className="flex items-center justify-between py-1.5 border-b last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium leading-tight">
                                {p.accountName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.primaryIndustry} • {p.country}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                p.techFitScore >= 80
                                  ? "bg-green-100 text-green-700"
                                  : p.techFitScore >= 60
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {p.techFitScore ?? "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Save message */}
                {saveMsg && (
                  <div className="text-sm px-3 py-2 rounded-lg border bg-muted/20">
                    {saveMsg}
                  </div>
                )}

                {/* Save button bottom */}
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