"use client"

// ─────────────────────────────────────────────
// Account Detail Page
// APIs:
//   GET /api/prospects/:id              → account data
//   PUT /api/prospects/:id              → account update (Edit modal)
//   GET /api/interactions/prospect/:id  → interactions list
//   POST /api/interactions              → log new interaction
//   POST /api/enrichment/:id            → AI enrich
//   GET /api/contacts?accountId=:id     → linked contacts  ← NEW
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Users, Mail, MessageSquare, Sparkles,
  Plus, Loader2, CheckCircle, Pencil
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Prospect, Interaction, InteractionType, InteractionOutcome } from "@/types"

const INTERACTION_TYPES: InteractionType[] = [
  "Email", "Call", "Meeting", "LinkedIn DM", "Demo", "Follow-Up", "Event"
]
const INTERACTION_OUTCOMES: InteractionOutcome[] = [
  "Positive", "Neutral", "Negative", "No Response"
]

export default function AccountDetailPage() {
  const { slug } = useParams()
  const id = Array.isArray(slug) ? slug[0] : slug

  // ── Data state ──────────────────────────────
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── CHANGE 1: Contacts state ────────────────
  const [contacts, setContacts] = useState<any[]>([])

  // ── Enrich state ────────────────────────────
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichMsg, setEnrichMsg] = useState("")

  // ── Log Interaction modal state ─────────────
  const [showLogModal, setShowLogModal] = useState(false)
  const [logType, setLogType] = useState<InteractionType>("Call")
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0])
  const [logNotes, setLogNotes] = useState("")
  const [logOutcome, setLogOutcome] = useState<InteractionOutcome>("Positive")
  const [isLogging, setIsLogging] = useState(false)
  const [logMsg, setLogMsg] = useState("")

  // ── Edit modal state ────────────────────────
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [editData, setEditData] = useState({
    salesPriority: "",
    intentSignal: "",
    clvRanking: "",
    strategicValue: "",
    servicePitch: "",
  })

  // ── CHANGE 2: GET prospect + interactions + contacts ─────────────
  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return
      try {
        const [prospectRes, interactionsRes, contactsRes] = await Promise.all([
          api.get<any>(`/prospects/${id}`),
          api.get<any>(`/interactions/prospect/${id}`),
          api.get<any>(`/contacts?accountId=${id}&limit=50`),
        ])
        setProspect(prospectRes.data)
        setInteractions(interactionsRes.data || [])
        setContacts(contactsRes.data?.contacts || [])
      } catch (err) {
        console.error("Account detail error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [id])

  // ── POST /api/enrichment/:id ────────────────
  const handleEnrich = async () => {
    setIsEnriching(true)
    setEnrichMsg("")
    try {
      await api.post<any>(`/enrichment/${id}`)
      setEnrichMsg("✅ AI enrichment complete!")
      const res = await api.get<any>(`/prospects/${id}`)
      setProspect(res.data)
    } catch {
      setEnrichMsg("❌ Enrichment fail ho gayi.")
    } finally {
      setIsEnriching(false)
    }
  }

  // ── PUT /api/prospects/:id ──────────────────
  const handleEdit = () => {
    if (!prospect) return
    setEditData({
      salesPriority: prospect.salesPriority ?? "",
      intentSignal: prospect.intentSignal ?? "",
      clvRanking: prospect.clvRanking ?? "",
      strategicValue: prospect.strategicValue ?? "",
      servicePitch: prospect.servicePitch ?? "",
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setSaveMsg("")
    try {
      const res = await api.put<any>(`/prospects/${id}`, {
        salesPriority: editData.salesPriority || undefined,
        intentSignal: editData.intentSignal || undefined,
        clvRanking: editData.clvRanking || undefined,
        strategicValue: editData.strategicValue || undefined,
        servicePitch: editData.servicePitch || undefined,
      })
      setProspect(res.data)
      setSaveMsg("✅ Saved!")
      setTimeout(() => {
        setShowEditModal(false)
        setSaveMsg("")
      }, 1000)
    } catch {
      setSaveMsg("❌ Save nahi ho saka.")
    } finally {
      setIsSaving(false)
    }
  }

  // ── POST /api/interactions ──────────────────
  const handleLogInteraction = async () => {
    if (!logType || !logDate) return
    setIsLogging(true)
    setLogMsg("")
    try {
      await api.post("/interactions", {
        prospectId: id,
        type: logType,
        interactedAt: new Date(logDate).toISOString(),
        notes: logNotes,
        outcome: logOutcome,
      })
      setLogMsg("✅ Interaction logged!")
      const res = await api.get<any>(`/interactions/prospect/${id}`)
      setInteractions(res.data || [])
      setTimeout(() => {
        setShowLogModal(false)
        setLogNotes("")
        setLogMsg("")
      }, 1000)
    } catch {
      setLogMsg("❌ Log nahi ho saka.")
    } finally {
      setIsLogging(false)
    }
  }

  // ── Outcome badge color ─────────────────────
  const getOutcomeColor = (outcome?: string) => {
    if (outcome === "Positive") return "bg-green-100 text-green-700"
    if (outcome === "Negative") return "bg-red-100 text-red-700"
    if (outcome === "No Response") return "bg-gray-100 text-gray-600"
    return "bg-yellow-100 text-yellow-700"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Prospect nahi mila.</p>
        <Link href="/accounts"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    )
  }

  const initials = prospect.accountName?.slice(0, 2).toUpperCase() ?? "NA"

  return (
    <div className="p-6 space-y-6">

      {/* ── Back button ── */}
      <Link href="/accounts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to accounts
      </Link>

      {/* ── Account Header Card ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white text-2xl font-bold">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{prospect.accountName}</h1>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">
                      {prospect.salesPriority?.startsWith("P1") ? "Sales-Ready" : prospect.salesPriority ?? "Active"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  {prospect.website && <span className="text-sm">{prospect.website}</span>}
                  {prospect.hqLocationCity && <><span>·</span><span className="text-sm">{prospect.hqLocationCity}, {prospect.country}</span></>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {prospect.primaryIndustry && <Badge variant="outline">{prospect.primaryIndustry}</Badge>}
                  {prospect.noOfEmployees && <Badge variant="outline" className="flex items-center gap-1"><Users className="h-3 w-3" />{prospect.noOfEmployees}</Badge>}
                  {prospect.annualRevenue && <Badge variant="outline">$ {prospect.annualRevenue}</Badge>}
                  {prospect.source && <Badge variant="outline">Source: {prospect.source}</Badge>}
                </div>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />Assign
              </Button>
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />Email POC
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />Edit
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowLogModal(true)}>
                <Plus className="h-4 w-4" />Log Interaction
              </Button>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />Add to Campaign
              </Button>
            </div>
          </div>
          {enrichMsg && <div className="mt-3 text-sm px-3 py-2 rounded-lg border">{enrichMsg}</div>}
        </CardContent>
      </Card>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left — Tabs ── */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="ai-insights">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="firmographics">Firmographics</TabsTrigger>
              <TabsTrigger value="technographics">Technographics</TabsTrigger>
              <TabsTrigger value="activity">
                Activity
                {interactions.length > 0 && (
                  <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    {interactions.length}
                  </span>
                )}
              </TabsTrigger>
              {/* ── CHANGE 3: Contacts tab ── */}
              <TabsTrigger value="contacts">
                Contacts
                {contacts.length > 0 && (
                  <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    {contacts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>

            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="mt-4 space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Buyer Intent Signals</h2>
                    <Badge className="bg-primary text-white">
                      <Sparkles className="h-3 w-3 mr-1" />AI {prospect.techFitScore ?? "—"}%
                    </Badge>
                  </div>
                  {prospect.intentSignal ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{prospect.intentSignal}</span>
                      <Badge variant="outline">Source: {prospect.source ?? "—"}</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Koi intent signals nahi hain. AI Enrich karo.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-4">Strategic Value</h2>
                  <p className="text-sm text-muted-foreground">
                    {prospect.strategicValue ?? "AI enrichment ke baad strategic value yahan dikhegi."}
                  </p>
                  {prospect.servicePitch && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Service Pitch</p>
                      <p className="text-sm">{prospect.servicePitch}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Firmographics Tab */}
            <TabsContent value="firmographics" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-4">Company Details</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "Industry", value: prospect.primaryIndustry },
                      { label: "Business Model", value: prospect.businessModel },
                      { label: "Country", value: prospect.country },
                      { label: "City", value: prospect.hqLocationCity },
                      { label: "Annual Revenue", value: prospect.annualRevenue },
                      { label: "Employees", value: prospect.noOfEmployees },
                      { label: "CLV Ranking", value: prospect.clvRanking },
                      { label: "Sales Priority", value: prospect.salesPriority },
                      { label: "Financial Capacity", value: prospect.financialCapacity },
                      { label: "Margin Potential", value: prospect.marginPotential },
                      { label: "History Trigger", value: prospect.historyTrigger },
                      { label: "Adoption Profile", value: prospect.techAdoptionProfile },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-muted-foreground">{label}</p>
                        <p className="font-medium">{value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technographics Tab */}
            <TabsContent value="technographics" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-4">Tech Stack</h2>
                  {prospect.primaryTechStack ? (
                    Array.isArray(prospect.primaryTechStack) ? (
                      <div className="flex flex-wrap gap-2">
                        {prospect.primaryTechStack.map((tech) => (
                          <Badge key={tech} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline">{prospect.primaryTechStack}</Badge>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Tech stack data nahi hai. AI Enrich karo.</p>
                  )}
                  {prospect.techFitScore && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tech Fit Score</span>
                        <span className="font-medium">{prospect.techFitScore}%</span>
                      </div>
                      <Progress value={prospect.techFitScore} className="h-2" />
                    </div>
                  )}
                  {prospect.infrastructureRisk && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Infrastructure Risk</p>
                      <p className="text-sm font-medium text-red-700">{prospect.infrastructureRisk}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold">Interaction History ({interactions.length})</h2>
                    <Button size="sm" className="gap-2" onClick={() => setShowLogModal(true)}>
                      <Plus className="h-4 w-4" />Log Interaction
                    </Button>
                  </div>
                  {interactions.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <p className="text-muted-foreground">Koi interactions nahi hain abhi.</p>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowLogModal(true)}>
                        <Plus className="h-4 w-4" />First interaction log karo
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {interactions.map((interaction) => (
                        <div key={interaction._id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{interaction.type}</Badge>
                              {interaction.outcome && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOutcomeColor(interaction.outcome)}`}>
                                  {interaction.outcome}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(interaction.interactedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </span>
                          </div>
                          {interaction.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">{interaction.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── CHANGE 3: Contacts Tab Content ── */}
            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold">Contacts ({contacts.length})</h2>
                  </div>
                  {contacts.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">Is account ke koi contacts nahi hain.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {contacts.map((contact) => (
                        <div key={contact._id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {((contact.firstName?.[0] ?? "") + (contact.lastName?.[0] ?? "")).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {contact.standardizedRoles ?? contact.functionalDomain ?? "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.email && (
                              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                                <Mail className="h-3 w-3" />{contact.email}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                              <Link href={`/contacts/${contact._id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sources Tab */}
            <TabsContent value="sources" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-4">Data Sources</h2>
                  <div className="p-3 border rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">{prospect.source ?? "Unknown"}</span>
                    <Badge variant="secondary">Primary</Badge>
                  </div>
                  {prospect.importLogId && typeof prospect.importLogId === "object" && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                      <p className="text-muted-foreground">Import File</p>
                      <p className="font-medium">{prospect.importLogId.fileName}</p>
                      <Badge variant="outline" className="mt-1">{prospect.importLogId.status}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Lead Score */}
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">Lead Score</p>
              <div className="flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary">
                  <span className="text-4xl font-bold text-primary">{prospect.techFitScore ?? "—"}</span>
                </div>
              </div>
              <p className="mt-4 text-sm">Intent: <span className="font-medium">
                {prospect.techFitScore && prospect.techFitScore >= 80 ? "High" :
                 prospect.techFitScore && prospect.techFitScore >= 60 ? "Medium" : "Low"}
              </span></p>
            </CardContent>
          </Card>

          {/* Primary Contact — contacts state se dikhao */}
          {contacts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Right POC</h2>
                  <Badge className="bg-primary text-white"><Sparkles className="h-3 w-3 mr-1" />AI</Badge>
                </div>
                {contacts.filter(c => c.isPrimary).slice(0, 1).concat(
                  contacts.filter(c => !c.isPrimary).slice(0, 1)
                ).slice(0, 1).map((contact) => (
                  <div key={contact._id}>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          {((contact.firstName?.[0] ?? "") + (contact.lastName?.[0] ?? "")).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {contact.standardizedRoles ?? contact.functionalDomain ?? "—"}
                        </p>
                      </div>
                    </div>
                    {contact.email && (
                      <Button variant="outline" className="w-full gap-2 text-xs">
                        <Mail className="h-4 w-4" />{contact.email}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI Enrich */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />AI Enrichment
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                AI se prospect ko enrich karo — tech stack, intent signals, strategic value.
              </p>
              <Button className="w-full gap-2" onClick={handleEnrich} disabled={isEnriching}>
                {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isEnriching ? "Enriching..." : "Enrich with AI"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Log Interaction Modal ── */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Interaction Type *</Label>
              <Select value={logType} onValueChange={(v) => setLogType(v as InteractionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={logOutcome} onValueChange={(v) => setLogOutcome(v as InteractionOutcome)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERACTION_OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Kya hua is interaction mein..." value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)} rows={3} />
            </div>
            {logMsg && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border">
                {logMsg.startsWith("✅") && <CheckCircle className="h-4 w-4 text-green-600" />}
                {logMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button onClick={handleLogInteraction} disabled={isLogging} className="gap-2">
              {isLogging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isLogging ? "Saving..." : "Save Interaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Account Modal ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit — {prospect.accountName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Sales Priority</Label>
              <Select value={editData.salesPriority} onValueChange={(v) => setEditData(p => ({ ...p, salesPriority: v }))}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1 (Tier A+Hot)">P1 — Sales Ready</SelectItem>
                  <SelectItem value="P2 (Tier B+Active)">P2 — Active</SelectItem>
                  <SelectItem value="P3 (Tier B+Warm)">P3 — Warm</SelectItem>
                  <SelectItem value="P4 (Tier B+Cold)">P4 — Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Intent Signal</Label>
              <Input placeholder="e.g. Cost Containment" value={editData.intentSignal}
                onChange={(e) => setEditData(p => ({ ...p, intentSignal: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>CLV Ranking</Label>
              <Select value={editData.clvRanking} onValueChange={(v) => setEditData(p => ({ ...p, clvRanking: v }))}>
                <SelectTrigger><SelectValue placeholder="Select ranking" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tier-A (Star)">Tier A — Star</SelectItem>
                  <SelectItem value="Tier-B (Core)">Tier B — Core</SelectItem>
                  <SelectItem value="Tier-C (Mass)">Tier C — Mass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Strategic Value</Label>
              <Input placeholder="e.g. Market Maker" value={editData.strategicValue}
                onChange={(e) => setEditData(p => ({ ...p, strategicValue: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Service Pitch</Label>
              <Input placeholder="e.g. Automation & Outsourcing" value={editData.servicePitch}
                onChange={(e) => setEditData(p => ({ ...p, servicePitch: e.target.value }))} />
            </div>
            {saveMsg && <div className="text-sm px-3 py-2 rounded-lg border">{saveMsg}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
