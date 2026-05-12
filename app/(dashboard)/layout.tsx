import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopHeader } from "@/components/top-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopHeader />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
