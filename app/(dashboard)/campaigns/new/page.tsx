"use client"

// ─────────────────────────────────────────────
// Campaign Builder — Simplified Flow
// Same layout language as segments/new (sticky header, 2-col grid, Live Preview rail)
// Step: pick a name, multi-select segments, contacts auto-import, then Draft/Launch
// APIs:
//   GET  /api/segments              → list of segments to pick from
//   POST /api/segments/contacts     → { segmentIds } → deduped contacts preview
//   POST /api/campaigns             → create the campaign
//   POST /api/campaigns/:id/contacts→ attach the imported contacts
// ─────────────────────────────────────────────

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Loader2, Check, Users,
  Rocket, Save, Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { api, ApiError } from "@/lib/api"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"

export default function CampaignWizardPage() {
  const router = useRouter()

  const [isCreating, setIsCreating] = useState(false)
  const createdCampaignIdRef = useRef("")

  const createMsg = useAutoDismissMessage({
    onAutoDismiss: () => {
      if (createdCampaignIdRef.current) {
        router.push(`/campaigns/${createdCampaignIdRef.current}`)
      }
    },
  })

  // ── Campaign name ────────────────────────────
  const [campaignName, setCampaignName] = useState("")

  // ── Segments (multi-select) ──────────────────
  const [segments, setSegments]               = useState<any[]>([])
  const [segmentsLoading, setSegmentsLoading] = useState(true)
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([])

  // ── Contacts preview (auto-imported from selected segments) ─
  const [previewContacts, setPreviewContacts]   = useState<any[]>([])
  const [previewAccounts, setPreviewAccounts]   = useState(0)
  const [previewLoading, setPreviewLoading]     = useState(false)

  // ── Launch / Draft ───────────────────────────
  const [status, setStatus] = useState("draft")

  // ── Load segments once ───────────────────────
  useEffect(() => {
    setSegmentsLoading(true)
    api.get<any>("/segments")
      .then(res => setSegments(res.data?.segments || res.data?.data?.segments || []))
      .catch(console.error)
      .finally(() => setSegmentsLoading(false))
  }, [])

  // ── Re-fetch contact preview whenever segment selection changes ─
  useEffect(() => {
    if (selectedSegmentIds.length === 0) {
      setPreviewContacts([])
      setPreviewAccounts(0)
      return
    }
    setPreviewLoading(true)
    api.post<any>("/segments/contacts", { segmentIds: selectedSegmentIds })
      .then(res => {
        setPreviewContacts(res.data || [])
        setPreviewAccounts(res.accountCount || 0)
      })
      .catch(console.error)
      .finally(() => setPreviewLoading(false))
  }, [selectedSegmentIds])

  const toggleSegment = (id: string) => {
    setSelectedSegmentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const hasSelection = selectedSegmentIds.length > 0
  const canCreate = campaignName.trim().length > 0 && hasSelection && !isCreating

  // ── Final Submit — create campaign + attach contacts ─────────
  const handleCreate = async () => {
    if (!campaignName.trim()) {
      createMsg.setMessage("❌ Campaign name is required.")
      return
    }
    if (!hasSelection) {
      createMsg.setMessage("❌ Select at least one segment.")
      return
    }
    setIsCreating(true)
    createMsg.clearMessage()
    try {
      const res = await api.post<any>("/campaigns", {
        name: campaignName,
        status,
      })
      const campaignId = res.data?._id
      createdCampaignIdRef.current = campaignId || ""

      if (campaignId && previewContacts.length > 0) {
        await api.post<any>(`/campaigns/${campaignId}/contacts`, {
          contactIds: previewContacts.map(c => c._id),
        })
      }

      createMsg.setMessage(
        `✅ Campaign ${status === "active" ? "launched" : "saved"} with ${previewContacts.length} contact(s)!`
      )
    } catch (err) {
      if (err instanceof ApiError) createMsg.setMessage(`❌ ${err.message}`)
      else createMsg.setMessage("❌ Creation failed.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* ── Header ── */}
      <div className="p-6 pb-4 border-b flex-shrink-0">
        <Link href="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />Back to Campaigns
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Campaign Builder
            </p>
            <h1 className="text-2xl font-bold">New Campaign</h1>
            <p className="text-sm text-muted-foreground">
              Pick segments — their contacts import automatically
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            {isCreating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : status === "active" ? <Rocket className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isCreating ? "Creating..." : status === "active" ? "Launch Campaign" : "Save Draft"}
          </Button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">

          {/* Left — Campaign Details + Segments */}
          <div className="lg:col-span-2 space-y-6">

            {/* Campaign details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Campaign Details
                </p>
                <div className="space-y-1.5">
                  <Label>Campaign Name *</Label>
                  <Input
                    placeholder="e.g. Q3 Fintech CTO Warmup"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Segment multi-select */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Choose Segments
                  </p>
                  {hasSelection && (
                    <Badge variant="secondary">{selectedSegmentIds.length} selected</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Select one or more segments. Contacts belonging to accounts in the
                  selected segments will be imported automatically — duplicates removed.
                </p>

                {segmentsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : segments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">No segments found yet.</p>
                    <Link href="/segments">
                      <Button variant="outline" size="sm" className="mt-3">Create a segment first</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {segments.map((seg) => {
                      const isSelected = selectedSegmentIds.includes(seg._id)
                      return (
                        <div
                          key={seg._id}
                          onClick={() => toggleSegment(seg._id)}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-tight">{seg.name}</p>
                              {seg.description && (
                                <p className="text-xs text-muted-foreground">{seg.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Users className="h-3.5 w-3.5" />
                            {seg.matchCount ?? 0} accounts
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Draft / Launch toggle */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Save as Draft or Launch
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setStatus("draft")}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      status === "draft" ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <Save className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Save as Draft</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Launch it later, anytime</p>
                  </div>
                  <div
                    onClick={() => setStatus("active")}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      status === "active" ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <Rocket className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-medium">Launch Now</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Activate immediately</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right — Live Preview */}
          <div>
            <Card className="sticky top-0">
              <CardContent className="p-6 space-y-4">

                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Live Preview
                </p>

                {!hasSelection ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Select segments to preview contacts</p>
                  </div>
                ) : previewLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Match count */}
                    <div>
                      <p className="text-4xl font-bold text-primary">{previewContacts.length}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Contacts to Import
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From {previewAccounts} account(s) · {selectedSegmentIds.length} segment(s)
                      </p>
                    </div>

                    {/* Selected segment badges */}
                    <div className="flex flex-wrap gap-1">
                      {segments
                        .filter(s => selectedSegmentIds.includes(s._id))
                        .map(s => (
                          <Badge key={s._id} variant="secondary" className="text-xs">{s.name}</Badge>
                        ))}
                    </div>

                    {/* Contacts list */}
                    {previewContacts.length > 0 && (
                      <div className="space-y-2 pt-2 border-t max-h-72 overflow-y-auto">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Contacts
                        </p>
                        {previewContacts.map((c: any) => (
                          <div
                            key={c._id}
                            className="flex items-center justify-between py-1.5 border-b last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium leading-tight">
                                {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.standardizedRoles || c.functionalDomain || "—"} · {c.accountName || "—"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {createMsg.visible && (
                  <AutoDismissBanner {...createMsg} className="bg-muted/20" onDismiss={createMsg.clearMessage} />
                )}

                <Button
                  className="w-full gap-2"
                  onClick={handleCreate}
                  disabled={!canCreate}
                >
                  {isCreating
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : status === "active" ? <Rocket className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {isCreating ? "Creating..." : status === "active" ? "Launch Campaign" : "Save Draft"}
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
