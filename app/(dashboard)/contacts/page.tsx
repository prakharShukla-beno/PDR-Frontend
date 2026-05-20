"use client"

// ─────────────────────────────────────────────
// Contacts Page — Master View
// APIs:
//   GET    /api/contacts                → list + pagination
//   POST   /api/contacts                → new contact create
//   DELETE /api/contacts/:id            → delete
//   POST   /api/import/contacts         → Excel/CSV upload
// ─────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Search, Upload, Plus, X, Pencil,
  ChevronLeft, ChevronRight, Loader2, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { api, ApiError } from "@/lib/api"
import type { Contact, Prospect } from "@/types"

// ── Constants ─────────────────────────────────────────────────────────────────
const FUNCTIONAL_DOMAINS = [
  "Corporate Strategy",
  "Technology & Digital",
  "Data & AI",
  "Finance & Accounting",
  "Revenue & Growth",
  "Product & Creative",
  "Operations & Logistics",
  "People & HR",
  "Legal & Governance",
  "Healthcare & Life Sciences",
  "Industrial & Engineering",
  "Resources & Utilities",
  "Public Sector & NGO",
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

  // ── Data state ───────────────────────────────────────────────────────────────
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading]   = useState(true)

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("")
  const [domainFilter, setDomainFilter]   = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")

  // ── Pagination state ─────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]       = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // ── Upload state ─────────────────────────────────────────────────────────────
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMsg, setUploadMsg]   = useState("")

  // ── Add Contact modal ────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]   = useState(false)
  const [isAdding, setIsAdding]           = useState(false)
  const [addMsg, setAddMsg]               = useState("")
  const [accountSearch, setAccountSearch] = useState("")
  const [accountOptions, setAccountOptions] = useState<Prospect[]>([])
  const [isSearchingAccounts, setIsSearchingAccounts] = useState(false)

  const emptyContact = {
    accountId: "", accountName: "", firstName: "", lastName: "",
    functionalDomain: "", keyFocusAreas: "", standardizedRoles: "",
    email: "", secondaryEmail: "", primaryPhone: "", secondaryPhone: "",
    primaryMobNo: "", primaryPhoneExtension: "", secondaryPhoneExtension: "",
    linkedIn: "", twitterUrl: "", country: "", state: "", city: "",
    timeZone: "", isPrimary: false,
  }
  const [newContact, setNewContact] = useState(emptyContact)

  // ── GET /api/contacts ────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = `/contacts?page=${currentPage}&limit=${recordsPerPage}`
      if (search)                  url += `&search=${encodeURIComponent(search)}`
      if (domainFilter !== "all")  url += `&functionalDomain=${encodeURIComponent(domainFilter)}`
      if (countryFilter !== "all") url += `&country=${encodeURIComponent(countryFilter)}`

      const res = await api.get<any>(url)
      setContacts(res.data || [])
      setTotal(res.pagination?.total || 0)
      setTotalPages(res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Contacts fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, recordsPerPage, search, domainFilter, countryFilter])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { setCurrentPage(1) }, [search, domainFilter, countryFilter, recordsPerPage])

  // ── Account search (debounced) ───────────────────────────────────────────────
  useEffect(() => {
    if (!accountSearch.trim()) { setAccountOptions([]); return }
    const timer = setTimeout(async () => {
      setIsSearchingAccounts(true)
      try {
        const res = await api.get<any>(`/search/prospects?search=${encodeURIComponent(accountSearch)}&limit=8`)
        setAccountOptions(res.data?.prospects || res.prospects || [])
      } catch {
        setAccountOptions([])
      } finally {
        setIsSearchingAccounts(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [accountSearch])

  // ── DELETE ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedIds.length || !confirm(`${selectedIds.length} contact(s) delete karna chahte ho?`)) return
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/contacts/${id}`)))
      setSelectedIds([])
      fetchContacts()
    } catch {
      alert("Delete nahi ho saka.")
    }
  }

  // ── POST /api/import/contacts ─────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    setUploadMsg("")
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      await api.upload<any>("/import/contacts", formData)
      setUploadMsg("✅ Import shuru ho gaya! Notification aayegi jab complete ho.")
      setUploadFile(null)
    } catch (err) {
      if (err instanceof ApiError) setUploadMsg(`❌ ${err.message}`)
      else setUploadMsg("❌ Upload nahi ho saka.")
    } finally {
      setIsUploading(false)
    }
  }

  // ── POST /api/contacts ───────────────────────────────────────────────────────
  const handleAddContact = async () => {
    if (!newContact.accountId) { setAddMsg("❌ Account select karna zaroori hai."); return }
    if (!newContact.email && !newContact.primaryPhone) {
      setAddMsg("❌ Email ya Phone mein se ek zaroori hai."); return
    }
    setIsAdding(true)
    setAddMsg("")
    try {
      const payload: any = { ...newContact }
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k] })
      delete payload.accountName
      await api.post("/contacts", payload)
      setAddMsg("✅ Contact create ho gaya!")
      setTimeout(() => {
        setShowAddModal(false)
        setAddMsg("")
        setNewContact(emptyContact)
        setAccountSearch("")
        setAccountOptions([])
        fetchContacts()
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) setAddMsg(`❌ ${err.message}`)
      else setAddMsg("❌ Create nahi ho saka.")
    } finally {
      setIsAdding(false)
    }
  }

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allPageSelected = contacts.length > 0 && contacts.every(c => selectedIds.includes(c._id))
  const allSelected     = selectedIds.length === total && total > 0
  const hasSelection    = selectedIds.length > 0

  const toggleAll = () => {
    if (allPageSelected) {
      setSelectedIds(ids => ids.filter(id => !contacts.map(c => c._id).includes(id)))
    } else {
      const newIds = [...selectedIds]
      contacts.forEach(c => { if (!newIds.includes(c._id)) newIds.push(c._id) })
      setSelectedIds(newIds)
    }
  }

  // ── Pagination numbers ───────────────────────────────────────────────────────
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (currentPage > 4) pages.push("...")
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
      if (currentPage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const getFullName  = (c: Contact) => [c.firstName, c.lastName].filter(Boolean).join(" ") || "—"
  const getAccountName = (c: Contact) =>
    typeof c.accountId === "object" && c.accountId !== null
      ? (c.accountId as Prospect).accountName
      : "—"

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* ── Header ── */}
      <div className="p-6 pb-0 space-y-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Master View</p>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-sm text-muted-foreground">{total} of {total} contacts</p>
          </div>
          <div className="flex gap-3">
            {/* Import */}
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadMsg("") } }}
              />
              <Button variant="outline" className="gap-2" asChild>
                <span><Upload className="h-4 w-4" />Import</span>
              </Button>
            </label>
            {uploadFile && (
              <Button variant="outline" className="gap-2 text-primary border-primary"
                onClick={handleUpload} disabled={isUploading}>
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

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, role..." className="pl-9 bg-white"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="All Domains" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {FUNCTIONAL_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {["India", "USA", "UK", "UAE", "Singapore", "Australia", "Canada"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-10"><Checkbox checked={allPageSelected} onCheckedChange={toggleAll} /></th>
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
                Array.from({ length: recordsPerPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-4 bg-muted rounded" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full" />
                        <div className="h-4 w-28 bg-muted rounded" />
                      </div>
                    </td>
                    <td className="p-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-6 w-32 bg-muted rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="p-4"><div className="h-6 w-14 bg-muted rounded" /></td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Users className="h-10 w-10 opacity-30" />
                      <p>Koi contacts nahi mile.</p>
                      <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />Add First Contact
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const fullName    = getFullName(contact)
                  const accountName = getAccountName(contact)
                  const initials    = [contact.firstName?.[0], contact.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"
                  const domainColor = contact.functionalDomain
                    ? DOMAIN_COLORS[contact.functionalDomain] ?? "bg-gray-50 text-gray-700 border-gray-200"
                    : ""
                  return (
                    <tr key={contact._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.includes(contact._id)}
                          onCheckedChange={() =>
                            setSelectedIds(ids =>
                              ids.includes(contact._id)
                                ? ids.filter(i => i !== contact._id)
                                : [...ids, contact._id]
                            )
                          }
                        />
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
                        <span className="truncate block" title={contact.standardizedRoles}>
                          {contact.standardizedRoles || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {contact.email
                          ? <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                          : "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {contact.primaryPhone || contact.primaryMobNo || "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {[contact.city, contact.country].filter(Boolean).join(", ") || "—"}
                      </td>
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

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">SELECTED: <span className="font-medium">{selectedIds.length}/{total}</span></span>
            <span className="text-sm text-muted-foreground">TOTAL: <span className="text-primary font-medium">{total} contacts</span></span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? <span key={`d${i}`} className="px-1 text-muted-foreground">...</span> :
              <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm"
                className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-white" : ""}`}
                onClick={() => setCurrentPage(Number(page))}>{page}</Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-4">RECORDS:</span>
            <Select value={recordsPerPage.toString()} onValueChange={(v) => setRecordsPerPage(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 bg-white"><SelectValue /></SelectTrigger>
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

      {/* ── Fixed Bottom Bar ── */}
      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-center gap-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50 cursor-not-allowed"}`}
          disabled={!hasSelection} onClick={handleDelete}>
          <X className="h-4 w-4" />DELETE
        </Button>
        <Button variant="ghost" size="sm" className={`gap-2 ${hasSelection ? "text-foreground" : "text-muted-foreground/50 cursor-not-allowed"}`}
          disabled={!hasSelection}>
          <Pencil className="h-4 w-4" />EDIT
        </Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>
          ADD TO CAMPAIGN
        </Button>
        <Button variant="outline" size="sm" disabled={!hasSelection} className={!hasSelection ? "opacity-50" : ""}>
          SEND EMAIL
        </Button>
        <div className="flex items-center gap-2 ml-4 border-l pl-4">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => allSelected ? setSelectedIds([]) : setSelectedIds(contacts.map(c => c._id))}
          />
          <span className="text-sm font-medium">SELECT ALL</span>
        </div>
      </div>

      {/* ── Add Contact Modal ── */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open)
        if (!open) { setNewContact(emptyContact); setAccountSearch(""); setAccountOptions([]) }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogDescription className="sr-only">Naya contact create karo.</DialogDescription>
          <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">

            {/* Account Search */}
            <div className="space-y-1">
              <Label>Account <span className="text-destructive">*</span></Label>
              {newContact.accountId ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/30">
                  <span className="text-sm font-medium">{newContact.accountName}</span>
                  <Button variant="ghost" size="sm" onClick={() => setNewContact(p => ({ ...p, accountId: "", accountName: "" }))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Account naam search karo..." className="pl-9"
                    value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} />
                  {(accountOptions.length > 0 || isSearchingAccounts) && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-white shadow-lg">
                      {isSearchingAccounts ? (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />Searching...
                        </div>
                      ) : accountOptions.map(acc => (
                        <button key={acc._id} className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors text-sm"
                          onClick={() => {
                            setNewContact(p => ({ ...p, accountId: acc._id, accountName: acc.accountName }))
                            setAccountSearch(""); setAccountOptions([])
                          }}>
                          <div className="font-medium">{acc.accountName}</div>
                          <div className="text-xs text-muted-foreground">
                            {[acc.primaryIndustry, acc.country].filter(Boolean).join(" · ")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input placeholder="John" value={newContact.firstName} onChange={e => setNewContact(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input placeholder="Doe" value={newContact.lastName} onChange={e => setNewContact(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            {/* Domain */}
            <div className="space-y-1">
              <Label>Functional Domain</Label>
              <Select value={newContact.functionalDomain} onValueChange={v => setNewContact(p => ({ ...p, functionalDomain: v }))}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {FUNCTIONAL_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Key Focus Areas</Label>
              <Input placeholder="e.g. Software, Cloud, DevOps" value={newContact.keyFocusAreas}
                onChange={e => setNewContact(p => ({ ...p, keyFocusAreas: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Standardized Roles</Label>
              <Input placeholder="e.g. CTO, VP Engineering" value={newContact.standardizedRoles}
                onChange={e => setNewContact(p => ({ ...p, standardizedRoles: e.target.value }))} />
            </div>

            {/* Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input placeholder="john@company.com" type="email" value={newContact.email}
                  onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Secondary Email</Label>
                <Input placeholder="john@gmail.com" type="email" value={newContact.secondaryEmail}
                  onChange={e => setNewContact(p => ({ ...p, secondaryEmail: e.target.value }))} />
              </div>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Primary Phone</Label>
                <Input placeholder="+91-9876543210" value={newContact.primaryPhone}
                  onChange={e => setNewContact(p => ({ ...p, primaryPhone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input placeholder="+91-9876543210" value={newContact.primaryMobNo}
                  onChange={e => setNewContact(p => ({ ...p, primaryMobNo: e.target.value }))} />
              </div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>LinkedIn</Label>
                <Input placeholder="https://linkedin.com/in/..." value={newContact.linkedIn}
                  onChange={e => setNewContact(p => ({ ...p, linkedIn: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Twitter</Label>
                <Input placeholder="https://twitter.com/..." value={newContact.twitterUrl}
                  onChange={e => setNewContact(p => ({ ...p, twitterUrl: e.target.value }))} />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Country</Label>
                <Input placeholder="India" value={newContact.country}
                  onChange={e => setNewContact(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input placeholder="Karnataka" value={newContact.state}
                  onChange={e => setNewContact(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input placeholder="Bengaluru" value={newContact.city}
                  onChange={e => setNewContact(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Time Zone</Label>
                <Input placeholder="IST (UTC+5:30)" value={newContact.timeZone}
                  onChange={e => setNewContact(p => ({ ...p, timeZone: e.target.value }))} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={newContact.isPrimary}
                    onCheckedChange={v => setNewContact(p => ({ ...p, isPrimary: !!v }))} />
                  <span className="text-sm font-medium">Primary Contact</span>
                </label>
              </div>
            </div>

            {addMsg && <div className="text-sm px-3 py-2 rounded-lg border">{addMsg}</div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setNewContact(emptyContact) }}>Cancel</Button>
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
