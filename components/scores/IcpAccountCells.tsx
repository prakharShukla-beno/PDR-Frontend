"use client"

import type { Prospect } from "@/types"
import {
  formatIcpFinalScoreTooltip,
  getIcpPriorityDisplay,
  getIcpScoreCircleClass,
  getIcpTierBadgeClass,
  getTechFitBandColor,
} from "@/lib/scoreDisplay"

export function TechFitScoreCell({ prospect }: { prospect: Prospect }) {
  const techFitScore = prospect.techFitScoreIcp
  const techFitBand = prospect.techFitBand
  const techFitColor = getTechFitBandColor(techFitBand)
  const tooltip = `${techFitScore ?? "--"} · ${techFitBand ?? "Not scored"}`

  if (techFitScore === null || techFitScore === undefined) {
    return (
      <div className="relative group flex items-center justify-center">
        <span className="text-gray-300 font-medium text-sm">--</span>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-10 pointer-events-none">
          {tooltip}
        </div>
      </div>
    )
  }

  return (
    <div className="relative group flex items-center justify-center">
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${techFitColor}`}
      >
        {techFitScore}
      </div>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-10 pointer-events-none">
        {tooltip}
      </div>
    </div>
  )
}

export function IcpScoreCell({ prospect }: { prospect: Prospect }) {
  const score = prospect.icpFinalScore

  if (score === null || score === undefined) {
    return (
      <div className="relative group flex items-center justify-center">
        <span className="text-gray-300 font-medium text-sm">--</span>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-10 pointer-events-none">
          Set a Benchmark ICP to see ICP scores
          {prospect.icpScoreStale && (
            <span className="block text-yellow-300 mt-0.5">
              Score is stale — run Re-Tier All
            </span>
          )}
        </div>
      </div>
    )
  }

  const isStale = prospect.icpScoreStale
  const scoreColor = getIcpScoreCircleClass(score)
  const tooltip = formatIcpFinalScoreTooltip(prospect)

  return (
    <div className="relative group flex items-center justify-center">
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${scoreColor} ${isStale ? "opacity-60" : ""}`}
      >
        {score}
      </div>
      {(tooltip || isStale) && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-10 pointer-events-none">
          {tooltip}
          {isStale && (
            <span className={`block ${tooltip ? "text-yellow-300 mt-0.5" : ""}`}>
              Score is stale — click Re-Tier All to refresh
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function IcpTierCell({ prospect }: { prospect: Prospect }) {
  const tier = prospect.icpTier

  if (!tier) {
    return <span className="text-gray-300 text-sm">--</span>
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getIcpTierBadgeClass(tier)}`}
    >
      {tier}
    </span>
  )
}

export function IcpPriorityCell({ prospect }: { prospect: Prospect }) {
  const priority = prospect.icpSalesPriority

  if (!priority) {
    return <span className="text-gray-300 text-sm">--</span>
  }

  const display = getIcpPriorityDisplay(priority)
  if (!display) {
    return <span className="text-gray-300 text-sm">--</span>
  }

  return (
    <span className={`text-sm font-medium ${display.color}`}>
      {display.label}
    </span>
  )
}
