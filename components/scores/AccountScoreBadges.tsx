"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CLV_TOOLTIP,
  ICP_FIT_TOOLTIP,
  getClvTierBadgeClass,
  getClvTierShort,
  getIcpFitBadgeClass,
  getPriorityBadgeClass,
  getPriorityShort,
} from "@/lib/scoreDisplay"

type ScoreProspect = {
  icpMatchScore?: number | null
  icpFinalScore?: number | null
  icpSalesPriority?: string | null
  clvRanking?: string | null
  salesPriority?: string | null
  finalScore?: number | null
}

export function AccountScoreBadges({ prospect }: { prospect: ScoreProspect }) {
  const icpScore = prospect.icpFinalScore
  const hasIcp = icpScore != null && icpScore > 0
  const priority = prospect.icpSalesPriority ?? prospect.salesPriority

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getIcpFitBadgeClass(hasIcp ? icpScore : null)}`}
          >
            ICP Fit: {hasIcp ? `${icpScore}/100` : "—"}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{ICP_FIT_TOOLTIP}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getClvTierBadgeClass(prospect.clvRanking)}`}
          >
            CLV: {getClvTierShort(prospect.clvRanking)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{CLV_TOOLTIP}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getPriorityBadgeClass(priority)}`}
          >
            {getPriorityShort(priority)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {priority || "No sales priority — run Re-Tier All after setting Benchmark ICP"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
