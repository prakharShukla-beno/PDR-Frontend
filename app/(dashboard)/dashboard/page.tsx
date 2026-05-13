"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TrendingUp, Users, Sparkles, DollarSign, ArrowUpRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import type { DashboardSummary, Prospect } from "@/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [topProspects, setTopProspects] = useState<Prospect[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, prospectsRes, campaignsRes] = await Promise.all([
          api.get<any>("/dashboard/summary"),
          api.get<any>("/dashboard/top-prospects"),
          api.get<any>("/campaigns"),
        ])
        setSummary(summaryRes.data)
        setTopProspects(prospectsRes.data || [])
        setCampaigns(campaignsRes.data || campaignsRes.campaigns || [])
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  const firstName = user?.name?.split(" ")[0] ?? "there"

  const statsCards = [
    {
      title: "Total Prospects",
      value: summary ? String(summary.totalProspects) : "—",
      subtext: `${summary?.enrichmentCoverage ?? 0}% enriched`,
      icon: TrendingUp,
    },
    {
      title: "ICP Matches",
      value: summary ? String(summary.icpMatchCount) : "—",
      subtext: "matched to ICP",
      icon: Users,
    },
    {
      title: "Enriched",
      value: summary ? String(summary.enrichedCount) : "—",
      subtext: "AI enriched",
      icon: Sparkles,
    },
    {
      title: "Pending Duplicates",
      value: summary ? String(summary.pendingDuplicates) : "—",
      subtext: "need review",
      icon: DollarSign,
    },
  ]

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
          <h1 className="text-2xl font-bold text-foreground">Good morning, {firstName}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening across your prospect workspace.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">New Segment</Button>
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="py-4">
            <CardContent className="flex items-start justify-between p-0 px-4">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Prospects */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="font-semibold">Sales-Ready Accounts</h2>
                  <p className="text-sm text-muted-foreground">Top scored accounts matching your ICP</p>
                </div>
                <Link href="/accounts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  View all <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y">
                {topProspects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Koi prospects nahi mile. Pehle data import karo.
                  </div>
                ) : (
                  topProspects.map((prospect) => (
                    <Link
                      key={prospect._id}
                      href={`/accounts/${prospect._id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
                        {prospect.techFitScore ?? "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prospect.accountName}</span>
                          <span className="text-xs text-muted-foreground">{prospect.primaryIndustry}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
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
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Sales-Ready
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {/* Summary Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Interactions</span>
                  <span className="font-medium">{summary?.totalInteractions ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duplicate Count</span>
                  <span className="font-medium">{summary?.duplicateCount ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enrichment Coverage</span>
                  <span className="font-medium">{summary?.enrichmentCoverage ?? 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Campaigns</h3>
              </div>
              <div className="divide-y">
                {campaigns.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Koi campaigns nahi hain.</div>
                ) : (
                  campaigns.slice(0, 4).map((campaign) => (
                    <div key={campaign._id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{campaign.status}</p>
                      </div>
                      <Badge
                        variant={
                          campaign.status === "active"
                            ? "default"
                            : campaign.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {campaign.status}
                      </Badge>
                    </div>
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