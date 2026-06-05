"use client"

// ICP Builder — Create + Edit
// APIs:
//   POST /api/icp              → create
//   GET  /api/icp/:id          → load for edit
//   PUT  /api/icp/:id          → update
//   GET  /api/icp/:id/match-prospects → matching accounts

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Loader2, Save, Users,
  Building2, Target, ChevronRight,
  Globe, MapPin, X, Plus, Cpu,
} from "lucide-react"
import { Button }            from "@/components/ui/button"
import { Input }             from "@/components/ui/input"
import { Label }             from "@/components/ui/label"
import { Badge }             from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox }          from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api }               from "@/lib/api"
import type { Prospect }     from "@/types"

// ── Static options ─────────────────────────────────────────────────────────────
// Step 1.2 — renamed from "Industries" to "Commercial Sector"
const COMMERCIAL_SECTOR_OPTIONS = [
  "BFSI", "IT & ITES", "SaaS", "Fintech", "E-commerce",
  "Healthcare", "EdTech", "Logistics", "Manufacturing",
  "Retail & CPG", "Media & Telecom", "Real Estate",
]
// Step 1.1 — Commercial Category (new field under Business Model)
const COMMERCIAL_CATEGORY_OPTIONS = [
  "Product Led", "SaaS / Subscriptions", "Professional Services",
  "Retail / E-Com", "Network / Platform", "Regulated (Health/Fin)", "Public / Gov",
]
const BUSINESS_MODEL_OPTIONS = ["B2B", "B2C", "B2B2C", "D2C", "E-Commerce", "Marketplace"]

// Step 2 — Tech Fit: 9 categories with tools (accordion + include/exclude like regions)
const TECH_STACK_CATEGORIES = [
  {
    label: "Cloud Provider",
    tools: ["AWS", "Microsoft Azure", "Google Cloud (GCP)", "Oracle Cloud", "Digital Ocean", "IBM Cloud", "On-Premise"],
  },
  {
    label: "CRM & ERP",
    tools: ["Salesforce", "HubSpot", "SAP S/4HANA", "MS Dynamics 365", "Oracle NetSuite", "Zoho", "Odoo", "Pipedrive"],
  },
  {
    label: "Frontend Framework",
    tools: ["React", "Angular", "Vue.js", "Next.js", "Svelte", "jQuery (Legacy)", "Flutter (Web)"],
  },
  {
    label: "Backend / Language",
    tools: ["Python (Django/Flask)", "Node.js", "Java (Spring)", "PHP (Laravel)", "Ruby on Rails", ".NET Core", "Go"],
  },
  {
    label: "Database",
    tools: ["PostgreSQL", "MySQL", "MongoDB (NoSQL)", "Oracle DB", "Snowflake", "Redis", "DynamoDB"],
  },
  {
    label: "DevOps & CI/CD",
    tools: ["Jenkins", "GitHub Actions", "GitLab CI", "Docker", "Kubernetes", "Terraform", "CircleCI", "Azure DevOps"],
  },
  {
    label: "Marketing Tech",
    tools: ["Marketo", "Mailchimp", "Klaviyo", "Adobe Experience Cloud", "Pardot", "Active Campaign"],
  },
  {
    label: "E-commerce",
    tools: ["Shopify", "Magento", "WooCommerce", "BigCommerce", "Salesforce Commerce Cloud"],
  },
  {
    label: "Cybersecurity",
    tools: ["CrowdStrike", "Okta", "Palo Alto Networks", "Zscaler", "Splunk", "Cloudflare"],
  },
]
const EMPLOYEE_RANGES = ["1-50", "51-200", "201-500", "501-1,000", "1,001-5,000", "5,000+"]
const REVENUE_RANGES  = [
  "Seed <$1M", "Early $1M-$10M", "Scale-Up $10M-$50M",
  "Mid-Market $50M-$250M", "Corporate $250M-$1B", "Enterprise $1B+",
]

// Regions — image 1 reference
const REGIONS = [
  { label: "Asia-Pacific (APAC)",   countries: ["China","Japan","India","Pakistan","Australia","South Korea","Indonesia","Singapore"] },
  { label: "Middle East",           countries: ["Saudi Arabia","UAE","Israel","Qatar","Kuwait","Jordan","Oman"] },
  { label: "Africa",                countries: ["Nigeria","South Africa","Kenya","Egypt","Ghana","Ethiopia"] },
  { label: "Europe",                countries: ["Germany","UK","France","Italy","Spain","Netherlands","Switzerland"] },
  { label: "North America (NA)",    countries: ["United States","Canada"] },
  { label: "Latin America (LATAM)", countries: ["Brazil","Mexico","Argentina","Chile","Colombia","Peru"] },
]

// All countries — image 2 & 3 reference (alphabetical)
const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada",
  "Central African Republic","Chad","Chile","China","Colombia","Comoros",
  "Congo (Congo-Brazzaville)","Costa Rica","Croatia","Cuba","Cyprus",
  "Czechia (Czech Republic)","Democratic Republic of the Congo","Denmark",
  "Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland",
  "France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya",
  "Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua",
  "Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan",
  "Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
  "Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis",
  "Saint Lucia","Saint Vincent","Samoa","San Marino","Saudi Arabia","Senegal",
  "Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain",
  "Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","UAE",
  "Uganda","UK","Ukraine","United States","Uruguay","Uzbekistan","Vanuatu",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
]

const SENIORITY_OPTIONS   = ["C-Suite", "VP", "Director", "Manager", "Senior IC"]
const DEPARTMENT_OPTIONS  = ["Technology", "Operations", "Sales", "Finance", "Marketing", "HR"]
const DESIGNATION_OPTIONS = ["CTO", "VP Engineering", "IT Director", "CIO", "VP Sales", "Head of Operations", "CFO"]

const toggle = (list: string[], val: string) =>
  list.includes(val) ? list.filter(v => v !== val) : [...list, val]

// ── IncludeExcludeChips — reusable chip row with Include/Exclude tabs ──────────
function IncludeExcludeChips({
  label, options, included, excluded,
  onInclude, onExclude,
}: {
  label: string
  options: string[]
  included: string[]
  excluded: string[]
  onInclude: (v: string) => void
  onExclude: (v: string) => void
}) {
  const [mode, setMode] = useState<"include" | "exclude">("include")

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex rounded-md border overflow-hidden text-xs">
          <button
            className={`px-3 py-1 transition-colors ${mode === "include" ? "bg-green-600 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
            onClick={() => setMode("include")}
          >
            + Include
          </button>
          <button
            className={`px-3 py-1 transition-colors ${mode === "exclude" ? "bg-red-500 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
            onClick={() => setMode("exclude")}
          >
            − Exclude
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isIncluded = included.includes(opt)
          const isExcluded = excluded.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => mode === "include" ? onInclude(opt) : onExclude(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isIncluded ? "bg-green-600 text-white border-green-600" :
                isExcluded ? "bg-red-500 text-white border-red-500" :
                "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {isIncluded && "✓ "}{isExcluded && "✗ "}{opt}
            </button>
          )
        })}
      </div>

      {/* Active selections summary */}
      {(included.length > 0 || excluded.length > 0) && (
        <div className="flex flex-wrap gap-1 pt-1">
          {included.map(v => (
            <Badge key={v} className="text-xs gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              +{v}
              <button onClick={() => onInclude(v)}><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
          {excluded.map(v => (
            <Badge key={v} className="text-xs gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
              −{v}
              <button onClick={() => onExclude(v)}><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Country picker with search ────────────────────────────────────────────────
function CountryPicker({
  includedCountries, excludedCountries,
  onInclude, onExclude,
}: {
  includedCountries: string[]
  excludedCountries: string[]
  onInclude: (v: string) => void
  onExclude: (v: string) => void
}) {
  const [search,  setSearch]  = useState("")
  const [mode,    setMode]    = useState<"include" | "exclude">("include")
  const [showAll, setShowAll] = useState(false)

  const filtered = ALL_COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  )
  const visible = showAll ? filtered : filtered.slice(0, 30)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Specific Countries</Label>
        <div className="flex rounded-md border overflow-hidden text-xs">
          <button
            className={`px-3 py-1 transition-colors ${mode === "include" ? "bg-green-600 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
            onClick={() => setMode("include")}
          >
            + Include
          </button>
          <button
            className={`px-3 py-1 transition-colors ${mode === "exclude" ? "bg-red-500 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
            onClick={() => setMode("exclude")}
          >
            − Exclude
          </button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search country..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      {/* Country chips */}
      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
        {visible.map(country => {
          const isIncluded = includedCountries.includes(country)
          const isExcluded = excludedCountries.includes(country)
          return (
            <button
              key={country}
              type="button"
              onClick={() => mode === "include" ? onInclude(country) : onExclude(country)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                isIncluded ? "bg-green-600 text-white border-green-600" :
                isExcluded ? "bg-red-500 text-white border-red-500" :
                "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {isIncluded && "✓ "}{isExcluded && "✗ "}{country}
            </button>
          )
        })}
      </div>

      {filtered.length > 30 && !showAll && (
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => setShowAll(true)}
        >
          Show all {filtered.length} countries
        </button>
      )}

      {/* Selected countries summary */}
      {(includedCountries.length > 0 || excludedCountries.length > 0) && (
        <div className="flex flex-wrap gap-1 pt-1 border-t">
          {includedCountries.map(v => (
            <Badge key={v} className="text-xs gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              +{v}
              <button onClick={() => onInclude(v)}><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
          {excludedCountries.map(v => (
            <Badge key={v} className="text-xs gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
              −{v}
              <button onClick={() => onExclude(v)}><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Simple chip toggle ─────────────────────────────────────────────────────────
function ChipGroup({ label, options, selected, onToggle }: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt} type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function IcpBuilderPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const editId       = searchParams.get("id")

  // ── Basic info ──────────────────────────────────────────────────────────────
  const [name,        setName]        = useState("")
  const [description, setDescription] = useState("")

  // ── Company filters ─────────────────────────────────────────────────────────
  const [industries,           setIndustries]           = useState<string[]>([])
  const [commercialCategories, setCommercialCategories] = useState<string[]>([]) // Step 1.1
  const [businessModels,       setBusinessModels]       = useState<string[]>([])
  const [employeeRanges,       setEmployeeRanges]       = useState<string[]>([])
  const [revenues,             setRevenues]             = useState<string[]>([])

  // ── Tech Fit (Step 2 — 4th tab) — same structure as Region ─────────────────
  const [techCategoriesInclude, setTechCategoriesInclude] = useState<string[]>([]) // like regionsInclude
  const [techCategoriesExclude, setTechCategoriesExclude] = useState<string[]>([]) // like regionsExclude
  const [techStackExclude,      setTechStackExclude]      = useState<string[]>([]) // individual tool exclusions within included categories (like regionCountriesExclude)
  const [techStackInclude,      setTechStackInclude]      = useState<string[]>([]) // kept for payload compat

  // ── Validation error for Buyer Persona (Step 3) ──────────────────────────────
  const [personaError, setPersonaError] = useState("")

  // ── Target Market ───────────────────────────────────────────────────────────
  const [regionsInclude,         setRegionsInclude]         = useState<string[]>([])
  const [regionsExclude,         setRegionsExclude]         = useState<string[]>([])
  const [regionCountriesExclude, setRegionCountriesExclude] = useState<string[]>([]) // countries excluded within included regions
  const [countriesInclude,       setCountriesInclude]       = useState<string[]>([])
  const [countriesExclude,       setCountriesExclude]       = useState<string[]>([])

  // ── Buyer Persona ───────────────────────────────────────────────────────────
  const [targetSeniorities,  setTargetSeniorities]  = useState<string[]>([])
  const [targetDepartments,  setTargetDepartments]  = useState<string[]>([])
  const [targetDesignations, setTargetDesignations] = useState<string[]>([])

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isLoadingIcp, setIsLoadingIcp] = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [saveMsg,      setSaveMsg]      = useState("")
  const [savedIcpId,   setSavedIcpId]   = useState<string | null>(editId)

  // ── Matched prospects panel ─────────────────────────────────────────────────
  const [matchedProspects, setMatchedProspects] = useState<Prospect[]>([])
  const [isMatching,       setIsMatching]       = useState(false)
  const [matchTotal,       setMatchTotal]       = useState(0)

  // Load ICP for edit — GET /api/icp/:id returns { success, data: icpObject }
  useEffect(() => {
    if (!editId) return
    setIsLoadingIcp(true)
    api.get<any>(`/icp/${editId}`)
      .then(res => {
        const icp = res.data?.data ?? res.data
        if (!icp) return
        setName(icp.name ?? "")
        setDescription(icp.description ?? "")
        setIndustries(icp.industries ?? [])
        setBusinessModels(icp.businessModels ?? [])
        setEmployeeRanges(icp.employeeRanges ?? [])
        setRevenues(icp.annualRevenues ?? [])
        setCommercialCategories(icp.commercialCategories ?? [])
        setTechCategoriesInclude(icp.techCategoriesInclude ?? [])
        setTechCategoriesExclude(icp.techCategoriesExclude ?? [])
        setTechStackInclude(icp.techStackInclude ?? [])
        setTechStackExclude(icp.techStackExclude ?? [])
        setRegionsInclude(icp.targetRegionsInclude ?? [])
        setRegionsExclude(icp.targetRegionsExclude ?? [])
        setRegionCountriesExclude(icp.targetRegionCountriesExclude ?? [])
        setCountriesInclude(icp.targetCountriesInclude ?? [])
        setCountriesExclude(icp.targetCountriesExclude ?? [])
        setTargetSeniorities(icp.buyerPersona?.targetSeniorities ?? [])
        setTargetDepartments(icp.buyerPersona?.targetDepartments ?? [])
        setTargetDesignations(icp.buyerPersona?.targetDesignations ?? [])
      })
      .catch(console.error)
      .finally(() => setIsLoadingIcp(false))
  }, [editId])

  useEffect(() => { if (editId) fetchMatches(editId) }, [editId])

  // GET /api/icp/:id/match-prospects — { success, data: { prospects, pagination } }
  const fetchMatches = async (icpId: string) => {
    setIsMatching(true)
    try {
      const res = await api.get<any>(`/icp/${icpId}/match-prospects?page=1&limit=20`)
      setMatchedProspects(res.data?.data?.prospects || res.data?.prospects || [])
      setMatchTotal(res.data?.data?.pagination?.total || res.data?.pagination?.total || 0)
    } catch (err) {
      console.error("Match error:", err)
    } finally {
      setIsMatching(false)
    }
  }

  // Toggle region — mutually exclusive from exclude list
  const toggleRegionInclude = (region: string) => {
    const isRemoving = regionsInclude.includes(region)
    setRegionsInclude(prev => toggle(prev, region))
    setRegionsExclude(prev => prev.filter(r => r !== region))
    // If removing a region, also clean up any per-country exclusions for that region's countries
    if (isRemoving) {
      const regionCountries = REGIONS.find(r => r.label === region)?.countries ?? []
      setRegionCountriesExclude(prev => prev.filter(c => !regionCountries.includes(c)))
    }
  }
  const toggleRegionExclude = (region: string) => {
    setRegionsExclude(prev => toggle(prev, region))
    setRegionsInclude(prev => prev.filter(r => r !== region))
  }

  // Toggle country — mutually exclusive
  const toggleCountryInclude = (c: string) => {
    setCountriesInclude(prev => toggle(prev, c))
    setCountriesExclude(prev => prev.filter(v => v !== c))
  }
  const toggleCountryExclude = (c: string) => {
    setCountriesExclude(prev => toggle(prev, c))
    setCountriesInclude(prev => prev.filter(v => v !== c))
  }

  // POST /api/icp or PUT /api/icp/:id
  // Tech Fit toggle helpers — exactly like region toggles
  const toggleTechCategoryInclude = (cat: string) => {
    const isRemoving = techCategoriesInclude.includes(cat)
    setTechCategoriesInclude(prev => toggle(prev, cat))
    setTechCategoriesExclude(prev => prev.filter(c => c !== cat))
    // If removing a category, clean up its individual tool exclusions
    if (isRemoving) {
      const catTools = TECH_STACK_CATEGORIES.find(c => c.label === cat)?.tools ?? []
      setTechStackExclude(prev => prev.filter(t => !catTools.includes(t)))
    }
  }
  const toggleTechCategoryExclude = (cat: string) => {
    setTechCategoriesExclude(prev => toggle(prev, cat))
    setTechCategoriesInclude(prev => prev.filter(c => c !== cat))
  }

  const handleSave = async () => {
    if (!name.trim()) { setSaveMsg("❌ ICP naam zaroori hai."); return }
    // Step 3 — Buyer Persona mandatory validation
    if (targetSeniorities.length === 0 && targetDepartments.length === 0 && targetDesignations.length === 0) {
      setPersonaError("Please select at least one Seniority, Department, or Designation.")
      setSaveMsg("❌ Buyer Persona is required before saving.")
      return
    }
    setPersonaError("")
    setIsSaving(true)
    setSaveMsg("")
    try {
      const payload = {
        name: name.trim(),
        description:            description || undefined,
        industries,
        commercialCategories,
        businessModels,
        employeeRanges,
        annualRevenues:          revenues,
        techCategoriesInclude,
        techCategoriesExclude,
        techStackInclude: techCategoriesInclude.flatMap(cat =>
          TECH_STACK_CATEGORIES.find(c => c.label === cat)?.tools ?? []
        ).filter(t => !techStackExclude.includes(t)),
        techStackExclude,
        targetRegionsInclude:          regionsInclude,
        targetRegionsExclude:          regionsExclude,
        targetRegionCountriesExclude:  regionCountriesExclude,
        targetCountriesInclude:        countriesInclude,
        targetCountriesExclude:        countriesExclude,
        buyerPersona: {
          targetSeniorities,
          targetDepartments,
          targetDesignations,
        },
      }

      let icpId = savedIcpId
      if (editId || savedIcpId) {
        await api.put<any>(`/icp/${editId || savedIcpId}`, payload)
        icpId = editId || savedIcpId
        setSaveMsg("✅ ICP profile updated successfully!")
      } else {
        const res = await api.post<any>("/icp", payload)
        icpId = res.data?.data?._id || res.data?._id
        setSavedIcpId(icpId)
        setSaveMsg("✅ ICP profile saved successfully!")
        router.replace(`/segments/icp-builder?id=${icpId}`)
      }
      if (icpId) fetchMatches(icpId)
    } catch {
      setSaveMsg("❌ Save failed. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingIcp) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Total market selections for badge
  const marketCount = regionsInclude.length + regionsExclude.length +
                      regionCountriesExclude.length +
                      countriesInclude.length + countriesExclude.length

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/segments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{editId ? "Edit ICP Profile" : "New ICP Profile"}</h1>
          <p className="text-sm text-muted-foreground">
            Define your Ideal Customer Profile — system will match prospects automatically.
          </p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : editId ? "Update ICP" : "Save ICP"}
        </Button>
      </div>

      {saveMsg && (
        <div className="text-sm px-4 py-2.5 rounded-lg border bg-muted/20">{saveMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="company">
            <TabsList className="w-full">
              <TabsTrigger value="company" className="flex-1">Company Profile</TabsTrigger>
              <TabsTrigger value="market" className="flex-1 gap-1.5">
                Target Market
                {marketCount > 0 && (
                  <Badge variant="secondary" className="text-xs h-4 px-1">{marketCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="techfit" className="flex-1 gap-1.5">
                Tech Fit
                {(techCategoriesInclude.length + techCategoriesExclude.length) > 0 && (
                  <Badge variant="secondary" className="text-xs h-4 px-1">
                    {techCategoriesInclude.length + techCategoriesExclude.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="persona" className="flex-1 gap-1.5">
                Buyer Persona
                {personaError && <span className="text-red-500 text-xs">*</span>}
              </TabsTrigger>
            </TabsList>

            {/* ────────── COMPANY PROFILE TAB ────────── */}
            <TabsContent value="company" className="mt-4 space-y-4">

              {/* Name + description */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label>ICP Name *</Label>
                    <Input
                      placeholder="e.g. Enterprise BFSI APAC"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="e.g. Large BFSI companies with modern tech stack"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Step 1.2 — Commercial Sector (renamed from Industries) */}
              <Card>
                <CardContent className="p-4">
                  <ChipGroup
                    label="Commercial Sector"
                    options={COMMERCIAL_SECTOR_OPTIONS}
                    selected={industries}
                    onToggle={v => setIndustries(p => toggle(p, v))}
                  />
                </CardContent>
              </Card>

              {/* Business Models */}
              <Card>
                <CardContent className="p-4">
                  <ChipGroup
                    label="Business Models"
                    options={BUSINESS_MODEL_OPTIONS}
                    selected={businessModels}
                    onToggle={v => setBusinessModels(p => toggle(p, v))}
                  />
                </CardContent>
              </Card>

              {/* Step 1.1 — Commercial Category (new field under Business Model) */}
              <Card>
                <CardContent className="p-4">
                  <ChipGroup
                    label="Commercial Category"
                    options={COMMERCIAL_CATEGORY_OPTIONS}
                    selected={commercialCategories}
                    onToggle={v => setCommercialCategories(p => toggle(p, v))}
                  />
                </CardContent>
              </Card>

              {/* Employee Range + Revenue */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Employee Range</h3>
                    <div className="space-y-2">
                      {EMPLOYEE_RANGES.map(range => (
                        <div key={range} className="flex items-center gap-2">
                          <Checkbox
                            id={`emp-${range}`}
                            checked={employeeRanges.includes(range)}
                            onCheckedChange={() => setEmployeeRanges(p => toggle(p, range))}
                          />
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
                      {REVENUE_RANGES.map(rev => (
                        <div key={rev} className="flex items-center gap-2">
                          <Checkbox
                            id={`rev-${rev}`}
                            checked={revenues.includes(rev)}
                            onCheckedChange={() => setRevenues(p => toggle(p, rev))}
                          />
                          <label htmlFor={`rev-${rev}`} className="text-xs cursor-pointer">{rev}</label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ────────── TARGET MARKET TAB ────────── */}
            <TabsContent value="market" className="mt-4 space-y-4">

              {/* Region selector with Include/Exclude */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Region</h3>
                    <p className="text-xs text-muted-foreground ml-auto">
                      Select a region to target all its countries
                    </p>
                  </div>

                  <IncludeExcludeChips
                    label="Regions"
                    options={REGIONS.map(r => r.label)}
                    included={regionsInclude}
                    excluded={regionsExclude}
                    onInclude={toggleRegionInclude}
                    onExclude={toggleRegionExclude}
                  />

                  {/* Show countries covered by selected regions — with per-country exclude */}
                  {regionsInclude.length > 0 && (() => {
                    const allCountriesInIncludedRegions = regionsInclude.flatMap(r =>
                      REGIONS.find(rx => rx.label === r)?.countries ?? []
                    )
                    return (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-2">
                        <p className="text-xs font-medium text-green-800">
                          Countries included via regions — click any to exclude individually:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {allCountriesInIncludedRegions.map(c => {
                            const isExcluded = regionCountriesExclude.includes(c)
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setRegionCountriesExclude(prev =>
                                    prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                                  )
                                }
                                title={isExcluded ? "Click to re-include" : "Click to exclude this country"}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                  isExcluded
                                    ? "bg-red-100 text-red-700 border-red-300 line-through opacity-70"
                                    : "bg-green-100 text-green-700 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                }`}
                              >
                                {isExcluded ? <X className="h-2.5 w-2.5" /> : null}
                                {c}
                              </button>
                            )
                          })}
                        </div>
                        {regionCountriesExclude.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            ✗ Excluded: {regionCountriesExclude.filter(c => allCountriesInIncludedRegions.includes(c)).join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {regionsExclude.length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-medium text-red-800 mb-2">
                        Countries excluded via regions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {regionsExclude.flatMap(r =>
                          REGIONS.find(rx => rx.label === r)?.countries ?? []
                        ).map(c => (
                          <span key={c} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Country picker */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Specific Countries</h3>
                    <p className="text-xs text-muted-foreground ml-auto">
                      Override or refine region selections
                    </p>
                  </div>

                  <CountryPicker
                    includedCountries={countriesInclude}
                    excludedCountries={countriesExclude}
                    onInclude={toggleCountryInclude}
                    onExclude={toggleCountryExclude}
                  />
                </CardContent>
              </Card>

              {/* Summary of all market criteria */}
              {marketCount > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm">Market Selection Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Included</p>
                        <p className="font-medium text-green-700">
                          {regionsInclude.length > 0 && `${regionsInclude.join(", ")} `}
                          {countriesInclude.length > 0 && `+ ${countriesInclude.length} countries`}
                          {regionsInclude.length === 0 && countriesInclude.length === 0 && "All markets"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Excluded</p>
                        <p className="font-medium text-red-600">
                          {regionsExclude.length > 0 && `${regionsExclude.join(", ")} `}
                          {countriesExclude.length > 0 && `+ ${countriesExclude.length} countries`}
                          {regionsExclude.length === 0 && countriesExclude.length === 0 && "None"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ────────── TECH FIT TAB ────────── */}
            <TabsContent value="techfit" className="mt-4 space-y-4">

              {/* Category selector — exactly like Region */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Tech Category</h3>
                    <p className="text-xs text-muted-foreground ml-auto">
                      Select a category to target all its tools
                    </p>
                  </div>

                  {/* Step 1 — Include/Exclude categories (same as Regions) */}
                  <IncludeExcludeChips
                    label="Categories"
                    options={TECH_STACK_CATEGORIES.map(c => c.label)}
                    included={techCategoriesInclude}
                    excluded={techCategoriesExclude}
                    onInclude={toggleTechCategoryInclude}
                    onExclude={toggleTechCategoryExclude}
                  />

                  {/* Step 2 — Show tools of included categories — click to exclude individually (same as countries in region) */}
                  {techCategoriesInclude.length > 0 && (() => {
                    const allToolsInIncludedCategories = techCategoriesInclude.flatMap(cat =>
                      TECH_STACK_CATEGORIES.find(c => c.label === cat)?.tools ?? []
                    )
                    return (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-2">
                        <p className="text-xs font-medium text-green-800">
                          Tools included via categories — click any to exclude individually:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {allToolsInIncludedCategories.map(tool => {
                            const isExcluded = techStackExclude.includes(tool)
                            return (
                              <button
                                key={tool}
                                type="button"
                                onClick={() =>
                                  setTechStackExclude(prev =>
                                    prev.includes(tool) ? prev.filter(x => x !== tool) : [...prev, tool]
                                  )
                                }
                                title={isExcluded ? "Click to re-include" : "Click to exclude this tool"}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                  isExcluded
                                    ? "bg-red-100 text-red-700 border-red-300 line-through opacity-70"
                                    : "bg-green-100 text-green-700 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                }`}
                              >
                                {isExcluded ? <X className="h-2.5 w-2.5" /> : null}
                                {tool}
                              </button>
                            )
                          })}
                        </div>
                        {techStackExclude.filter(t => allToolsInIncludedCategories.includes(t)).length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            ✗ Excluded: {techStackExclude.filter(t => allToolsInIncludedCategories.includes(t)).join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {/* Excluded categories — show their tools in red (same as excluded regions) */}
                  {techCategoriesExclude.length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-medium text-red-800 mb-2">
                        Tools excluded via categories:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {techCategoriesExclude.flatMap(cat =>
                          TECH_STACK_CATEGORIES.find(c => c.label === cat)?.tools ?? []
                        ).map(tool => (
                          <span key={tool} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              {(techCategoriesInclude.length + techCategoriesExclude.length) > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm">Tech Fit Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Included</p>
                        <p className="font-medium text-green-700">
                          {techCategoriesInclude.length > 0 ? techCategoriesInclude.join(", ") : "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Excluded</p>
                        <p className="font-medium text-red-600">
                          {techCategoriesExclude.length > 0 ? techCategoriesExclude.join(", ") : "None"}
                          {techStackExclude.length > 0 && ` + ${techStackExclude.length} individual tools`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ────────── BUYER PERSONA TAB ────────── */}
            <TabsContent value="persona" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Target Buyer Persona</h3>
                    <span className="text-xs text-red-500 ml-1">* Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Who to contact in a matching company — seniority, department, designation.
                  </p>

                  {/* Step 3 — validation error */}
                  {personaError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                      ⚠ {personaError}
                    </div>
                  )}

                  <ChipGroup
                    label="Seniority Level"
                    options={SENIORITY_OPTIONS}
                    selected={targetSeniorities}
                    onToggle={v => { setTargetSeniorities(p => toggle(p, v)); setPersonaError("") }}
                  />
                  <ChipGroup
                    label="Department"
                    options={DEPARTMENT_OPTIONS}
                    selected={targetDepartments}
                    onToggle={v => { setTargetDepartments(p => toggle(p, v)); setPersonaError("") }}
                  />
                  <ChipGroup
                    label="Designation"
                    options={DESIGNATION_OPTIONS}
                    selected={targetDesignations}
                    onToggle={v => { setTargetDesignations(p => toggle(p, v)); setPersonaError("") }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* ── Right: Matched Prospects ── */}
        <div>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 p-4 border-b">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Matching Prospects</h3>
                {matchTotal > 0 && (
                  <Badge className="ml-auto">{matchTotal}</Badge>
                )}
              </div>

              {!savedIcpId && !isMatching && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Save the ICP profile first — matching prospects will appear here.
                </div>
              )}

              {isMatching && (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isMatching && matchedProspects.length > 0 && (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {matchedProspects.map(prospect => (
                    <Link
                      key={prospect._id}
                      href={`/accounts/${prospect._id}`}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
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
                  No prospects match this ICP. Try loosening the criteria.
                </div>
              )}

              {matchTotal > matchedProspects.length && (
                <div className="p-3 border-t text-center text-xs text-muted-foreground">
                  Showing 20 of {matchTotal} matches
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Segment from this ICP */}
          {savedIcpId && (
            <Button
              variant="outline"
              className="w-full mt-3 gap-2"
              onClick={() => router.push(`/segments/new?from_icp=${savedIcpId}`)}
            >
              <Plus className="h-4 w-4" />
              Create Segment from this ICP
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
