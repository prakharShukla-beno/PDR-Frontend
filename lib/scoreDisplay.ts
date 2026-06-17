/** Shared helpers for ICP Fit vs CLV score display */

export type IcpScoreBreakdown = {
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

export function getIcpFitBadgeClass(score: number | null | undefined): string {
  if (score == null) return "bg-gray-50 text-gray-500 border-gray-200"
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200"
  if (score >= 50) return "bg-yellow-50 text-yellow-700 border-yellow-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export function getIcpMatchLabel(score: number) {
  if (score >= 80) return { label: "Strong Match", className: "bg-green-100 text-green-800 border-green-200" }
  if (score >= 50) return { label: "Partial Match", className: "bg-yellow-100 text-yellow-800 border-yellow-200" }
  return { label: "Weak Match", className: "bg-red-100 text-red-800 border-red-200" }
}

export function formatIcpBreakdownLines(breakdown?: IcpScoreBreakdown) {
  const firm =
    (breakdown?.firmographic?.industry?.score ?? 0) +
    (breakdown?.firmographic?.employee?.score ?? 0) +
    (breakdown?.firmographic?.revenue?.score ?? 0)
  const market = breakdown?.market?.market?.score ?? 0
  const tech = breakdown?.tech?.tech?.score ?? 0
  const persona = breakdown?.persona?.persona?.score ?? 0
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
