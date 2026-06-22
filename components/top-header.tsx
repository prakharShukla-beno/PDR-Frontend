"use client"

// ─────────────────────────────────────────────
// Top Header
// APIs:
//   GET /api/notifications           → bell count
//   PUT /api/notifications/read-all  → mark all read
//   GET /api/search?q=                → global search
// ─────────────────────────────────────────────

import { useEffect, useState, useRef } from "react"
import { Bell, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HelpDrawer } from "@/components/help-drawer"
import { GlobalSearch } from "@/components/global-search"
import { api } from "@/lib/apiClient"
import type { Notification } from "@/types"

export function TopHeader() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

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

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all")
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false)
    }
    document.addEventListener("keydown", handleKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 gap-4 relative z-40">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <SidebarTrigger />
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHelpOpen(true)}
          aria-label="Open help guide"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {showNotifs && (
        <div
          ref={notifRef}
          className="absolute right-4 top-14 w-80 bg-white border rounded-lg shadow-lg z-50"
        >
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
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}
