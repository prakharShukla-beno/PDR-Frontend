"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Search, Upload, Plus, X, Pencil, SlidersHorizontal,
  ChevronLeft, ChevronRight, Loader2, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { api, ApiError } from "@/lib/api"
import type { Contact, Prospect } from "@/types"
import { FilterPanel, FilterState, EMPTY_FILTERS, buildFilterQuery, countActiveFilters } from "@/components/filters/FilterPanel"

const FUNCTIONAL_DOMAINS = [
  "Corporate Strategy","Technology & Digital","Data & AI","Finance & Accounting",
  "Revenue & Growth","Product & Creative","Operations & Logistics","People & HR",
  "Legal & Governance","Healthcare & Life Sciences","Industrial & Engineering",
  "Resources & Utilities","Public Sector & NGO",
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

export default function ContactsPage() {
  const [contacts, setContacts]         = useState<Contact[]>([])
  const [total, setTotal]               = useState(0)
  const [totalPages, setTotalPages]     = useState(1)
  const [isLoading, setIsLoading]       = useState(true)
  const [search, setSearch]             = useState("")
  const [showFilters, setShowFilters]   = useState(false)
  const [filters, setFilters]           = useState<FilterState>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [currentPage, setCurrentPage]   = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [uploadFile, setUploadFile]     = useState<File | null>(null)
  const [isUploading, setIsUploading]   = useState(false)
  const [uploadMsg, setUploadMsg]       = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAdding, setIsAdding]         = useState(false)
  const [addMsg, setAddMsg]             = useState("")
  const [accountSearch, setAccountSearch]   = useState("")
  const [accountOptions, setAccountOptions] = useState<Prospect[]>([])
  const [isSearchingAccounts, setIsSearchingAccounts] = useState(false)

  const activeCount = countActiveFilters(appliedFilters)

  const emptyContact = {
    accountId: "", accountName: "", firstName: "", lastName: "",
    functionalDomain: "", keyFocusAreas: "", standardizedRoles: "",
    email: "", secondaryEmail: "", primaryPhone: "", secondaryPhone: "",
    primaryMobNo: "", linkedIn: "", twitterUrl: "",
    country: "", state: "", city: "", timeZone: "", isPrimary: false,
  }
  const [newContact, setNewContact] = useState(emptyContact)

  // ── Fetch contacts ────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setIsLoading(true)
    try {
      const filterQuery = buildFilterQuery(appliedFilters, "contacts")
      const hasFilters  = filterQuery.length > 0 || search

      let url: string
      if (hasFilters) {
        url = `/search/contacts?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${recordsPerPage}`
        if (filterQuery) url += `&${filterQuery}`
      } else {
        url = `/contacts?page=${currentPage}&limit=${recordsPerPage}`
      }

      const res = await api.get<any>(url)
      setContacts(res.data?.contacts || res.data || res.contacts || [])
      setTotal(res.data?.pagination?.total || res.pagination?.total || 0)
      setTotalPages(res.data?.pagination?.totalPages || res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Contacts fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, recordsPerPage, search, appliedFilters])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { setCurrentPage(1) }, [search, appliedFilters, recordsPerPage])

  // ── Account search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accountSearch.trim()) { setAccountOptions([]); return }
    const timer = setTimeout(async () => {
      setIsSearchingAccounts(true)
      try {
        const res = await api.get<any>(`/search/prospects?search=${encodeURIComponent(accountSearch)}&limit=8`)
        setAccountOptions(res.data?.prospects || res.prospects || [])
      } catch { setAccountOptions([]) }
      finally { setIsSearchingAccounts(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [accountSearch])

  // ── Active filter chips ────────────────────────────────────────────────────
  const getActiveChips = () => {
    const chips: { label: string; onRemove: () => void }[] = []
    const f = appliedFilters
    const rem = (key: keyof FilterState, val: string) =>
      setAppliedFilters(p => ({ ...p, [key]: (p[key] as string[]).filter(v => v !== val) }))

    f.industryInclude.forEach(v => chips.push({ label: `Industry: ${v}`,      onRemove: () => rem("industryInclude", v) }))
    f.industryExclude.forEach(v => chips.push({ label: `NOT Industry: ${v}`,  onRemove: () => rem("industryExclude", v) }))
    f.countryInclude.forEach(v  => chips.push({ label: `Country: ${v}`,       onRemove: () => rem("countryInclude", v) }))
    f.countryExclude.forEach(v  => chips.push({ label: `NOT Country: ${v}`,   onRemove: () => rem("countryExclude", v) }))
    f.functionalDomainInclude.forEach(v => chips.push({ label: `Domain: ${v}`,     onRemove: () => rem("functionalDomainInclude", v) }))
    f.functionalDomainExclude.forEach(v => chips.push({ label: `NOT Domain: ${v}`, onRemove: () => rem("functionalDomainExclude", v) }))
    if (f.hasPhone   === true)  chips.push({ label: "Has Phone",    onRemove: () => setAppliedFilters(p => ({ ...p, hasPhone: null })) })
    if (f.hasEmail   === true)  chips.push({ label: "Has Email",    onRemove: () => setAppliedFilters(p => ({ ...p, hasEmail: null })) })
    if (f.hasLinkedIn=== true)  chips.push({ label: "Has LinkedIn", onRemove: () => setAppliedFilters(p => ({ ...p, hasLinkedIn: null })) })
    if (f.isLinked   === true)  chips.push({ label: "Linked",       onRemove: () => setAppliedFilters(p => ({ ...p, isLinked: null })) })
    if (f.isLinked   === false) chips.push({ label: "Unlinked",     onRemove: () => setAppliedFilters(p => ({ ...p, isLinked: null })) })
    return chips
  }

  const handleDelete = async () => {
    if (!selectedIds.length || !confirm(`Do you want to delete ${selectedIds.length} selected contact(s)?`)) return
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/contacts/${id}`)))
      setSelectedIds([]); fetchContacts()
    } catch { alert("Delete failed.") }
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true); setUploadMsg("")
    try {
      const formData = new FormData(); formData.append("file", uploadFile)
      await api.upload<any>("/import/contacts", formData)
      setUploadMsg("✅ Import started. You will be notified when it completes.")
      setUploadFile(null)
      setTimeout(fetchContacts, 2000)
    } catch (err) {
      if (err instanceof ApiError) setUploadMsg(`❌ ${err.message}`)
      else setUploadMsg("❌ Upload failed.")
    } finally { setIsUploading(false) }
  }

  const handleAddContact = async () => {
    if (!newContact.accountId) { setAddMsg("❌ Selecting an account is required."); return }
    setIsAdding(true); setAddMsg("")
    try {
      const payload: any = { ...newContact }
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k] })
      delete payload.accountName
      await api.post("/contacts", payload)
      setAddMsg("✅ Contact created successfully!")
      setTimeout(() => {
        setShowAddModal(false); setAddMsg(""); setNewContact(emptyContact)
        setAccountSearch(""); setAccountOptions([]); fetchContacts()
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) setAddMsg(`❌ ${err.message}`)
    } finally { setIsAdding(false) }
  }

  const allPageSelected = contacts.length > 0 && contacts.every(c => selectedIds.includes(c._id))
  const hasSelection    = selectedIds.length > 0
  const chips           = getActiveChips()

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 6) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
      pages.push(1, 2, 3)
      if (currentPage > 4) pages.push("...")
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
      if (currentPage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const getFullName    = (c: Contact) => [c.firstName, c.lastName].filter(Boolean).join(" ") || "—"
  const getAccountName = (c: Contact) =>
    typeof c.accountId === "object" && c.accountId !== null
      ? (c.accountId as Prospect).accountName : c.accountName || "—"

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="p-6 pb-0 space-y-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Master View</p>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-sm text-muted-foreground">{total} contacts</p>
          </div>
          <div className="flex gap-3">
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadMsg("") } }} />
              <Button variant="outline" className="gap-2" asChild><span><Upload className="h-4 w-4" />Import</span></Button>
            </label>
            {uploadFile && (
              <Button variant="outline" className="gap-2 text-primary border-primary" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload: {uploadFile.name.slice(0, 15)}...
              </Button>
            )}
            <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />Add Contact
            </Button>
          </div>
        </div>

        {uploadMsg && <div className="text-sm px-3 py-2 rounded-lg border">{uploadMsg}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, role..." className="pl-9 bg-white"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className={`gap-2 bg-white ${activeCount > 0 ? "border-primary text-primary" : ""}`}
            onClick={() => { setFilters(appliedFilters); setShowFilters(true) }}>
            <SlidersHorizontal className="h-4 w-4" />Filters
            {activeCount > 0 && <Badge className="bg-primary text-white text-xs h-4 w-4 p-0 flex items-center justify-center">{activeCount}</Badge>}
          </Button>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={() => setAppliedFilters(EMPTY_FILTERS)}>
              <X className="h-3 w-3" />Clear all
            </Button>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                {chip.label}
                <button onClick={chip.onRemove}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-10">
                  <Checkbox checked={allPageSelected}
                    onCheckedChange={() => {
                      if (allPageSelected) setSelectedIds(ids => ids.filter(id => !contacts.map(c => c._id).includes(id)))
                      else { const n = [...selectedIds]; contacts.forEach(c => { if (!n.includes(c._id)) n.push(c._id) }); setSelectedIds(n) }
                    }} />
                </th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium">Domain</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-muted rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Users className="h-10 w-10 opacity-30" />
                      <p>{activeCount > 0 ? "No contacts match the filter criteria." : "No contacts available."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const fullName    = getFullName(contact)
                  const accountName = getAccountName(contact)
                  const initials    = [contact.firstName?.[0], contact.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"
                  const domainColor = contact.functionalDomain
                    ? DOMAIN_COLORS[contact.functionalDomain] ?? "bg-gray-50 text-gray-700 border-gray-200" : ""
                  return (
                    <tr key={contact._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <Checkbox checked={selectedIds.includes(contact._id)}
                          onCheckedChange={() => setSelectedIds(ids => ids.includes(contact._id) ? ids.filter(i => i !== contact._id) : [...ids, contact._id])} />
                      </td>
                      <td className="p-4">
                        <Link href={`/contacts/${contact._id}`} className="flex items-center gap-3 hover:underline group">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">{fullName}</div>
                            {contact.isPrimary && <span className="text-xs text-primary font-medium">Primary</span>}
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{accountName}</td>
                      <td className="p-4">
                        {contact.functionalDomain ? (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${domainColor}`}>
                            {contact.functionalDomain}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-sm max-w-[160px]">
                        <span className="truncate block" title={contact.standardizedRoles}>{contact.standardizedRoles || "—"}</span>
                      </td>
                      <td className="p-4 text-sm">
                        {contact.email ? <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a> : "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{contact.primaryPhone || contact.primaryMobNo || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{[contact.city, contact.country].filter(Boolean).join(", ") || "—"}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-md border bg-white px-2.5 py-1 text-xs font-medium capitalize">
                          {contact.source || "manual"}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between py-4">
          <span className="text-sm text-muted-foreground">TOTAL: <span className="text-primary font-medium">{total} contacts</span></span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? <span key={`d${i}`} className="px-1 text-muted-foreground">...</span> :
              <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm"
                className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-white" : ""}`}
                onClick={() => setCurrentPage(Number(page))}>{page}</Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            <Select value={recordsPerPage.toString()} onValueChange={(v) => setRecordsPerPage(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 bg-white ml-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="h-20" />
      </div>

      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-center gap-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50"}`} disabled={!hasSelection} onClick={handleDelete}>
          <X className="h-4 w-4" />DELETE
        </Button>
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50"}`} disabled={!hasSelection}>
          <Pencil className="h-4 w-4" />EDIT
        </Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>ADD TO CAMPAIGN</Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>SEND EMAIL</Button>
        <div className="flex items-center gap-2 ml-4 border-l pl-4">
          <Checkbox
            checked={selectedIds.length === total && total > 0}
            onCheckedChange={() => selectedIds.length === total ? setSelectedIds([]) : setSelectedIds(contacts.map(c => c._id))}
          />
          <span className="text-sm font-medium">SELECT ALL</span>
        </div>
      </div>

      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
        onApply={() => setAppliedFilters(filters)}
        mode="contacts"
      />

      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open)
        if (!open) { setNewContact(emptyContact); setAccountSearch(""); setAccountOptions([]) }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogDescription className="sr-only">Create a new contact.</DialogDescription>
          <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Account <span className="text-destructive">*</span></Label>
              {newContact.accountId ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/30">
                  <span className="text-sm font-medium">{newContact.accountName}</span>
                  <Button variant="ghost" size="sm" onClick={() => setNewContact(p => ({ ...p, accountId: "", accountName: "" }))}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search account name..." className="pl-9"
                    value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} />
                  {(accountOptions.length > 0 || isSearchingAccounts) && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-white shadow-lg">
                      {isSearchingAccounts ? (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Searching...</div>
                      ) : accountOptions.map(acc => (
                        <button key={acc._id} className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm"
                          onClick={() => { setNewContact(p => ({ ...p, accountId: acc._id, accountName: acc.accountName })); setAccountSearch(""); setAccountOptions([]) }}>
                          <div className="font-medium">{acc.accountName}</div>
                          <div className="text-xs text-muted-foreground">{[acc.primaryIndustry, acc.country].filter(Boolean).join(" · ")}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>First Name</Label>
                <Input placeholder="John" value={newContact.firstName} onChange={e => setNewContact(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Last Name</Label>
                <Input placeholder="Doe" value={newContact.lastName} onChange={e => setNewContact(p => ({ ...p, lastName: e.target.value }))} /></div>
            </div>

            <div className="space-y-1"><Label>Functional Domain</Label>
              <Select value={newContact.functionalDomain} onValueChange={v => setNewContact(p => ({ ...p, functionalDomain: v }))}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>{FUNCTIONAL_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1"><Label>Standardized Roles</Label>
              <Input placeholder="e.g. CTO, VP Engineering" value={newContact.standardizedRoles}
                onChange={e => setNewContact(p => ({ ...p, standardizedRoles: e.target.value }))} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Email</Label>
                <Input placeholder="john@company.com" type="email" value={newContact.email}
                  onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Primary Phone</Label>
                <Input placeholder="+91-9876543210" value={newContact.primaryPhone}
                  onChange={e => setNewContact(p => ({ ...p, primaryPhone: e.target.value }))} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>LinkedIn</Label>
                <Input placeholder="linkedin.com/in/..." value={newContact.linkedIn}
                  onChange={e => setNewContact(p => ({ ...p, linkedIn: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Country</Label>
                <Input placeholder="India" value={newContact.country}
                  onChange={e => setNewContact(p => ({ ...p, country: e.target.value }))} /></div>
            </div>

            {addMsg && <div className="text-sm px-3 py-2 rounded-lg border">{addMsg}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddContact} disabled={isAdding} className="gap-2">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAdding ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
