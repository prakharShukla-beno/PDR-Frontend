"use client"

// ─────────────────────────────────────────────
// ICP Builder — Create + Edit
// APIs:
//   POST /api/icp              → create
//   GET  /api/icp/:id          → load for edit
//   PUT  /api/icp/:id          → update
//   GET  /api/icp/:id/match-prospects
//   GET  /api/icp/:id/match-persona
// buyerPersona fields: targetSeniorities, targetDepartments, targetDesignations
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, Users, Building2, Target, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import type { Prospect } from "@/types"

// ── Options matching backend actual values ──
const INDUSTRY_OPTIONS = [
  "BFSI", "IT & ITES", "SaaS", "Fintech", "E-commerce",
  "Healthcare", "EdTech", "Logistics", "Manufacturing",
  "Retail & CPG", "Media & Telecom", "Real Estate"
]
const BUSINESS_MODEL_OPTIONS = ["B2B", "B2C", "B2B2C", "D2C", "E-Commerce", "Marketplace"]
const EMPLOYEE_RANGES = ["1-50", "51-200", "201-500", "501-1,000", "1,001-5,000", "5,000+"]
const REVENUE_RANGES = [
  "Seed <$1M", "Early $1M-$10M", "Scale-Up $10M-$50M",
  "Mid-Market $50M-$250M", "Corporate $250M-$1B", "Enterprise $1B+"
]
const INTENT_SIGNALS = [
  "Modernization Mandate", "Hyper-Growth Mode", "Risk Mitigation",
  "Cost Containment", "Hiring for Data role", "Capital Event",
  "Strategic Pivot", "Regulatory Action"
]
const COUNTRY_OPTIONS = ["India", "UAE", "Singapore", "USA", "UK", "Australia", "Canada", "Germany"]
const SENIORITY_OPTIONS = ["C-Suite", "VP", "Director", "Manager", "Senior IC"]
const DEPARTMENT_OPTIONS = ["Technology", "Operations", "Sales", "Finance", "Marketing", "HR"]
const DESIGNATION_OPTIONS = ["CTO", "VP Engineering", "IT Director", "CIO", "VP Sales", "Head of Operations", "CFO"]

const toggle = (list: string[], val: string) =>
  list.includes(val) ? list.filter(v => v !== val) : [...list, val]

export default function IcpBuilderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get("id")

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [industries, setIndustries] = useState<string[]>([])
  const [businessModels, setBusinessModels] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([])
  const [revenues, setRevenues] = useState<string[]>([])
  const [intentSignals, setIntentSignals] = useState<string[]>([])
  const [minTechScore, setMinTechScore] = useState("")

  // Buyer Persona
  const [targetSeniorities, setTargetSeniorities] = useState<string[]>([])
  const [targetDepartments, setTargetDepartments] = useState<string[]>([])
  const [targetDesignations, setTargetDesignations] = useState<string[]>([])

  // UI state
  const [isLoadingIcp, setIsLoadingIcp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [savedIcpId, setSavedIcpId] = useState<string | null>(editId)

  // Match state
  const [matchedProspects, setMatchedProspects] = useState<Prospect[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [matchTotal, setMatchTotal] = useState(0)

  // Load existing ICP for edit
  useEffect(() => {
    if (!editId) return
    setIsLoadingIcp(true)
    api.get<any>(`/icp/${editId}`).then(res => {
      const icp = res.data
      setName(icp.name ?? "")
      setDescription(icp.description ?? "")
      setIndustries(icp.industries ?? [])
      setBusinessModels(icp.businessModels ?? [])
      setCountries(icp.countries ?? [])
      setEmployeeRanges(icp.employeeRanges ?? [])
      setRevenues(icp.annualRevenues ?? [])
      setIntentSignals(icp.intentSignals ?? [])
      setMinTechScore(icp.minTechFitScore ? String(icp.minTechFitScore) : "")
      setTargetSeniorities(icp.buyerPersona?.targetSeniorities ?? [])
      setTargetDepartments(icp.buyerPersona?.targetDepartments ?? [])
      setTargetDesignations(icp.buyerPersona?.targetDesignations ?? [])
    }).catch(console.error).finally(() => setIsLoadingIcp(false))
  }, [editId])

  // Load matches on edit
  useEffect(() => {
    if (editId) fetchMatches(editId)
  }, [editId])

  const fetchMatches = async (icpId: string) => {
    setIsMatching(true)
    try {
      const res = await api.get<any>(`/icp/${icpId}/match-prospects?page=1&limit=20`)
      setMatchedProspects(res.data || [])
      setMatchTotal(res.pagination?.total || 0)
    } catch (err) {
      console.error("Match error:", err)
    } finally {
      setIsMatching(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { setSaveMsg("❌ ICP naam zaroori hai."); return }
    setIsSaving(true)
    setSaveMsg("")
    try {
      const payload = {
        name,
        description: description || undefined,
        industries,
        businessModels,
        countries,
        employeeRanges,
        annualRevenues: revenues,
        intentSignals,
        minTechFitScore: minTechScore ? Number(minTechScore) : undefined,
        buyerPersona: {
          targetSeniorities,
          targetDepartments,
          targetDesignations,
        },
      }

      let icpId = savedIcpId
      if (editId || savedIcpId) {
        const res = await api.put<any>(`/icp/${editId || savedIcpId}`, payload)
        icpId = res.data?._id || editId || savedIcpId
        setSaveMsg("✅ ICP update ho gaya!")
      } else {
        const res = await api.post<any>("/icp", payload)
        icpId = res.data?._id
        setSavedIcpId(icpId)
        setSaveMsg("✅ ICP save ho gaya!")
        router.replace(`/segments/icp-builder?id=${icpId}`)
      }
      if (icpId) fetchMatches(icpId)
    } catch {
      setSaveMsg("❌ Save nahi ho saka.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingIcp) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/segments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{editId ? "Edit ICP Profile" : "New ICP Profile"}</h1>
          <p className="text-sm text-muted-foreground">Define your Ideal Customer Profile — system will find matching prospects.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : editId ? "Update ICP" : "Save ICP"}
        </Button>
      </div>

      {saveMsg && <div className="text-sm px-4 py-2 rounded-lg border">{saveMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="company">
            <TabsList className="w-full">
              <TabsTrigger value="company" className="flex-1">Company Profile</TabsTrigger>
              <TabsTrigger value="persona" className="flex-1">Buyer Persona</TabsTrigger>
            </TabsList>

            {/* Company Profile Tab */}
            <TabsContent value="company" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label>ICP Name *</Label>
                    <Input placeholder="e.g. Enterprise BFSI India" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Description (Optional)</Label>
                    <Input placeholder="e.g. Large BFSI companies with high tech fit" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <button key={ind} onClick={() => setIndustries(p => toggle(p, ind))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${industries.includes(ind) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Business Models</h3>
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_MODEL_OPTIONS.map((bm) => (
                      <button key={bm} onClick={() => setBusinessModels(p => toggle(p, bm))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${businessModels.includes(bm) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                        {bm}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Countries</h3>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRY_OPTIONS.map((c) => (
                      <button key={c} onClick={() => setCountries(p => toggle(p, c))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${countries.includes(c) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Employee Range</h3>
                    <div className="space-y-2">
                      {EMPLOYEE_RANGES.map((range) => (
                        <div key={range} className="flex items-center gap-2">
                          <Checkbox id={`emp-${range}`} checked={employeeRanges.includes(range)}
                            onCheckedChange={() => setEmployeeRanges(p => toggle(p, range))} />
                          <label htmlFor={`emp-${range}`} className="text-sm cursor-pointer">{range}</label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Annual Revenue</h3>
                    <div className="space-y-2">
                      {REVENUE_RANGES.map((rev) => (
                        <div key={rev} className="flex items-center gap-2">
                          <Checkbox id={`rev-${rev}`} checked={revenues.includes(rev)}
                            onCheckedChange={() => setRevenues(p => toggle(p, rev))} />
                          <label htmlFor={`rev-${rev}`} className="text-xs cursor-pointer">{rev}</label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Intent Signals</h3>
                  <div className="flex flex-wrap gap-2">
                    {INTENT_SIGNALS.map((signal) => (
                      <button key={signal} onClick={() => setIntentSignals(p => toggle(p, signal))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${intentSignals.includes(signal) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                        {signal}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Minimum Tech Fit Score</h3>
                  <p className="text-xs text-muted-foreground">0-100 ke beech — sirf is score se upar ke prospects match honge</p>
                  <Input type="number" min={0} max={100} placeholder="e.g. 60" value={minTechScore}
                    onChange={(e) => setMinTechScore(e.target.value)} className="w-32" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Buyer Persona Tab */}
            <TabsContent value="persona" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Target Buyer Persona</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Kaunse logon se contact karna hai — seniority, department, designation.</p>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Seniority Level</Label>
                    <div className="flex flex-wrap gap-2">
                      {SENIORITY_OPTIONS.map((s) => (
                        <button key={s} onClick={() => setTargetSeniorities(p => toggle(p, s))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${targetSeniorities.includes(s) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Department</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <button key={d} onClick={() => setTargetDepartments(p => toggle(p, d))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${targetDepartments.includes(d) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Designation</Label>
                    <div className="flex flex-wrap gap-2">
                      {DESIGNATION_OPTIONS.map((des) => (
                        <button key={des} onClick={() => setTargetDesignations(p => toggle(p, des))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${targetDesignations.includes(des) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}>
                          {des}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Matched Prospects */}
        <div>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 p-4 border-b">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Matching Prospects</h3>
                {matchTotal > 0 && <Badge className="ml-auto">{matchTotal}</Badge>}
              </div>

              {!savedIcpId && !isMatching && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  ICP save karo — matching prospects yahan dikhenge.
                </div>
              )}

              {isMatching && (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isMatching && matchedProspects.length > 0 && (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {matchedProspects.map((prospect) => (
                    <Link key={prospect._id} href={`/accounts/${prospect._id}`}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{prospect.accountName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[prospect.primaryIndustry, prospect.country].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {prospect.techFitScore ?? "—"}
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {!isMatching && savedIcpId && matchedProspects.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Is ICP se koi prospect match nahi hua. Criteria loose karo.
                </div>
              )}

              {matchTotal > matchedProspects.length && (
                <div className="p-3 border-t text-center text-xs text-muted-foreground">
                  Showing 20 of {matchTotal} matches
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}