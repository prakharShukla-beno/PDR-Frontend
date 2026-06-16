"use client"

// Segments + ICP list page
// APIs:
//   GET /api/segments        → all segments for this user
//   GET /api/icp             → all ICP profiles
//   DELETE /api/segments/:id → delete segment
//   DELETE /api/icp/:id      → delete ICP profile

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Loader2, Target, Trash2,
  ChevronLeft, ChevronRight,
  Building2, Clock, Brain,
} from "lucide-react"
import { Button }            from "@/components/ui/button"
import { Badge }             from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api }               from "@/lib/api"

// Format time ago — "2h ago", "3d ago" etc.
const timeAgo = (dateStr?: string) => {
  if (!dateStr) return "Never synced"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function SegmentsPage() {
  const router = useRouter()

  // Segments state
  const [segments,    setSegments]    = useState<any[]>([])
  const [segLoading,  setSegLoading]  = useState(true)
  const [segPage,     setSegPage]     = useState(1)
  const SEG_LIMIT = 12

  // ICP state
  const [icps,        setIcps]        = useState<any[]>([])
  const [icpLoading,  setIcpLoading]  = useState(true)
  const [icpPage,     setIcpPage]     = useState(1)
  const ICP_LIMIT = 12

  // GET /api/segments — fetch all segments
  const fetchSegments = useCallback(async () => {
    setSegLoading(true)
    try {
      const res = await api.get<any>("/segments")
      setSegments(res.data?.segments || res.data?.data?.segments || [])
    } catch (err) {
      console.error("Segments fetch error:", err)
    } finally {
      setSegLoading(false)
    }
  }, [])

  // GET /api/icp — fetch all ICP profiles
  const fetchIcps = useCallback(async () => {
    setIcpLoading(true)
    try {
      const res = await api.get<any>("/icp?page=1&limit=50")
      setIcps(res.data?.data || res.data || [])
    } catch (err) {
      console.error("ICP fetch error:", err)
    } finally {
      setIcpLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSegments()
    fetchIcps()
  }, [fetchSegments, fetchIcps])

  // DELETE /api/segments/:id
  const deleteSegment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("This segment will be deleted permanently. Continue?")) return
    try {
      await api.delete(`/segments/${id}`)
      fetchSegments()
    } catch {
      alert("Delete failed. Try again.")
    }
  }

  // DELETE /api/icp/:id
  const deleteIcp = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("This ICP profile will be deleted permanently. Continue?")) return
    try {
      await api.delete(`/icp/${id}`)
      fetchIcps()
    } catch {
      alert("Delete failed. Try again.")
    }
  }

  // POST /api/icp/:id/create-segment
  const createSegmentFromIcp = async (icpId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await api.post<any>(`/icp/${icpId}/create-segment`)
      const segment = res.data
      const segmentId = segment?._id ?? segment?.id
      if (!segmentId) throw new Error("Segment ID missing in response")
      router.push(`/segments/${segmentId}`)
    } catch (err: any) {
      alert(err?.message || "Failed to create segment from ICP.")
    }
  }

  // Paginate locally
  const segTotalPages = Math.ceil(segments.length / SEG_LIMIT)
  const pageSegments  = segments.slice((segPage - 1) * SEG_LIMIT, segPage * SEG_LIMIT)
  const icpTotalPages = Math.ceil(icps.length / ICP_LIMIT)
  const pageIcps      = icps.slice((icpPage - 1) * ICP_LIMIT, icpPage * ICP_LIMIT)

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Workspace
          </p>
          <h1 className="text-2xl font-bold">Segments & ICP</h1>
          <p className="text-sm text-muted-foreground">
            {segments.length} segments · {icps.length} ICP profiles
          </p>
        </div>

        {/* Both create buttons visible at top level */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/segments/icp-builder")}
          >
            <Brain className="h-4 w-4" />New ICP
          </Button>
          <Button
            className="gap-2"
            onClick={() => router.push("/segments/new")}
          >
            <Plus className="h-4 w-4" />New Segment
          </Button>
        </div>
      </div>

      {/* ── Tabs: Segments | ICP ── */}
      <Tabs defaultValue="segments">
        <TabsList>
          <TabsTrigger value="segments" className="gap-2">
            <Target className="h-4 w-4" />
            Segments ({segments.length})
          </TabsTrigger>
          <TabsTrigger value="icp" className="gap-2">
            <Brain className="h-4 w-4" />
            ICP Profiles ({icps.length})
          </TabsTrigger>
        </TabsList>

        {/* ──────────── SEGMENTS TAB ──────────── */}
        <TabsContent value="segments" className="mt-4">

          {segLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!segLoading && segments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <Target className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No segments yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a segment to save a filtered list of accounts.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/segments/icp-builder")}>
                  Create ICP first
                </Button>
                <Button onClick={() => router.push("/segments/new")}>
                  New Segment
                </Button>
              </div>
            </div>
          )}

          {!segLoading && segments.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageSegments.map((seg) => (
                  <Card
                    key={seg._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/segments/${seg._id}`)}
                  >
                    <CardContent className="p-4 space-y-3">

                      {/* Name + shared badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight line-clamp-1">
                          {seg.name}
                        </h3>
                        {seg.isShared && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            Shared
                          </Badge>
                        )}
                      </div>

                      {seg.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {seg.description}
                        </p>
                      )}

                      {/* Match count from stored snapshot */}
                      <div>
                        <p className="text-3xl font-bold text-primary">
                          {seg.matchCount ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Matching Accounts
                        </p>
                      </div>

                      {/* Filter badges */}
                      {seg.filters?.industries?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          {seg.filters.industries.slice(0, 3).map((ind: string) => (
                            <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                          ))}
                          {seg.filters.industries.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{seg.filters.industries.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {seg.filters?.countries?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {seg.filters.countries.slice(0, 3).join(", ")}
                          {seg.filters.countries.length > 3 && ` +${seg.filters.countries.length - 3}`}
                        </p>
                      )}

                      {/* Last synced */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Synced: {timeAgo(seg.lastSyncedAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1 border-t">
                        <Button
                          variant="outline" size="sm" className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/segments/${seg._id}`)
                          }}
                        >
                          View Accounts
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={(e) => deleteSegment(seg._id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Segment pagination */}
              {segTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {segPage} of {segTotalPages} — {segments.length} total
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={segPage === 1}
                      onClick={() => setSegPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={segPage === segTotalPages}
                      onClick={() => setSegPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ──────────── ICP TAB ──────────── */}
        <TabsContent value="icp" className="mt-4">

          {icpLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!icpLoading && icps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <Brain className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No ICP profiles yet</p>
                <p className="text-sm text-muted-foreground">
                  Define your Ideal Customer Profile — then create a Segment from it.
                </p>
              </div>
              <Button onClick={() => router.push("/segments/icp-builder")}>
                Create ICP Profile
              </Button>
            </div>
          )}

          {!icpLoading && icps.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageIcps.map((icp) => (
                  <Card
                    key={icp._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/segments/icp-builder?id=${icp._id}`)}
                  >
                    <CardContent className="p-4 space-y-3">

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight line-clamp-1">{icp.name}</h3>
                        <Badge
                          variant={icp.isActive ? "default" : "secondary"}
                          className="text-xs flex-shrink-0"
                        >
                          {icp.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {icp.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {icp.description}
                        </p>
                      )}

                      {/* Industry tags */}
                      {icp.industries?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          {icp.industries.slice(0, 3).map((ind: string) => (
                            <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                          ))}
                          {icp.industries.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{icp.industries.length - 3}</Badge>
                          )}
                        </div>
                      )}

                      {icp.countries?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {icp.countries.slice(0, 3).join(", ")}
                          {icp.countries.length > 3 && ` +${icp.countries.length - 3}`}
                        </p>
                      )}

                      {icp.minTechFitScore && (
                        <p className="text-xs text-muted-foreground">
                          Min score: <span className="font-medium text-foreground">{icp.minTechFitScore}</span>
                        </p>
                      )}

                      {/* Buyer persona indicator */}
                      {(icp.buyerPersona?.designations?.length > 0 ||
                        icp.buyerPersona?.functionalDomains?.length > 0) && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">
                            Persona defined
                          </Badge>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1 border-t">
                        {/* Create Segment from this ICP */}
                        <Button
                          variant="default" size="sm" className="flex-1 text-xs"
                          onClick={(e) => createSegmentFromIcp(icp._id, e)}
                        >
                          Create Segment
                        </Button>
                        <Button
                          variant="outline" size="sm" className="text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/segments/icp-builder?id=${icp._id}`)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={(e) => deleteIcp(icp._id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ICP pagination */}
              {icpTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {icpPage} of {icpTotalPages} — {icps.length} total
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={icpPage === 1}
                      onClick={() => setIcpPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={icpPage === icpTotalPages}
                      onClick={() => setIcpPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
