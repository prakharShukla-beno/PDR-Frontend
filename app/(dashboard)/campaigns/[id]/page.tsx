"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Search, Plus, X, Users, Building2,
  Mail, Phone, Linkedin, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import type { Campaign, Contact } from "@/types"
import { useAutoDismissMessage } from "@/hooks/useAutoDismissMessage"
import { AutoDismissBanner } from "@/components/ui/auto-dismiss-banner"
import { useConfirmDialog } from "@/hooks/useConfirmDialog"

const DOMAIN_COLORS: Record<string, string> = {
  "Technology & Digital":      "bg-blue-50 text-blue-700 border-blue-200",
  "Corporate Strategy":        "bg-purple-50 text-purple-700 border-purple-200",
  "Data & AI":                 "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Finance & Accounting":      "bg-green-50 text-green-700 border-green-200",
  "Revenue & Growth":          "bg-orange-50 text-orange-700 border-orange-200",
  "People & HR":               "bg-rose-50 text-rose-700 border-rose-200",
  "Operations & Logistics":    "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Healthcare & Life Sciences":"bg-emerald-50 text-emerald-700 border-emerald-200",
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { showConfirm, ConfirmDialogHost } = useConfirmDialog()

  const [campaign, setCampaign]           = useState<Campaign | null>(null)
  const [isLoading, setIsLoading]         = useState(true)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [contactSearch, setContactSearch] = useState("")
  const [industryFilter, setIndustryFilter] = useState("")
  const [domainFilter, setDomainFilter]   = useState("")
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching]     = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isAdding, setIsAdding]           = useState(false)
  const [industries, setIndustries]       = useState<string[]>([])
  const [functionalDomains, setFunctionalDomains] = useState<string[]>([])

  // ── Bulk selection on the main "Contacts in Campaign" table ────────────────
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [isBulkRemoving, setIsBulkRemoving] = useState(false)

  // ── Basic filter for the main table (client-side — contacts already loaded) ─
  const [tableSearch, setTableSearch]   = useState("")
  const [tableDomain, setTableDomain]   = useState("")
  const [tableIndustry, setTableIndustry] = useState("")

  const fetchCampaign = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>(`/campaigns/${id}`)
      setCampaign(res.data || res)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCampaign() }, [fetchCampaign])

  const addMsg = useAutoDismissMessage({
    onAutoDismiss: () => {
      setShowAddModal(false)
      fetchCampaign()
    },
  })

  // Load filter options when modal opens
  useEffect(() => {
    if (!showAddModal) return
    api.get<any>("/search/filters").then(res => {
      setIndustries(res.data?.industries || [])
      setFunctionalDomains(res.data?.functionalDomains || [])
    }).catch(() => {})
  }, [showAddModal])

  // Search contacts with debounce
  useEffect(() => {
    if (!showAddModal) return
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        let url = `/search/contacts?limit=20&isLinked=true`
        if (contactSearch) url += `&search=${encodeURIComponent(contactSearch)}`
        if (industryFilter) url += `&accountIndustryInclude[]=${encodeURIComponent(industryFilter)}`
        if (domainFilter)   url += `&functionalDomainInclude[]=${encodeURIComponent(domainFilter)}`

        const res = await api.get<any>(url)
        const contacts = Array.isArray(res.data) ? res.data : (res.data?.contacts || res.contacts || [])
        // Remove contacts already in campaign
        const existingIds = new Set(
          ((campaign?.contactIds || []) as any[]).map((c: any) =>
            typeof c === "string" ? c : c._id
          )
        )
        setSearchResults(contacts.filter((c: Contact) => !existingIds.has(c._id)))
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [contactSearch, industryFilter, domainFilter, showAddModal, campaign])

  const handleAddContacts = async () => {
    if (!selectedContacts.length) return
    setIsAdding(true); addMsg.clearMessage()
    try {
      await api.post(`/campaigns/${id}/contacts`, { contactIds: selectedContacts })
      addMsg.setMessage(`✅ ${selectedContacts.length} contact(s) added!`)
      setSelectedContacts([])
    } catch (err) {
      if (err instanceof ApiError) addMsg.setMessage(`❌ ${err.message}`)
    } finally { setIsAdding(false) }
  }

  const handleRemoveContact = (contactId: string) => {
    showConfirm({
      title: "Remove contact?",
      message: "This contact will be removed from the campaign. The contact record itself will not be deleted.",
      confirmLabel: "Remove",
      variant: "warning",
      onConfirm: async () => {
        try {
          await api.delete(`/campaigns/${id}/contacts/${contactId}`)
          fetchCampaign()
        } catch {
          alert("Could not remove contact.")
        }
      },
    })
  }

  // ── Bulk remove — selected rows from the main table ───────────────────────
  const handleBulkRemove = () => {
    if (!selectedContactIds.length) return
    showConfirm({
      title: "Remove contacts?",
      message: `${selectedContactIds.length} contact(s) will be removed from this campaign. The contact records themselves will not be deleted.`,
      confirmLabel: "Remove",
      variant: "warning",
      onConfirm: async () => {
        setIsBulkRemoving(true)
        try {
          await Promise.all(
            selectedContactIds.map(cid => api.delete(`/campaigns/${id}/contacts/${cid}`))
          )
          setSelectedContactIds([])
          fetchCampaign()
        } catch {
          alert("Could not remove some contacts.")
        } finally {
          setIsBulkRemoving(false)
        }
      },
    })
  }

  const getFullName    = (c: Contact) => [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown"
  const getAccountName = (c: Contact) =>
    typeof c.accountId === "object" && c.accountId
      ? (c.accountId as any).accountName : c.accountName || "—"

  const contacts = ((campaign?.contactIds || []) as Contact[])

  // ── Filter options — derived from contacts already in this campaign ────────
  const tableDomainOptions   = [...new Set(contacts.map(c => c.functionalDomain).filter(Boolean))] as string[]
  const tableIndustryOptions = [...new Set(contacts.map(c => (c as any).accountIndustry).filter(Boolean))] as string[]

  const filteredContacts = contacts.filter((c) => {
    if (tableDomain   && c.functionalDomain !== tableDomain) return false
    if (tableIndustry && (c as any).accountIndustry !== tableIndustry) return false
    if (tableSearch) {
      const q = tableSearch.toLowerCase()
      const name  = getFullName(c).toLowerCase()
      const email = (c.email || "").toLowerCase()
      const role  = (c.standardizedRoles || "").toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !role.includes(q)) return false
    }
    return true
  })

  const allPageSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.includes(c._id))
  const hasBulkSelection = selectedContactIds.length > 0

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!campaign) return (
    <div className="flex h-full items-center justify-center flex-col gap-3">
      <p className="text-muted-foreground">Campaign not found</p>
      <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* Page header */}
      <div className="p-6 border-b flex-shrink-0">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />Back to Campaigns
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            {campaign.description && <p className="text-muted-foreground mt-1">{campaign.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={campaign.status === "active" ? "default" : campaign.status === "completed" ? "secondary" : "outline"}>
                {campaign.status}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />{contacts.length} contacts
              </span>
            </div>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />Add Contacts
          </Button>
        </div>
      </div>

      {/* Contacts table */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">Contacts in Campaign</h2>
            <span className="text-xs text-muted-foreground">
              {contacts.length} total
              {hasBulkSelection && (
                <span className="ml-2">• <span className="text-foreground font-medium">{selectedContactIds.length} selected</span></span>
              )}
            </span>
          </div>
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">No contacts added yet</p>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Contacts
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <Checkbox
                      checked={allPageSelected}
                      ref={(el) => { if (el) { const input = el.querySelector('input'); if (input) input.indeterminate = hasBulkSelection && !allPageSelected } }}
                      onCheckedChange={() => {
                        if (allPageSelected) setSelectedContactIds([])
                        else setSelectedContactIds(contacts.map(c => c._id))
                      }} />
                  </th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Domain</th>
                  <th className="p-4">Industry</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">LinkedIn</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contacts.map((contact: Contact) => {
                  const fullName    = getFullName(contact)
                  const accountName = getAccountName(contact)
                  const initials    = [contact.firstName?.[0], contact.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"
                  const domainColor = contact.functionalDomain
                    ? DOMAIN_COLORS[contact.functionalDomain] ?? "bg-gray-50 text-gray-700 border-gray-200" : ""
                  return (
                    <tr key={contact._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <Checkbox checked={selectedContactIds.includes(contact._id)}
                          onCheckedChange={() => setSelectedContactIds(ids =>
                            ids.includes(contact._id) ? ids.filter(i => i !== contact._id) : [...ids, contact._id]
                          )} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">{initials}</div>
                          <div>
                            <Link href={`/contacts/${contact._id}`}
                              className="font-medium text-sm hover:text-primary hover:underline">
                              {fullName}
                            </Link>
                            <div className="text-xs text-muted-foreground">{contact.standardizedRoles || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{accountName}</div>
                      </td>
                      <td className="p-4">
                        {contact.functionalDomain ? (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${domainColor}`}>
                            {contact.functionalDomain}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{contact.accountIndustry || "—"}</td>
                      <td className="p-4">
                        {contact.email
                          ? <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline"><Mail className="h-3 w-3" />{contact.email}</a>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{contact.primaryPhone || contact.primaryMobNo || "—"}</td>
                      <td className="p-4">
                        {contact.linkedIn
                          ? <a href={contact.linkedIn} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700"><Linkedin className="h-4 w-4" /></a>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveContact(contact._id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="h-20" />
      </div>

      {/* ── Bulk action bar — appears once contacts exist ───────────────────── */}
      {contacts.length > 0 && (
        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-between z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="sm"
              className={`gap-2 ${hasBulkSelection ? "text-destructive hover:text-destructive" : "text-muted-foreground/40"}`}
              disabled={!hasBulkSelection || isBulkRemoving}
              onClick={handleBulkRemove}
            >
              {isBulkRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              REMOVE
            </Button>
          </div>
          <Button
            variant={allPageSelected ? "default" : "outline"}
            size="sm"
            className={allPageSelected ? "bg-primary text-white" : ""}
            onClick={() => setSelectedContactIds(allPageSelected ? [] : contacts.map(c => c._id))}
          >
            {allPageSelected ? `✓ All ${contacts.length} Selected` : "Select All"}
          </Button>
        </div>
      )}

      {/* Add Contacts Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open)
        if (!open) { setContactSearch(""); setIndustryFilter(""); setDomainFilter(""); setSelectedContacts([]); setSearchResults([]); addMsg.clearMessage() }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogDescription className="sr-only">Search and add contacts to this campaign.</DialogDescription>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Contacts to Campaign</DialogTitle>
            <p className="text-sm text-muted-foreground">Filter by industry and domain to find the right contacts.</p>
          </DialogHeader>

          {/* Search and filter row */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, email, role..." className="pl-9"
                value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
            </div>
            <Select value={industryFilter || "all"} onValueChange={v => setIndustryFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Industries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={domainFilter || "all"} onValueChange={v => setDomainFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Domains" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {functionalDomains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Selected count banner */}
          {selectedContacts.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex-shrink-0">
              <span className="text-sm font-medium text-primary">{selectedContacts.length} contact(s) selected</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedContacts([])}>Clear</Button>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-0">
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Searching...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                <Users className="h-8 w-8 opacity-30" />
                <p className="text-sm">No contacts found. Try different filters.</p>
              </div>
            ) : searchResults.map((contact) => {
              const isSelected  = selectedContacts.includes(contact._id)
              const fullName    = getFullName(contact)
              const accName     = getAccountName(contact)
              const initials    = [contact.firstName?.[0], contact.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"
              return (
                <div key={contact._id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                  onClick={() => setSelectedContacts(ids =>
                    ids.includes(contact._id) ? ids.filter(i => i !== contact._id) : [...ids, contact._id]
                  )}>
                  <Checkbox checked={isSelected} onCheckedChange={() => {}} className="flex-shrink-0" />
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{fullName}</span>
                      {contact.isPrimary && <Badge variant="outline" className="text-xs h-4 px-1">Primary</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{contact.standardizedRoles || "—"} {contact.functionalDomain ? `· ${contact.functionalDomain}` : ""}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-xs font-medium"><Building2 className="h-3 w-3 text-muted-foreground" />{accName}</div>
                    <div className="text-xs text-muted-foreground">{contact.accountIndustry || "—"}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {contact.hasEmail    && <Mail     className="h-3.5 w-3.5 text-green-500" />}
                    {contact.hasPhone    && <Phone    className="h-3.5 w-3.5 text-blue-500" />}
                    {contact.hasLinkedIn && <Linkedin className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                </div>
              )
            })}
          </div>

          {addMsg.visible && (
            <AutoDismissBanner {...addMsg} className="flex-shrink-0" onDismiss={addMsg.clearMessage} />
          )}

          <div className="flex justify-between items-center pt-2 flex-shrink-0 border-t">
            <span className="text-xs text-muted-foreground">{searchResults.length} contacts found</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90 gap-2"
                disabled={selectedContacts.length === 0 || isAdding}
                onClick={handleAddContacts}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isAdding ? "Adding..." : `Add ${selectedContacts.length || ""} Contact${selectedContacts.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {ConfirmDialogHost}
    </div>
  )
}
