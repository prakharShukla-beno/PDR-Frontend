"use client"

// ─────────────────────────────────────────────
// Insights Page — AI Prioritised Accounts
// Reference: akshayji.lovable.app/app/insights
// APIs:
//   GET /api/dashboard/top-prospects  → ranked accounts
//   GET /api/dashboard/summary        → pattern detection ke liye
//   GET /api/dashboard/by-industry    → trend data
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles, Loader2, TrendingUp,
  ArrowUpRight, Users, Megaphone, ExternalLink
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { Prospect, DashboardSummary } from "@/types"

export default function InsightsPage() {
  const router = useRouter()

  const [topProspects, setTopProspects] = useState<Prospect[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [byIndustry, setByIndustry] = useState<{ count: number; industry: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prospectsRes, summaryRes, industryRes] = await Promise.all([
          api.get<any>("/dashboard/top-prospects"),
          api.get<any>("/dashboard/summary"),
          api.get<any>("/dashboard/by-industry"),
        ])
        setTopProspects(prospectsRes.data || [])
        setSummary(summaryRes.data)
        setByIndustry(industryRes.data || [])
      } catch (err) {
        console.error("Insights load error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Toggle prospect selection
  const toggleSelect = (id: string) => {
    setSelectedIds(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    )
  }

  // Top industry by count for pattern detection
  const topIndustry = byIndustry[0]?.industry ?? "your ICP"
  const topIndustryCount = byIndustry[0]?.count ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            AI-prioritised accounts
          </p>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Top accounts ranked by lead score, intent and ICP fit.
          </p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Bulk Assign ({selectedIds.length})
              </Button>
              <Button
                className="gap-2"
                onClick={() => router.push("/campaigns")}
              >
                <Megaphone className="h-4 w-4" />
                Create Campaign
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── AI Pattern Detection Card ── */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">Pattern detected this week</span>
              </div>
              <p className="text-lg font-bold">
                {topIndustryCount} accounts in {topIndustry} — your highest concentration segment.
              </p>
              <p className="text-sm opacity-80">
                Enrich these accounts to find buying signals and intent data for outreach.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs font-medium">AI</span>
            </div>
          </div>

          {/* Quick stats from summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-2xl font-bold">{summary.totalProspects?.toLocaleString()}</p>
                <p className="text-xs opacity-80">Total Accounts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.icpMatchCount?.toLocaleString()}</p>
                <p className="text-xs opacity-80">ICP Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.enrichedCount?.toLocaleString()}</p>
                <p className="text-xs opacity-80">AI Enriched</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top-N Accounts List ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Top-N Accounts</h2>
          {selectedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </p>
          )}
        </div>

        {topProspects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No top accounts found.</p>
              <p className="text-sm mt-1">Import data and run AI enrichment.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/accounts")}>
                Import Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topProspects.map((prospect, index) => (
              <Card
                key={prospect._id}
                className={`transition-all cursor-pointer ${
                  selectedIds.includes(prospect._id)
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:shadow-md"
                }`}
                onClick={() => toggleSelect(prospect._id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">

                    {/* Rank number */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Lead Score circle */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold text-sm flex-shrink-0 ${
                      (prospect.techFitScore ?? 0) >= 90
                        ? "border-primary text-primary bg-primary/5"
                        : (prospect.techFitScore ?? 0) >= 70
                        ? "border-yellow-500 text-yellow-600 bg-yellow-50"
                        : "border-gray-400 text-gray-600"
                    }`}>
                      {prospect.techFitScore ?? "—"}
                    </div>

                    {/* Account info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{prospect.accountName}</span>
                        {prospect.primaryIndustry && (
                          <span className="text-sm text-muted-foreground">
                            {prospect.primaryIndustry}
                            {prospect.country && ` · ${prospect.country}`}
                          </span>
                        )}
                      </div>

                      {/* Intent signals */}
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {prospect.intentSignal && (
                          <Badge variant="secondary" className="text-xs">
                            {prospect.intentSignal}
                          </Badge>
                        )}
                        {prospect.salesPriority && (
                          <Badge variant="outline" className="text-xs">
                            {prospect.salesPriority}
                          </Badge>
                        )}
                        {prospect.clvRanking && (
                          <Badge variant="outline" className="text-xs">
                            {prospect.clvRanking}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AI score badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          AI {prospect.techFitScore ?? 0}%
                        </span>
                      </div>

                      {/* Open link */}
                      <Link
                        href={`/accounts/${prospect._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded-md px-2 py-1 hover:bg-muted/50 transition-colors"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Industry Breakdown ── */}
      {byIndustry.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Industry Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {byIndustry.slice(0, 8).map((item) => (
                <div
                  key={item.industry}
                  className="p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/accounts?industry=${encodeURIComponent(item.industry)}`)}
                >
                  <p className="text-2xl font-bold text-primary">{item.count}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.industry}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">View accounts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}