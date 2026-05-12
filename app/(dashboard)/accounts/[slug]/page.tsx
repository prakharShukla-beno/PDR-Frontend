import Link from "next/link"
import { ArrowLeft, Users, Mail, MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const intentSignals = [
  { signal: "Hiring for Data role", source: "Apollo" },
  { signal: "Published RFP", source: "Apollo" },
  { signal: "New CTO appointed", source: "Apollo" },
]

const scoreBreakdown = [
  { label: "Icp Match", value: 87 },
  { label: "Intent Match", value: 66 },
  { label: "Tech Match", value: 99 },
  { label: "Recency Match", value: 58 },
]

const recommendedActions = [
  "Send personalized intro email",
  "Add to \"Series B Fintech\" segment",
  "Schedule discovery call",
]

export default async function AccountDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const accountName = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link href="/accounts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to accounts
      </Link>

      {/* Account Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white text-2xl font-bold">
                M
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{accountName}</h1>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">Sales-Ready</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <span className="text-sm">mosaiccommerce.com</span>
                  <span>·</span>
                  <span className="text-sm">Sydney, Australia</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">Manufacturing</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> 9,488
                  </Badge>
                  <Badge variant="outline">$ $478M</Badge>
                  <Badge variant="outline">Source: Apollo</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Assign
              </Button>
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email POC
              </Button>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Add to Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="ai-insights">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="firmographics">Firmographics</TabsTrigger>
              <TabsTrigger value="technographics">Technographics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="ai-insights" className="mt-4 space-y-6">
              {/* Buyer Intent Signals */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Buyer Intent Signals</h2>
                    <Badge className="bg-primary text-white">
                      <Sparkles className="h-3 w-3 mr-1" /> AI 99%
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {intentSignals.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{item.signal}</span>
                        <Badge variant="outline">Source: {item.source}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Why this score? */}
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-4">Why this score?</h2>
                  <div className="space-y-4">
                    {scoreBreakdown.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="firmographics">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Firmographic data will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technographics">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Technology stack information will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Activity timeline will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Data sources will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Score & Actions */}
        <div className="space-y-6">
          {/* Lead Score */}
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">Lead Score</p>
              <div className="flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary">
                  <span className="text-4xl font-bold text-primary">99</span>
                </div>
              </div>
              <p className="mt-4 text-sm">Intent: <span className="font-medium">High</span></p>
            </CardContent>
          </Card>

          {/* Right POC */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Right POC</h2>
                <Badge className="bg-primary text-white">
                  <Sparkles className="h-3 w-3 mr-1" /> AI 88%
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-white">AR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Anjali Rao</p>
                  <p className="text-sm text-muted-foreground">VP Sales</p>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                contact@mosaiccommerce.com
              </Button>
              <p className="text-xs text-muted-foreground mt-3">AI suggested based on title, recency & engagement.</p>
            </CardContent>
          </Card>

          {/* Recommended Actions */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Recommended Actions</h2>
              <div className="space-y-3">
                {recommendedActions.map((action, i) => (
                  <button 
                    key={i} 
                    className="flex items-center gap-2 w-full text-left text-sm hover:text-primary transition-colors"
                  >
                    <span className="text-primary">→</span>
                    {action}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
