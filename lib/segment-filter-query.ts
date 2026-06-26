import {
  CLV_TIER_TO_DB,
  SALES_PRIORITY_TO_DB,
  expandIndustries,
  type SegmentFilterState,
} from "@/lib/segment-builder-constants"

/** Build query string for GET /api/search/prospects */
export function buildSegmentFilterQuery(f: SegmentFilterState, opts?: { limit?: number; page?: number }) {
  const params = new URLSearchParams()
  const add = (key: string, values: string[]) => values.forEach((v) => params.append(key, v))

  const industries = expandIndustries(f.industries)
  add("industryInclude", industries)
  add("employeesInclude", f.employeeRanges)
  add("revenueInclude", f.annualRevenues)
  add("regionsInclude", f.regionsInclude)
  add("regionsExclude", f.regionsExclude)
  add("countryInclude", f.countriesInclude)
  add("countryExclude", f.countriesExclude)
  add("techStackInclude", f.techStackInclude)
  add("techStackExclude", f.techStackExclude)
  add("clvRankingInclude", f.clvTiers.map((t) => CLV_TIER_TO_DB[t] ?? t))
  add("salesPriorityInclude", f.salesPriorities.map((p) => SALES_PRIORITY_TO_DB[p] ?? p))
  add("designationInclude", f.designations)
  add("seniorityInclude", f.seniorityLevels)

  f.techFitScores.forEach((score) => params.append("techFitScores", String(score)))

  if (f.finalScoreMin > 0) params.set("finalScoreMin", String(f.finalScoreMin))
  if (f.finalScoreMax < 100) params.set("finalScoreMax", String(f.finalScoreMax))

  if (opts?.page) params.set("page", String(opts.page))
  if (opts?.limit) params.set("limit", String(opts.limit))

  return params.toString()
}
