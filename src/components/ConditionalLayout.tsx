"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Routes sans sidebar
  const routesWithoutSidebar = ['/login']
  const shouldShowSidebar = !routesWithoutSidebar.includes(pathname)

  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}