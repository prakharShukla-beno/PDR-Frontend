"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Rule {
  id: string
  field: string
  operator: string
  value: string
}

const previewAccounts = [
  { name: "Lumen Labs", score: 76 },
  { name: "Kestrel Bank", score: 80 },
  { name: "Beacon Mobility", score: 86 },
  { name: "Prism Media", score: 94 },
  { name: "Delta Drone", score: 98 },
]

export default function NewSegmentPage() {
  const [segmentName, setSegmentName] = useState("New Segment")
  const [matchType, setMatchType] = useState("and")
  const [shareWithTeam, setShareWithTeam] = useState(true)
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", field: "Industry", operator: "equals", value: "SaaS" },
    { id: "2", field: "Lead Score", operator: "≥", value: "70" },
  ])

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), field: "", operator: "equals", value: "" }])
  }

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id))
  }

  const updateRule = (id: string, field: keyof Rule, value: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
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
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Visual Rule Builder</p>
          <h1 className="text-2xl font-bold text-foreground">New Segment</h1>
        </div>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Segment
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Builder */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Segment Name */}
              <div className="space-y-2">
                <Label htmlFor="segment-name">Segment Name</Label>
                <Input
                  id="segment-name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {/* Match Rules */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Match rules</span>
                  <div className="flex rounded-md border overflow-hidden">
                    <button
                      className={`px-3 py-1 text-sm font-medium ${
                        matchType === "and" 
                          ? "bg-primary text-white" 
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                      onClick={() => setMatchType("and")}
                    >
                      AND
                    </button>
                    <button
                      className={`px-3 py-1 text-sm font-medium ${
                        matchType === "or" 
                          ? "bg-primary text-white" 
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                      onClick={() => setMatchType("or")}
                    >
                      OR
                    </button>
                  </div>
                </div>

                {/* Rules */}
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3">
                      <Select 
                        value={rule.field} 
                        onValueChange={(v) => updateRule(rule.id, "field", v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Industry">Industry</SelectItem>
                          <SelectItem value="Lead Score">Lead Score</SelectItem>
                          <SelectItem value="Employees">Employees</SelectItem>
                          <SelectItem value="Location">Location</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select 
                        value={rule.operator} 
                        onValueChange={(v) => updateRule(rule.id, "operator", v)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="≥">≥</SelectItem>
                          <SelectItem value="≤">≤</SelectItem>
                          <SelectItem value="contains">contains</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                        className="flex-1"
                        placeholder="Value"
                      />

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={addRule} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add rule
                </Button>
              </div>

              {/* Share with Team */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Share with team</p>
                  <p className="text-sm text-muted-foreground">Make this segment visible to all members</p>
                </div>
                <Switch 
                  checked={shareWithTeam} 
                  onCheckedChange={setShareWithTeam} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Live Preview</p>
              <p className="text-4xl font-bold text-primary mb-1">{previewAccounts.length}</p>
              <p className="text-sm text-muted-foreground mb-6">accounts match these rules</p>

              <div className="space-y-3">
                {previewAccounts.map((account) => (
                  <div key={account.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded">{account.score}</span>
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
