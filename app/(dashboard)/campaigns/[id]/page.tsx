"use client"

// ─────────────────────────────────────────────
// Campaign Detail Page
// APIs:
//   GET /api/campaigns/:id                     → campaign detail
//   PUT /api/campaigns/:id                     → update status/name
//   POST /api/campaigns/:id/prospects          → prospects add karo
//   DELETE /api/campaigns/:id/prospects/:pid   → prospect remove karo
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, Loader2, Trash2,
  Users, Megaphone, Sparkles, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Campaign, Prospect } from "@/types"

export default function CampaignDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const campaignId = Array.isArray(id) ? id[0] : id

  // ── Data state ──────────────────────────────
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ── Add Prospects modal ─────────────────────
  const [showAddModal, setShowAddModal] = useState(false)
  const [prospectSearch, setProspectSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Prospect[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProspects, setSelectedProspects] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [addMsg, setAddMsg] = useState("")

  // ── Update status ───────────────────────────
  const [isUpdating, setIsUpdating] = useState(false)

  // ── GET /api/campaigns/:id ──────────────────
  const fetchCampaign = async () => {
    if (!campaignId) return
    try {
      const res = await api.get<any>(`/campaigns/${campaignId}`)
      setCampaign(res.data)
    } catch (err) {
      console.error("Campaign detail error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCampaign() }, [campaignId])

  // ── PUT /api/campaigns/:id — status update ──
  const handleStatusChange = async (newStatus: string) => {
    if (!campaignId) return
    setIsUpdating(true)
    try {
      const res = await api.put<any>(`/campaigns/${campaignId}`, { status: newStatus })
      setCampaign(res.data)
    } catch {
      alert("Status update nahi ho saka.")
    } finally {
      setIsUpdating(false)
    }
  }






  // ── Search prospects to add ─────────────────
const searchProspects = async (query: string) => {
  if (!query.trim()) { setSearchResults([]); return }
  setIsSearching(true)
  try {
    // /prospects endpoint use karo — /search/prospects ka structure alag hai
    const res = await api.get<any>(
      `/prospects?page=1&limit=10&query=${encodeURIComponent(query)}`
    )
    // Backend response: { success, data: [...], pagination: {...} }
    const list = res.data?.prospects || res.data || res.prospects || []
    setSearchResults(Array.isArray(list) ? list : [])
  } catch {
    setSearchResults([])
  } finally {
    setIsSearching(false)
  }
}



  // ── POST /api/campaigns/:id/prospects ───────
  const handleAddProspects = async () => {
    if (!selectedProspects.length || !campaignId) return
    setIsAdding(true)
    setAddMsg("")
    try {
      await api.post(`/campaigns/${campaignId}/prospects`, {
        prospectIds: selectedProspects
      })
      setAddMsg(`✅ ${selectedProspects.length} prospects add ho gaye!`)
      setSelectedProspects([])
      setSearchResults([])
      setProspectSearch("")
      setTimeout(() => {
        setShowAddModal(false)
        setAddMsg("")
        fetchCampaign()
      }, 1000)
    } catch {
      setAddMsg("❌ Add nahi ho sake.")
    } finally {
      setIsAdding(false)
    }
  }

  // ── DELETE /api/campaigns/:id/prospects/:pid ──
  const handleRemoveProspect = async (prospectId: string) => {
    if (!campaignId || !confirm("Is prospect ko campaign se remove karna chahte ho?")) return
    try {
      await api.delete(`/campaigns/${campaignId}/prospects/${prospectId}`)
      fetchCampaign()
    } catch {
      alert("Remove nahi ho saka.")
    }
  }

  // ── Status badge ────────────────────────────
  const getStatusStyle = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700 border-green-200"
    if (status === "completed") return "bg-blue-100 text-blue-700 border-blue-200"
    return "bg-gray-100 text-gray-600 border-gray-200"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Campaign nahi mili.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Back</Button>
      </div>
    )
  }

  const prospects = (campaign.prospectIds as any[]) || []

  return (
    <div className="p-6 space-y-6">

      {/* ── Back button ── */}
      <Link href="/campaigns"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to campaigns
      </Link>

      {/* ── Header Card ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                {campaign.description && (
                  <p className="text-muted-foreground text-sm mt-1">{campaign.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  {campaign.createdBy && typeof campaign.createdBy === "object" && (
                    <span className="text-xs text-muted-foreground">
                      By: {(campaign.createdBy as any).name}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(campaign.createdAt ?? "").toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Status update */}
            <div className="flex items-center gap-3">
              <Select
                value={campaign.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />Add Prospects
              </Button>
            </div>
          </div>

          {/* AI Prompt */}
          {campaign.promptUsed && (
            <div className="mt-4 p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />AI Prompt
              </p>
              <p className="text-sm">{campaign.promptUsed}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Prospects in Campaign ── */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Prospects ({prospects.length})</h2>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />Add
            </Button>
          </div>

          {prospects.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">Koi prospects nahi hain is campaign mein.</p>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                Prospects Add Karo
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {prospects.map((prospect: any) => (
                <div key={prospect._id} className="flex items-center justify-between p-4 hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {prospect.techFitScore ?? "—"}
                    </div>
                    <div>
                      <Link href={`/accounts/${prospect._id}`}
                        className="font-medium text-sm hover:underline" onClick={e => e.stopPropagation()}>
                        {prospect.accountName}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {prospect.primaryIndustry && (
                          <span className="text-xs text-muted-foreground">{prospect.primaryIndustry}</span>
                        )}
                        {prospect.country && (
                          <span className="text-xs text-muted-foreground">· {prospect.country}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {prospect.salesPriority && (
                      <Badge variant="outline" className="text-xs">{prospect.salesPriority}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemoveProspect(prospect._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Prospects Modal ── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Prospects to Campaign</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Search karo aur prospects select karo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Account name se search karo..."
                className="pl-9"
                value={prospectSearch}
                onChange={(e) => {
                  setProspectSearch(e.target.value)
                  searchProspects(e.target.value)
                }}
              />
            </div>

            {/* Search results */}
            {isSearching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((prospect) => {
                  const isSelected = selectedProspects.includes(prospect._id)
                  const alreadyInCampaign = prospects.some((p: any) => p._id === prospect._id)
                  return (
                    <button
                      key={prospect._id}
                      disabled={alreadyInCampaign}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                        ${alreadyInCampaign ? "opacity-50 cursor-not-allowed bg-muted/20" :
                          isSelected ? "bg-primary/5" : "hover:bg-muted/40"}`}
                      onClick={() => {
                        if (alreadyInCampaign) return
                        setSelectedProspects(ids =>
                          ids.includes(prospect._id)
                            ? ids.filter(i => i !== prospect._id)
                            : [...ids, prospect._id]
                        )
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm">{prospect.accountName}</p>
                        <p className="text-xs text-muted-foreground">
                          {[prospect.primaryIndustry, prospect.country].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {alreadyInCampaign && (
                          <span className="text-xs text-muted-foreground">Already added</span>
                        )}
                        {isSelected && !alreadyInCampaign && (
                          <Badge className="text-xs">Selected</Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Selected count */}
            {selectedProspects.length > 0 && (
              <p className="text-sm text-primary font-medium">
                {selectedProspects.length} prospects selected
              </p>
            )}

            {addMsg && (
              <div className="text-sm px-3 py-2 rounded-lg border">{addMsg}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddModal(false)
              setSelectedProspects([])
              setSearchResults([])
              setProspectSearch("")
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProspects}
              disabled={isAdding || selectedProspects.length === 0}
              className="gap-2"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAdding ? "Adding..." : `Add ${selectedProspects.length || ""} Prospects`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}