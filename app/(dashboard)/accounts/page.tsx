"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Upload, Download, Plus, Filter, Columns, Trash2, Pencil, Phone, MessageCircle, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const accounts = [
  { name: "Mosaic Commerce", domain: "mosaiccommerce.com", industry: "Manufacturing", employees: "9,488", location: "Sydney, Australia", score: 99, source: "Apollo", status: "Sales-Ready" },
  { name: "Cobalt Security", domain: "cobaltsecurity.com", industry: "Fintech", employees: "9,544", location: "Toronto, Canada", score: 99, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Loop Fitness", domain: "loopfitness.com", industry: "Healthtech", employees: "9,541", location: "Bangalore, India", score: 99, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Umbra Print", domain: "umbraprint.com", industry: "Logistics", employees: "9,479", location: "San Francisco, USA", score: 99, source: "OneB", status: "Sales-Ready" },
  { name: "Iris Optics", domain: "irisoptics.com", industry: "Logistics", employees: "9,497", location: "Toronto, Canada", score: 99, source: "CSV", status: "Sales-Ready" },
  { name: "Northwind Cloud", domain: "northwindcloud.com", industry: "Fintech", employees: "9,375", location: "San Francisco, USA", score: 98, source: "Apollo", status: "Sales-Ready" },
  { name: "Zephyr Cloud", domain: "zephyrcloud.com", industry: "Healthtech", employees: "9,390", location: "Sydney, Australia", score: 98, source: "OneB", status: "Sales-Ready" },
  { name: "Delta Drone", domain: "deltadrone.com", industry: "SaaS", employees: "9,360", location: "London, UK", score: 98, source: "CSV", status: "Sales-Ready" },
  { name: "Riverstone CRM", domain: "riverstonecrm.com", industry: "Healthtech", employees: "9,204", location: "London, UK", score: 97, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Quill Publishing", domain: "quillpublishing.com", industry: "Fintech", employees: "9,225", location: "Mumbai, India", score: 97, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Glide Travel", domain: "glidetravel.com", industry: "Logistics", employees: "8,977", location: "Singapore, Singapore", score: 96, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Harbor Capital", domain: "harborcapital.com", industry: "Manufacturing", employees: "9,004", location: "Berlin, Germany", score: 96, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Fable Studio", domain: "fablestudio.com", industry: "EdTech", employees: "8,728", location: "Singapore, Singapore", score: 94, source: "Apollo", status: "Sales-Ready" },
  { name: "Pinnacle Systems", domain: "pinnaclesystems.io", industry: "SaaS", employees: "7,892", location: "Austin, USA", score: 94, source: "Apollo", status: "Sales-Ready" },
  { name: "Stellar Dynamics", domain: "stellardynamics.com", industry: "Manufacturing", employees: "8,456", location: "Munich, Germany", score: 93, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Quantum Labs", domain: "quantumlabs.ai", industry: "SaaS", employees: "6,234", location: "Boston, USA", score: 93, source: "OneB", status: "Sales-Ready" },
  { name: "Apex Ventures", domain: "apexventures.com", industry: "Fintech", employees: "5,678", location: "New York, USA", score: 92, source: "Apollo", status: "Sales-Ready" },
  { name: "Horizon Tech", domain: "horizontech.co", industry: "SaaS", employees: "4,890", location: "Seattle, USA", score: 92, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Nova Analytics", domain: "novaanalytics.com", industry: "SaaS", employees: "3,456", location: "Chicago, USA", score: 91, source: "CSV", status: "Sales-Ready" },
  { name: "Vertex Solutions", domain: "vertexsolutions.io", industry: "Healthtech", employees: "7,123", location: "Denver, USA", score: 91, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Atlas Global", domain: "atlasglobal.com", industry: "Logistics", employees: "12,345", location: "Dubai, UAE", score: 90, source: "Apollo", status: "Sales-Ready" },
  { name: "Titan Industries", domain: "titanindustries.com", industry: "Manufacturing", employees: "15,678", location: "Tokyo, Japan", score: 90, source: "OneB", status: "Sales-Ready" },
  { name: "Phoenix Digital", domain: "phoenixdigital.io", industry: "EdTech", employees: "2,890", location: "Los Angeles, USA", score: 89, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Summit Health", domain: "summithealth.com", industry: "Healthtech", employees: "8,901", location: "Boston, USA", score: 89, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Cascade Systems", domain: "cascadesystems.net", industry: "SaaS", employees: "4,567", location: "Portland, USA", score: 88, source: "Apollo", status: "Sales-Ready" },
  { name: "Prism Media", domain: "prismmedia.com", industry: "EdTech", employees: "3,234", location: "London, UK", score: 88, source: "CSV", status: "Sales-Ready" },
  { name: "Nexus Corp", domain: "nexuscorp.io", industry: "Fintech", employees: "6,789", location: "Frankfurt, Germany", score: 87, source: "OneB", status: "Sales-Ready" },
  { name: "Ember Tech", domain: "embertech.co", industry: "SaaS", employees: "2,345", location: "Amsterdam, Netherlands", score: 87, source: "Apollo", status: "Sales-Ready" },
  { name: "Orion Networks", domain: "orionnetworks.com", industry: "Logistics", employees: "5,432", location: "Paris, France", score: 86, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Zenith Labs", domain: "zenithlabs.ai", industry: "SaaS", employees: "1,890", location: "Tel Aviv, Israel", score: 86, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Evergreen Solutions", domain: "evergreensolutions.com", industry: "Healthtech", employees: "4,123", location: "Vancouver, Canada", score: 85, source: "Apollo", status: "Sales-Ready" },
  { name: "Sapphire Systems", domain: "sapphiresystems.io", industry: "Fintech", employees: "3,567", location: "Zurich, Switzerland", score: 85, source: "OneB", status: "Sales-Ready" },
  { name: "Aurora Dynamics", domain: "auroradynamics.com", industry: "Manufacturing", employees: "7,890", location: "Stockholm, Sweden", score: 84, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Velocity Labs", domain: "velocitylabs.co", industry: "SaaS", employees: "2,678", location: "Dublin, Ireland", score: 84, source: "CSV", status: "Sales-Ready" },
  { name: "Spark Innovations", domain: "sparkinnovations.io", industry: "EdTech", employees: "1,456", location: "Helsinki, Finland", score: 83, source: "Apollo", status: "Sales-Ready" },
  { name: "Fusion Analytics", domain: "fusionanalytics.com", industry: "SaaS", employees: "3,890", location: "Oslo, Norway", score: 83, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Radiant Health", domain: "radianthealth.io", industry: "Healthtech", employees: "5,123", location: "Melbourne, Australia", score: 82, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Momentum Tech", domain: "momentumtech.com", industry: "SaaS", employees: "2,234", location: "Copenhagen, Denmark", score: 82, source: "OneB", status: "Sales-Ready" },
  { name: "Vanguard Systems", domain: "vanguardsystems.net", industry: "Logistics", employees: "6,456", location: "Brussels, Belgium", score: 81, source: "Apollo", status: "Sales-Ready" },
  { name: "Eclipse Digital", domain: "eclipsedigital.co", industry: "EdTech", employees: "1,789", location: "Lisbon, Portugal", score: 80, source: "CSV", status: "Sales-Ready" },
  { name: "Lumen Labs", domain: "lumenlabs.ai", industry: "SaaS", employees: "987", location: "Barcelona, Spain", score: 76, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Kestrel Bank", domain: "kestrelbank.com", industry: "Fintech", employees: "4,567", location: "Milan, Italy", score: 80, source: "ZoomInfo", status: "Sales-Ready" },
  { name: "Beacon Mobility", domain: "beaconmobility.io", industry: "Logistics", employees: "3,456", location: "Vienna, Austria", score: 86, source: "Apollo", status: "Sales-Ready" },
  { name: "Helios Pay", domain: "heliospay.com", industry: "Fintech", employees: "2,890", location: "Warsaw, Poland", score: 92, source: "OneB", status: "Sales-Ready" },
  { name: "Quanta AI", domain: "quantaai.io", industry: "SaaS", employees: "1,234", location: "Prague, Czech Republic", score: 89, source: "CSV", status: "Sales-Ready" },
  { name: "Stratos Cloud", domain: "stratoscloud.com", industry: "SaaS", employees: "5,678", location: "Budapest, Hungary", score: 91, source: "Bitrix24", status: "Sales-Ready" },
  { name: "Nimbus Tech", domain: "nimbustech.io", industry: "Healthtech", employees: "2,345", location: "Athens, Greece", score: 87, source: "Apollo", status: "Sales-Ready" },
  { name: "Cirrus Networks", domain: "cirrusnetworks.com", industry: "Logistics", employees: "4,123", location: "Dublin, Ireland", score: 85, source: "ZoomInfo", status: "Sales-Ready" },
]

export default function AccountsPage() {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(4)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const totalPages = Math.ceil(accounts.length / recordsPerPage)

  // Get current page accounts
  const startIndex = (currentPage - 1) * recordsPerPage
  const currentAccounts = accounts.slice(startIndex, startIndex + recordsPerPage)
  const currentPageNames = currentAccounts.map((a) => a.name)

  // Check if all items on current page are selected
  const allCurrentPageSelected = currentPageNames.length > 0 && 
    currentPageNames.every((name) => selectedAccounts.includes(name))
  
  // Check if some items on current page are selected (for indeterminate state)
  const someCurrentPageSelected = currentPageNames.some((name) => selectedAccounts.includes(name))
  
  // Check if ALL accounts across all pages are selected
  const allAccountsSelected = selectedAccounts.length === accounts.length && accounts.length > 0
  
  const hasSelection = selectedAccounts.length > 0

  // Toggle selection for current page only (header checkbox)
  const toggleCurrentPageSelection = () => {
    if (allCurrentPageSelected) {
      // Deselect all items on current page
      setSelectedAccounts(selectedAccounts.filter((name) => !currentPageNames.includes(name)))
    } else {
      // Select all items on current page (add to existing selection)
      const newSelection = [...selectedAccounts]
      currentPageNames.forEach((name) => {
        if (!newSelection.includes(name)) {
          newSelection.push(name)
        }
      })
      setSelectedAccounts(newSelection)
    }
  }

  // Toggle selection for ALL accounts across all pages (bottom "Select All" button)
  const toggleSelectAllAccounts = () => {
    if (allAccountsSelected) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(accounts.map((a) => a.name))
    }
  }

  const toggleAccount = (name: string) => {
    if (selectedAccounts.includes(name)) {
      setSelectedAccounts(selectedAccounts.filter((n) => n !== name))
    } else {
      setSelectedAccounts([...selectedAccounts, name])
    }
  }

  // Handle records per page change
  const handleRecordsPerPageChange = (value: string) => {
    setRecordsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing records per page
  }

  // Count selected on current page
  const selectedOnCurrentPage = currentPageNames.filter((name) => selectedAccounts.includes(name)).length

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header - Fixed */}
      <div className="p-6 pb-0 space-y-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Master View</p>
            <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
            <p className="text-sm text-muted-foreground">{accounts.length} of {accounts.length} accounts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or domain..." className="pl-9 bg-white" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="fintech">Fintech</SelectItem>
              <SelectItem value="healthtech">Healthtech</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
              <SelectItem value="edtech">EdTech</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sales-ready">Sales-Ready</SelectItem>
              <SelectItem value="nurturing">Nurturing</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-white">
            <Filter className="h-4 w-4" />
            Build Segment
          </Button>
          <Button variant="outline" className="gap-2 bg-white">
            <Columns className="h-4 w-4" />
            Columns
          </Button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-10">
                  <Checkbox 
                    checked={allCurrentPageSelected} 
                    onCheckedChange={toggleCurrentPageSelection}
                    className={someCurrentPageSelected && !allCurrentPageSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">Employees</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Lead Score <span className="text-muted-foreground/60">&#8593;&#8595;</span></th>
                <th className="p-4 font-medium">Source</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentAccounts.map((account) => (
                <tr key={account.name} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedAccounts.includes(account.name)} 
                      onCheckedChange={() => toggleAccount(account.name)} 
                    />
                  </td>
                  <td className="p-4">
                    <Link href={`/accounts/${encodeURIComponent(account.name.toLowerCase().replace(/\s+/g, "-"))}`} className="hover:underline">
                      <div className="font-medium text-foreground">{account.name}</div>
                      <div className="text-sm text-muted-foreground">{account.domain}</div>
                    </Link>
                  </td>
                  <td className="p-4 text-sm">{account.industry}</td>
                  <td className="p-4 text-sm">{account.employees}</td>
                  <td className="p-4 text-sm">{account.location}</td>
                  <td className="p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-primary font-semibold text-sm">
                      {account.score}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-md border bg-white px-2.5 py-1 text-xs font-medium">
                      {account.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">{account.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">
              SELECTED: <span className="font-medium text-foreground">{selectedAccounts.length}/{accounts.length}</span>
              {selectedOnCurrentPage > 0 && selectedOnCurrentPage < selectedAccounts.length && (
                <span className="text-xs text-muted-foreground ml-1">({selectedOnCurrentPage} on this page)</span>
              )}
            </span>
            <span className="text-sm text-muted-foreground">
              TOTAL: <button className="text-primary font-medium hover:underline">SHOW QUANTITY</button>
            </span>
          </div>
          
          <Button variant="outline" size="sm" className="bg-white">
            SHOW MORE
          </Button>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3].map((page) => (
              <Button 
                key={page} 
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-white" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button 
              variant={currentPage === 4 ? "default" : "ghost"}
              size="sm"
              className={`h-8 w-8 p-0 ${currentPage === 4 ? "bg-primary text-white" : ""}`}
              onClick={() => setCurrentPage(4)}
            >
              4
            </Button>
            <span className="px-1 text-muted-foreground">...</span>
            <Button 
              variant={currentPage === totalPages ? "default" : "ghost"} 
              size="sm" 
              className={`h-8 w-8 p-0 ${currentPage === totalPages ? "bg-primary text-white" : ""}`}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-4">RECORDS:</span>
            <Select value={recordsPerPage.toString()} onValueChange={handleRecordsPerPageChange}>
              <SelectTrigger className="w-[70px] h-8 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Spacer for fixed bottom bar */}
        <div className="h-20" />
      </div>

      {/* Fixed Bottom Action Bar - Always Visible */}
      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t py-3 px-6 flex items-center justify-center gap-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 ${hasSelection ? "text-foreground hover:text-foreground" : "text-muted-foreground/50 cursor-not-allowed"}`}
          disabled={!hasSelection}
        >
          <X className="h-4 w-4" />
          DELETE
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 ${hasSelection ? "text-foreground hover:text-foreground" : "text-muted-foreground/50 cursor-not-allowed"}`}
          disabled={!hasSelection}
        >
          <Pencil className="h-4 w-4" />
          EDIT
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${hasSelection ? "" : "opacity-50 cursor-not-allowed"}`}
          disabled={!hasSelection}
        >
          START DIALING
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${hasSelection ? "" : "opacity-50 cursor-not-allowed"}`}
          disabled={!hasSelection}
        >
          SEND WHATSAPP MESSAGE
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${hasSelection ? "" : "opacity-50 cursor-not-allowed"}`}
          disabled={!hasSelection}
        >
          SELECT ACTION
          <Download className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 ml-4 border-l pl-4">
          <Checkbox 
            checked={allAccountsSelected} 
            onCheckedChange={toggleSelectAllAccounts}
          />
          <span className="text-sm font-medium">SELECT ALL</span>
        </div>
      </div>
    </div>
  )
}
