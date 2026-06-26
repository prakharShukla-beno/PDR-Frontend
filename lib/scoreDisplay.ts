/** Shared helpers for ICP Fit vs CLV score display */

/** Nested breakdown from live ICP match API */
export type IcpScoreBreakdownNested = {
  firmographic?: {
    industry?: { score?: number }
    employee?: { score?: number }
    revenue?: { score?: number }
  }
  market?: { market?: { score?: number } }
  tech?: { tech?: { score?: number } }
  persona?: { persona?: { score?: number } }
  formula?: string
}

/** Flat breakdown persisted on prospect (Part 1 schema) */
export type IcpScoreBreakdownPersisted = {
  firmographic?: number | null
  market?: number | null
  tech?: number | null
  persona?: number | null
}

export type IcpScoreBreakdown = IcpScoreBreakdownNested | IcpScoreBreakdownPersisted

const pillarPoints = (value: unknown): number | null => {
  if (value == null) return null
  if (typeof value === "number") return value
  if (typeof value !== "object") return null

  const nested = value as Record<string, { score?: number } | undefined>
  return Object.values(nested).reduce(
    (sum, entry) => sum + (entry?.score ?? 0),
    0
  )
}

export function getIcpScoreCircleClass(score: number | null | undefined): string {
  if (score == null) return "text-gray-400 border-gray-300"
  if (score > 60) return "text-green-600 border-green-500"
  if (score >= 30) return "text-blue-600 border-blue-400"
  return "text-red-500 border-red-400"
}

/** Tech Fit multiplier bands (mirrors backend icpScoreHelpers) */
export function getIcpTechFitMultiplier(techFitScore: number | null | undefined): {
  multiplier: number
  band: string
} {
  if (techFitScore === null || techFitScore === undefined) {
    return { multiplier: 1.0, band: "Unknown" }
  }
  if (techFitScore >= 90) return { multiplier: 1.0, band: "Core Match" }
  if (techFitScore >= 79) return { multiplier: 0.8, band: "Addressable" }
  if (techFitScore >= 50) return { multiplier: 0.5, band: "Stretch" }
  return { multiplier: 0.0, band: "Incompatible" }
}

export function formatIcpFinalScoreTooltip(prospect: {
  icpMatchScore?: number | null
  icpFinalScore?: number | null
  techFitScoreIcp?: number | null
  techFitBand?: string | null
}): string | null {
  const final = prospect.icpFinalScore
  const raw = prospect.icpMatchScore
  if (final == null || raw == null) return null

  const tech = prospect.techFitScoreIcp
  const band = prospect.techFitBand ?? "Not scored"
  return `ICP: ${raw} × Tech: ${tech ?? "--"} (${band}) = ${final}`
}

export function getTechFitBandColor(band?: string | null): string {
  if (band === "Core Match") return "text-green-600 border-green-500"
  if (band === "Addressable") return "text-blue-600 border-blue-400"
  if (band === "Stretch") return "text-yellow-600 border-yellow-400"
  if (band === "Incompatible") return "text-red-500 border-red-400"
  return "text-gray-400 border-gray-300"
}

export function getIcpFitBadgeClass(score: number | null | undefined): string {
  if (score == null) return "bg-gray-50 text-gray-500 border-gray-200"
  if (score > 60) return "bg-green-50 text-green-700 border-green-200"
  if (score >= 30) return "bg-yellow-50 text-yellow-700 border-yellow-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export function getIcpMatchLabel(score: number) {
  if (score > 60) return { label: "Strong Match", className: "bg-green-100 text-green-800 border-green-200" }
  if (score >= 30) return { label: "Partial Match", className: "bg-yellow-100 text-yellow-800 border-yellow-200" }
  return { label: "Weak Match", className: "bg-red-100 text-red-800 border-red-200" }
}

export function formatIcpBreakdownLines(breakdown?: IcpScoreBreakdown) {
  const firm = pillarPoints(breakdown?.firmographic) ?? 0
  const market = pillarPoints(breakdown?.market) ?? 0
  const tech = pillarPoints(breakdown?.tech) ?? 0
  const persona = pillarPoints(breakdown?.persona) ?? 0
  return {
    firmographic: `${firm}/40`,
    market: `${market}/25`,
    tech: `${tech}/25`,
    persona: `${persona}/10`,
  }
}

export function formatIcpBreakdownTooltip(breakdown?: IcpScoreBreakdown) {
  if (!breakdown) return "No breakdown available"
  const lines = formatIcpBreakdownLines(breakdown)
  return `Firmographic: ${lines.firmographic} | Market: ${lines.market} | Tech: ${lines.tech} | Persona: ${lines.persona}`
}

export function getClvTierBadgeClass(clvRanking?: string | null): string {
  if (!clvRanking) return "bg-gray-50 text-gray-500 border-gray-200"
  if (clvRanking.includes("A")) return "bg-green-50 text-green-700 border-green-200"
  if (clvRanking.includes("B")) return "bg-yellow-50 text-yellow-700 border-yellow-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export function getClvTierShort(clvRanking?: string | null): string {
  if (!clvRanking) return "—"
  if (clvRanking.includes("A")) return "Tier A"
  if (clvRanking.includes("B")) return "Tier B"
  if (clvRanking.includes("C")) return "Tier C"
  return clvRanking.split(" ")[0] || "—"
}

export function getClvValueLabel(clvRanking?: string | null): string {
  if (!clvRanking) return "Not scored"
  if (clvRanking.includes("A")) return "High Value"
  if (clvRanking.includes("B")) return "Core Value"
  return "Long Tail"
}

export function getIcpTierBadgeClass(icpTier?: string | null): string {
  if (!icpTier) return "bg-gray-50 text-gray-500 border-gray-200"
  if (icpTier === "Tier A") return "bg-green-100 text-green-700 border border-green-200"
  if (icpTier === "Tier B") return "bg-blue-100 text-blue-700 border border-blue-200"
  return "bg-red-100 text-red-600 border border-red-200"
}

export const ICP_PRIORITY_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  P1: { label: "P1 · Drop Everything", color: "text-red-600" },
  P2: { label: "P2 · Fast Cash", color: "text-orange-500" },
  P3: { label: "P3 · Long Game", color: "text-blue-600" },
  P4: { label: "P4 · Volume", color: "text-gray-500" },
}

export function getIcpPriorityDisplay(priority?: string | null) {
  if (!priority) return null
  const key = priority.startsWith("P") ? priority.slice(0, 2) : priority
  return ICP_PRIORITY_LABELS[key] ?? { label: priority, color: "text-gray-600" }
}

export function getIcpPriorityExplanation(priority?: string | null): {
  title: string
  detail: string
} {
  const descriptions: Record<string, string> = {
    P1: "Drop Everything — Executive call within 30 min",
    P2: "Fast Cash — SDR call within 2 hours",
    P3: "Long Game — Strategic ABM campaign",
    P4: "Volume Game — Automated outreach sequence",
  }

  if (!priority) {
    return {
      title: "No priority assigned",
      detail: "Set a Benchmark ICP and run Re-Tier All to calculate ICP priority.",
    }
  }

  const key = priority.startsWith("P") ? priority.slice(0, 2) : priority
  const display = ICP_PRIORITY_LABELS[key]
  return {
    title: display?.label ?? priority,
    detail: descriptions[key] ?? "",
  }
}

export function getPriorityBadgeClass(priority?: string | null): string {
  if (!priority) return "bg-gray-50 text-gray-500 border-gray-200"
  if (priority.startsWith("P1")) return "bg-red-50 text-red-700 border-red-200"
  if (priority.startsWith("P2")) return "bg-orange-50 text-orange-700 border-orange-200"
  if (priority.startsWith("P3")) return "bg-blue-50 text-blue-700 border-blue-200"
  return "bg-gray-50 text-gray-600 border-gray-200"
}

export function getPriorityShort(priority?: string | null): string {
  if (!priority) return "—"
  return priority.split(" ")[0] || priority
}

export function getPriorityExplanation(priority?: string | null): {
  title: string
  detail: string
} {
  if (priority === "P1" || priority === "P2" || priority === "P3" || priority === "P4") {
    return getIcpPriorityExplanation(priority)
  }

  if (!priority) {
    return {
      title: "No priority assigned",
      detail: "Score this account to get a sales priority recommendation.",
    }
  }
  if (priority.startsWith("P1")) {
    return {
      title: "P1 — Drop Everything",
      detail: "Executive outreach recommended within 30 minutes. High-value account with active intent.",
    }
  }
  if (priority.startsWith("P2")) {
    return {
      title: "P2 — Fast Cash",
      detail: "SDR qualification call within 2 hours. Mid-market account showing interest.",
    }
  }
  if (priority.startsWith("P3")) {
    return {
      title: "P3 — Long Game",
      detail: "Strategic ABM campaign. High-value whale that needs bespoke outreach.",
    }
  }
  if (priority.startsWith("P4")) {
    return {
      title: "P4 — Volume Game",
      detail: "Automated outreach sequence to spark interest and move to P2.",
    }
  }
  return { title: priority, detail: "" }
}

export const ICP_FIT_TOOLTIP =
  "ICP Fit measures how closely this account matches your Ideal Customer Profile across industry, size, tech stack, geography, and buyer persona."

export const CLV_TOOLTIP =
  "CLV Score measures the absolute business value of this account based on revenue capacity, strategic value, and margin potential. Run AI Enrichment to improve this score."
