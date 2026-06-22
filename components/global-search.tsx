"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Building2, Target, Megaphone, User, X, Loader2 } from "lucide-react"
import { api } from "@/lib/apiClient"

interface SearchResult {
  id: string
  type: "account" | "segment" | "campaign" | "contact"
  title: string
  subtitle?: string
  badge?: string | null
  accountId?: string | null
}

interface SearchResults {
  accounts: SearchResult[]
  segments: SearchResult[]
  campaigns: SearchResult[]
  contacts: SearchResult[]
}

const TYPE_CONFIG = {
  account: {
    label: "Accounts",
    icon: Building2,
    route: (id: string) => `/accounts/${id}`,
  },
  segment: {
    label: "Segments",
    icon: Target,
    route: (id: string) => `/segments/${id}`,
  },
  campaign: {
    label: "Campaigns",
    icon: Megaphone,
    route: (id: string) => `/campaigns/${id}`,
  },
  contact: {
    label: "Contacts",
    icon: User,
    route: (id: string) => `/contacts/${id}`,
  },
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const flatResults: SearchResult[] = results
    ? [
        ...results.accounts,
        ...results.segments,
        ...results.campaigns,
        ...results.contacts,
      ]
    : []

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await api.get<{
        success: boolean
        data: SearchResults
      }>(`/search?q=${encodeURIComponent(q)}`)

      if (res.success) {
        setResults(res.data)
      }
    } catch (error) {
      console.error("Search failed:", error)
      setResults({
        accounts: [],
        segments: [],
        campaigns: [],
        contacts: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      runSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (result: SearchResult) => {
    const config = TYPE_CONFIG[result.type]
    router.push(config.route(result.id))
    setQuery("")
    setResults(null)
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (!open || flatResults.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(flatResults[activeIndex])
    }
  }

  const clearSearch = () => {
    setQuery("")
    setResults(null)
    setOpen(false)
    setActiveIndex(-1)
  }

  const renderSection = (label: string, items: SearchResult[]) => {
    if (items.length === 0) return null
    const config = TYPE_CONFIG[items[0].type]
    const Icon = config.icon

    return (
      <div key={label} className="py-1">
        <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        {items.map((item) => {
          const globalIndex = flatResults.findIndex(
            (r) => r.id === item.id && r.type === item.type
          )
          const isActive = globalIndex === activeIndex

          return (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(globalIndex)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                isActive ? "bg-teal-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                )}
              </div>
              {item.badge && (
                <span className="text-xs font-medium text-gray-400 flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search accounts, segments, campaigns..."
          className="w-full h-9 pl-9 pr-9 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-200 max-h-[420px] overflow-y-auto z-50">
          {loading && (
            <div className="px-3 py-8 text-center text-sm text-gray-400">Searching...</div>
          )}

          {!loading && results && flatResults.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-gray-500">No results for &quot;{query}&quot;</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {!loading && results && flatResults.length > 0 && (
            <>
              {renderSection("Accounts", results.accounts)}
              {renderSection("Segments", results.segments)}
              {renderSection("Campaigns", results.campaigns)}
              {renderSection("Contacts", results.contacts)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
