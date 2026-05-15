"use client"


import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Loader2, Target, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import type { ICP } from "@/types"

export default function SegmentsPage() {
  
  const [icps, setIcps] = useState<ICP[]>([])
  const [isLoading, setIsLoading] = useState(true)

 
  useEffect(() => {
    const fetchIcps = async () => {
      try {
        const res = await api.get<any>("/icp")
        setIcps(res.data || [])
      } catch (err) {
        console.error("ICPs fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchIcps()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segments & ICP</h1>
          <p className="text-sm text-muted-foreground">
            Apne saved Ideal Customer Profiles manage karo.
          </p>
        </div>
        <Link href="/segments/icp-builder">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New ICP
          </Button>
        </Link>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && icps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Target className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Koi ICP nahi hai abhi</p>
            <p className="text-sm text-muted-foreground">
              first build your first ICP — system automatically matching prospects search.
            </p>
          </div>
          <Link href="/segments/icp-builder">
            <Button>Create ICP</Button>
          </Link>
        </div>
      )}

      {/* ── ICP Cards ── */}
      {!isLoading && icps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {icps.map((icp) => (
            <Card key={icp._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">

                {/* ICP Name + Active badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{icp.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(icp.createdAt ?? "").toLocaleDateString()}
                    </p>
                  </div>
                  {icp.isActive && (
                    <Badge className="text-xs">Active</Badge>
                  )}
                </div>

                {/* Industries */}
                {icp.industries && icp.industries.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {icp.industries.slice(0, 3).map((ind) => (
                      <Badge key={ind} variant="secondary" className="text-xs">
                        {ind}
                      </Badge>
                    ))}
                    {icp.industries.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{icp.industries.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {icp.minTechFitScore && (
                    <div>Min Score: <span className="font-medium text-foreground">{icp.minTechFitScore}</span></div>
                  )}
                  {icp.employeeRanges && icp.employeeRanges.length > 0 && (
                    <div>Size: <span className="font-medium text-foreground">{icp.employeeRanges[0]}</span></div>
                  )}
                </div>

                {/* View button */}
                <Link href={`/segments/icp-builder?id=${icp._id}`}>
                  <Button variant="outline" className="w-full gap-2 h-8 text-sm">
                    View & Edit
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}