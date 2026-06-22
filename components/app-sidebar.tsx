"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Building2, Target, Lightbulb,
  Megaphone, Users, Database, Copy,
  FileText, UserCog, LogOut, Contact, ChevronUp,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

const workspaceItems = [
  { title: "Dashboard",    icon: LayoutDashboard, href: "/dashboard" },
  { title: "Accounts",     icon: Building2,       href: "/accounts" },
  { title: "Contacts",     icon: Contact,         href: "/contacts" },
  { title: "Segments & ICP", icon: Target,        href: "/segments" },
  { title: "Insights",     icon: Lightbulb,       href: "/insights" },
  { title: "Campaigns",    icon: Megaphone,       href: "/campaigns" },
]

const adminItemsBefore = [
  { title: "Data Sources", icon: Database, href: "/data-sources" },
  { title: "Duplicates",   icon: Copy,     href: "/duplicates" },
]

const adminItemsAfter = [
  { title: "Audit Log", icon: FileText, href: "/audit-log" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const ROLE_COLOR: Record<string, string> = {
  admin:  "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const displayName = user?.name ?? (isLoading ? "Loading..." : "...")
  const initials = user?.name ? getInitials(user.name) : "?"

  const renderAdminLink = (item: (typeof adminItemsBefore)[0]) => (
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
  )

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
              {adminItemsBefore.map(renderAdminLink)}
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/users" || pathname.startsWith("/users/")}
                    tooltip="Users & Roles"
                  >
                    <Link href="/users">
                      <Users className="size-4" />
                      <span>Users & Roles</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {adminItemsAfter.map(renderAdminLink)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-2">
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-teal-800 transition-colors text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
          >
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>

            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-teal-300 capitalize">{user?.role ?? ""}</p>
            </div>

            <ChevronUp
              className={`w-4 h-4 text-teal-400 transition-transform flex-shrink-0 group-data-[collapsible=icon]:hidden ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[240px]">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {user?.name}
                      </p>
                      {user?.role && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${
                            ROLE_COLOR[user.role] ?? ROLE_COLOR.viewer
                          }`}
                        >
                          {user.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-700">
                  {user?.company?.name ?? "Your Company"}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {user?.company?.plan ?? "free"} plan
                </p>
              </div>

              <div className="p-1">
                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      router.push("/users")
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <UserCog className="w-4 h-4 text-gray-400" />
                    Team & Members
                  </button>
                )}
              </div>

              <div className="p-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
