"use client"

import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function TopHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 gap-4">
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
        <span className="text-sm text-muted-foreground">View as</span>
        <Button variant="outline" className="h-9 gap-2">
          Sales Rep
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
            3
          </span>
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
