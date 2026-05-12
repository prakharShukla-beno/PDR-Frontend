import Link from "next/link"
import { TrendingUp, Users, Sparkles, DollarSign, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const statsCards = [
  { title: "Sales-Ready", value: "6", subtext: "+3 today", icon: TrendingUp, iconBg: "bg-accent" },
  { title: "My Accounts", value: "18", subtext: "12 active", icon: Users, iconBg: "bg-accent" },
  { title: "AI Insights", value: "24", subtext: "new", icon: Sparkles, iconBg: "bg-accent" },
  { title: "Pipeline Value", value: "$1.2M", subtext: "+8% MoM", icon: DollarSign, iconBg: "bg-accent" },
]

const salesReadyAccounts = [
  { name: "Lumen Labs", type: "SaaS", score: 76, tags: ["Funding announced", "Visited pricing page"], status: "Sales-Ready" },
  { name: "Northwind Cloud", type: "Fintech", score: 98, tags: ["Hiring for Data role", "Funding announced"], status: "Sales-Ready" },
  { name: "Helios Pay", type: "E-commerce", score: 92, tags: ["Visited pricing page", "Published RFP"], status: "Sales-Ready" },
  { name: "Quanta AI", type: "Logistics", score: 89, tags: ["Funding announced", "Visited pricing page"], status: "Sales-Ready" },
  { name: "Mosaic Commerce", type: "Manufacturing", score: 99, tags: ["Hiring for Data role", "Published RFP"], status: "Sales-Ready" },
  { name: "Kestrel Bank", type: "SaaS", score: 8, tags: ["Funding announced", "Visited pricing page"], status: "Sales-Ready" },
]

const topMovers = [
  { name: "Mosaic Commerce", change: "+12" },
  { name: "Cobalt Security", change: "+12" },
  { name: "Loop Fitness", change: "+12" },
  { name: "Umbra Print", change: "+12" },
]

const campaigns = [
  { id: "CMP-01", name: "Q2 APAC Outbound", status: "Active", sent: 124, open: "68%", conv: 8 },
  { id: "CMP-02", name: "Fintech CTO Warmup", status: "Active", sent: 87, open: "71%", conv: 12 },
  { id: "CMP-03", name: "Healthtech Cloud Pitch", status: "Draft", sent: 0, open: "0%", conv: 0 },
  { id: "CMP-04", name: "Hiring Signal Nurture", status: "Completed", sent: 211, open: "54%", conv: 6 },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Sales Rep - Dashboard</p>
          <h1 className="text-2xl font-bold text-foreground">Good morning, Rajat</h1>
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
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales-Ready Accounts */}
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
                {salesReadyAccounts.map((account) => (
                  <Link 
                    key={account.name} 
                    href={`/accounts/${encodeURIComponent(account.name.toLowerCase().replace(/\s+/g, "-"))}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
                      {account.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-sm text-muted-foreground">{account.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {account.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-accent text-accent-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">{account.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insight + Top Movers */}
        <div className="space-y-6">
          {/* AI Insight of the Day */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">AI Insight of the Day</h2>
                <Badge className="bg-primary text-white">
                  <Sparkles className="h-3 w-3 mr-1" /> AI 92%
                </Badge>
              </div>
              <div className="bg-primary rounded-lg p-4 text-white space-y-3">
                <p className="text-sm text-primary-foreground/80">Trend detected</p>
                <p className="font-semibold">7 Fintech accounts in APAC just announced Series B funding.</p>
                <p className="text-sm text-primary-foreground/80">Strong signal for outbound — historically converts 3.2x better.</p>
                <Button variant="secondary" size="sm" className="mt-2">
                  Review accounts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Top Movers */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Top Movers This Week</h3>
              <div className="space-y-3">
                {topMovers.map((mover) => (
                  <div key={mover.name} className="flex items-center justify-between">
                    <span className="text-sm">{mover.name}</span>
                    <span className="text-sm font-medium text-primary">{mover.change}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Active Campaigns</h2>
            <Link href="/campaigns" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              All campaigns <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-mono">{campaign.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      campaign.status === "Active" ? "bg-primary" : 
                      campaign.status === "Draft" ? "bg-orange-400" : "bg-muted-foreground"
                    }`} />
                    <span className="text-xs text-muted-foreground">{campaign.status}</span>
                  </div>
                </div>
                <p className="font-medium mb-3">{campaign.name}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Sent</p>
                    <p className="font-semibold">{campaign.sent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="font-semibold">{campaign.open}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conv</p>
                    <p className="font-semibold text-primary">{campaign.conv}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
