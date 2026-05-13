"use client"

import { useEffect, useState } from "react"
import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { api } from "@/lib/api"
import type { Notification } from "@/types"

export function TopHeader() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get<any>("/notifications")
        setNotifications(res.data || [])
      } catch {
        // silent fail
      }
    }
    fetchNotifs()
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all")
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    } catch {
      // silent fail
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 gap-4 relative">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts, segments, campaigns..."
            className="pl-9 h-9 bg-white border-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Notifications Dropdown */}
      {showNotifs && (
        <div className="absolute right-4 top-14 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" className="text-xs h-7" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">Koi notifications nahi hain.</p>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div key={notif._id} className={`p-3 text-sm ${!notif.isRead ? "bg-blue-50" : ""}`}>
                  <p className={!notif.isRead ? "font-medium" : "text-muted-foreground"}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt ?? "").toLocaleDateString()}
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