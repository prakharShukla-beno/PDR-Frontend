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
  ChevronLeft, ChevronRight, Users,
  MoreHorizontal, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { api, ApiError } from "@/lib/api"
import type { Campaign } from "@/types"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"
import { useConfirmDialog } from "@/hooks/useConfirmDialog"

export default function CampaignsPage() {
  const router = useRouter()
  const { showConfirm, ConfirmDialogHost } = useConfirmDialog()

  // ── Data state ──────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  // ── Create modal state ──────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
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

  const createMsg = useAutoDismissMessage({
    onAutoDismiss: () => {
      setShowCreateModal(false)
      setNewCampaign({ name: "", description: "", status: "draft", promptUsed: "" })
      fetchCampaigns()
    },
  })

  // ── POST /api/campaigns ─────────────────────
  const handleCreate = async () => {
    if (!newCampaign.name.trim()) {
      createMsg.setMessage("❌ Campaign name is required.")
      return
    }
    setIsCreating(true)
    createMsg.clearMessage()
    try {
      await api.post("/campaigns", {
        name: newCampaign.name,
        description: newCampaign.description || undefined,
        status: newCampaign.status,
        promptUsed: newCampaign.promptUsed || undefined,
      })
      createMsg.setMessage("✅ Campaign created successfully!")
    } catch (err) {
      if (err instanceof ApiError) createMsg.setMessage(`❌ ${err.message}`)
      else createMsg.setMessage("❌ Creation failed.")
    } finally {
      setIsCreating(false)
    }
  }

  // ── DELETE /api/campaigns/:id ───────────────
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    showConfirm({
      title: "Delete campaign?",
      message: "This campaign will be deleted permanently. This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/campaigns/${id}`)
          fetchCampaigns()
        } catch {
          alert("Delete failed.")
        }
      },
    })
  }

  // ── Header summary ──────────────────────────
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

      {/* ── Campaigns Table — simple, LinkedIn Sales Navigator style ── */}
      {!isLoading && campaigns.length > 0 && (
        <>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 font-medium">Campaign Name</th>
                    <th className="p-4 font-medium">Contacts</th>
                    <th className="p-4 font-medium">Last Updated</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaigns.map((campaign) => {
                    const contactCount = Array.isArray((campaign as any).contactIds)
                      ? (campaign as any).contactIds.length : 0

                    return (
                      <tr
                        key={campaign._id}
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/campaigns/${campaign._id}`)}
                      >
                        <td className="p-4">
                          <p className="font-medium text-sm">{campaign.name}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />{contactCount}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(campaign.updatedAt ?? campaign.createdAt ?? "").toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign._id}`)}>
                                <Eye className="h-4 w-4 mr-2" />View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e: any) => handleDelete(campaign._id, e)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
            <DialogDescription className="sr-only">Create a new campaign</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Campaign Name *</Label>
              <Input placeholder="e.g. Q3 Fintech Outreach" value={newCampaign.name}
                onChange={(e) => setNewCampaign(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Campaign purpose..." value={newCampaign.description}
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
              <Textarea placeholder="What should the AI do..." value={newCampaign.promptUsed}
                onChange={(e) => setNewCampaign(p => ({ ...p, promptUsed: e.target.value }))} rows={3} />
            </div>
            {createMsg.visible && (
              <AutoDismissBanner {...createMsg} onDismiss={createMsg.clearMessage} />
            )}
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

      {ConfirmDialogHost}
    </div>
  )
}