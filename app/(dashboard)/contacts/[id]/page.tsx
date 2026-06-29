"use client"

// ─────────────────────────────────────────────
// Contact Detail Page
// APIs:
//   GET  /api/contacts/:id                       → contact data
//   PUT  /api/contacts/:id                       → update contact
//   POST /api/contacts/:id/campaigns/:campaignId → add to campaign
//   GET  /api/campaigns                          → campaign list for dropdown
// ─────────────────────────────────────────────

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Mail, Phone, Linkedin, Globe,
  Pencil, Loader2, Sparkles, MapPin,
  Clock, Twitter, Plus, CheckCircle, Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import { getLinkedInUrl } from "@/lib/urlUtils"
import { getContactAccountId, getContactAccountName } from "@/lib/contactAccountUtils"
import type { Contact, Campaign, Prospect } from "@/types"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"

const FUNCTIONAL_DOMAINS = [
  "Corporate Strategy", "Technology & Digital", "Data & AI",
  "Finance & Accounting", "Revenue & Growth", "Product & Creative",
  "Operations & Logistics", "People & HR", "Legal & Governance",
  "Healthcare & Life Sciences", "Industrial & Engineering",
  "Resources & Utilities", "Public Sector & NGO",
]

const DOMAIN_COLORS: Record<string, string> = {
  "Corporate Strategy":        "bg-purple-50 text-purple-700 border-purple-200",
  "Technology & Digital":      "bg-blue-50 text-blue-700 border-blue-200",
  "Data & AI":                 "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Finance & Accounting":      "bg-green-50 text-green-700 border-green-200",
  "Revenue & Growth":          "bg-orange-50 text-orange-700 border-orange-200",
  "Product & Creative":        "bg-pink-50 text-pink-700 border-pink-200",
  "Operations & Logistics":    "bg-yellow-50 text-yellow-700 border-yellow-200",
  "People & HR":               "bg-rose-50 text-rose-700 border-rose-200",
  "Legal & Governance":        "bg-slate-50 text-slate-700 border-slate-200",
  "Healthcare & Life Sciences":"bg-emerald-50 text-emerald-700 border-emerald-200",
  "Industrial & Engineering":  "bg-amber-50 text-amber-700 border-amber-200",
  "Resources & Utilities":     "bg-teal-50 text-teal-700 border-teal-200",
  "Public Sector & NGO":       "bg-indigo-50 text-indigo-700 border-indigo-200",
}

export default function ContactDetailPage() {
  const { id } = useParams()
  const contactId = Array.isArray(id) ? id[0] : id
  const router = useRouter()

  // ── Data state ───────────────────────────────────────────────────────────────
  const [contact, setContact]   = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ── Edit modal state ─────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving]           = useState(false)
  const [editData, setEditData] = useState({
    firstName: "", lastName: "", functionalDomain: "",
    keyFocusAreas: "", standardizedRoles: "", seniority: "",
    email: "", secondaryEmail: "",
    primaryPhone: "", secondaryPhone: "", primaryMobNo: "",
    primaryPhoneExtension: "", secondaryPhoneExtension: "",
    linkedIn: "", twitterUrl: "",
    country: "", state: "", city: "", timeZone: "",
    isPrimary: false,
  })

  // ── Campaign modal state ─────────────────────────────────────────────────────
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaigns, setCampaigns]                 = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState("")
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false)

  const saveMsg = useAutoDismissMessage({
    onAutoDismiss: () => setShowEditModal(false),
  })
  const campaignMsg = useAutoDismissMessage({
    onAutoDismiss: () => {
      setShowCampaignModal(false)
      if (selectedCampaignId) router.push(`/campaigns/${selectedCampaignId}`)
    },
  })

  // ── GET /api/contacts/:id ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) return
      try {
        const res = await api.get<any>(`/contacts/${contactId}`)
        setContact(res.data)
      } catch (err) {
        console.error("Contact fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchContact()
  }, [contactId])

  // ── Open edit modal — prefill existing data ──────────────────────────────────
  const handleEdit = () => {
    if (!contact) return
    setEditData({
      firstName:               contact.firstName ?? "",
      lastName:                contact.lastName ?? "",
      functionalDomain:        contact.functionalDomain ?? "",
      keyFocusAreas:           contact.keyFocusAreas ?? "",
      standardizedRoles:       contact.standardizedRoles ?? "",
      seniority:               contact.seniority ?? "",
      email:                   contact.email ?? "",
      secondaryEmail:          contact.secondaryEmail ?? "",
      primaryPhone:            contact.primaryPhone ?? "",
      secondaryPhone:          contact.secondaryPhone ?? "",
      primaryMobNo:            contact.primaryMobNo ?? "",
      primaryPhoneExtension:   contact.primaryPhoneExtension ?? "",
      secondaryPhoneExtension: contact.secondaryPhoneExtension ?? "",
      linkedIn:                contact.linkedIn ?? "",
      twitterUrl:              contact.twitterUrl ?? "",
      country:                 contact.country ?? "",
      state:                   contact.state ?? "",
      city:                    contact.city ?? "",
      timeZone:                contact.timeZone ?? "",
      isPrimary:               contact.isPrimary ?? false,
    })
    saveMsg.clearMessage()
    setShowEditModal(true)
  }

  // ── PUT /api/contacts/:id ────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    setIsSaving(true)
    saveMsg.clearMessage()
    try {
      const payload: any = { ...editData }
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k] })
      const res = await api.put<any>(`/contacts/${contactId}`, payload)
      setContact(res.data)
      saveMsg.setMessage("✅ Saved!")
    } catch (err) {
      if (err instanceof ApiError) saveMsg.setMessage(`❌ ${err.message}`)
      else saveMsg.setMessage("❌ Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  // ── Open campaign modal — load campaigns ─────────────────────────────────────
  const handleOpenCampaignModal = async () => {
    setSelectedCampaignId("")
    campaignMsg.clearMessage()
    try {
      const res = await api.get<any>("/campaigns?limit=100")
      setCampaigns(res.data?.campaigns ?? res.data ?? [])
    } catch {
      setCampaigns([])
    }
    setShowCampaignModal(true)
  }

  // ── POST /api/contacts/:id/campaigns/:campaignId ─────────────────────────────
  const handleAddToCampaign = async () => {
    if (!selectedCampaignId) { campaignMsg.setMessage("❌ Please select a campaign."); return }
    setIsAddingToCampaign(true)
    campaignMsg.clearMessage()
    try {
      await api.post(`/contacts/${contactId}/campaigns/${selectedCampaignId}`)
      campaignMsg.setMessage("✅ Contact successfully added to campaign!")
      const res = await api.get<any>(`/contacts/${contactId}`)
      setContact(res.data)
    } catch (err) {
      if (err instanceof ApiError) campaignMsg.setMessage(`❌ ${err.message}`)
      else campaignMsg.setMessage("❌ Could not add to campaign.")
    } finally {
      setIsAddingToCampaign(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getFullName = (c: Contact) => [c.firstName, c.lastName].filter(Boolean).join(" ") || "—"

  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Contact not found.</p>
        <Link href="/contacts"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    )
  }

  const fullName    = getFullName(contact)
  const accountName = getContactAccountName(contact)
  const accountId   = getContactAccountId(contact)
  const initials    = [contact.firstName?.[0], contact.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"
  const domainColor = contact.functionalDomain
    ? DOMAIN_COLORS[contact.functionalDomain] ?? "bg-gray-50 text-gray-700 border-gray-200"
    : ""
  const linkedCampaigns = (contact.campaignIds || []) as Campaign[]

  return (
    <div className="p-6 space-y-6">

      {/* ── Back button ── */}
      <Link href="/contacts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to contacts
      </Link>

      {/* ── Contact Header Card ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white text-2xl font-bold">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  {contact.isPrimary && (
                    <Badge className="bg-primary text-white">
                      <Sparkles className="h-3 w-3 mr-1" />Primary
                    </Badge>
                  )}
                </div>
                {/* Role */}
                {contact.standardizedRoles && (
                  <p className="text-muted-foreground mt-0.5">{contact.standardizedRoles}</p>
                )}
                {/* Account link */}
                {accountName && accountId && (
                  <Link href={`/accounts/${accountId}`}
                    className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />{accountName}
                  </Link>
                )}
                {accountName && !accountId && (
                  <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />{accountName}
                  </p>
                )}
                {/* Domain badge */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {contact.functionalDomain && (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${domainColor}`}>
                      {contact.functionalDomain}
                    </span>
                  )}
                  {contact.keyFocusAreas && (
                    <Badge variant="outline" className="text-xs">{contact.keyFocusAreas}</Badge>
                  )}
                  {contact.source && (
                    <Badge variant="outline" className="capitalize text-xs">Source: {contact.source}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {contact.email && (
                <Button variant="outline" className="gap-2" asChild>
                  <a href={`mailto:${contact.email}`}><Mail className="h-4 w-4" />Email</a>
                </Button>
              )}
              {getLinkedInUrl(contact.linkedIn) && (
                <Button variant="outline" className="gap-2" asChild>
                  <a href={getLinkedInUrl(contact.linkedIn)!} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />LinkedIn
                  </a>
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />Edit
              </Button>
              {/* Save to Campaign */}
              <Button className="gap-2" onClick={handleOpenCampaignModal}>
                <Save className="h-4 w-4" />Save to Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left — Contact Details ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Primary Email</p>
                    {contact.email
                      ? <a href={`mailto:${contact.email}`} className="text-primary hover:underline font-medium">{contact.email}</a>
                      : <span className="text-muted-foreground">—</span>}
                  </div>
                </div>

                {/* Secondary Email */}
                {contact.secondaryEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Secondary Email</p>
                      <a href={`mailto:${contact.secondaryEmail}`} className="text-primary hover:underline font-medium">
                        {contact.secondaryEmail}
                      </a>
                    </div>
                  </div>
                )}

                {/* Primary Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Primary Phone</p>
                    <span className="font-medium">
                      {contact.primaryPhone
                        ? `${contact.primaryPhone}${contact.primaryPhoneExtension ? ` ext. ${contact.primaryPhoneExtension}` : ""}`
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Mobile */}
                {contact.primaryMobNo && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mobile</p>
                      <span className="font-medium">{contact.primaryMobNo}</span>
                    </div>
                  </div>
                )}

                {/* Secondary Phone */}
                {contact.secondaryPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Secondary Phone</p>
                      <span className="font-medium">
                        {contact.secondaryPhone}
                        {contact.secondaryPhoneExtension ? ` ext. ${contact.secondaryPhoneExtension}` : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* LinkedIn */}
                <div className="flex items-start gap-3">
                  <Linkedin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                    {(() => {
                      const linkedInUrl = getLinkedInUrl(contact.linkedIn)
                      return linkedInUrl ? (
                        <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium truncate block max-w-[200px]">
                          View Profile
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    })()}
                  </div>
                </div>

                {/* Twitter */}
                {contact.twitterUrl && (
                  <div className="flex items-start gap-3">
                    <Twitter className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Twitter</p>
                      <a href={contact.twitterUrl} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium">View Profile</a>
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <span className="font-medium">
                      {[contact.city, contact.state, contact.country].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>

                {/* Time Zone */}
                {contact.timeZone && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Time Zone</p>
                      <span className="font-medium">{contact.timeZone}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role & Domain */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">Role & Expertise</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Functional Domain</p>
                  {contact.functionalDomain ? (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${domainColor}`}>
                      {contact.functionalDomain}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Key Focus Areas</p>
                  <p className="font-medium">{contact.keyFocusAreas || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Standardized Roles</p>
                  <p className="font-medium">{contact.standardizedRoles || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Campaigns ({linkedCampaigns.length})</h2>
                <Button size="sm" className="gap-2" onClick={handleOpenCampaignModal}>
                  <Plus className="h-4 w-4" />Add to Campaign
                </Button>
              </div>
              {linkedCampaigns.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">No campaigns available yet.</p>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenCampaignModal}>
                    <Plus className="h-4 w-4" />Save to Campaign
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {linkedCampaigns.map((camp, i) => {
                    const campObj = typeof camp === "object" ? camp : { _id: camp, name: camp, status: "" }
                    return (
                      <div key={i} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">{campObj.status || "active"}</Badge>
                          <span className="text-sm font-medium">{campObj.name || "Campaign"}</span>
                        </div>
                        {campObj._id && (
                          <Link href={`/campaigns/${campObj._id}`}>
                            <Button variant="ghost" size="sm">View →</Button>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Account Card */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />Account
              </h2>
              {accountName ? (
                <div>
                  <p className="font-medium">{accountName}</p>
                  {typeof contact.accountId === "object" && contact.accountId !== null && (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      {(contact.accountId as Prospect).primaryIndustry && (
                        <p>{(contact.accountId as Prospect).primaryIndustry}</p>
                      )}
                      {(contact.accountId as Prospect).country && (
                        <p>{(contact.accountId as Prospect).country}</p>
                      )}
                    </div>
                  )}
                  {accountId && (
                    <Link href={`/accounts/${accountId}`}>
                      <Button variant="outline" className="w-full mt-3 text-sm gap-2">
                        <Globe className="h-4 w-4" />View Account
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No account is linked.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Quick Info</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Source",    value: contact.source },
                  { label: "Added On",  value: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : undefined },
                  { label: "Updated",   value: contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : undefined },
                  { label: "Campaigns", value: linkedCampaigns.length > 0 ? `${linkedCampaigns.length} campaign(s)` : "None" },
                  { label: "Primary",   value: contact.isPrimary ? "Yes" : "No" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{value ?? "—"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save to Campaign shortcut */}


          {/* <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Save className="h-4 w-4 text-primary" />Save to Campaign
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Add this contact to a campaign for targeted outreach.
              </p>
              <Button className="w-full gap-2" onClick={handleOpenCampaignModal}>
                <Plus className="h-4 w-4" />Select Campaign
              </Button>
            </CardContent>
          </Card> */}


        </div>
      </div>

      {/* ── Edit Modal ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogDescription className="sr-only">Edit contact details.</DialogDescription>
          <DialogHeader><DialogTitle>Edit — {fullName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input value={editData.firstName} onChange={e => setEditData(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input value={editData.lastName} onChange={e => setEditData(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Functional Domain</Label>
              <Select value={editData.functionalDomain} onValueChange={v => setEditData(p => ({ ...p, functionalDomain: v }))}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {FUNCTIONAL_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Key Focus Areas</Label>
              <Input value={editData.keyFocusAreas} onChange={e => setEditData(p => ({ ...p, keyFocusAreas: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Standardized Roles</Label>
                <Input value={editData.standardizedRoles} onChange={e => setEditData(p => ({ ...p, standardizedRoles: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Seniority</Label>
                <Select value={editData.seniority} onValueChange={v => setEditData(p => ({ ...p, seniority: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select seniority" /></SelectTrigger>
                  <SelectContent>
                    {["C-Level","VP","Director","Manager","Senior","Mid-Level","Junior","Entry-Level"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Secondary Email</Label>
                <Input type="email" value={editData.secondaryEmail} onChange={e => setEditData(p => ({ ...p, secondaryEmail: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Primary Phone</Label>
                <Input value={editData.primaryPhone} onChange={e => setEditData(p => ({ ...p, primaryPhone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input value={editData.primaryMobNo} onChange={e => setEditData(p => ({ ...p, primaryMobNo: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>LinkedIn</Label>
                <Input value={editData.linkedIn} onChange={e => setEditData(p => ({ ...p, linkedIn: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Twitter</Label>
                <Input value={editData.twitterUrl} onChange={e => setEditData(p => ({ ...p, twitterUrl: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={editData.country} onChange={e => setEditData(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={editData.state} onChange={e => setEditData(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={editData.city} onChange={e => setEditData(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Time Zone</Label>
                <Input value={editData.timeZone} onChange={e => setEditData(p => ({ ...p, timeZone: e.target.value }))} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={editData.isPrimary}
                    onCheckedChange={v => setEditData(p => ({ ...p, isPrimary: !!v }))} />
                  <span className="text-sm font-medium">Primary Contact</span>
                </label>
              </div>
            </div>

            {saveMsg.visible && (
              <AutoDismissBanner {...saveMsg} onDismiss={saveMsg.clearMessage} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Save to Campaign Modal ── */}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">Add to campaign.</DialogDescription>
          <DialogHeader><DialogTitle>Save to Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{fullName}</span> should be added to which campaign?
            </p>
            <div className="space-y-1">
              <Label>Select a Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger><SelectValue placeholder="Select campaign..." /></SelectTrigger>
                <SelectContent>
                  {campaigns.length === 0
                    ? <SelectItem value="none" disabled>No campaigns available</SelectItem>
                    : campaigns.map(c => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name} — <span className="capitalize text-muted-foreground">{c.status}</span>
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            {campaignMsg.visible && (
              <AutoDismissBanner
                {...campaignMsg}
                className="flex items-center gap-2"
                onDismiss={campaignMsg.clearMessage}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
            <Button onClick={handleAddToCampaign} disabled={isAddingToCampaign || !selectedCampaignId} className="gap-2">
              {isAddingToCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAddingToCampaign ? "Adding..." : "Save to Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
