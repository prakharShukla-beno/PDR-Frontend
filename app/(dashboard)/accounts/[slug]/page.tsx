"use client"

// Account Detail Page
// APIs:
//   GET  /api/prospects/:id              → account data
//   PUT  /api/prospects/:id              → update
//   GET  /api/interactions/prospect/:id  → interactions
//   POST /api/interactions               → log interaction
//   POST /api/enrichment/:id             → AI enrich
//   GET  /api/contacts?accountId=:id     → linked contacts
//   POST /api/prospects/:id/calculate-score  → run scoring formula
//   GET  /api/prospects/:id/score-breakdown  → scoring breakdownm
//   PUT  /api/prospects/:id/override-tier    → manual override

import { useEffect, useState } from "react"
import { useParams }           from "next/navigation"
import Link                    from "next/link"
import {
  ArrowLeft, Users, Mail, MessageSquare, Sparkles,
  Plus, Loader2, CheckCircle, Pencil, RefreshCw,
  Target, TrendingUp, Shield, Server
} from "lucide-react"
import { Button }                         from "@/components/ui/button"
import { Card, CardContent }              from "@/components/ui/card"
import { Badge }                          from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress }                       from "@/components/ui/progress"
import { Avatar, AvatarFallback }         from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
}                                         from "@/components/ui/dialog"
import { Label }                          from "@/components/ui/label"
import { Input }                          from "@/components/ui/input"
import { RadioGroup, RadioGroupItem }     from "@/components/ui/radio-group"
import { Textarea }                       from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
}                                         from "@/components/ui/select"
import { api }                            from "@/lib/api"
import { formatEnrichmentError }          from "@/lib/responseUtils"
import type { Prospect, Interaction, InteractionType, InteractionOutcome } from "@/types"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"
import { useAppAlert } from "@/hooks/useAppAlert"
import { IcpClvScorePanel } from "@/components/scores/IcpClvScorePanel"
import {
  formatIcpFinalScoreTooltip,
  getIcpPriorityDisplay,
  getIcpScoreCircleClass,
  getIcpTierBadgeClass,
} from "@/lib/scoreDisplay"

// ── Tech Stack categories — matches requirement doc ───────────────────────────
const TECH_CATEGORIES: Record<string, string[]> = {
  "Cloud Provider":      ["AWS", "Microsoft Azure", "Google Cloud (GCP)", "Oracle Cloud", "Digital Ocean", "IBM Cloud", "On-Premise"],
  "CRM & ERP":           ["Salesforce", "HubSpot", "SAP S/4HANA", "MS Dynamics 365", "Oracle NetSuite", "Zoho", "Odoo", "Pipedrive"],
  "Frontend":            ["React", "Angular", "Vue.js", "Next.js", "Svelte", "jQuery (Legacy)", "Flutter (Web)"],
  "Backend / Language":  ["Python (Django/Flask)", "Node.js", "Java (Spring)", "PHP (Laravel)", "Ruby on Rails", ".NET Core", "Go"],
  "Database":            ["PostgreSQL", "MySQL", "MongoDB (NoSQL)", "Oracle DB", "Snowflake", "Redis", "DynamoDB"],
  "DevOps & CI/CD":      ["Jenkins", "GitHub Actions", "GitLab CI", "Docker", "Kubernetes", "Terraform", "CircleCI", "Azure DevOps"],
  "Marketing Tech":      ["Marketo", "Mailchimp", "Klaviyo", "Adobe Experience Cloud", "Pardot", "Active Campaign"],
  "E-commerce":          ["Shopify", "Magento", "WooCommerce", "BigCommerce", "Salesforce Commerce Cloud"],
  "Cybersecurity":       ["CrowdStrike", "Okta", "Palo Alto Networks", "Zscaler", "Splunk", "Cloudflare"],
}

// Functional domains for new contact form
const FUNCTIONAL_DOMAINS = [
  "Corporate Strategy", "Technology & Digital", "Data & AI",
  "Finance & Accounting", "Revenue & Growth", "Product & Creative",
  "Operations & Logistics", "People & HR", "Legal & Governance",
  "Healthcare & Life Sciences", "Industrial & Engineering",
  "Resources & Utilities", "Public Sector & NGO",
]

// Category color mapping for badges
const CATEGORY_COLORS: Record<string, string> = {
  "Cloud Provider":     "bg-blue-100 text-blue-800 border-blue-200",
  "CRM & ERP":          "bg-purple-100 text-purple-800 border-purple-200",
  "Frontend":           "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Backend / Language": "bg-green-100 text-green-800 border-green-200",
  "Database":           "bg-orange-100 text-orange-800 border-orange-200",
  "DevOps & CI/CD":     "bg-gray-100 text-gray-800 border-gray-200",
  "Marketing Tech":     "bg-pink-100 text-pink-800 border-pink-200",
  "E-commerce":         "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Cybersecurity":      "bg-red-100 text-red-800 border-red-200",
  "Other":              "bg-slate-100 text-slate-800 border-slate-200",
}

// Given a tool name, find which category it belongs to
const getCategoryForTool = (tool: string): string => {
  for (const [category, tools] of Object.entries(TECH_CATEGORIES)) {
    if (tools.some(t => t.toLowerCase() === tool.toLowerCase())) return category
  }
  return "Other"
}

// Group a flat array of tools into { category: [tools] }
const groupToolsByCategory = (tools: string[]): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {}
  for (const tool of tools) {
    const cat = getCategoryForTool(tool)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(tool)
  }
  return grouped
}

const getScoreColor = (score?: number | null) => {
  if (!score) return "text-muted-foreground"
  if (score > 60) return "text-green-700"
  if (score >= 30) return "text-blue-700"
  return "text-red-600"
}

const getTierBadgeClass = (tier?: string | null) => {
  if (tier?.includes("A")) return "bg-green-100 text-green-800 border-green-300"
  if (tier?.includes("B")) return "bg-blue-100 text-blue-800 border-blue-300"
  return "bg-gray-100 text-gray-600 border-gray-300"
}

const INTERACTION_TYPES: InteractionType[] = [
  "Email", "Call", "Meeting", "LinkedIn DM", "Demo", "Follow-Up", "Event"
]
const INTERACTION_OUTCOMES: InteractionOutcome[] = [
  "Positive", "Neutral", "Negative", "No Response"
]

export default function AccountDetailPage() {
  const { slug } = useParams()
  const id = Array.isArray(slug) ? slug[0] : slug

  // ── Data state ──────────────────────────────────────────────────────────────
  const [prospect,     setProspect]     = useState<Prospect | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [contacts,     setContacts]     = useState<any[]>([])
  const [isLoading,    setIsLoading]    = useState(true)

  // ── Scoring state ───────────────────────────────────────────────────────────
  // breakdown shape from backend:
  // { prospect: { ... }, calculated: { finalScore, techFitScore, clvRanking, salesPriority, disqualified, breakdown: { techFit, financial, strategic, industry, formula } } }
  const [scoreData,        setScoreData]        = useState<any>(null)
  const [isCalculating,    setIsCalculating]    = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideTier,     setOverrideTier]     = useState("")
  const [overridePriority, setOverridePriority] = useState("")
  const [overrideReason,   setOverrideReason]   = useState("")
  const [isOverriding,     setIsOverriding]     = useState(false)

  // ── Enrich state ────────────────────────────────────────────────────────────
  const [isEnriching, setIsEnriching] = useState(false)

  // ── Suggest POC state ────────────────────────────────────────────────────────
  const [pocResult,       setPocResult]       = useState<any>(null)
  const [isSuggestingPoc, setIsSuggestingPoc] = useState(false)

  // ── Log Interaction modal ───────────────────────────────────────────────────
  const [showLogModal, setShowLogModal] = useState(false)
  const [logType,      setLogType]      = useState<InteractionType>("Call")
  const [logDate,      setLogDate]      = useState(new Date().toISOString().split("T")[0])
  const [logNotes,     setLogNotes]     = useState("")
  const [logOutcome,   setLogOutcome]   = useState<InteractionOutcome>("Positive")
  const [isLogging,    setIsLogging]    = useState(false)

  // ── Edit modal ──────────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving,      setIsSaving]      = useState(false)
  const [editData,      setEditData]      = useState({
    // Basic Info
    accountName: "", website: "", country: "", hqLocationCity: "",
    primaryIndustry: "", businessModel: "", noOfEmployees: "", annualRevenue: "",
    // Scoring Inputs
    salesPriority: "", intentSignal: "", clvRanking: "",
    strategicValue: "", financialCapacity: "", marginPotential: "",
    technologyAlignment: "", servicePitch: "", historyTrigger: "",
    // Tech Profile
    techAdoptionProfile: "", infrastructureRisk: "", commercialCategory: "",
  })
  const [editTechStack, setEditTechStack] = useState<string[]>([])

  // ── Add Contact modal state ───────────────────────────────────────────────────
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [isAddingContact, setIsAddingContact]         = useState(false)
  const [removingContactId, setRemovingContactId]     = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    firstName: "", lastName: "", functionalDomain: "",
    standardizedRoles: "", email: "", primaryPhone: "",
    linkedIn: "", isPrimary: false,
  })

  // ── Load all data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return
      try {
        const [prospectRes, interactionsRes, contactsRes] = await Promise.all([
          api.get<any>(`/prospects/${id}`),
          api.get<any>(`/interactions/prospect/${id}`),
          api.get<any>(`/contacts/account/${id}`),
        ])
        // Backend: { success: true, data: prospect }
        setProspect(prospectRes.data)
        setInteractions(interactionsRes.data || [])
        setContacts(contactsRes.data || [])

        // Load score breakdown silently — don't fail if not available yet
        try {
          const scoreRes = await api.get<any>(`/prospects/${id}/score-breakdown`)
          setScoreData(scoreRes.data)
        } catch { /* not scored yet */ }
      } catch (err) {
        console.error("Account detail fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const calcMsg = useAutoDismissMessage()
  const enrichMsg = useAutoDismissMessage()
  const pocError = useAutoDismissMessage()
  const logMsg = useAutoDismissMessage({
    onAutoDismiss: () => {
      setShowLogModal(false)
      setLogNotes("")
    },
  })
  const saveMsg = useAutoDismissMessage({
    onAutoDismiss: () => setShowEditModal(false),
  })
  const contactMsg = useAutoDismissMessage()
  const { showAlert, AlertHost } = useAppAlert()

  // ── POST /api/prospects/:id/calculate-score ──────────────────────────────
  // Runs scoring formula, saves to DB, then loads fresh breakdown
  const handleCalculateScore = async () => {
    setIsCalculating(true)
    calcMsg.clearMessage()
    try {
      const res = await api.post<any>(`/prospects/${id}/calculate-score`, {})
      const result = res.data

      if (result?.disqualified) {
        calcMsg.setMessage("⚠️ Account disqualified — no tech fit match")
      } else {
        calcMsg.setMessage(`✅ Score: ${result?.finalScore} → ${result?.clvRanking}`)
      }

      // Reload breakdown + prospect
      const [scoreRes, prospectRes] = await Promise.all([
        api.get<any>(`/prospects/${id}/score-breakdown`),
        api.get<any>(`/prospects/${id}`),
      ])
      setScoreData(scoreRes.data)
      setProspect(prospectRes.data)
    } catch {
      calcMsg.setMessage("❌ Calculation failed. Check fields and try again.")
    } finally {
      setIsCalculating(false)
    }
  }

  // ── PUT /api/prospects/:id/override-tier ─────────────────────────────────
  const handleOverrideTier = async () => {
    if (!overrideTier || !overrideReason) return
    setIsOverriding(true)
    try {
      await api.put<any>(`/prospects/${id}/override-tier`, {
        clvRanking:    overrideTier,
        salesPriority: overridePriority || undefined,
        overrideReason,
      })
      const [scoreRes, prospectRes] = await Promise.all([
        api.get<any>(`/prospects/${id}/score-breakdown`),
        api.get<any>(`/prospects/${id}`),
      ])
      setScoreData(scoreRes.data)
      setProspect(prospectRes.data)
      setShowOverrideModal(false)
      setOverrideTier("")
      setOverridePriority("")
      setOverrideReason("")
    } catch (err) {
      console.error("Override error:", err)
    } finally {
      setIsOverriding(false)
    }
  }

  // ── POST /api/enrichment/:id ──────────────────────────────────────────────
  const handleEnrich = async () => {
    setIsEnriching(true)
    enrichMsg.clearMessage()
    try {
      await api.post<any>(`/enrichment/${id}`, {})
      enrichMsg.setMessage("✅ AI enrichment complete — score recalculated!")
      const [prospectRes, scoreRes] = await Promise.all([
        api.get<any>(`/prospects/${id}`),
        api.get<any>(`/prospects/${id}/score-breakdown`),
      ])
      setProspect(prospectRes.data)
      setScoreData(scoreRes.data)
    } catch (err: unknown) {
      enrichMsg.setMessage(`❌ ${formatEnrichmentError(err, "Enrichment failed. Check Gemini API key.")}`)
    } finally {
      setIsEnriching(false)
    }
  }

  // ── POST /api/prospects/:id/suggest-poc ──────────────────────────────────
  // Calls Gemini to suggest best POC — scenario 1: existing contact, scenario 2: no contacts
  const handleSuggestPoc = async () => {
    if (isSuggestingPoc) return   // prevent double fire
    setIsSuggestingPoc(true)
    pocError.clearMessage()
    setPocResult(null)
    try {
      const res = await api.post<any>(`/prospects/${id}/suggest-poc`, {})
      setPocResult(res.data)
    } catch {
      pocError.setMessage("❌ POC suggestion failed. Try again.")
    } finally {
      setIsSuggestingPoc(false)
    }
  }

  // ── PUT /api/prospects/:id ────────────────────────────────────────────────
  const handleEdit = () => {
    if (!prospect) return
    setEditData({
      accountName:         prospect.accountName       ?? "",
      website:             prospect.website           ?? "",
      country:             prospect.country           ?? "",
      hqLocationCity:      prospect.hqLocationCity     ?? "",
      primaryIndustry:     prospect.primaryIndustry    ?? "",
      businessModel:       prospect.businessModel      ?? "",
      noOfEmployees:       prospect.noOfEmployees      ?? "",
      annualRevenue:       prospect.annualRevenue      ?? "",
      salesPriority:       prospect.salesPriority       ?? "",
      intentSignal:        prospect.intentSignal        ?? "",
      clvRanking:          prospect.clvRanking          ?? "",
      strategicValue:      prospect.strategicValue      ?? "",
      financialCapacity:   prospect.financialCapacity   ?? "",
      marginPotential:     prospect.marginPotential     ?? "",
      technologyAlignment: (prospect as any).technologyAlignment ?? "",
      servicePitch:        prospect.servicePitch        ?? "",
      historyTrigger:      prospect.historyTrigger      ?? "",
      techAdoptionProfile: (prospect as any).techAdoptionProfile ?? "",
      infrastructureRisk:  (prospect as any).infrastructureRisk  ?? "",
      commercialCategory:  (prospect as any).commercialCategory  ?? "",
    })
    setEditTechStack((prospect as any).primaryTechStack ?? [])
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    saveMsg.clearMessage()
    try {
      const payload: any = {}
      Object.entries(editData).forEach(([k, v]) => { if (v) payload[k] = v })
      if (editTechStack.length > 0) payload.primaryTechStack = editTechStack
      const res = await api.put<any>(`/prospects/${id}`, payload)
      setProspect(res.data)
      saveMsg.setMessage("✅ Saved!")
    } catch {
      saveMsg.setMessage("❌ Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  // ── POST /api/contacts — create + auto-link to this account ─────────────────
  const handleAddContact = async () => {
    if (!newContact.firstName.trim() && !newContact.lastName.trim() && !newContact.email.trim()) return
    setIsAddingContact(true)
    contactMsg.clearMessage()
    try {
      const payload: any = {
        ...newContact,
        accountId: id,
        accountName: prospect?.accountName,
      }
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k] })
      const res = await api.post<any>("/contacts", payload)
      setContacts(prev => [...prev, res.data])
      setShowAddContactModal(false)
      setNewContact({
        firstName: "", lastName: "", functionalDomain: "",
        standardizedRoles: "", email: "", primaryPhone: "",
        linkedIn: "", isPrimary: false,
      })
    } catch (err) {
      console.error("Add contact error:", err)
      contactMsg.setMessage("❌ Could not add contact. Check the fields and try again.")
      showAlert({
        message: "Could not add contact. Check the fields and try again.",
        variant: "error",
      })
    } finally {
      setIsAddingContact(false)
    }
  }

  // ── DELETE /api/contacts/:id/account — unlink contact from this account ─────
  // Contact record is preserved, only the account association is cleared
  const handleRemoveContact = async (contactId: string) => {
    const ok = window.confirm("Remove this contact from the account? The contact will not be deleted.")
    if (!ok) return
    setRemovingContactId(contactId)
    try {
      await api.delete<any>(`/contacts/${contactId}/account`)
      setContacts(prev => prev.filter(c => c._id !== contactId))
    } catch (err) {
      console.error("Remove contact error:", err)
      alert("❌ Could not remove contact. Please try again.")
    } finally {
      setRemovingContactId(null)
    }
  }

  // ── POST /api/interactions ────────────────────────────────────────────────
  const handleLogInteraction = async () => {
    if (!logType || !logDate) return
    setIsLogging(true)
    logMsg.clearMessage()
    try {
      await api.post("/interactions", {
        prospectId: id, type: logType,
        interactedAt: new Date(logDate).toISOString(),
        notes: logNotes, outcome: logOutcome,
      })
      logMsg.setMessage("✅ Logged!")
      const res = await api.get<any>(`/interactions/prospect/${id}`)
      setInteractions(res.data || [])
    } catch {
      logMsg.setMessage("❌ Failed.")
    } finally {
      setIsLogging(false)
    }
  }

  const getOutcomeColor = (outcome?: string) => {
    if (outcome === "Positive")    return "bg-green-100 text-green-700"
    if (outcome === "Negative")    return "bg-red-100 text-red-700"
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
        <p className="text-muted-foreground">Prospect not found.</p>
        <Link href="/accounts"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    )
  }

  // Merge all tech tools from all three stack fields
  const allTools: string[] = [
    ...(Array.isArray(prospect.primaryTechStack)   ? prospect.primaryTechStack   : prospect.primaryTechStack   ? [prospect.primaryTechStack]   : []),
    ...(Array.isArray(prospect.secondaryTechStack) ? prospect.secondaryTechStack : prospect.secondaryTechStack ? [prospect.secondaryTechStack] : []),
    ...(Array.isArray(prospect.tertiaryTechStack)  ? prospect.tertiaryTechStack  : prospect.tertiaryTechStack  ? [prospect.tertiaryTechStack]  : []),
  ]
  const groupedTools = groupToolsByCategory(allTools)

  // Score breakdown from backend — shape: { prospect, calculated: { finalScore, clvRanking, breakdown: { techFit, financial, strategic, industry, formula } } }
  const calc      = scoreData?.calculated
  const breakdown = calc?.breakdown

  const initials = prospect.accountName?.slice(0, 2).toUpperCase() ?? "NA"

  return (
    <div className="p-6 space-y-6">

      <Link href="/accounts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to accounts
      </Link>

      {/* ── Header Card ── */}
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
                  {prospect.icpSalesPriority && (() => {
                    const p = getIcpPriorityDisplay(prospect.icpSalesPriority)
                    return p ? (
                      <Badge className={`${p.color} bg-white border`}>
                        {p.label}
                      </Badge>
                    ) : null
                  })()}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  {prospect.website    && <span className="text-sm">{prospect.website}</span>}
                  {prospect.hqLocationCity && <><span>·</span><span className="text-sm">{prospect.hqLocationCity}, {prospect.country}</span></>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {prospect.primaryIndustry && <Badge variant="outline">{prospect.primaryIndustry}</Badge>}
                  {prospect.noOfEmployees   && <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{prospect.noOfEmployees}</Badge>}
                  {prospect.annualRevenue   && <Badge variant="outline">{prospect.annualRevenue}</Badge>}
                  {prospect.icpTier && (
                    <Badge className={getIcpTierBadgeClass(prospect.icpTier)}>
                      {prospect.icpTier}
                    </Badge>
                  )}
                  {prospect.clvRanking && (
                    <Badge className={getTierBadgeClass(prospect.clvRanking)} variant="outline">
                      CLV: {prospect.clvRanking}
                    </Badge>
                  )}
                  {prospect.icpFinalScore != null && (
                    <Badge variant="outline" className="font-bold">
                      ICP: {prospect.icpFinalScore}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" className="gap-2" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />Edit
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowLogModal(true)}>
                <Plus className="h-4 w-4" />Log Interaction
              </Button>
              <Button className="gap-2" onClick={handleCalculateScore} disabled={isCalculating}>
                {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                {isCalculating ? "Scoring..." : "Calculate Score"}
              </Button>
            </div>
          </div>
          {calcMsg.visible && (
            <AutoDismissBanner {...calcMsg} className="mt-3 bg-muted/20" onDismiss={calcMsg.clearMessage} />
          )}
          {enrichMsg.visible && (
            <AutoDismissBanner {...enrichMsg} className="mt-3 bg-muted/20" onDismiss={enrichMsg.clearMessage} />
          )}
        </CardContent>
      </Card>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Tabs ── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="scoring">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="scoring">Scoring</TabsTrigger>
              <TabsTrigger value="technographics">Technographics</TabsTrigger>
              <TabsTrigger value="firmographics">Firmographics</TabsTrigger>
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="activity">
                Activity {interactions.length > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    {interactions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts {contacts.length > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    {contacts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>

            {/* ══ SCORING TAB ══════════════════════════════════════════════════ */}
            <TabsContent value="scoring" className="mt-4 space-y-4">
              <IcpClvScorePanel prospect={prospect} scoreCalc={calc} />

              <Card>
                <CardContent className="p-5 space-y-5">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Score Breakdown</h2>
                    <Button size="sm" variant="outline" className="gap-2"
                      onClick={handleCalculateScore} disabled={isCalculating}>
                      {isCalculating
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RefreshCw className="h-4 w-4" />}
                      Recalculate
                    </Button>
                  </div>

                  {!scoreData && !isCalculating && (
                    <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
                      <Target className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Score not calculated yet. Fill in Financial Capacity, Strategic Value,
                        Margin Potential, and Tech Alignment — then click Calculate Score.
                      </p>
                      <Button className="gap-2" onClick={handleCalculateScore}>
                        <Target className="h-4 w-4" />Calculate Now
                      </Button>
                    </div>
                  )}

                  {calc && (
                    <>
                      {/* Disqualified banner */}
                      {calc.disqualified && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                          <Shield className="h-5 w-5 text-red-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-red-800 text-sm">Account Disqualified</p>
                            <p className="text-xs text-red-600">Tech Fit = No Match — score zeroed out. Update technologyAlignment to re-qualify.</p>
                          </div>
                        </div>
                      )}

                      {/* Final score display */}
                      {!calc.disqualified && (
                        <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/30 border">
                          <div className="text-center">
                            <p className={`text-5xl font-bold ${getScoreColor(calc.finalScore)}`}>
                              {calc.finalScore ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Final Score</p>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">CLV Tier</span>
                              <Badge className={getTierBadgeClass(calc.clvRanking)}>{calc.clvRanking ?? "—"}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Sales Priority</span>
                              <span className="font-medium">{calc.salesPriority ?? "—"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tech Fit Score</span>
                              <span className="font-medium">{calc.techFitScore ?? "—"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Formula breakdown — step by step */}
                      {breakdown && !calc.disqualified && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Formula: ((Financial + Strategic) × Industry) × TechFit
                          </p>

                          {/* Tech Fit */}
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                            <div>
                              <p className="text-sm font-medium">Tech Fit</p>
                              <p className="text-xs text-muted-foreground">{breakdown.techFit?.label}</p>
                            </div>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                              breakdown.techFit?.multiplier === 1.0 ? "bg-green-100 text-green-700" :
                              breakdown.techFit?.multiplier === 0.5 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              ×{breakdown.techFit?.multiplier}
                            </span>
                          </div>

                          {/* Financial */}
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                            <div>
                              <p className="text-sm font-medium">Financial Baseline</p>
                              <p className="text-xs text-muted-foreground">{breakdown.financial?.label}</p>
                            </div>
                            <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                              {breakdown.financial?.points} pts
                            </span>
                          </div>

                          {/* Strategic */}
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                            <div>
                              <p className="text-sm font-medium">Strategic Bonus</p>
                              <p className="text-xs text-muted-foreground">{breakdown.strategic?.label}</p>
                            </div>
                            <span className="text-sm font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                              +{breakdown.strategic?.bonus}
                            </span>
                          </div>

                          {/* Industry */}
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                            <div>
                              <p className="text-sm font-medium">Industry Multiplier</p>
                              <p className="text-xs text-muted-foreground">{breakdown.industry?.label}</p>
                            </div>
                            <span className="text-sm font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                              ×{breakdown.industry?.multiplier}
                            </span>
                          </div>

                          {/* Final formula */}
                          <div className="flex items-center justify-between p-3 rounded-xl border-2 border-primary bg-primary/5">
                            <p className="text-sm font-semibold">Result</p>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground font-mono">{breakdown.formula}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Override button */}
                      <Button variant="outline" className="w-full gap-2"
                        onClick={() => setShowOverrideModal(true)}>
                        <Pencil className="h-4 w-4" />Manual Tier Override
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Required fields reminder if missing */}
              {!calc && !isCalculating && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Required fields for scoring
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { label: "Technology Alignment", value: (prospect as any).technologyAlignment },
                        { label: "Financial Capacity",   value: prospect.financialCapacity },
                        { label: "Strategic Value",      value: prospect.strategicValue },
                        { label: "Margin Potential",     value: prospect.marginPotential },
                        { label: "Intent Signal",        value: prospect.intentSignal },
                      ].map(({ label, value }) => (
                        <div key={label} className={`p-2 rounded border ${value ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-medium text-xs">{value ?? "⚠️ Not set"}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ══ TECHNOGRAPHICS TAB ═══════════════════════════════════════════ */}
            <TabsContent value="technographics" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-5 space-y-5">
                  <h2 className="font-semibold">Tech Stack</h2>

                  {allTools.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <Server className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tech stack data. Enrich with AI or edit the account.
                      </p>
                    </div>
                  ) : (
                    // Group tools by category
                    Object.entries(groupedTools).map(([category, tools]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tools.map(tool => (
                            <span
                              key={tool}
                              className={`px-3 py-1 text-xs font-medium rounded-full border ${CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"]}`}
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Tech Fit Score bar */}
                  {prospect.techFitScore != null && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tech Fit Score</span>
                        <span className="font-bold">{prospect.techFitScore}/100</span>
                      </div>
                      <Progress value={prospect.techFitScore} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {prospect.techFitScore >= 90 ? "Core Match — modern compatible stack" :
                         prospect.techFitScore >= 50 ? "Adjacent Match — partially compatible" :
                         "No Match — legacy or incompatible stack"}
                      </p>
                    </div>
                  )}

                  {/* Technology Alignment */}
                  {(prospect as any).technologyAlignment && (
                    <div className={`p-3 rounded-lg border ${
                      (prospect as any).technologyAlignment === "Core Match"     ? "bg-green-50 border-green-200" :
                      (prospect as any).technologyAlignment === "Adjacent Match" ? "bg-yellow-50 border-yellow-200" :
                      "bg-red-50 border-red-200"
                    }`}>
                      <p className="text-xs text-muted-foreground mb-1">Technology Alignment</p>
                      <p className="text-sm font-semibold">{(prospect as any).technologyAlignment}</p>
                    </div>
                  )}

                  {/* Adoption profile + Risk */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Adoption Profile</p>
                      <p className="font-medium text-sm">{prospect.techAdoptionProfile ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Infrastructure Risk</p>
                      {prospect.infrastructureRisk ? (
                        <span className="text-sm font-medium text-red-700">{prospect.infrastructureRisk}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══ FIRMOGRAPHICS TAB ════════════════════════════════════════════ */}
            <TabsContent value="firmographics" className="mt-4">
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-semibold mb-4">Company Details</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "Industry",          value: prospect.primaryIndustry },
                      { label: "Business Model",    value: prospect.businessModel },
                      { label: "Country",           value: prospect.country },
                      { label: "City",              value: prospect.hqLocationCity },
                      { label: "Annual Revenue",    value: prospect.annualRevenue },
                      { label: "Employees",         value: prospect.noOfEmployees },
                      { label: "CLV Ranking",       value: prospect.clvRanking },
                      { label: "Sales Priority",    value: prospect.salesPriority },
                      { label: "Financial Capacity",value: prospect.financialCapacity },
                      { label: "Margin Potential",  value: prospect.marginPotential },
                      { label: "Strategic Value",   value: prospect.strategicValue },
                      { label: "History Trigger",   value: prospect.historyTrigger },
                      { label: "Intent Signal",     value: prospect.intentSignal },
                      { label: "Service Pitch",     value: prospect.servicePitch },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-muted-foreground text-xs">{label}</p>
                        <p className="font-medium">{value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══ AI INSIGHTS TAB ══════════════════════════════════════════════ */}
            <TabsContent value="ai-insights" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">AI Insights</h2>
                    <Button size="sm" className="gap-2" onClick={handleEnrich} disabled={isEnriching}>
                      {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isEnriching ? "Enriching..." : "Enrich with AI"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Intent Signal",   value: prospect.intentSignal,   color: "bg-blue-50 border-blue-200" },
                      { label: "Strategic Value", value: prospect.strategicValue, color: "bg-purple-50 border-purple-200" },
                      { label: "Service Pitch",   value: prospect.servicePitch,   color: "bg-green-50 border-green-200" },
                      { label: "History Trigger", value: prospect.historyTrigger, color: "bg-amber-50 border-amber-200" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`p-3 rounded-lg border ${value ? color : "border-dashed"}`}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium mt-0.5">{value ?? "Not available — enrich with AI"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══ ACTIVITY TAB ═════════════════════════════════════════════════ */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold">Interactions ({interactions.length})</h2>
                    <Button size="sm" className="gap-2" onClick={() => setShowLogModal(true)}>
                      <Plus className="h-4 w-4" />Log
                    </Button>
                  </div>
                  {interactions.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No interactions yet.</p>
                      <Button variant="outline" size="sm" onClick={() => setShowLogModal(true)}>
                        Log first interaction
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {interactions.map((i) => (
                        <div key={i._id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{i.type}</Badge>
                              {i.outcome && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOutcomeColor(i.outcome)}`}>
                                  {i.outcome}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(i.interactedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </span>
                          </div>
                          {i.notes && <p className="mt-2 text-sm text-muted-foreground">{i.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══ CONTACTS TAB ═════════════════════════════════════════════════ */}
            <TabsContent value="contacts" className="mt-4 space-y-4">
              {/* AI Suggest POC result card */}
              {pocResult && (
                <Card className={pocResult.scenario === "contacts_exist"
                  ? "border-green-300 bg-green-50/50"
                  : "border-blue-300 bg-blue-50/50"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        AI Recommended POC
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        pocResult.confidenceLevel === "High"   ? "bg-green-100 text-green-700" :
                        pocResult.confidenceLevel === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {pocResult.confidenceLevel} confidence
                      </span>
                    </div>

                    {pocResult.scenario === "contacts_exist" && pocResult.recommendedContact && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-green-200">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-600 text-white text-sm">
                            {((pocResult.recommendedContact.firstName?.[0] ?? "") + (pocResult.recommendedContact.lastName?.[0] ?? "")).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {[pocResult.recommendedContact.firstName, pocResult.recommendedContact.lastName].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pocResult.recommendedContact.standardizedRoles ?? pocResult.recommendedContact.functionalDomain ?? "—"}
                          </p>
                          {pocResult.recommendedContact.email && (
                            <p className="text-xs text-muted-foreground">{pocResult.recommendedContact.email}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {pocResult.scenario === "no_contacts" && (
                      <div className="p-3 rounded-lg bg-white border border-blue-200 space-y-1">
                        <p className="text-sm font-semibold">Target: {pocResult.targetRole}</p>
                        <p className="text-xs text-muted-foreground">Dept: {pocResult.targetDepartment}</p>
                        <p className="text-xs text-blue-700 italic">{pocResult.searchSuggestion}</p>
                        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1 w-full"
                          onClick={() => window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(pocResult.targetRole + " " + prospect?.accountName)}`, "_blank")}>
                          Search on LinkedIn ↗
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground italic">"{pocResult.reason}"</p>
                  </CardContent>
                </Card>
              )}
              {pocError.visible && (
                <AutoDismissBanner {...pocError} onDismiss={pocError.clearMessage} />
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold">Contacts ({contacts.length})</h2>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-2 h-8 text-xs"
                        onClick={() => setShowAddContactModal(true)}>
                        <Plus className="h-3 w-3" />Add Contact
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 h-8 text-xs"
                        onClick={handleSuggestPoc} disabled={isSuggestingPoc}>
                        {isSuggestingPoc
                          ? <><Loader2 className="h-3 w-3 animate-spin" />Suggesting...</>
                          : <><Sparkles className="h-3 w-3" />Suggest POC</>}
                      </Button>
                    </div>
                  </div>
                  {contacts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No contacts linked to this account.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {contacts.map((contact) => (
                        <div key={contact._id}
                          className="p-4 flex items-center justify-between hover:bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={`text-sm font-medium ${contact.isPrimary ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                                {((contact.firstName?.[0] ?? "") + (contact.lastName?.[0] ?? "")).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">
                                  {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—"}
                                </p>
                                {contact.isPrimary && (
                                  <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 h-4">Primary</Badge>
                                )}
                              </div>
                              {/* Position / Role */}
                              <p className="text-xs font-medium text-foreground/70 mt-0.5">
                                {contact.standardizedRoles || contact.keyFocusAreas || "—"}
                              </p>
                              {/* Department */}
                              {contact.functionalDomain && (
                                <p className="text-xs text-muted-foreground">{contact.functionalDomain}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.email && (
                              <span className="text-xs text-muted-foreground hidden md:block">{contact.email}</span>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                              <Link href={`/contacts/${contact._id}`}>View</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              disabled={removingContactId === contact._id}
                              onClick={() => handleRemoveContact(contact._id)}
                            >
                              {removingContactId === contact._id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : "Remove"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══ SOURCES TAB ══════════════════════════════════════════════════ */}
            <TabsContent value="sources" className="mt-4">
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-semibold mb-4">Data Sources</h2>
                  <div className="p-3 border rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">{prospect.source ?? "Unknown"}</span>
                    <Badge variant="secondary">Primary</Badge>
                  </div>
                  {prospect.importLogId && typeof prospect.importLogId === "object" && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                      <p className="text-muted-foreground text-xs">Import File</p>
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
        <div className="space-y-4">

          {/* Score ring */}
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">ICP Score</p>
              <div
                className={`inline-flex h-28 w-28 items-center justify-center rounded-full border-4 mx-auto ${
                  prospect.icpFinalScore != null
                    ? getIcpScoreCircleClass(prospect.icpFinalScore)
                    : "border-gray-200 text-gray-300"
                }`}
              >
                <span className="text-4xl font-bold">
                  {prospect.icpFinalScore != null ? prospect.icpFinalScore : "—"}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {formatIcpFinalScoreTooltip(prospect) && (
                  <p className="text-xs text-muted-foreground px-2">
                    {formatIcpFinalScoreTooltip(prospect)}
                  </p>
                )}
                {prospect.icpTier && (
                  <Badge className={`${getIcpTierBadgeClass(prospect.icpTier)} w-full justify-center`}>
                    {prospect.icpTier}
                  </Badge>
                )}
                {prospect.clvRanking && (
                  <p className="text-xs text-muted-foreground">
                    CLV: {prospect.clvRanking}
                  </p>
                )}
                {prospect.techFitScore != null && (
                  <p className="text-xs text-muted-foreground">Tech Fit: {prospect.techFitScore}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Primary Contact */}
          {contacts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3 text-sm">Primary Contact</h2>
                {contacts.slice(0, 1).map((contact) => (
                  <div key={contact._id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {((contact.firstName?.[0] ?? "") + (contact.lastName?.[0] ?? "")).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p className="text-xs font-medium text-foreground/70">
                          {contact.standardizedRoles || contact.keyFocusAreas || "—"}
                        </p>
                        {contact.functionalDomain && (
                          <p className="text-xs text-muted-foreground">{contact.functionalDomain}</p>
                        )}
                      </div>
                    </div>
                    {contact.email && (
                      <Button variant="outline" className="w-full gap-2 text-xs h-8" asChild>
                        <a href={`mailto:${contact.email}`}>
                          <Mail className="h-3 w-3" />{contact.email}
                        </a>
                      </Button>
                    )}
                    {contacts.length > 1 && (
                      <p className="text-xs text-muted-foreground text-center">+{contacts.length - 1} more contacts</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI Enrich */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />AI Enrichment
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                Fills missing fields + auto-calculates score via Gemini.
              </p>
              <Button className="w-full gap-2" onClick={handleEnrich} disabled={isEnriching}>
                {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isEnriching ? "Enriching..." : "Enrich with AI"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Stats</p>
              {[
                { label: "Tech Tools",    value: allTools.length > 0 ? `${allTools.length} tools` : "None" },
                { label: "Interactions", value: interactions.length },
                { label: "Contacts",     value: contacts.length },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* Log Interaction */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type *</Label>
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
              <Textarea rows={3} placeholder="What happened..." value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)} />
            </div>
            {logMsg.visible && (
              <AutoDismissBanner {...logMsg} onDismiss={logMsg.clearMessage} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button onClick={handleLogInteraction} disabled={isLogging} className="gap-2">
              {isLogging && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogging ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact */}
      <Dialog open={showAddContactModal} onOpenChange={setShowAddContactModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Contact — {prospect.accountName}</DialogTitle></DialogHeader>
          {contactMsg.visible && (
            <AutoDismissBanner {...contactMsg} onDismiss={contactMsg.clearMessage} />
          )}
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input value={newContact.firstName}
                  onChange={(e) => setNewContact(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input value={newContact.lastName}
                  onChange={(e) => setNewContact(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Functional Domain</Label>
              <Select value={newContact.functionalDomain}
                onValueChange={(v) => setNewContact(p => ({ ...p, functionalDomain: v }))}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {FUNCTIONAL_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Role / Title</Label>
              <Input placeholder="e.g. VP of Engineering" value={newContact.standardizedRoles}
                onChange={(e) => setNewContact(p => ({ ...p, standardizedRoles: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={newContact.email}
                  onChange={(e) => setNewContact(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={newContact.primaryPhone}
                  onChange={(e) => setNewContact(p => ({ ...p, primaryPhone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>LinkedIn</Label>
              <Input value={newContact.linkedIn}
                onChange={(e) => setNewContact(p => ({ ...p, linkedIn: e.target.value }))} />
            </div>
           
           
           
    <div className="space-y-1 pt-1">
              <Label>Contact Type</Label>
              <RadioGroup
                value={newContact.isPrimary ? "primary" : "secondary"}
                onValueChange={(v) => setNewContact(p => ({ ...p, isPrimary: v === "primary" }))}
                className="flex items-center gap-6"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="primary" />
                  <span className="text-sm font-medium">Primary Contact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="secondary" />
                  <span className="text-sm font-medium">Secondary Contact</span>
                </label>
              </RadioGroup>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContactModal(false)}>Cancel</Button>
            <Button onClick={handleAddContact} disabled={isAddingContact} className="gap-2">
              {isAddingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAddingContact ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit — {prospect.accountName}</DialogTitle></DialogHeader>

          {/* ── Basic Info ── */}
          <div className="space-y-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Account Name</Label>
                <Input value={editData.accountName} onChange={(e) => setEditData(p => ({ ...p, accountName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Website</Label>
                <Input value={editData.website} onChange={(e) => setEditData(p => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={editData.country} onChange={(e) => setEditData(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={editData.hqLocationCity} onChange={(e) => setEditData(p => ({ ...p, hqLocationCity: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Industry</Label>
                <Select value={editData.primaryIndustry} onValueChange={(v) => setEditData(p => ({ ...p, primaryIndustry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["BFSI","IT & ITES","SaaS","Fintech","E-commerce","Healthcare","EdTech","Logistics","Manufacturing","Retail & CPG","Media & Telecom","Real Estate"].map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Business Model</Label>
                <Select value={editData.businessModel} onValueChange={(v) => setEditData(p => ({ ...p, businessModel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["B2B","B2C","B2B2C","D2C","E-Commerce","Marketplace"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Employees</Label>
                <Select value={editData.noOfEmployees} onValueChange={(v) => setEditData(p => ({ ...p, noOfEmployees: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["1-10","11-50","51-200","201-500","501-1,000","1,001-5,000","5,001-10,000","10,000+"].map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Annual Revenue</Label>
                <Select value={editData.annualRevenue} onValueChange={(v) => setEditData(p => ({ ...p, annualRevenue: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                 
                 
                {["Seed <$1M","Early $1M-$10M","Growth $10M-$50M","Scale $50M-$100M","Mid-Market $100M-$500M","Enterprise $500M-$1B","Mega $1B+"].map(r => (                  
                  
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-t pt-4">
            <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-1">Scoring Inputs</p>
            {/* Technology Alignment — important for scoring */}
            <div className="col-span-2 space-y-1">
              <Label>Technology Alignment <span className="text-xs text-primary">(scoring input)</span></Label>
              <Select value={editData.technologyAlignment}
                onValueChange={(v) => setEditData(p => ({ ...p, technologyAlignment: v }))}>
                <SelectTrigger><SelectValue placeholder="Select alignment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core Match">Core Match — modern compatible stack</SelectItem>
                  <SelectItem value="Adjacent Match">Adjacent Match — partially compatible</SelectItem>
                  <SelectItem value="No Match">No Match — legacy/incompatible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Financial Capacity <span className="text-xs text-primary">(scoring)</span></Label>
              <Select value={editData.financialCapacity}
                onValueChange={(v) => setEditData(p => ({ ...p, financialCapacity: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enterprise">Enterprise (&gt;$200M)</SelectItem>
                  <SelectItem value="Mid-Market">Mid-Market ($50M-$200M)</SelectItem>
                  <SelectItem value="Small Business">Small Business (&lt;$50M)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Strategic Value <span className="text-xs text-primary">(scoring)</span></Label>
              <Select value={editData.strategicValue}
                onValueChange={(v) => setEditData(p => ({ ...p, strategicValue: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Market Maker">Market Maker (+40)</SelectItem>
                  <SelectItem value="VC Backed">VC Backed (+20)</SelectItem>
                  <SelectItem value="Standard">Standard (+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Margin Potential <span className="text-xs text-primary">(scoring)</span></Label>
              <Select value={editData.marginPotential}
                onValueChange={(v) => setEditData(p => ({ ...p, marginPotential: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High Margins">High Margins (×1.2)</SelectItem>
                  <SelectItem value="Standard Margins">Standard Margins (×1.0)</SelectItem>
                  <SelectItem value="Low Margins">Low Margins (×0.8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Intent Signal</Label>
              <Select value={editData.intentSignal}
                onValueChange={(v) => setEditData(p => ({ ...p, intentSignal: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Hyper-Growth Mode","Cost Containment","Risk Mitigation","Modernization Mandate","Capital Event","Regulatory Action","Earnings Shock","Strategic Pivot","Security Incident","Job Postings"].map(v =>
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sales Priority</Label>
              <Select value={editData.salesPriority}
                onValueChange={(v) => setEditData(p => ({ ...p, salesPriority: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["P1 (Tier A+Active)","P2 (Tier B+Active)","P3 (Tier A+Cold)","P4 (Tier B+Cold)"].map(v =>
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>History Trigger</Label>
              <Select value={editData.historyTrigger}
                onValueChange={(v) => setEditData(p => ({ ...p, historyTrigger: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["M&A Activity","Capital Event","Leadership Shakeup","Regulatory Action","Earnings Shock","Security Incident","Strategic Pivot","Job Postings"].map(v =>
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Service Pitch</Label>
              <Select value={editData.servicePitch}
                onValueChange={(v) => setEditData(p => ({ ...p, servicePitch: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Speed & Capacity","Automation & Outsourcing","Security & Compliance","Future-Proofing","Data Unification"].map(v =>
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Tech Profile ── */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tech Profile</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Adoption Profile</Label>
                <Select value={editData.techAdoptionProfile} onValueChange={(v) => setEditData(p => ({ ...p, techAdoptionProfile: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Innovator","Early Adopter","Mainstream","Laggard","Leapfrog"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Infrastructure Risk</Label>
                <Select value={editData.infrastructureRisk} onValueChange={(v) => setEditData(p => ({ ...p, infrastructureRisk: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["EOL","Data Silos","Security Gaps","Scalability Lock","Shadow IT"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Commercial Category</Label>
                <Select value={editData.commercialCategory} onValueChange={(v) => setEditData(p => ({ ...p, commercialCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Product Led","SaaS-Subscriptions","Professional Services","Retail-E-Com"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tech Stack multi-select by category */}
            <div>
              <Label className="text-sm font-medium">Tech Stack (multi-select)</Label>
              <p className="text-xs text-muted-foreground mb-2">Click tools to add/remove.</p>
              <div className="space-y-3 border rounded-lg p-3 bg-muted/20 max-h-48 overflow-y-auto">
                {[
                  { cat: "Cloud",    tools: ["AWS","Microsoft Azure","Google Cloud (GCP)","Oracle Cloud","Digital Ocean","On-Premise"] },
                  { cat: "CRM/ERP",  tools: ["Salesforce","HubSpot","SAP S/4HANA","MS Dynamics 365","Zoho","Odoo"] },
                  { cat: "Frontend", tools: ["React","Angular","Vue.js","Next.js","Flutter (Web)"] },
                  { cat: "Backend",  tools: ["Python","Node.js","Java (Spring)","PHP (Laravel)",".NET Core","Go"] },
                  { cat: "Database", tools: ["PostgreSQL","MySQL","MongoDB (NoSQL)","Snowflake","Redis"] },
                  { cat: "DevOps",   tools: ["Docker","Kubernetes","GitHub Actions","Terraform","Jenkins"] },
                  { cat: "Security", tools: ["CrowdStrike","Okta","Palo Alto Networks","Cloudflare","Splunk"] },
                  { cat: "E-comm",   tools: ["Shopify","Magento","WooCommerce","BigCommerce"] },
                ].map(({ cat, tools }) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tools.map(tool => {
                        const selected = editTechStack.includes(tool)
                        return (
                          <button
                            key={tool}
                            type="button"
                            onClick={() => setEditTechStack(prev =>
                              prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
                            )}
                            className={`px-2.5 py-1 rounded-full text-xs border font-medium transition-colors ${
                              selected
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                            }`}
                          >
                            {selected ? "✓ " : ""}{tool}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {editTechStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editTechStack.map(tool => (
                    <span key={tool}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                      {tool}
                      <button onClick={() => setEditTechStack(p => p.filter(t => t !== tool))}
                        className="ml-0.5 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {saveMsg.visible && (
            <AutoDismissBanner {...saveMsg} onDismiss={saveMsg.clearMessage} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Tier */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manual Tier Override</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Override the formula result. Reason will be saved in comments for audit trail.
            </p>
            <div className="space-y-2">
              <Label>New Tier *</Label>
              <Select value={overrideTier} onValueChange={setOverrideTier}>
                <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tier-A (Strategic)">Tier A — Strategic</SelectItem>
                  <SelectItem value="Tier-B (Core)">Tier B — Core</SelectItem>
                  <SelectItem value="Tier-C (Mass)">Tier C — Mass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sales Priority (optional)</Label>
              <Select value={overridePriority} onValueChange={setOverridePriority}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  {["P1 (Tier A+Active)","P2 (Tier B+Active)","P3 (Tier A+Cold)","P4 (Tier B+Cold)"].map(v =>
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea rows={3}
                placeholder="e.g. Strategic partnership, existing customer, expansion plans..."
                value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
            <Button onClick={handleOverrideTier}
              disabled={!overrideTier || !overrideReason || isOverriding}
              className="gap-2">
              {isOverriding && <Loader2 className="h-4 w-4 animate-spin" />}
              {isOverriding ? "Saving..." : "Save Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {AlertHost}
    </div>
  )
}
