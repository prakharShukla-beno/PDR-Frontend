"use client"

// ─────────────────────────────────────────────
// Top Header
// APIs:
//   GET /api/notifications           → bell count
//   PUT /api/notifications/read-all  → mark all read
//   GET /api/search/prospects?search  → search bar
// ─────────────────────────────────────────────

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, HelpCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { api } from "@/lib/api"
import type { Notification, Prospect } from "@/types"

export function TopHeader() {
  const router = useRouter()

  // ── Notifications state ─────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Search state ────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Prospect[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef  = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ── GET /api/notifications ──────────────────
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get<any>("/notifications")
        const notifList = res.data || []
        setNotifications(notifList)
        setUnreadCount(res.unreadCount ?? notifList.filter((n: Notification) => !n.isRead).length)
      } catch {
        // silent fail
      }
    }
    fetchNotifs()
  }, [])

  // ── PUT /api/notifications/read-all ─────────
  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all")
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // silent fail
    }
  }

  // ── Search — debounced 400ms ────────────────
  // GET /api/search/prospects?query=xyz
  useEffect(() => {
    const q = searchQuery.trim()
    // require at least 2 characters
    if (q.length < 2) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
      setSearchResults([])
      setShowResults(false)
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await api.get<any>(
          `/search/prospects?search=${encodeURIComponent(q)}&limit=5`
        )
        setSearchResults(res.data?.prospects || res.prospects || [])
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
      // Close notification dropdown when clicking outside
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    // close on Escape as well
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowResults(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 gap-4 relative z-40">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />

        {/* ── Search bar with dropdown ── */}
        <div className="relative max-w-md flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <Input
            placeholder="Search accounts, segments, campaigns..."
            className="pl-9 pr-9 h-9 bg-white border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => (searchQuery.trim().length >= 2 && searchResults.length > 0) && setShowResults(true)}
          />

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((prospect) => (
                <button
                  key={prospect._id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors"
                  onClick={() => {
                    router.push(`/accounts/${prospect._id}`)
                    setSearchQuery("")
                    setShowResults(false)
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                    {prospect.techFitScore ?? "—"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{prospect.accountName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[prospect.primaryIndustry, prospect.country].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              ))}
              <button
                className="w-full px-4 py-2 text-xs text-primary hover:bg-muted/30 text-center border-t"
                onClick={() => {
                  router.push(`/accounts?search=${encodeURIComponent(searchQuery)}`)
                  setShowResults(false)
                }}
              >
                View all results →
              </button>
            </div>
          )}

          {/* No results */}
          {showResults && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-4 text-sm text-muted-foreground text-center">
              "{searchQuery}" did not return any results.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell icon */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setShowNotifs(!showNotifs)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* ── Notifications Dropdown ── */}
      {showNotifs && (
        <div ref={notifRef} className="absolute right-4 top-14 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" className="text-xs h-7 text-primary" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                No notifications available.
              </p>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif._id}
                  className={`p-3 text-sm ${!notif.isRead ? "bg-blue-50" : ""}`}
                >
                  <p className={!notif.isRead ? "font-medium" : "text-muted-foreground"}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(notif.createdAt ?? "").toLocaleDateString("en-IN", {
                      day: "numeric", month: "short"
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  )
}