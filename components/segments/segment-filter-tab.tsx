"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { api } from "@/lib/api"
import {
  ALL_COUNTRIES,
  CLV_TIER_OPTIONS,
  EMPLOYEE_RANGES,
  POPULAR_COUNTRIES,
  REGIONS,
  REVENUE_RANGES,
  SALES_PRIORITY_OPTIONS,
  SEGMENT_CHIP_DEFAULT,
  SEGMENT_CHIP_SELECTED,
  SEGMENT_INDUSTRIES,
  SEGMENT_SECTION_HEADER_CLASS,
  SENIORITY_LEVELS,
  TECH_FIT_OPTIONS,
  TECH_STACK_TOOLS,
  EMPTY_SEGMENT_FILTERS,
  toggle,
  toggleNumber,
  type SegmentFilterState,
} from "@/lib/segment-builder-constants"

interface SegmentFilterTabProps {
  filters: SegmentFilterState
  onFiltersChange: (filters: SegmentFilterState) => void
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(opt) ? SEGMENT_CHIP_SELECTED : SEGMENT_CHIP_DEFAULT
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function CountryPicker({
  included,
  excluded,
  countryMode,
  onModeChange,
  onInclude,
  onExclude,
}: {
  included: string[]
  excluded: string[]
  countryMode: "include" | "exclude"
  onModeChange: (mode: "include" | "exclude") => void
  onInclude: (v: string) => void
  onExclude: (v: string) => void
}) {
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q))
      : ALL_COUNTRIES
    return list
  }, [search])
  const popular = POPULAR_COUNTRIES.filter((c) =>
    search.trim() ? c.toLowerCase().includes(search.trim().toLowerCase()) : true
  )

  const toggleCountry = (country: string) => {
    if (countryMode === "include") onInclude(country)
    else onExclude(country)
  }

  const isActive = (country: string) =>
    countryMode === "include" ? included.includes(country) : excluded.includes(country)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["include", "exclude"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={`px-3 py-1 rounded-full text-xs border capitalize transition-colors ${
              countryMode === mode ? SEGMENT_CHIP_SELECTED : SEGMENT_CHIP_DEFAULT
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      {!search.trim() && popular.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Popular</p>
          <div className="flex flex-wrap gap-1.5">
            {popular.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCountry(c)}
                className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                  isActive(c) ? SEGMENT_CHIP_SELECTED : SEGMENT_CHIP_DEFAULT
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {filtered.slice(0, 40).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCountry(c)}
            className={`px-2 py-1 rounded-full text-xs border transition-colors ${
              isActive(c) ? SEGMENT_CHIP_SELECTED : SEGMENT_CHIP_DEFAULT
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SegmentFilterTab({
  filters,
  onFiltersChange,
}: SegmentFilterTabProps) {
  const [countryMode, setCountryMode] = useState<"include" | "exclude">("include")
  const [designationSearch, setDesignationSearch] = useState("")
  const [designationResults, setDesignationResults] = useState<string[]>([])

  const set = (patch: Partial<SegmentFilterState>) =>
    onFiltersChange({ ...filters, ...patch })

  useEffect(() => {
    const q = designationSearch.trim()
    if (q.length < 2) {
      setDesignationResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<any>(
          `/search/contacts?search=${encodeURIComponent(q)}&limit=20`
        )
        const contacts = res.data?.contacts ?? res.data?.data ?? []
        const titles = [
          ...new Set(
            (Array.isArray(contacts) ? contacts : [])
              .map((c: { standardizedRoles?: string }) => c.standardizedRoles)
              .filter(Boolean)
          ),
        ] as string[]
        setDesignationResults(titles.slice(0, 10))
      } catch {
        setDesignationResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [designationSearch])

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className={SEGMENT_SECTION_HEADER_CLASS}>
          Section 1 — Firmographic
        </p>
        <ChipGroup
          label="Industry"
          options={SEGMENT_INDUSTRIES}
          selected={filters.industries}
          onToggle={(v) => set({ industries: toggle(filters.industries, v) })}
        />
        <ChipGroup
          label="Employee Range"
          options={EMPLOYEE_RANGES}
          selected={filters.employeeRanges}
          onToggle={(v) => set({ employeeRanges: toggle(filters.employeeRanges, v) })}
        />
        <ChipGroup
          label="Annual Revenue"
          options={REVENUE_RANGES}
          selected={filters.annualRevenues}
          onToggle={(v) => set({ annualRevenues: toggle(filters.annualRevenues, v) })}
        />
      </div>

      <div className="space-y-4">
        <p className={SEGMENT_SECTION_HEADER_CLASS}>
          Section 2 — Location
        </p>
        <ChipGroup
          label="Region"
          options={REGIONS}
          selected={filters.regionsInclude}
          onToggle={(v) => set({ regionsInclude: toggle(filters.regionsInclude, v) })}
        />
        <div className="space-y-2">
          <Label className="text-sm font-medium">Country</Label>
          <CountryPicker
            included={filters.countriesInclude}
            excluded={filters.countriesExclude}
            countryMode={countryMode}
            onModeChange={setCountryMode}
            onInclude={(v) =>
              set({ countriesInclude: toggle(filters.countriesInclude, v) })
            }
            onExclude={(v) =>
              set({ countriesExclude: toggle(filters.countriesExclude, v) })
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className={SEGMENT_SECTION_HEADER_CLASS}>
          Section 3 — Tech Stack
        </p>
        <ChipGroup
          label="Tech Stack Include"
          options={TECH_STACK_TOOLS}
          selected={filters.techStackInclude}
          onToggle={(v) => set({ techStackInclude: toggle(filters.techStackInclude, v) })}
        />
        <ChipGroup
          label="Tech Stack Exclude"
          options={TECH_STACK_TOOLS}
          selected={filters.techStackExclude}
          onToggle={(v) => set({ techStackExclude: toggle(filters.techStackExclude, v) })}
        />
      </div>

      <div className="space-y-4">
        <p className={SEGMENT_SECTION_HEADER_CLASS}>
          Section 4 — Scoring & Tier
        </p>
        <ChipGroup
          label="CLV Tier"
          options={CLV_TIER_OPTIONS}
          selected={filters.clvTiers}
          onToggle={(v) => set({ clvTiers: toggle(filters.clvTiers, v) })}
        />
        <ChipGroup
          label="Sales Priority"
          options={SALES_PRIORITY_OPTIONS}
          selected={filters.salesPriorities}
          onToggle={(v) => set({ salesPriorities: toggle(filters.salesPriorities, v) })}
        />
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Final Score Range: {filters.finalScoreMin} – {filters.finalScoreMax}
          </Label>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[filters.finalScoreMin, filters.finalScoreMax]}
            onValueChange={([min, max]) =>
              set({ finalScoreMin: min, finalScoreMax: max })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tech Fit Score</Label>
          <div className="flex flex-wrap gap-2">
            {TECH_FIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  set({
                    techFitScores: toggleNumber(filters.techFitScores, opt.value),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filters.techFitScores.includes(opt.value)
                    ? SEGMENT_CHIP_SELECTED
                    : SEGMENT_CHIP_DEFAULT
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className={SEGMENT_SECTION_HEADER_CLASS}>
          Section 5 — Buyer Persona
        </p>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Designation</Label>
          <Input
            placeholder='Search designation e.g. "CTO", "CFO"...'
            value={designationSearch}
            onChange={(e) => setDesignationSearch(e.target.value)}
          />
          {designationResults.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {designationResults.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set({ designations: toggle(filters.designations, d) })}
                  className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                    filters.designations.includes(d)
                      ? SEGMENT_CHIP_SELECTED
                      : SEGMENT_CHIP_DEFAULT
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          {filters.designations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filters.designations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    set({ designations: filters.designations.filter((x) => x !== d) })
                  }
                  className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {d} ×
                </button>
              ))}
            </div>
          )}
        </div>
        <ChipGroup
          label="Seniority Level"
          options={SENIORITY_LEVELS}
          selected={filters.seniorityLevels}
          onToggle={(v) => set({ seniorityLevels: toggle(filters.seniorityLevels, v) })}
        />
      </div>

      <div className="border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => onFiltersChange(EMPTY_SEGMENT_FILTERS)}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
