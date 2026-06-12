"use client"

// ─────────────────────────────────────────────
// Campaign Wizard — 6-Step Flow
// Reference: akshayji.lovable.app/app/campaigns/new
// Step 1: Choose a segment (ICP list)
// Step 2: Define the goal
// Step 3: Write the AI prompt
// Step 4: Preview the AI draft
// Step 5: Review prospects
// Step 6: Schedule or launch
// API: POST /api/campaigns → create the campaign at the end
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, Loader2,
  Sparkles, Check, Users, Target,
  MessageSquare, Eye, Calendar, Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import type { ICP } from "@/types"

// ── Steps config ──────────────────────────────
const STEPS = [
  { id: 1, label: "Segment", icon: Target },
  { id: 2, label: "Goal", icon: Rocket },
  { id: 3, label: "Prompt", icon: MessageSquare },
  { id: 4, label: "AI Draft", icon: Sparkles },
  { id: 5, label: "Review", icon: Eye },
  { id: 6, label: "Schedule", icon: Calendar },
]

const GOALS = [
  { id: "awareness", label: "Brand Awareness", desc: "Introduce your company to cold prospects" },
  { id: "warmup", label: "Warm Up", desc: "Build relationship before a sales call" },
  { id: "demo", label: "Book a Demo", desc: "Get prospects to schedule a call" },
  { id: "nurture", label: "Nurture", desc: "Keep prospects engaged over time" },
  { id: "reactivate", label: "Reactivate", desc: "Re-engage cold or lost prospects" },
]

export default function CampaignWizardPage() {
  const router = useRouter()

  // ── Wizard state ────────────────────────────
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState("")

  // Step 1 — Segment
  const [icps, setIcps] = useState<ICP[]>([])
  const [icpsLoading, setIcpsLoading] = useState(false)
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null)

  // Step 2 — Goal
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  // Step 3 — Prompt + Name
  const [campaignName, setCampaignName] = useState("")
  const [prompt, setPrompt] = useState("")

  // Step 4 — AI Draft (generated)
  const [aiDraft, setAiDraft] = useState("")
  const [isDrafting, setIsDrafting] = useState(false)

  // Step 6 — Schedule
  const [scheduleDate, setScheduleDate] = useState("")
  const [status, setStatus] = useState("draft")

  // ── Load ICPs for Step 1 ────────────────────
  useEffect(() => {
    setIcpsLoading(true)
    api.get<any>("/icp?page=1&limit=20")
      .then(res => setIcps(res.data || []))
      .catch(console.error)
      .finally(() => setIcpsLoading(false))
  }, [])

  // ── Selected ICP details ────────────────────
  const selectedIcp = icps.find(i => i._id === selectedIcpId)

  // ── Step 4 — Simulate AI Draft ─────────────
  const generateDraft = () => {
    setIsDrafting(true)
    setTimeout(() => {
      const goal = GOALS.find(g => g.id === selectedGoal)
      setAiDraft(
        `Subject: ${selectedIcp?.name ? `For ${selectedIcp.name} accounts` : "Quick question"}\n\n` +
        `Hi {{First Name}},\n\n` +
        `I noticed that ${selectedIcp?.industries?.join(", ") || "companies in your space"} are ${
          goal?.id === "demo" ? "increasingly looking for ways to streamline their sales process" :
          goal?.id === "nurture" ? "building stronger B2B relationships through data" :
          "exploring new ways to accelerate growth"
        }.\n\n` +
        (prompt ? `${prompt}\n\n` : "") +
        `Would love to show you how we've helped similar teams achieve results in 30 days.\n\n` +
        `Do you have 15 minutes this week?\n\n` +
        `Best,\n{{Sender Name}}`
      )
      setIsDrafting(false)
    }, 1500)
  }

  useEffect(() => {
    if (currentStep === 4 && !aiDraft) {
      generateDraft()
    }
  }, [currentStep])

  // ── Final Submit — POST /api/campaigns ──────
  const handleLaunch = async () => {
    if (!campaignName.trim()) {
      setCreateMsg("❌ Campaign name is required.")
      return
    }
    setIsCreating(true)
    setCreateMsg("")
    try {
      const res = await api.post<any>("/campaigns", {
        name: campaignName,
        description: selectedGoal
          ? `Goal: ${GOALS.find(g => g.id === selectedGoal)?.label}`
          : undefined,
        status: status,
        promptUsed: prompt || undefined,
      })
      setCreateMsg("✅ Campaign created!")
      setTimeout(() => {
        router.push(`/campaigns/${res.data?._id || ""}`)
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) setCreateMsg(`❌ ${err.message}`)
      else setCreateMsg("❌ Creation failed.")
    } finally {
      setIsCreating(false)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) return !!selectedIcpId
    if (currentStep === 2) return !!selectedGoal
    if (currentStep === 3) return campaignName.trim().length > 0
    return true
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to campaigns
        </Link>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">AI-powered, &lt; 5 min</p>
          <h1 className="text-2xl font-bold">New Campaign</h1>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                currentStep > step.id
                  ? "bg-primary border-primary text-white"
                  : currentStep === step.id
                  ? "border-primary text-primary"
                  : "border-muted text-muted-foreground"
              }`}>
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <p className={`text-xs mt-1 ${currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-4 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step Content ── */}
      <Card>
        <CardContent className="p-6">

          {/* STEP 1 — Segment */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Choose a segment</h2>
              <p className="text-sm text-muted-foreground">
                Which ICP prospects should be targeted?
              </p>
              {icpsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : icps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No ICP profiles found.</p>
                  <Link href="/segments/icp-builder">
                    <Button variant="outline" size="sm" className="mt-3">Create ICP first</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {icps.map((icp) => (
                    <div
                      key={icp._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedIcpId === icp._id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedIcpId(icp._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{icp.name}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {icp.industries?.slice(0, 3).map(ind => (
                              <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                            ))}
                            {icp.countries?.slice(0, 2).map(c => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>ICP</span>
                          </div>
                          {selectedIcpId === icp._id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Goal */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Define your goal</h2>
              <p className="text-sm text-muted-foreground">What is the primary objective of this campaign?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GOALS.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedGoal === goal.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:border-primary/50 hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{goal.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{goal.desc}</p>
                      </div>
                      {selectedGoal === goal.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Prompt */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Write your prompt</h2>
              <p className="text-sm text-muted-foreground">
                AI will draft the outreach message based on this prompt.
              </p>
              <div className="space-y-1">
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="e.g. Q3 Fintech CTO Warmup"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>AI Prompt</Label>
                <Textarea
                  placeholder={`e.g. Write a cold email targeting CTOs in Fintech companies who have recently raised Series B funding. Focus on how we can help them scale their data infrastructure quickly...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: ICP — {selectedIcp?.name}, Goal — {GOALS.find(g => g.id === selectedGoal)?.label}
                </p>
              </div>
              {/* Context pills */}
              <div className="flex flex-wrap gap-2">
                {selectedIcp?.industries?.map(ind => (
                  <Badge key={ind} variant="secondary" className="text-xs">#{ind}</Badge>
                ))}
                {selectedIcp?.countries?.map(c => (
                  <Badge key={c} variant="outline" className="text-xs">#{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — AI Draft */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">AI Draft</h2>
                <Badge className="ml-auto">AI Generated</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                AI has drafted this outreach message. You can edit it.
              </p>
              {isDrafting ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating AI draft...</p>
                </div>
              ) : (
                <Textarea
                  value={aiDraft}
                  onChange={(e) => setAiDraft(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={generateDraft}>
                <Sparkles className="h-4 w-4" />Regenerate
              </Button>
            </div>
          )}

          {/* STEP 5 — Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Review</h2>
              <p className="text-sm text-muted-foreground">Review before launching the campaign.</p>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Campaign Name</p>
                  <p className="font-medium">{campaignName}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Target Segment</p>
                  <p className="font-medium">{selectedIcp?.name ?? "—"}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selectedIcp?.industries?.map(ind => (
                      <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="font-medium">{GOALS.find(g => g.id === selectedGoal)?.label ?? "—"}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">AI Prompt</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{prompt || "No prompt"}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 — Schedule */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Schedule & Launch</h2>
              <p className="text-sm text-muted-foreground">
                Launch now or schedule the campaign.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    status === "active" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => setStatus("active")}
                >
                  <Rocket className="h-6 w-6 text-primary mb-2" />
                  <p className="font-medium">Launch Now</p>
                  <p className="text-xs text-muted-foreground mt-1">The campaign will be activated immediately.</p>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    status === "draft" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => setStatus("draft")}
                >
                  <Calendar className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="font-medium">Save as Draft</p>
                  <p className="text-xs text-muted-foreground mt-1">You can launch it later</p>
                </div>
              </div>

              {status === "active" && (
                <div className="space-y-1">
                  <Label>Schedule Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              )}

              {/* Final Summary */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm font-medium">Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>Campaign:</span>
                  <span className="font-medium text-foreground">{campaignName}</span>
                  <span>Segment:</span>
                  <span className="font-medium text-foreground">{selectedIcp?.name ?? "—"}</span>
                  <span>Goal:</span>
                  <span className="font-medium text-foreground">
                    {GOALS.find(g => g.id === selectedGoal)?.label ?? "—"}
                  </span>
                  <span>Status:</span>
                  <span className="font-medium text-foreground capitalize">{status}</span>
                </div>
              </div>

              {createMsg && <div className="text-sm px-3 py-2 rounded-lg border">{createMsg}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Navigation Buttons ── */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep === 1 ? router.push("/campaigns") : setCurrentStep(s => s - 1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < 6 ? (
          <Button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!canGoNext()}
            className="gap-2"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleLaunch}
            disabled={isCreating}
            className="gap-2"
          >
            {isCreating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Rocket className="h-4 w-4" />
            }
            {isCreating ? "Creating..." : status === "active" ? "Launch Campaign" : "Save Draft"}
          </Button>
        )}
      </div>
    </div>
  )
}