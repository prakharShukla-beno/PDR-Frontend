"use client"


import { useEffect, useState } from "react"
import { Loader2, Save, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api"
import type { Prospect } from "@/types"

const INDUSTRY_OPTIONS = [
  "SaaS", "Fintech", "E-commerce", "Logistics", "Healthcare",
  "Manufacturing", "EdTech", "Real Estate", "Retail", "Media",
]

const BUSINESS_MODEL_OPTIONS = ["B2B", "B2C", "B2B2C", "Marketplace", "SaaS"]

const EMPLOYEE_RANGES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
]

const REVENUE_RANGES = [
  "< $1M", "$1M-$10M", "$10M-$50M", "$50M-$100M", "$100M+",
]

const INTENT_SIGNALS = [
  "Funding announced", "Hiring for Data role", "Visited pricing page",
  "Published RFP", "Expanding to new market",
]

export default function IcpBuilderPage() {
  // ── Form state ──────────────────────────────
  const [name, setName] = useState("")
  const [industries, setIndustries] = useState<string[]>([])
  const [businessModels, setBusinessModels] = useState<string[]>([])
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([])
  const [revenues, setRevenues] = useState<string[]>([])
  const [intentSignals, setIntentSignals] = useState<string[]>([])
  const [minTechScore, setMinTechScore] = useState("")

  // ── UI state ────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [savedIcpId, setSavedIcpId] = useState<string | null>(null)

  // ── Matching prospects state ─────────────────
  const [matchedProspects, setMatchedProspects] = useState<Prospect[]>([])
  const [isMatching, setIsMatching] = useState(false)


  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    if (list.includes(value)) setList(list.filter(v => v !== value))
    else setList([...list, value])
  }

  // ───────────────

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMsg("❌ ICP name is required.")
      return
    }

    setIsSaving(true)
    setSaveMsg("")

    try {
      const payload = {
        name,
        industries,
        businessModels,
        employeeRanges,
        annualRevenues: revenues,
        intentSignals,
        minTechFitScore: minTechScore ? Number(minTechScore) : undefined,
      }

      const res = await api.post<any>("/icp", payload)
      const icpId = res.data?._id

      setSavedIcpId(icpId)
      setSaveMsg("✅ ICP is saved successfully.")

    
      if (icpId) fetchMatchedProspects(icpId)

    } catch (err) {
      setSaveMsg("❌ Save is failed try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const fetchMatchedProspects = async (icpId: string) => {
    setIsMatching(true)
    try {
      const res = await api.get<any>(`/icp/${icpId}/match-prospects`)
      setMatchedProspects(res.data || [])
    } catch (err) {
      console.error("Match prospects error:", err)
    } finally {
      setIsMatching(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold">ICP Builder</h1>
        <p className="text-muted-foreground text-sm">
        Define your Ideal Customer Profile — system automatically matches prospects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: ICP Form ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ICP Name */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label htmlFor="icp-name">ICP Name *</Label>
              <Input
                id="icp-name"
                placeholder="e.g. Mid-Market SaaS B2B India"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </CardContent>
          </Card>

          {/* Industries */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Industries</h3>
              <p className="text-xs text-muted-foreground">
              “Which industries accounts should be targeted?”
              </p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => toggle(industries, setIndustries, ind)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      industries.includes(ind)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Models */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Business Models</h3>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_MODEL_OPTIONS.map((bm) => (
                  <button
                    key={bm}
                    onClick={() => toggle(businessModels, setBusinessModels, bm)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      businessModels.includes(bm)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {bm}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Company Size + Revenue */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Employee Range</h3>
                <div className="space-y-2">
                  {EMPLOYEE_RANGES.map((range) => (
                    <div key={range} className="flex items-center gap-2">
                      <Checkbox
                        id={`emp-${range}`}
                        checked={employeeRanges.includes(range)}
                        onCheckedChange={() => toggle(employeeRanges, setEmployeeRanges, range)}
                      />
                      <label htmlFor={`emp-${range}`} className="text-sm cursor-pointer">
                        {range}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Annual Revenue</h3>
                <div className="space-y-2">
                  {REVENUE_RANGES.map((rev) => (
                    <div key={rev} className="flex items-center gap-2">
                      <Checkbox
                        id={`rev-${rev}`}
                        checked={revenues.includes(rev)}
                        onCheckedChange={() => toggle(revenues, setRevenues, rev)}
                      />
                      <label htmlFor={`rev-${rev}`} className="text-sm cursor-pointer">
                        {rev}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intent Signals */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Intent Signals</h3>
              <p className="text-xs text-muted-foreground">
                Which signals indicate high intent?
              </p>
              <div className="flex flex-wrap gap-2">
                {INTENT_SIGNALS.map((signal) => (
                  <button
                    key={signal}
                    onClick={() => toggle(intentSignals, setIntentSignals, signal)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      intentSignals.includes(signal)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Min Tech Fit Score */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Minimum Tech Fit Score</h3>
              <p className="text-xs text-muted-foreground">
             Between 0–100 — only prospects with a score above this will match
              </p>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 70"
                value={minTechScore}
                onChange={(e) => setMinTechScore(e.target.value)}
                className="h-10 w-32"
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          {saveMsg && (
            <div className="rounded-lg border px-4 py-2 text-sm">{saveMsg}</div>
          )}
          <Button
            className="gap-2 w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save ICP
          </Button>
        </div>

        {/* ── Right: Matched Prospects ── */}
        <div>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 p-4 border-b">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Matching Prospects</h3>
                {matchedProspects.length > 0 && (
                  <Badge className="ml-auto">{matchedProspects.length}</Badge>
                )}
              </div>

            
              {!savedIcpId && !isMatching && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Save your ICP — matching prospects will appear here.
                </div>
              )}

              {/* Loading state */}
              {isMatching && (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Matched prospects list */}
              {!isMatching && matchedProspects.length > 0 && (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {matchedProspects.map((prospect) => (
                    <div key={prospect._id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{prospect.accountName}</p>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {prospect.techFitScore ?? "—"}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prospect.primaryIndustry} · {prospect.country}
                      </p>
                      {prospect.intentSignal && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {prospect.intentSignal}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

            
              {!isMatching && savedIcpId && matchedProspects.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No prospects match your ICP criteria. Consider loosening the criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}