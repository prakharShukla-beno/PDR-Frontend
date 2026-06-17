"use client"

import { Target, TrendingUp, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  formatIcpBreakdownLines,
  getClvTierBadgeClass,
  getClvTierShort,
  getClvValueLabel,
  getIcpMatchLabel,
  getPriorityExplanation,
  type IcpScoreBreakdown,
} from "@/lib/scoreDisplay"
import type { Prospect } from "@/types"

type ScoreCalc = {
  finalScore?: number
  clvRanking?: string
  salesPriority?: string | null
  breakdown?: {
    techFit?: { label?: string; multiplier?: number }
    financial?: { label?: string }
    strategic?: { label?: string; bonus?: number }
    industry?: { label?: string; multiplier?: number }
    formula?: string
  }
}

export function IcpClvScorePanel({
  prospect,
  scoreCalc,
}: {
  prospect: Prospect
  scoreCalc?: ScoreCalc | null
}) {
  const icpScore = prospect.icpMatchScore
  const hasIcp = icpScore != null && icpScore > 0
  const icpMeta = hasIcp ? getIcpMatchLabel(icpScore) : null
  const icpLines = formatIcpBreakdownLines(prospect.icpScoreBreakdown as IcpScoreBreakdown | undefined)

  const clvRanking = scoreCalc?.clvRanking ?? prospect.clvRanking
  const finalScore = scoreCalc?.finalScore ?? prospect.finalScore
  const hasClv = clvRanking != null || finalScore != null
  const priority = scoreCalc?.salesPriority ?? prospect.salesPriority
  const priorityInfo = getPriorityExplanation(priority)

  const breakdown = scoreCalc?.breakdown

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ICP Fit card */}
        <Card className="border-green-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-green-600" />
              ICP Fit Score
            </div>

            {hasIcp ? (
              <>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-700">{icpScore} / 100</p>
                  <Progress value={icpScore} className="h-2 mt-2" />
                </div>
                {icpMeta && (
                  <Badge variant="outline" className={icpMeta.className}>
                    {icpMeta.label}
                  </Badge>
                )}
                {prospect.icpScoreBreakdown && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <p>Firmographic: {icpLines.firmographic}</p>
                    <p>Market: {icpLines.market}</p>
                    <p>Tech: {icpLines.tech}</p>
                    <p>Persona: {icpLines.persona}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Run ICP Match to see score — open ICP Builder and match prospects, or add this account to a segment created from an ICP.
              </p>
            )}
          </CardContent>
        </Card>

        {/* CLV card */}
        <Card className="border-blue-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              CLV Score
            </div>

            {hasClv ? (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold">{getClvTierShort(clvRanking)}</p>
                  {finalScore != null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      finalScore: {Math.round(finalScore)}
                    </p>
                  )}
                </div>
                <Badge className={`${getClvTierBadgeClass(clvRanking)} w-full justify-center`}>
                  {getClvValueLabel(clvRanking)}
                </Badge>
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p>Financial: {prospect.financialCapacity || breakdown?.financial?.label || "—"}</p>
                  <p>Strategic: {prospect.strategicValue || breakdown?.strategic?.label || "—"}</p>
                  <p>Sector: {prospect.marginPotential || breakdown?.industry?.label || "—"}</p>
                  <p>Tech Fit: {prospect.technologyAlignment || breakdown?.techFit?.label || "—"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Run AI Enrichment to calculate CLV — fill financial capacity, strategic value, and tech alignment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Priority */}
      <Card className="border-orange-100 bg-orange-50/30">
        <CardContent className="p-4 flex gap-3">
          <Zap className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              Sales Priority: {priorityInfo.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{priorityInfo.detail}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
