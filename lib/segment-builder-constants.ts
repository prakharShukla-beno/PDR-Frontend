export const SEGMENT_SECTION_HEADER_CLASS =
  "font-semibold text-sm uppercase tracking-wide text-muted-foreground"

export const SEGMENT_CHIP_SELECTED =
  "bg-primary text-primary-foreground border-primary"

export const SEGMENT_CHIP_DEFAULT =
  "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"

export const INDUSTRY_CHILDREN: Record<string, string[]> = {
  "BFSI": [
    "BFSI",
    "Banking",
    "Investment Services",
    "Central Banks",
    "Fintech",
    "Social Security",
    "Wealth Management",
    "Insurance Carriers",
  ],
  "IT & ITES": [
    "IT & ITES",
    "Software Development",
    "AI/ML",
    "Blockchain",
    "Cybersecurity",
    "Managed IT",
    "Cloud Infrastructure",
    "Data Centers",
    "BPO",
    "KPO",
    "Call Centers",
    "Back Office",
    "Technical Support",
    "Technology",
  ],
  "Media & Telecom": [
    "Media & Telecom",
    "Streaming Media",
    "Online Gaming",
    "Film/Video",
    "Radio/TV",
    "Publishing/Print",
    "Cinemas",
    "Sports (Broadcast)",
    "Theme Parks",
    "Telecommunications",
    "Internet Services",
  ],
  "Retail, CPG & Hospitality": [
    "Retail, CPG & Hospitality",
    "FMCG",
    "Appliances (White Goods)",
    "Toys & Games",
    "Sports Equipment",
    "Personal Care Products",
    "Retail",
    "Wholesale",
    "E-commerce",
    "Hotels",
    "Restaurants",
    "Catering",
    "Tourism",
    "Food Services",
    "Laundry",
    "Repair of Goods",
    "Domestic Help",
    "Personal Grooming",
  ],
  "Healthcare & Life Sciences": [
    "Healthcare & Life Sciences",
    "Pharmaceuticals",
    "Biotechnology",
    "Medical Device Manufacturing",
    "Hospitals",
    "Clinics",
    "Elderly & Social Care",
    "Diagnostics & Labs",
    "Fitness",
    "Veterinary Services",
  ],
  "Manufacturing & Automotive": [
    "Manufacturing & Automotive",
    "Steel & Iron",
    "Shipbuilding",
    "Aerospace/Aircraft",
    "Locomotive",
    "Armaments",
    "Industrial Machinery",
    "Automotive (OEM)",
    "Electric Vehicles",
    "Farm Equipment",
    "Textiles",
    "Electronics & Semiconductors",
    "Food Processing",
    "Petrochemicals",
    "Plastics",
    "Metal Casting",
    "Furniture",
    "Paper & Pulp",
    "Packaging",
  ],
  "Travel, Transport & Logistics": [
    "Travel, Transport & Logistics",
    "Warehousing",
    "Supply Chain",
    "Postals & Couriers",
    "Trucking",
    "Cab Services",
    "Aviation (Airlines)",
    "Shipping (Maritime)",
    "Railways (Operations)",
  ],
  "Energy, Resources & Utilities": [
    "Energy, Resources & Utilities",
    "Electricity/Thermal",
    "Renewable Energy",
    "Hydro/Natural Gas",
    "Grid Storage/Batteries",
    "Agriculture",
    "Coal & Mining",
    "Oil & Gas (Upstream)",
    "Forestry",
    "Fishing",
    "Water Supply",
    "Sewage Management",
    "Waste Management",
    "Environmental Remediation",
  ],
  "Real Estate & Construction": [
    "Real Estate & Construction",
    "Residential Construction",
    "Commercial Construction",
    "Infrastructure",
    "Real Estate Sales/Leasing",
    "Property Management",
    "Architecture Services",
  ],
  "Public Sector, Gov & Education": [
    "Public Sector, Gov & Education",
    "Government (Federal/State)",
    "Defence (Non-Industrial)",
    "PSUs",
    "Policy Makers",
    "International Bodies",
    "Schools",
    "Universities",
    "Edtech",
    "Non-Profits",
    "Think Tanks",
  ],
  "Professional Services": [
    "Professional Services",
    "Legal",
    "Accounting",
    "Consulting (Strat/HR/Fin/IT)",
    "Marketing & Advertising",
    "Research Analysis",
    "HR & Talent",
    "Payroll",
    "Translation",
    "Vocational Training",
    "Customer Success",
    "Facility Management",
    "Equipment Rental",
    "R&D Services",
    "Media & Design Agency",
  ],
}

export const SEGMENT_INDUSTRIES = [
  "BFSI",
  "IT & ITES",
  "Media & Telecom",
  "Retail, CPG & Hospitality",
  "Healthcare & Life Sciences",
  "Manufacturing & Automotive",
  "Travel, Transport & Logistics",
  "Energy, Resources & Utilities",
  "Real Estate & Construction",
  "Public Sector, Gov & Education",
  "Professional Services",
]

export const expandIndustries = (values: string[]) =>
  [...new Set(values.flatMap((value) => INDUSTRY_CHILDREN[value] ?? [value]))]

export const EMPLOYEE_RANGES = [
  "1-10", "11-50", "51-200", "201-500", "501-1,000",
  "1,001-5,000", "5,001-10,000", "10,000+",
]

export const REVENUE_RANGES = [
  "Seed <$1M", "Early $1M-$10M", "Scale-Up $10M-$50M",
  "Mid-Market $50M-$250M", "Corporate $250M-$1B", "Enterprise $1B+",
]

export const REGIONS = [
  "North America (NA)", "Europe", "Asia-Pacific (APAC)", "South Asia",
  "Southeast Asia", "Middle East", "GCC", "Latin America (LATAM)", "Africa",
]

export const CLV_TIER_OPTIONS = ["Tier A", "Tier B", "Tier C"] as const
export const CLV_TIER_TO_DB: Record<string, string> = {
  "Tier A": "Tier-A (Strategic)",
  "Tier B": "Tier-B (Core)",
  "Tier C": "Tier-C (Mass)",
}
export const CLV_TIER_FROM_DB: Record<string, string> = {
  "Tier-A (Strategic)": "Tier A",
  "Tier-B (Core)": "Tier B",
  "Tier-C (Mass)": "Tier C",
}

export const SALES_PRIORITY_OPTIONS = ["P1", "P2", "P3", "P4"] as const
export const SALES_PRIORITY_TO_DB: Record<string, string> = {
  P1: "P1 (Tier A+Active)",
  P2: "P2 (Tier B+Active)",
  P3: "P3 (Tier A+Cold)",
  P4: "P4 (Tier B+Cold)",
}

export const TECH_FIT_OPTIONS = [
  { label: "Core Match (90)", value: 90 },
  { label: "Adjacent Match (60)", value: 60 },
  { label: "No Match (0)", value: 0 },
]

export const SENIORITY_LEVELS = [
  "Executive (C-Suite / VP)",
  "Management (Director / Manager)",
  "Senior Professional (IC)",
  "Associate / Entry Level",
]

export const TECH_STACK_TOOLS = [
  "React", "Next.js", "Angular", "Vue.js", "Node.js", ".NET Core",
  "Java (Spring)", "Python", "AWS", "Microsoft Azure", "GCP",
  "Salesforce", "HubSpot", "Docker", "Kubernetes", "PostgreSQL",
  "MongoDB", "OpenAI", "LangChain", "jQuery (Legacy)", "PHP",
  "SAP S/4HANA", "Oracle DB", "On-Premise", "MySQL",
]

export const REGION_COUNTRIES: Record<string, string[]> = {
  "North America (NA)": ["United States", "Canada", "Mexico"],
  "Europe": [
    "United Kingdom", "Germany", "France", "Netherlands", "Sweden",
    "Norway", "Denmark", "Finland", "Switzerland", "Austria", "Belgium",
    "Spain", "Italy", "Portugal", "Ireland", "Poland",
  ],
  "Asia-Pacific (APAC)": [
    "China", "Japan", "South Korea", "Australia", "New Zealand",
    "Hong Kong", "Taiwan",
  ],
  "South Asia": ["India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives"],
  "Southeast Asia": [
    "Singapore", "Indonesia", "Malaysia", "Thailand", "Vietnam",
    "Philippines", "Myanmar", "Cambodia",
  ],
  "Middle East": [
    "Turkey", "Israel", "Jordan", "Lebanon", "Iraq", "Iran",
    "Yemen", "Oman", "Kuwait", "Bahrain", "Qatar",
  ],
  "GCC": ["Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman"],
  "Latin America (LATAM)": [
    "Brazil", "Mexico", "Argentina", "Colombia", "Chile", "Peru",
    "Venezuela", "Ecuador",
  ],
  "Africa": [
    "South Africa", "Nigeria", "Kenya", "Egypt", "Ghana", "Ethiopia",
    "Morocco", "Tunisia",
  ],
}

export const POPULAR_COUNTRIES = [
  "United States", "India", "United Kingdom", "Germany", "Canada", "Australia",
  "Singapore", "United Arab Emirates", "Saudi Arabia", "France", "Netherlands", "Brazil",
]

export const ALL_COUNTRIES = [
  ...new Set([...Object.values(REGION_COUNTRIES).flat()]),
].sort((a, b) => a.localeCompare(b))

export type SegmentFilterState = {
  industries: string[]
  employeeRanges: string[]
  annualRevenues: string[]
  regionsInclude: string[]
  regionsExclude: string[]
  countriesInclude: string[]
  countriesExclude: string[]
  techStackInclude: string[]
  techStackExclude: string[]
  clvTiers: string[]
  salesPriorities: string[]
  finalScoreMin: number
  finalScoreMax: number
  techFitScores: number[]
  designations: string[]
  seniorityLevels: string[]
}

export const EMPTY_SEGMENT_FILTERS: SegmentFilterState = {
  industries: [],
  employeeRanges: [],
  annualRevenues: [],
  regionsInclude: [],
  regionsExclude: [],
  countriesInclude: [],
  countriesExclude: [],
  techStackInclude: [],
  techStackExclude: [],
  clvTiers: [],
  salesPriorities: [],
  finalScoreMin: 0,
  finalScoreMax: 100,
  techFitScores: [],
  designations: [],
  seniorityLevels: [],
}

export const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

export const toggleNumber = (arr: number[], val: number) =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

export const hasActiveSegmentFilters = (f: SegmentFilterState) =>
  f.industries.length > 0 ||
  f.employeeRanges.length > 0 ||
  f.annualRevenues.length > 0 ||
  f.regionsInclude.length > 0 ||
  f.regionsExclude.length > 0 ||
  f.countriesInclude.length > 0 ||
  f.countriesExclude.length > 0 ||
  f.techStackInclude.length > 0 ||
  f.techStackExclude.length > 0 ||
  f.clvTiers.length > 0 ||
  f.salesPriorities.length > 0 ||
  f.techFitScores.length > 0 ||
  f.designations.length > 0 ||
  f.seniorityLevels.length > 0 ||
  f.finalScoreMin > 0 ||
  f.finalScoreMax < 100

export const buildSavedFilters = (f: SegmentFilterState) => {
  const saved: Record<string, unknown> = {}
  if (f.industries.length) saved.industries = expandIndustries(f.industries)
  if (f.employeeRanges.length) saved.employeeRanges = f.employeeRanges
  if (f.annualRevenues.length) saved.annualRevenues = f.annualRevenues
  if (f.regionsInclude.length) saved.regionsInclude = f.regionsInclude
  if (f.regionsExclude.length) saved.regionsExclude = f.regionsExclude
  if (f.countriesInclude.length) saved.countries = f.countriesInclude
  if (f.techStackInclude.length) saved.techStackInclude = f.techStackInclude
  if (f.techStackExclude.length) saved.techStackExclude = f.techStackExclude
  if (f.clvTiers.length) {
    saved.tierFilter = f.clvTiers.map((t) => CLV_TIER_TO_DB[t] ?? t)
  }
  if (f.salesPriorities.length) {
    saved.salesPriorities = f.salesPriorities.map((p) => SALES_PRIORITY_TO_DB[p] ?? p)
  }
  if (f.finalScoreMin > 0) saved.minFinalScore = f.finalScoreMin
  if (f.finalScoreMax < 100) saved.maxFinalScore = f.finalScoreMax
  if (f.techFitScores.length) saved.techFitScores = f.techFitScores
  if (f.designations.length) saved.designations = f.designations
  if (f.seniorityLevels.length) saved.seniorityLevels = f.seniorityLevels
  return saved
}

export const formatClvTier = (tier?: string | null) => {
  if (!tier) return "—"
  return CLV_TIER_FROM_DB[tier] ?? tier.replace("Tier-", "Tier ").split(" ")[0]
}
