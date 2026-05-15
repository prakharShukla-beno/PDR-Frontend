"use client"

// ─────────────────────────────────────────────
// Campaigns List Page
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
  ChevronLeft, ChevronRight, Pencil, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
    name: "",
    description: "",
    status: "draft",
    promptUsed: "",
  })

  // ── Edit status modal state ─────────────────
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [editMsg, setEditMsg] = useState("")

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
      setCreateMsg("✅ Campaign create ho gayi!")
      setTimeout(() => {
        setShowCreateModal(false)
        setCreateMsg("")
        setNewCampaign({ name: "", description: "", status: "draft", promptUsed: "" })
        fetchCampaigns()
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) setCreateMsg(`❌ ${err.message}`)
      else setCreateMsg("❌ Create nahi ho saki.")
    } finally {
      setIsCreating(false)
    }
  }

  // ── PUT /api/campaigns/:id — status update ──
  const handleUpdateStatus = async () => {
    if (!editingCampaign) return
    setIsUpdating(true)
    setEditMsg("")
    try {
      await api.put(`/campaigns/${editingCampaign._id}`, { status: editStatus })
      setEditMsg("✅ Status update ho gaya!")
      setTimeout(() => {
        setShowEditModal(false)
        setEditMsg("")
        fetchCampaigns()
      }, 800)
    } catch {
      setEditMsg("❌ Update nahi ho saka.")
    } finally {
      setIsUpdating(false)
    }
  }

  // ── DELETE /api/campaigns/:id ───────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Ye campaign delete karna chahte ho?")) return
    try {
      await api.delete(`/campaigns/${id}`)
      fetchCampaigns()
    } catch {
      alert("Delete nahi ho saka.")
    }
  }

  // ── Open edit modal ─────────────────────────
  const openEdit = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCampaign(campaign)
    setEditStatus(campaign.status)
    setEditMsg("")
    setShowEditModal(true)
  }

  // ── Status badge color ──────────────────────
  const getStatusStyle = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700 border-green-200"
    if (status === "completed") return "bg-blue-100 text-blue-700 border-blue-200"
    return "bg-gray-100 text-gray-600 border-gray-200"
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Workspace
          </p>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">{total} total campaigns</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />New Campaign
        </Button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Koi campaigns nahi hain abhi</p>
            <p className="text-sm text-muted-foreground">
              Pehli campaign banao aur prospects add karo.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Create Campaign</Button>
        </div>
      )}

      {/* ── Campaigns Grid ── */}
      {!isLoading && campaigns.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign._id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/campaigns/${campaign._id}`)}
              >
                <CardContent className="p-4 space-y-3">

                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-1">
                      {campaign.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusStyle(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>

                  {/* Description */}
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Prompt */}
                  {campaign.promptUsed && (
                    <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground line-clamp-2">
                      <span className="font-medium">Prompt:</span> {campaign.promptUsed}
                    </div>
                  )}

                  {/* Prospects count + Created by */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {Array.isArray(campaign.prospectIds)
                          ? campaign.prospectIds.length
                          : 0} prospects
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(campaign.createdAt ?? "").toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>

                  {/* Created by */}
                  {campaign.createdBy && typeof campaign.createdBy === "object" && (
                    <p className="text-xs text-muted-foreground">
                      By: {(campaign.createdBy as any).name}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      onClick={(e) => openEdit(campaign, e)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit Status
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={(e) => handleDelete(campaign._id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between pt-2">
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
        </>
      )}

      {/* ── Create Campaign Modal ── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription className="sr-only">
              Naya campaign create karo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Campaign Name *</Label>
              <Input
                placeholder="e.g. Q3 Fintech Outreach"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                placeholder="Campaign ka purpose kya hai..."
                value={newCampaign.description}
                onChange={(e) => setNewCampaign(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={newCampaign.status}
                onValueChange={(v) => setNewCampaign(p => ({ ...p, status: v }))}>
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
              <Textarea
                placeholder="AI ko kya dhundna hai is campaign mein..."
                value={newCampaign.promptUsed}
                onChange={(e) => setNewCampaign(p => ({ ...p, promptUsed: e.target.value }))}
                rows={3}
              />
            </div>
            {createMsg && (
              <div className="text-sm px-3 py-2 rounded-lg border">{createMsg}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Status Modal ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingCampaign?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editMsg && (
              <div className="text-sm px-3 py-2 rounded-lg border">{editMsg}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating} className="gap-2">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}