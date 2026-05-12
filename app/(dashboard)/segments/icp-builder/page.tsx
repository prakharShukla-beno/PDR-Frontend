"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, History, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface CriteriaWeight {
  label: string
  key: string
  value: number
}

const sampleMatches = [
  { name: "Lumen Labs", score: 76 },
  { name: "Northwind Cloud", score: 98 },
  { name: "Helios Pay", score: 92 },
  { name: "Quanta AI", score: 89 },
  { name: "Mosaic Commerce", score: 99 },
  { name: "Kestrel Bank", score: 80 },
]

export default function ICPBuilderPage() {
  const [criteria, setCriteria] = useState<CriteriaWeight[]>([
    { label: "Industry Match", key: "industry", value: 30 },
    { label: "Company Size", key: "size", value: 25 },
    { label: "Tech Stack Fit", key: "tech", value: 20 },
    { label: "Geography", key: "geography", value: 15 },
    { label: "Buyer Intent", key: "intent", value: 10 },
  ])

  const totalWeight = criteria.reduce((sum, c) => sum + c.value, 0)

  const updateWeight = (key: string, newValue: number) => {
    setCriteria(criteria.map((c) => (c.key === key ? { ...c, value: newValue } : c)))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link href="/segments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to segments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Define Your Ideal Customer Profile</p>
          <h1 className="text-2xl font-bold text-foreground">ICP Builder</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            Version v2.3
          </Button>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Save ICP
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criteria & Weights */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Criteria & Weights</h2>
                <span className={`text-sm ${totalWeight === 100 ? "text-primary" : "text-destructive"}`}>
                  Total weight: {totalWeight}/100
                </span>
              </div>

              <div className="space-y-8">
                {criteria.map((criterion) => (
                  <div key={criterion.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{criterion.label}</span>
                      <span className="text-sm font-medium">{criterion.value}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary rounded-full"
                          style={{ width: `${criterion.value}%` }}
                        />
                      </div>
                      <Slider
                        value={[criterion.value]}
                        onValueChange={(v) => updateWeight(criterion.key, v[0])}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fit-Score Preview */}
        <div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Fit-Score Preview</p>
              <p className="text-5xl font-bold text-primary mb-1">48</p>
              <p className="text-sm text-muted-foreground mb-6">accounts in your base match this ICP</p>

              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">Sample Matches</p>
              <div className="space-y-3">
                {sampleMatches.map((account) => (
                  <div key={account.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded">{account.score}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
