"use client"

// ─────────────────────────────────────────────
// Campaigns List Page — with Performance Table
// Reference: akshayji.lovable.app/app/campaigns
// APIs:
//   GET /api/campaigns?page=1&limit=10  → list
//   POST /api/campaigns                  → create
//   PUT /api/campaigns/:id               → update status
//   DELETE /api/campaigns/:id            → delete
// ─────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Loader2, Megaphone, Trash2,
  ChevronLeft, ChevronRight, Send,
  Eye, MousePointerClick, TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import type { Campaign } from "@/types"

export default function CampaignsPage() {
  const router = useRouter()

  // ── Data state ──────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  // ── Create modal state ──────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState("")
  const [newCampaign, setNewCampaign] = useState({
    name: "", description: "", status: "draft", promptUsed: "",
  })

  // ── GET /api/campaigns ──────────────────────
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>(`/campaigns?page=${currentPage}&limit=10`)
      setCampaigns(res.data || [])
      setTotal(res.pagination?.total || 0)
      setTotalPages(res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Campaigns fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  // ── POST /api/campaigns ─────────────────────
  const handleCreate = async () => {
    if (!newCampaign.name.trim()) {
      setCreateMsg("❌ Campaign name zaroori hai.")
      return
    }
    setIsCreating(true)
    setCreateMsg("")
    try {
      await api.post("/campaigns", {
        name: newCampaign.name,
        description: newCampaign.description || undefined,
        status: newCampaign.status,
        promptUsed: newCampaign.promptUsed || undefined,
      })
      setCreateMsg("✅ Campaign created successfully!")
      setTimeout(() => {
        setShowCreateModal(false)
        setCreateMsg("")
        setNewCampaign({ name: "", description: "", status: "draft", promptUsed: "" })
        fetchCampaigns()
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) setCreateMsg(`❌ ${err.message}`)
      else setCreateMsg("❌ Creation failed.")
    } finally {
      setIsCreating(false)
    }
  }

  // ── DELETE /api/campaigns/:id ───────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this campaign?")) return
    try {
      await api.delete(`/campaigns/${id}`)
      fetchCampaigns()
    } catch {
      alert("Delete failed.")
    }
  }

  // ── Status badge ────────────────────────────
  const getStatusStyle = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700 border-green-200"
    if (status === "completed") return "bg-blue-100 text-blue-700 border-blue-200"
    return "bg-gray-100 text-gray-600 border-gray-200"
  }

  // ── Summary KPIs — from campaigns data ─────
  const totalSent = campaigns.reduce((s, c) => s + ((c as any).sent ?? 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === "active").length

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Prompt-based outreach
          </p>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            {total} campaigns · {activeCampaigns} active
          </p>
        </div>
        <div className="flex gap-3">
          {/* Campaign Wizard button */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/campaigns/new")}
          >
            <Plus className="h-4 w-4" />Campaign Wizard
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />Quick Create
          </Button>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send, color: "text-blue-500" },
          { label: "Avg Open Rate", value: "—", icon: Eye, color: "text-green-500" },
          { label: "Avg CTR", value: "—", icon: MousePointerClick, color: "text-purple-500" },
          { label: "Conversions", value: "—", icon: TrendingUp, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <CardContent className="flex items-start justify-between p-0 px-4">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No campaigns found yet</p>
            <p className="text-sm text-muted-foreground">
              Use the wizard to create a campaign step by step.
            </p>
          </div>
          <Button onClick={() => router.push("/campaigns/new")}>
            Start Campaign Wizard
          </Button>
        </div>
      )}

      {/* ── Campaigns Performance Table ── */}
      {!isLoading && campaigns.length > 0 && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="font-semibold">All Campaigns</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b">
                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="p-4 font-medium">Campaign</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-center">Prospects</th>
                      <th className="p-4 font-medium text-center">Sent</th>
                      <th className="p-4 font-medium text-center">Open</th>
                      <th className="p-4 font-medium text-center">CTR</th>
                      <th className="p-4 font-medium text-center">Conv</th>
                      <th className="p-4 font-medium">Performance</th>
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {campaigns.map((campaign) => {
                      const prospects = Array.isArray(campaign.prospectIds)
                        ? campaign.prospectIds.length : 0
                      const sent = (campaign as any).sent ?? 0
                      const openRate = (campaign as any).openRate ?? 0
                      const ctr = (campaign as any).ctr ?? 0
                      const conv = (campaign as any).conversions ?? 0

                      return (
                        <tr
                          key={campaign._id}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => router.push(`/campaigns/${campaign._id}`)}
                        >
                          <td className="p-4">
                            <p className="font-medium text-sm">{campaign.name}</p>
                            {campaign.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {campaign.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(campaign.createdAt ?? "").toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(campaign.status)}`}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-4 text-center text-sm font-medium">{prospects}</td>
                          <td className="p-4 text-center text-sm">{sent || "—"}</td>
                          <td className="p-4 text-center text-sm">{openRate ? `${openRate}%` : "—"}</td>
                          <td className="p-4 text-center text-sm">{ctr ? `${ctr}%` : "—"}</td>
                          <td className="p-4 text-center text-sm">{conv || "—"}</td>
                          <td className="p-4">
                            {/* Performance bar — prospects based */}
                            <div className="w-20">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    campaign.status === "active" ? "bg-green-500" :
                                    campaign.status === "completed" ? "bg-blue-400" : "bg-gray-300"
                                  }`}
                                  style={{
                                    width: campaign.status === "completed" ? "100%" :
                                           campaign.status === "active" ? "60%" : "10%"
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {campaign.status === "completed" ? "Done" :
                                 campaign.status === "active" ? "Running" : "Draft"}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={(e) => handleDelete(campaign._id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} — {total} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8"
                  disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Quick Create Modal ── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Create Campaign</DialogTitle>
            <DialogDescription className="sr-only">Naya campaign banao</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Campaign Name *</Label>
              <Input placeholder="e.g. Q3 Fintech Outreach" value={newCampaign.name}
                onChange={(e) => setNewCampaign(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Campaign ka purpose..." value={newCampaign.description}
                onChange={(e) => setNewCampaign(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={newCampaign.status} onValueChange={(v) => setNewCampaign(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>AI Prompt (Optional)</Label>
              <Textarea placeholder="AI ko kya karna hai..." value={newCampaign.promptUsed}
                onChange={(e) => setNewCampaign(p => ({ ...p, promptUsed: e.target.value }))} rows={3} />
            </div>
            {createMsg && <div className="text-sm px-3 py-2 rounded-lg border">{createMsg}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}