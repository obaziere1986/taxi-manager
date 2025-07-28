"use client"

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

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: MapPin,
  },
  {
    title: "Planning",
    url: "/planning",
    icon: Calendar,
  },
  {
    title: "Chauffeurs",
    url: "/chauffeurs",
    icon: Car,
  },
  {
    title: "Paramètres",
    url: "/parametres",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-primary">
            🚕 Taxi Manager
          </div>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}