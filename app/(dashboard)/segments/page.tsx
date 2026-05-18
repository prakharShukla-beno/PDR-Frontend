"use client"

// ─────────────────────────────────────────────
// Segments / ICP List Page
// APIs:
//   GET /api/icp                     → all ICPs
//   DELETE /api/icp/:id              → delete
//   GET /api/search/prospects        → account count per industry
// Account count: multiple industries → parallel calls → sum
// ─────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Target, Trash2, ChevronLeft, ChevronRight, Users, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import type { ICP } from "@/types"

export default function SegmentsPage() {
  const router = useRouter()

  const [icps, setIcps] = useState<ICP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [accountCounts, setAccountCounts] = useState<Record<string, number>>({})
  const [countsLoading, setCountsLoading] = useState(false)

  // GET /api/icp
  const fetchIcps = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>(`/icp?page=${currentPage}&limit=12`)
      setIcps(res.data || [])
      setTotal(res.pagination?.total || 0)
      setTotalPages(res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("ICPs fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage])

  useEffect(() => { fetchIcps() }, [fetchIcps])

  // Account count — multiple industries ka sum
  useEffect(() => {
    if (!icps || icps.length === 0) return
    let cancelled = false

    const loadCounts = async () => {
      setCountsLoading(true)
      try {
        const counts = await Promise.all(
          icps.map(async (icp) => {
            if (!icp.industries || icp.industries.length === 0) return { id: icp._id, count: 0 }

            if (icp.industries.length === 1) {
              const res = await api.get<any>(
                `/search/prospects?primaryIndustry=${encodeURIComponent(icp.industries[0])}&page=1&limit=1`
              ).catch(() => null)
              return { id: icp._id, count: res?.data?.pagination?.total || res?.pagination?.total || 0 }
            }

            // Multiple industries — sum karo
            const results = await Promise.all(
              icp.industries.map(ind =>
                api.get<any>(`/search/prospects?primaryIndustry=${encodeURIComponent(ind)}&page=1&limit=1`).catch(() => null)
              )
            )
            const industryTotal = results.reduce((sum, res) =>
              sum + (res?.data?.pagination?.total || res?.pagination?.total || 0), 0)
            return { id: icp._id, count: industryTotal }
          })
        )
        if (cancelled) return
        const countMap: Record<string, number> = {}
        counts.forEach(c => { countMap[c.id] = c.count })
        setAccountCounts(countMap)
      } catch (err) {
        console.error("Account count error:", err)
      } finally {
        if (!cancelled) setCountsLoading(false)
      }
    }

    loadCounts()
    return () => { cancelled = true }
  }, [icps])

  // DELETE /api/icp/:id
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Ye ICP profile delete karna chahte ho?")) return
    try {
      await api.delete(`/icp/${id}`)
      fetchIcps()
    } catch {
      alert("Delete nahi ho saka.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Workspace</p>
          <h1 className="text-2xl font-bold">Segments & ICP</h1>
          <p className="text-sm text-muted-foreground">{total} ICP profiles saved</p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/segments/icp-builder")}>
          <Plus className="h-4 w-4" />New ICP
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

      {!isLoading && icps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Target className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Koi ICP nahi hai abhi</p>
            <p className="text-sm text-muted-foreground">Pehla ICP banao — system automatically matching prospects dhundh dega.</p>
          </div>
          <Button onClick={() => router.push("/segments/icp-builder")}>Create ICP</Button>
        </div>
      )}

      {!isLoading && icps.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {icps.map((icp) => (
              <Card key={icp._id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/accounts?industry=${encodeURIComponent(icp.industries?.[0] || "")}`)}>
                <CardContent className="p-4 space-y-3">

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-1">{icp.name}</h3>
                    {icp.isActive && <Badge className="text-xs flex-shrink-0">Active</Badge>}
                  </div>

                  {(icp as any).description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{(icp as any).description}</p>
                  )}

                  {/* Account count */}
                  <div>
                    {countsLoading && accountCounts[icp._id] === undefined ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-primary">{accountCounts[icp._id] ?? "—"}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Matching Accounts</p>
                      </>
                    )}
                  </div>

                  {icp.industries && icp.industries.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {icp.industries.slice(0, 3).map((ind) => (
                        <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                      ))}
                      {icp.industries.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{icp.industries.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  {icp.businessModels && icp.businessModels.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {icp.businessModels.map((bm) => (
                        <Badge key={bm} variant="outline" className="text-xs">{bm}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t">
                    {icp.minTechFitScore && (
                      <div>Min Score: <span className="font-medium text-foreground">{icp.minTechFitScore}</span></div>
                    )}
                    {icp.countries && icp.countries.length > 0 && (
                      <div>Countries: <span className="font-medium text-foreground">{icp.countries.slice(0, 2).join(", ")}</span></div>
                    )}
                    {icp.employeeRanges && icp.employeeRanges.length > 0 && (
                      <div>Size: <span className="font-medium text-foreground">{icp.employeeRanges[0]}</span></div>
                    )}
                    <div>{new Date(icp.createdAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>

                  {(icp as any).buyerPersona?.targetSeniorities?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {(icp as any).buyerPersona.targetSeniorities.slice(0, 2).join(", ")}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={(e) => { e.stopPropagation(); router.push(`/segments/icp-builder?id=${icp._id}`) }}>
                      View & Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={(e) => handleDelete(icp._id, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} — {total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}