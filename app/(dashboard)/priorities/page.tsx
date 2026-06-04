"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { Prospect } from "@/types"

interface MatrixCell {
  priority: string
  label: string
  color: string
  count: number
  prospects: Prospect[]
  sla: string
  action: string
}

export default function PrioritiesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [expandedPriority, setExpandedPriority] = useState<string | null>(null)
  const [matrixData, setMatrixData] = useState<Record<string, MatrixCell>>({})

  useEffect(() => {
    const fetchPriorities = async () => {
      setIsLoading(true)
      try {
        // Fetch prospects grouped by priority
        const [p1Res, p2Res, p3Res, p4Res] = await Promise.all([
          api.get<any>("/prospects?salesPriority=P1%20(Tier%20A%2BActive)&limit=100"),
          api.get<any>("/prospects?salesPriority=P2%20(Tier%20B%2BActive)&limit=100"),
          api.get<any>("/prospects?salesPriority=P3%20(Tier%20A%2BCold)&limit=100"),
          api.get<any>("/prospects?salesPriority=P4%20(Tier%20B%2BCold)&limit=100"),
        ])

        const matrix: Record<string, MatrixCell> = {
          P1: {
            priority: "P1",
            label: "War Room — Tier A + High Intent",
            color: "bg-red-50 border-red-200",
            count: p1Res.data?.pagination?.total || 0,
            prospects: p1Res.data?.data?.prospects || p1Res.data?.prospects || [],
            sla: "24 hours",
            action: "Call immediately. Executive engagement.",
          },
          P2: {
            priority: "P2",
            label: "Hot Leads — Tier B + High Intent",
            color: "bg-orange-50 border-orange-200",
            count: p2Res.data?.pagination?.total || 0,
            prospects: p2Res.data?.data?.prospects || p2Res.data?.prospects || [],
            sla: "48 hours",
            action: "High-volume blitz campaign.",
          },
          P3: {
            priority: "P3",
            label: "VIP Watch List — Tier A + No Intent",
            color: "bg-blue-50 border-blue-200",
            count: p3Res.data?.pagination?.total || 0,
            prospects: p3Res.data?.data?.prospects || p3Res.data?.prospects || [],
            sla: "1 week",
            action: "Nurture with personalized content.",
          },
          P4: {
            priority: "P4",
            label: "Pipeline — Tier B + No Intent",
            color: "bg-gray-50 border-gray-200",
            count: p4Res.data?.pagination?.total || 0,
            prospects: p4Res.data?.data?.prospects || p4Res.data?.prospects || [],
            sla: "2 weeks",
            action: "Automated drip campaigns.",
          },
        }

        setMatrixData(matrix)
      } catch (err) {
        console.error("Priorities fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPriorities()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalAccounts = Object.values(matrixData).reduce((sum, cell) => sum + cell.count, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Link href="/accounts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to accounts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">War Room Matrix</h1>
        <p className="text-muted-foreground">
          {totalAccounts} accounts organized by priority for strategic outreach.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(matrixData).map((cell) => (
          <Card
            key={cell.priority}
            className={`${cell.color} border-2 cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setExpandedPriority(expandedPriority === cell.priority ? null : cell.priority)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className={`${cell.priority === "P1" ? "bg-red-600" : cell.priority === "P2" ? "bg-orange-600" : cell.priority === "P3" ? "bg-blue-600" : "bg-gray-600"} text-white`}>
                    {cell.priority}
                  </Badge>
                  <CardTitle className="text-lg mt-2">{cell.count}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{cell.label}</p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">SLA:</span>
                <Badge variant="outline" className="text-xs">{cell.sla}</Badge>
              </div>
              <p className="text-xs text-muted-foreground italic">{cell.action}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed lists */}
      <div className="grid grid-cols-1 gap-6">
        {Object.values(matrixData).map((cell) => (
          <Card key={cell.priority} className="overflow-hidden">
            <CardHeader 
              className={`${cell.color} border-b-2 cursor-pointer`}
              onClick={() => setExpandedPriority(expandedPriority === cell.priority ? null : cell.priority)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`${cell.priority === "P1" ? "bg-red-600" : cell.priority === "P2" ? "bg-orange-600" : cell.priority === "P3" ? "bg-blue-600" : "bg-gray-600"}`}>
                    {cell.priority}
                  </Badge>
                  <CardTitle>{cell.label}</CardTitle>
                  <Badge variant="secondary">{cell.count} accounts</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedPriority(expandedPriority === cell.priority ? null : cell.priority)
                  }}
                >
                  {expandedPriority === cell.priority ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>

            {expandedPriority === cell.priority && (
              <CardContent className="p-0">
                {cell.count === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No accounts in this priority bucket yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {cell.prospects.slice(0, 20).map((prospect) => (
                      <Link
                        key={prospect._id}
                        href={`/accounts/${prospect._id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{prospect.accountName}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {prospect.primaryIndustry && <span>{prospect.primaryIndustry}</span>}
                            {prospect.primaryIndustry && prospect.noOfEmployees && <span>·</span>}
                            {prospect.noOfEmployees && <span>{prospect.noOfEmployees} emps</span>}
                            {prospect.annualRevenue && <span>·</span>}
                            {prospect.annualRevenue && <span>${prospect.annualRevenue}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {prospect.finalScore !== undefined && (
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs ${
                              prospect.finalScore >= 60 ? "bg-green-100 text-green-700" :
                              prospect.finalScore >= 30 ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {Math.round(prospect.finalScore)}
                            </div>
                          )}
                          <Badge variant="outline">{prospect.intentSignal ?? "—"}</Badge>
                        </div>
                      </Link>
                    ))}
                    {cell.count > 20 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        +{cell.count - 20} more accounts...
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Execution guide */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-red-700 mb-2">🔴 P1 — War Room (24h SLA)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Call within 24 hours</li>
                <li>• VP/Senior AE engagement</li>
                <li>• Executive positioning</li>
                <li>• Direct mail + meetings</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-orange-700 mb-2">🟠 P2 — Blitz (48h SLA)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• High-volume calling</li>
                <li>• SDR team outreach</li>
                <li>• Email + LinkedIn</li>
                <li>• 3x contact attempts</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-700 mb-2">🔵 P3 — VIP Watch (1 week SLA)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Nurture sequences</li>
                <li>• Personalized content</li>
                <li>• Wait for buyer signals</li>
                <li>• Monthly check-ins</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">⚪ P4 — Pipeline (2 week SLA)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Automated drips</li>
                <li>• Marketing touchpoints</li>
                <li>• No AE involvement yet</li>
                <li>• Scale + filter</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
