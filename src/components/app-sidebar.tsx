"use client"

import { usePathname } from "next/navigation"
import {
  Calendar,
  Car,
  Home,
  Settings,
  Users,
  MapPin,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserProfile } from "@/components/auth/UserProfile"
import { ProtectedComponent } from "@/components/auth/ProtectedComponent"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    permissions: ["analytics.read"], // Tout le monde peut voir le dashboard
    forEveryone: true
  },
  {
    title: "Planning",
    url: "/planning",
    icon: Calendar,
    permissions: ["courses.read"], // Besoin de voir les courses
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permissions: ["clients.read"], // Besoin de voir les clients
  },
  {
    title: "Courses",
    url: "/courses",
    icon: MapPin,
    permissions: ["courses.read"], // Besoin de voir les courses
  },
  {
    title: "Paramètres",
    url: "/parametres",
    icon: Settings,
    permissions: ["settings.read"], // Besoin d'accéder aux paramètres
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="text-xl font-bold text-primary">
          Taxi Manager
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <ProtectedComponent 
                  key={item.title}
                  permissions={item.forEveryone ? [] : item.permissions}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </ProtectedComponent>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <UserProfile />
    </Sidebar>
  )
}