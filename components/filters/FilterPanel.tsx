"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface FilterState {
  // Account filters
  industryInclude:         string[]
  industryExclude:         string[]
  countryInclude:          string[]
  countryExclude:          string[]
  cityInclude:             string[]
  cityExclude:             string[]
  businessModelInclude:    string[]
  businessModelExclude:    string[]
  employeesInclude:        string[]
  employeesExclude:        string[]
  revenueInclude:          string[]
  revenueExclude:          string[]
  salesPriorityInclude:    string[]
  salesPriorityExclude:    string[]
  clvRankingInclude:       string[]
  clvRankingExclude:       string[]
  intentSignalInclude:     string[]
  intentSignalExclude:     string[]
  historyTriggerInclude:   string[]
  historyTriggerExclude:   string[]
  techAdoptionInclude:     string[]
  techAdoptionExclude:     string[]
  infraRiskInclude:        string[]
  infraRiskExclude:        string[]
  financialCapacityInclude:string[]
  financialCapacityExclude:string[]
  // Range
  techFitScoreMin:         number
  techFitScoreMax:         number
  // Contact filters
  functionalDomainInclude: string[]
  functionalDomainExclude: string[]
  contactCountryInclude:   string[]
  contactCountryExclude:   string[]
  hasEmail:                boolean | null
  hasPhone:                boolean | null
  hasLinkedIn:             boolean | null
  isLinked:                boolean | null
}

export const EMPTY_FILTERS: FilterState = {
  industryInclude: [], industryExclude: [],
  countryInclude:  [], countryExclude:  [],
  cityInclude:     [], cityExclude:     [],
  businessModelInclude:  [], businessModelExclude:  [],
  employeesInclude:      [], employeesExclude:      [],
  revenueInclude:        [], revenueExclude:        [],
  salesPriorityInclude:  [], salesPriorityExclude:  [],
  clvRankingInclude:     [], clvRankingExclude:     [],
  intentSignalInclude:   [], intentSignalExclude:   [],
  historyTriggerInclude: [], historyTriggerExclude: [],
  techAdoptionInclude:   [], techAdoptionExclude:   [],
  infraRiskInclude:      [], infraRiskExclude:      [],
  financialCapacityInclude: [], financialCapacityExclude: [],
  techFitScoreMin:  0,
  techFitScoreMax:  100,
  functionalDomainInclude: [], functionalDomainExclude: [],
  contactCountryInclude:   [], contactCountryExclude:   [],
  hasEmail: null, hasPhone: null, hasLinkedIn: null, isLinked: null,
}

// ─── Count active filters ──────────────────────────────────────────────────────
export const countActiveFilters = (f: FilterState): number => {
  let count = 0
  const arrays = [
    f.industryInclude, f.industryExclude,
    f.countryInclude,  f.countryExclude,
    f.cityInclude,     f.cityExclude,
    f.businessModelInclude,  f.businessModelExclude,
    f.employeesInclude,      f.employeesExclude,
    f.revenueInclude,        f.revenueExclude,
    f.salesPriorityInclude,  f.salesPriorityExclude,
    f.clvRankingInclude,     f.clvRankingExclude,
    f.intentSignalInclude,   f.intentSignalExclude,
    f.historyTriggerInclude, f.historyTriggerExclude,
    f.techAdoptionInclude,   f.techAdoptionExclude,
    f.infraRiskInclude,      f.infraRiskExclude,
    f.financialCapacityInclude, f.financialCapacityExclude,
    f.functionalDomainInclude, f.functionalDomainExclude,
    f.contactCountryInclude,   f.contactCountryExclude,
  ]
  arrays.forEach(arr => { count += arr.length })
  if (f.techFitScoreMin > 0 || f.techFitScoreMax < 100) count++
  if (f.hasEmail   !== null) count++
  if (f.hasPhone   !== null) count++
  if (f.hasLinkedIn!== null) count++
  if (f.isLinked   !== null) count++
  return count
}

// ─── Build query string from filters ──────────────────────────────────────────
export const buildFilterQuery = (f: FilterState, mode: "accounts" | "contacts" = "accounts"): string => {
  const params = new URLSearchParams()
  const add = (key: string, arr: string[]) => arr.forEach(v => params.append(key, v))

  if (mode === "accounts") {
    add("industryInclude",          f.industryInclude)
    add("industryExclude",          f.industryExclude)
    add("countryInclude",           f.countryInclude)
    add("countryExclude",           f.countryExclude)
    add("cityInclude",              f.cityInclude)
    add("cityExclude",              f.cityExclude)
    add("businessModelInclude",     f.businessModelInclude)
    add("businessModelExclude",     f.businessModelExclude)
    add("employeesInclude",         f.employeesInclude)
    add("employeesExclude",         f.employeesExclude)
    add("revenueInclude",           f.revenueInclude)
    add("revenueExclude",           f.revenueExclude)
    add("salesPriorityInclude",     f.salesPriorityInclude)
    add("salesPriorityExclude",     f.salesPriorityExclude)
    add("clvRankingInclude",        f.clvRankingInclude)
    add("clvRankingExclude",        f.clvRankingExclude)
    add("intentSignalInclude",      f.intentSignalInclude)
    add("intentSignalExclude",      f.intentSignalExclude)
    add("historyTriggerInclude",    f.historyTriggerInclude)
    add("historyTriggerExclude",    f.historyTriggerExclude)
    add("techAdoptionInclude",      f.techAdoptionInclude)
    add("techAdoptionExclude",      f.techAdoptionExclude)
    add("infraRiskInclude",         f.infraRiskInclude)
    add("infraRiskExclude",         f.infraRiskExclude)
    add("financialCapacityInclude", f.financialCapacityInclude)
    add("financialCapacityExclude", f.financialCapacityExclude)
    if (f.techFitScoreMin > 0)   params.set("techFitScoreMin", f.techFitScoreMin.toString())
    if (f.techFitScoreMax < 100) params.set("techFitScoreMax", f.techFitScoreMax.toString())
  } else {
    add("functionalDomainInclude",   f.functionalDomainInclude)
    add("functionalDomainExclude",   f.functionalDomainExclude)
    add("accountIndustryInclude",    f.industryInclude)
    add("accountIndustryExclude",    f.industryExclude)
    add("accountCountryInclude",     f.countryInclude)
    add("accountCountryExclude",     f.countryExclude)
    add("accountEmployeesInclude",   f.employeesInclude)
    add("accountEmployeesExclude",   f.employeesExclude)
    add("accountRevenueInclude",     f.revenueInclude)
    add("accountRevenueExclude",     f.revenueExclude)
    add("accountSalesPriorityInclude", f.salesPriorityInclude)
    add("accountSalesPriorityExclude", f.salesPriorityExclude)
    add("accountClvRankingInclude",  f.clvRankingInclude)
    add("accountClvRankingExclude",  f.clvRankingExclude)
    add("accountIntentSignalInclude",f.intentSignalInclude)
    add("accountIntentSignalExclude",f.intentSignalExclude)
    if (f.hasEmail   !== null) params.set("hasEmail",    f.hasEmail.toString())
    if (f.hasPhone   !== null) params.set("hasPhone",    f.hasPhone.toString())
    if (f.hasLinkedIn!== null) params.set("hasLinkedIn", f.hasLinkedIn.toString())
    if (f.isLinked   !== null) params.set("isLinked",    f.isLinked.toString())
  }

  return params.toString()
}

// ─── IncExcPicker Component ────────────────────────────────────────────────────
// Include/Exclude toggle with chips for each filter
interface IncExcPickerProps {
  label:      string
  options:    string[]
  included:   string[]
  excluded:   string[]
  onInclude:  (v: string) => void
  onExclude:  (v: string) => void
  onRemove:   (v: string, type: "inc" | "exc") => void
}

function IncExcPicker({ label, options, included, excluded, onInclude, onExclude, onRemove }: IncExcPickerProps) {
  const [open, setOpen]     = useState(false)
  const [mode, setMode]     = useState<"include" | "exclude">("include")
  const hasActive = included.length > 0 || excluded.length > 0

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          {label}
          {hasActive && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
              {included.length + excluded.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Active chips */}
      {hasActive && (
        <div className="flex flex-wrap gap-1.5">
          {included.map(v => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700">
              ✓ {v}
              <button onClick={() => onRemove(v, "inc")} className="hover:text-green-900"><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
          {excluded.map(v => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">
              ✗ {v}
              <button onClick={() => onRemove(v, "exc")} className="hover:text-red-900"><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          {/* Include / Exclude toggle */}
          <div className="flex border-b">
            <button
              onClick={() => setMode("include")}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${mode === "include" ? "bg-green-50 text-green-700 border-b-2 border-green-500" : "text-muted-foreground hover:bg-muted/30"}`}
            >
              Include ✓
            </button>
            <button
              onClick={() => setMode("exclude")}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${mode === "exclude" ? "bg-red-50 text-red-700 border-b-2 border-red-500" : "text-muted-foreground hover:bg-muted/30"}`}
            >
              Exclude ✗
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-40 overflow-y-auto p-1">
            {options.map(opt => {
              const isIncluded = included.includes(opt)
              const isExcluded = excluded.includes(opt)
              const isSelected = mode === "include" ? isIncluded : isExcluded

              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (mode === "include") {
                      if (isIncluded) onRemove(opt, "inc")
                      else { onInclude(opt); if (isExcluded) onRemove(opt, "exc") }
                    } else {
                      if (isExcluded) onRemove(opt, "exc")
                      else { onExclude(opt); if (isIncluded) onRemove(opt, "inc") }
                    }
                  }}
                  className={`w-full flex items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors
                    ${isSelected
                      ? mode === "include" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      : "hover:bg-muted/50 text-foreground"
                    }`}
                >
                  <span>{opt}</span>
                  {isIncluded && <span className="text-green-600 font-bold">✓</span>}
                  {isExcluded && <span className="text-red-600 font-bold">✗</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── BooleanFilter Component ───────────────────────────────────────────────────
interface BooleanFilterProps {
  label:    string
  value:    boolean | null
  onChange: (v: boolean | null) => void
}

function BooleanFilter({ label, value, onChange }: BooleanFilterProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {[
          { label: "Any", v: null },
          { label: "Yes", v: true },
          { label: "No",  v: false },
        ].map(opt => (
          <button
            key={String(opt.v)}
            onClick={() => onChange(opt.v)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors
              ${value === opt.v
                ? opt.v === true  ? "bg-green-100 text-green-700 border border-green-300"
                : opt.v === false ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-muted text-foreground border border-border"
                : "text-muted-foreground hover:bg-muted/50 border border-transparent"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main FilterPanel Component ────────────────────────────────────────────────
interface FilterPanelProps {
  isOpen:   boolean
  onClose:  () => void
  filters:  FilterState
  onChange: (f: FilterState) => void
  onApply:  () => void
  mode?:    "accounts" | "contacts"
}

export function FilterPanel({ isOpen, onClose, filters, onChange, onApply, mode = "accounts" }: FilterPanelProps) {

  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({})

  // Fetch filter options from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get<any>("/search/filters")
        setFilterOptions(res.data || res)
      } catch {
        // Fallback options
        setFilterOptions({
          industries:    ["BFSI","IT & ITES","SaaS","Fintech","E-commerce","Healthcare","EdTech","Logistics","Manufacturing","Retail & CPG","Media & Telecom","Real Estate"],
          countries:     ["United States","United Kingdom","India","Singapore","UAE","Australia","Canada","Germany","France"],
          cities:        ["San Francisco","New York","London","Bangalore","Mumbai","Singapore","Dubai"],
          businessModels:["B2B","B2C","D2C","E-Commerce","B2B2C","Marketplace"],
          employeeBands: ["1-50","51-200","201-1,000","1,001-5,000","5,000+"],
          revenueBands:  ["Seed <$1M","Early $1M-$10M","Scale-Up $10M-$50M","Mid-Market $50M-$250M","Corporate $250M-$1B","Enterprise $1B+"],
          salesPriorities:["P1 (Tier A+Active)","P2 (Tier B+Active)","P3 (Tier A+Cold)","P4 (Tier B+Cold)"],
          clvRankings:   ["Tier-A (Strategic)","Tier-B (Core)","Tier-C (Mass)"],
          intentSignals: ["Hyper-Growth Mode","Cost Containment","Risk Mitigation","Modernization Mandate"],
          historyTriggers:["M&A Activity","Capital Event","Leadership Shakeup","Regulatory Action","Earnings Shock","Security Incident","Strategic Pivot","Job Postings"],
          techAdoptions: ["Innovator","Early Adopter","Mainstream","Laggard","Leapfrog"],
          infraRisks:    ["EOL","Data Silos","Security Gaps","Scalability Lock","Shadow IT"],
          financialCapacities:["Enterprise","Mid-Market","Small Business"],
          functionalDomains:["Corporate Strategy","Technology & Digital","Data & AI","Finance & Accounting","Revenue & Growth","Product & Creative","Operations & Logistics","People & HR","Legal & Governance","Healthcare & Life Sciences","Industrial & Engineering","Resources & Utilities","Public Sector & NGO"],
        })
      }
    }
    if (isOpen) fetchOptions()
  }, [isOpen])

  const update = (key: keyof FilterState, value: any) => onChange({ ...filters, [key]: value })

  const addToList = (key: keyof FilterState, value: string) => {
    const arr = filters[key] as string[]
    if (!arr.includes(value)) update(key, [...arr, value])
  }

  const removeFromList = (key: keyof FilterState, value: string) => {
    update(key, (filters[key] as string[]).filter(v => v !== value))
  }

  const activeCount = countActiveFilters(filters)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Filters</span>
            {activeCount > 0 && (
              <Badge variant="default" className="bg-primary text-white text-xs h-5">
                {activeCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => onChange(EMPTY_FILTERS)}>
                <RotateCcw className="h-3 w-3" />Reset
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter sections — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* ── COMPANY FILTERS ── */}
          {(mode === "accounts" || mode === "contacts") && (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company</p>
                <div className="space-y-4">
                  <IncExcPicker
                    label="Industry"
                    options={filterOptions.industries || []}
                    included={filters.industryInclude}
                    excluded={filters.industryExclude}
                    onInclude={v => addToList("industryInclude", v)}
                    onExclude={v => addToList("industryExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "industryInclude" : "industryExclude", v)}
                  />
                  <IncExcPicker
                    label="Country"
                    options={filterOptions.countries || []}
                    included={filters.countryInclude}
                    excluded={filters.countryExclude}
                    onInclude={v => addToList("countryInclude", v)}
                    onExclude={v => addToList("countryExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "countryInclude" : "countryExclude", v)}
                  />
                  <IncExcPicker
                    label="City"
                    options={filterOptions.cities || []}
                    included={filters.cityInclude}
                    excluded={filters.cityExclude}
                    onInclude={v => addToList("cityInclude", v)}
                    onExclude={v => addToList("cityExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "cityInclude" : "cityExclude", v)}
                  />
                  <IncExcPicker
                    label="Business Model"
                    options={filterOptions.businessModels || []}
                    included={filters.businessModelInclude}
                    excluded={filters.businessModelExclude}
                    onInclude={v => addToList("businessModelInclude", v)}
                    onExclude={v => addToList("businessModelExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "businessModelInclude" : "businessModelExclude", v)}
                  />
                  <IncExcPicker
                    label="Employee Band"
                    options={filterOptions.employeeBands || []}
                    included={filters.employeesInclude}
                    excluded={filters.employeesExclude}
                    onInclude={v => addToList("employeesInclude", v)}
                    onExclude={v => addToList("employeesExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "employeesInclude" : "employeesExclude", v)}
                  />
                  <IncExcPicker
                    label="Annual Revenue"
                    options={filterOptions.revenueBands || []}
                    included={filters.revenueInclude}
                    excluded={filters.revenueExclude}
                    onInclude={v => addToList("revenueInclude", v)}
                    onExclude={v => addToList("revenueExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "revenueInclude" : "revenueExclude", v)}
                  />
                </div>
              </div>

              <Separator />

              {/* ── SALES INTELLIGENCE ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sales Intelligence</p>
                <div className="space-y-4">
                  <IncExcPicker
                    label="Sales Priority"
                    options={filterOptions.salesPriorities || []}
                    included={filters.salesPriorityInclude}
                    excluded={filters.salesPriorityExclude}
                    onInclude={v => addToList("salesPriorityInclude", v)}
                    onExclude={v => addToList("salesPriorityExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "salesPriorityInclude" : "salesPriorityExclude", v)}
                  />
                  <IncExcPicker
                    label="CLV Ranking"
                    options={filterOptions.clvRankings || []}
                    included={filters.clvRankingInclude}
                    excluded={filters.clvRankingExclude}
                    onInclude={v => addToList("clvRankingInclude", v)}
                    onExclude={v => addToList("clvRankingExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "clvRankingInclude" : "clvRankingExclude", v)}
                  />
                  <IncExcPicker
                    label="Intent Signal"
                    options={filterOptions.intentSignals || []}
                    included={filters.intentSignalInclude}
                    excluded={filters.intentSignalExclude}
                    onInclude={v => addToList("intentSignalInclude", v)}
                    onExclude={v => addToList("intentSignalExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "intentSignalInclude" : "intentSignalExclude", v)}
                  />
                  <IncExcPicker
                    label="History Trigger"
                    options={filterOptions.historyTriggers || []}
                    included={filters.historyTriggerInclude}
                    excluded={filters.historyTriggerExclude}
                    onInclude={v => addToList("historyTriggerInclude", v)}
                    onExclude={v => addToList("historyTriggerExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "historyTriggerInclude" : "historyTriggerExclude", v)}
                  />
                  <IncExcPicker
                    label="Financial Capacity"
                    options={filterOptions.financialCapacities || []}
                    included={filters.financialCapacityInclude}
                    excluded={filters.financialCapacityExclude}
                    onInclude={v => addToList("financialCapacityInclude", v)}
                    onExclude={v => addToList("financialCapacityExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "financialCapacityInclude" : "financialCapacityExclude", v)}
                  />

                  {/* TechFit Score Range */}
                  {mode === "accounts" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">TechFit Score</span>
                        <span className="text-xs text-muted-foreground">
                          {filters.techFitScoreMin} — {filters.techFitScoreMax}
                        </span>
                      </div>
                      <Slider
                        min={0} max={100} step={5}
                        value={[filters.techFitScoreMin, filters.techFitScoreMax]}
                        onValueChange={([min, max]) => onChange({ ...filters, techFitScoreMin: min, techFitScoreMax: max })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* ── TECH FILTERS ── */}
              {mode === "accounts" && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Technology</p>
                  <div className="space-y-4">
                    <IncExcPicker
                      label="Tech Adoption Profile"
                      options={filterOptions.techAdoptions || []}
                      included={filters.techAdoptionInclude}
                      excluded={filters.techAdoptionExclude}
                      onInclude={v => addToList("techAdoptionInclude", v)}
                      onExclude={v => addToList("techAdoptionExclude", v)}
                      onRemove={(v, t) => removeFromList(t === "inc" ? "techAdoptionInclude" : "techAdoptionExclude", v)}
                    />
                    <IncExcPicker
                      label="Infrastructure Risk"
                      options={filterOptions.infraRisks || []}
                      included={filters.infraRiskInclude}
                      excluded={filters.infraRiskExclude}
                      onInclude={v => addToList("infraRiskInclude", v)}
                      onExclude={v => addToList("infraRiskExclude", v)}
                      onRemove={(v, t) => removeFromList(t === "inc" ? "infraRiskInclude" : "infraRiskExclude", v)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CONTACT FILTERS ── */}
          {mode === "contacts" && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact</p>
                <div className="space-y-4">
                  <IncExcPicker
                    label="Functional Domain"
                    options={filterOptions.functionalDomains || []}
                    included={filters.functionalDomainInclude}
                    excluded={filters.functionalDomainExclude}
                    onInclude={v => addToList("functionalDomainInclude", v)}
                    onExclude={v => addToList("functionalDomainExclude", v)}
                    onRemove={(v, t) => removeFromList(t === "inc" ? "functionalDomainInclude" : "functionalDomainExclude", v)}
                  />
                  <BooleanFilter label="Has Email"    value={filters.hasEmail}    onChange={v => update("hasEmail", v)} />
                  <BooleanFilter label="Has Phone"    value={filters.hasPhone}    onChange={v => update("hasPhone", v)} />
                  <BooleanFilter label="Has LinkedIn" value={filters.hasLinkedIn} onChange={v => update("hasLinkedIn", v)} />
                  <BooleanFilter label="Linked to Account" value={filters.isLinked} onChange={v => update("isLinked", v)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer — Apply button */}
        <div className="p-4 border-t flex-shrink-0 space-y-2">
          {activeCount > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              {activeCount} filter{activeCount > 1 ? "s" : ""} active
            </p>
          )}
          <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => { onApply(); onClose() }}>
            Apply Filters {activeCount > 0 ? `(${activeCount})` : ""}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
