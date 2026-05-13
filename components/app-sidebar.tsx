"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Target,
  Lightbulb,
  Megaphone,
  Users,
  Layers,
  Database,
  Copy,
  FileText,
  UserCog,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

const workspaceItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Accounts", icon: Building2, href: "/accounts" },
  { title: "Segments & ICP", icon: Target, href: "/segments" },
  { title: "Insights", icon: Lightbulb, href: "/insights" },
  { title: "Campaigns", icon: Megaphone, href: "/campaigns" },
  { title: "Collaboration", icon: Users, href: "/collaboration" },
  { title: "All Screens", icon: Layers, href: "/screens" },
]

const adminItems = [
  { title: "Data Sources", icon: Database, href: "/data-sources" },
  { title: "Duplicates", icon: Copy, href: "/duplicates" },
  { title: "Audit Log", icon: FileText, href: "/audit-log" },
  { title: "Users & Roles", icon: UserCog, href: "/users-roles" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const displayName = user?.name ?? "User"
  const displayEmail = user?.email ?? ""
  const initials = getInitials(displayName)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sidebar font-bold text-sm">
            B
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-white text-sm">Beno</span>
            <span className="text-xs text-white/70">Prospect Tool</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 text-xs uppercase tracking-wider px-4">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 text-xs uppercase tracking-wider px-4">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="bg-primary text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-white truncate">{displayName}</span>
            <span className="text-xs text-white/70 truncate">{displayEmail}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 group-data-[collapsible=icon]:hidden"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}