import Link from "next/link"
import { Globe, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const segments = [
  { name: "Enterprise SaaS — APAC", owner: "Marketing", updated: "2h ago", accounts: 124, shared: true },
  { name: "Series B Fintech US", owner: "Sales", updated: "1d ago", accounts: 87, shared: true },
  { name: "Healthtech with AWS", owner: "Sales", updated: "3d ago", accounts: 56, shared: false },
  { name: "Hiring Data Roles", owner: "Marketing", updated: "5h ago", accounts: 211, shared: true },
  { name: "EdTech EU 200+ employees", owner: "Analyst", updated: "1w ago", accounts: 43, shared: false },
]

export default function SegmentsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Saved Segments & ICP</p>
          <h1 className="text-2xl font-bold text-foreground">Segments & ICP</h1>
          <p className="text-muted-foreground">5 segments · 2 ICP profiles</p>
        </div>
        <div className="flex gap-3">
          <Link href="/segments/icp-builder">
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              Open ICP Builder
            </Button>
          </Link>
          <Link href="/segments/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Segment
            </Button>
          </Link>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((segment) => (
          <Link key={segment.name} href={`/segments/${encodeURIComponent(segment.name.toLowerCase().replace(/\s+/g, "-"))}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  {segment.shared && (
                    <Badge variant="secondary" className="text-xs">Shared</Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{segment.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Owner: {segment.owner} · Updated {segment.updated}
                </p>
                <div>
                  <p className="text-2xl font-bold">{segment.accounts}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Accounts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
