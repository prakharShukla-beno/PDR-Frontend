"use client"

// ─────────────────────────────────────────────
// Dashboard Page — Complete Version
// APIs:
//   GET /api/dashboard/summary
//   GET /api/dashboard/top-prospects
//   GET /api/dashboard/by-industry
//   GET /api/dashboard/by-country
//   GET /api/dashboard/by-priority
//   GET /api/dashboard/by-clv
//   GET /api/dashboard/import-history
//   GET /api/campaigns
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  TrendingUp, Users, Sparkles, Copy,
  ArrowUpRight, Loader2, Upload,
  BarChart3, Globe, Target, Brain
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, getAccessToken } from "@/lib/apiClient"
import { useAuth } from "@/context/AuthContext"
import type { DashboardSummary, Prospect } from "@/types"
import { INDUSTRIES } from "@/lib/taxonomy"

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [topProspects, setTopProspects] = useState<Prospect[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [byIndustry, setByIndustry] = useState<{ count: number; sector: string }[]>([])
  const [byCountry, setByCountry] = useState<{ count: number; country: string }[]>([])
  const [byCLV, setByCLV] = useState<{ count: number; clvRanking: string }[]>([])
  const [icpStats, setIcpStats] = useState<{
    priorities?: Record<string, number>
    tiers?: Record<string, number>
    staleCount?: number
    unscoredCount?: number
    totalScored?: number
  } | null>(null)
  const [importHistory, setImportHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!getAccessToken()) return

    const fetchAll = async () => {
      try {
        const [summaryRes, prospectsRes, campaignsRes, industryRes, countryRes, clvRes, importRes, icpStatsRes] =
          await Promise.all([
            api.get<any>("/dashboard/summary"),
            api.get<any>("/dashboard/top-prospects"),
            api.get<any>("/campaigns?page=1&limit=5"),
            api.get<any>("/dashboard/by-industry"),
            api.get<any>("/dashboard/by-country"),
            api.get<any>("/dashboard/by-clv"),
            api.get<any>("/dashboard/import-history"),
            api.get<any>("/prospects/icp-stats"),
          ])
        setSummary(summaryRes.data)
        setTopProspects(prospectsRes.data || [])
        setCampaigns(campaignsRes.data || [])
        setByIndustry(industryRes.data || [])
        setByCountry(countryRes.data || [])
        setByCLV(clvRes.data || [])
        setImportHistory(importRes.data || [])
        setIcpStats(icpStatsRes.data ?? icpStatsRes)
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [authLoading])

  const firstName = user?.name?.split(" ")[0] ?? "there"

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  const getCLVColor = (c: string) => {
    if (c?.includes("Tier-A")) return "bg-primary"
    if (c?.includes("Tier-B")) return "bg-blue-400"
    return "bg-gray-300"
  }

  const byIndustrySector = INDUSTRIES.map((sector) => ({
    sector,
    count: byIndustry.find((item) => item.sector === sector)?.count ?? 0,
  })).sort((a, b) => b.count - a.count)

  const maxInd = Math.max(...byIndustrySector.map(i => i.count), 1)
  const maxCty = Math.max(...byCountry.map(c => c.count), 1)

  // Click handler — pass commercial sector; FilterPanel + API expand to child industries
  const goToSectorAccounts = (sector: string) => {
    const params = new URLSearchParams()
    params.append("industryInclude[]", sector)
    router.push(`/accounts?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Sales Rep - Dashboard</p>
          <h1 className="text-2xl font-bold">{getGreeting()}, {firstName}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening across your prospect workspace.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push("/segments/icp-builder")}>
            <Brain className="h-4 w-4" />New ICP
          </Button>
          <Button className="gap-2" onClick={() => router.push("/campaigns")}>
            <Sparkles className="h-4 w-4" />New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Prospects", value: summary?.totalProspects ?? 0, sub: `${summary?.enrichmentCoverage ?? 0}% enriched`, icon: TrendingUp, href: "/accounts" },
          { title: "ICP Matches", value: summary?.icpMatchCount ?? 0, sub: "Tier A + Tier B accounts", icon: Target, href: "/segments" },
          { title: "AI Enriched", value: summary?.enrichedCount ?? 0, sub: "prospects enriched", icon: Sparkles, href: "/accounts" },
          { title: "Pending Duplicates", value: summary?.pendingDuplicates ?? 0, sub: "need review", icon: Copy, href: "/duplicates" },
        ].map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="py-4 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-start justify-between p-0 px-4">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
                <div className="p-2 rounded-lg bg-accent">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sales-Ready Accounts */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h2 className="font-semibold">Sales-Ready Accounts</h2>
                  <p className="text-sm text-muted-foreground">Top scored accounts matching your ICP</p>
                </div>
                <Link href="/accounts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  View all <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              {topProspects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No top prospects found.</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => router.push("/accounts")}>
                    <Upload className="h-4 w-4" />Import Data
                  </Button>
                </div>
              ) : (
                <div className="max-h-[340px] overflow-y-auto divide-y">
                  {topProspects.map((prospect) => (
                    <Link key={prospect._id} href={`/accounts/${prospect._id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
                        {prospect.icpFinalScore ?? prospect.techFitScore ?? "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{prospect.accountName}</span>
                          {prospect.primaryIndustry && (
                            <span className="text-xs text-muted-foreground">{prospect.primaryIndustry}</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {prospect.intentSignal && (
                            <Badge variant="secondary" className="text-xs">{prospect.intentSignal}</Badge>
                          )}
                          {(prospect.icpSalesPriority ?? prospect.salesPriority) && (
                            <Badge variant="outline" className="text-xs">
                              {prospect.icpSalesPriority ?? prospect.salesPriority}
                            </Badge>
                          )}
                          {prospect.icpTier && (
                            <Badge variant="secondary" className="text-xs">{prospect.icpTier}</Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex-shrink-0">
                        Sales-Ready
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry + Country charts */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">By Industry</h3>
                </div>
                <div className="space-y-2">
                  {byIndustrySector.map((item) => (
                    <div
                      key={item.sector}
                      className="cursor-pointer group"
                      onClick={() => goToSectorAccounts(item.sector)}
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate max-w-[140px] group-hover:text-primary group-hover:underline">{item.sector}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(item.count / maxInd) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">By Country</h3>
                </div>
                <div className="space-y-2 max-h-[330px] overflow-y-auto pr-1">
                  {byCountry.map((item) => (
                    <div
                      key={item.country}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/accounts?countryInclude[]=${encodeURIComponent(item.country)}`)}
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground group-hover:text-primary group-hover:underline">{item.country}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(item.count / maxCty) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import History */}
          {importHistory.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />Recent Imports
                  </h3>
                </div>
                <div className="divide-y">
                  {importHistory.slice(0, 3).map((imp) => (
                    <div key={imp._id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {imp.fileName?.split("-").slice(1).join("-") || imp.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {imp.successCount} records · {new Date(imp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <Badge variant={imp.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {imp.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-6">

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Quick Stats</h3>
              <div className="space-y-2">
                {[
                  { label: "Total Interactions", value: summary?.totalInteractions ?? 0 },
                  { label: "Duplicate Count", value: summary?.duplicateCount ?? 0 },
                  { label: "Enrichment Coverage", value: `${summary?.enrichmentCoverage ?? 0}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Priority (ICP-based) */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">By Priority</h3>
              <div className="space-y-2">
                {[
                  { key: "P1", label: "P1 (Tier A+Active)", color: "bg-red-500" },
                  { key: "P2", label: "P2 (Tier B+Active)", color: "bg-orange-400" },
                  { key: "P3", label: "P3 (Tier A+Cold)", color: "bg-blue-500" },
                  { key: "P4", label: "P4 (Tier B+Cold)", color: "bg-gray-400" },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-gray-600">{label}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {icpStats?.priorities?.[key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By CLV */}
          {byCLV.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">CLV Ranking</h3>
                <div className="space-y-2">
                  {byCLV.map((item) => (
                    <div key={item.clvRanking} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getCLVColor(item.clvRanking)}`} />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{item.clvRanking}</span>
                      <span className="text-xs font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaigns */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Campaigns</h3>
                <Link href="/campaigns" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y">
                {campaigns.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">No campaigns available.</div>
                ) : (
                  campaigns.slice(0, 4).map((campaign) => (
                    <Link key={campaign._id} href={`/campaigns/${campaign._id}`}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(campaign.prospectIds) ? campaign.prospectIds.length : 0} prospects
                        </p>
                      </div>
                      <Badge variant={campaign.status === "active" ? "default" : campaign.status === "completed" ? "secondary" : "outline"} className="text-xs flex-shrink-0">
                        {campaign.status}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}