"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  role: string
  avatarUrl?: string
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/current-user')
        const result = await response.json()
        
        if (result.success) {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error)
      }
    }

    fetchUser()
  }, [])

  if (!user) {
    return null
  }

  const firstName = user.name?.split(' ')[0] || 'Utilisateur'
  const initials = `${user.name?.split(' ')[0]?.[0] || ''}${user.name?.split(' ')[1]?.[0] || ''}`.toUpperCase()

  const handleSignOut = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      // Forcer la redirection même en cas d'erreur
      router.push('/login')
      router.refresh()
    }
  }

  const handleGoToProfile = () => {
    router.push('/parametres')
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'Administrateur'
      case 'Planner': return 'Planificateur' 
      case 'Chauffeur': return 'Chauffeur'
      default: return role
    }
  }

  return (
    <div className="border-t border-border p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-auto p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <UserAvatar 
                user={{ name: user.name, avatarUrl: user.avatarUrl }}
                className="ring-2 ring-background shadow-sm"
                size="md"
              />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">
                  Bonjour {firstName} 👋
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRoleLabel(user.role)}
                </div>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  user={{ name: user.name, avatarUrl: user.avatarUrl }}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="px-2 py-1 bg-muted rounded text-xs text-center">
                {getRoleLabel(user.role)}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleGoToProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>Mon profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="opacity-50">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}