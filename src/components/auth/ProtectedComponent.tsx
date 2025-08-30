import { ReactNode, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface ProtectedComponentProps {
  children: ReactNode
  permissions?: string[]
  requireAll?: boolean // Si true, nécessite toutes les permissions, sinon au moins une
  fallback?: ReactNode // Composant à afficher si pas d'autorisation
  role?: 'Admin' | 'Planner' | 'Chauffeur' // Restriction par rôle
}

export function ProtectedComponent({ 
  children, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  role 
}: ProtectedComponentProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Afficher un loader pendant la vérification
  if (loading) {
    return null
  }

  // Vérifier l'authentification
  if (!user) {
    return <>{fallback}</>
  }

  const isAdmin = user.role === 'Admin'
  
  // Vérifier le rôle spécifique si demandé
  if (role && user.role !== role && !isAdmin) {
    return <>{fallback}</>
  }

  // Admin a accès à tout
  if (isAdmin) {
    return <>{children}</>
  }

  // Si aucune permission spécifique n'est requise, afficher le contenu
  if (permissions.length === 0) {
    return <>{children}</>
  }

  // Pour le moment, on simplifie les permissions basées sur le rôle
  // Admin a accès à tout, les autres selon leurs besoins
  let hasAccess = false
  
  if (user.role === 'Admin') {
    hasAccess = true // Admin a accès à tout
  } else if (user.role === 'Planner') {
    // Planner a accès à presque tout sauf les permissions d'admin
    hasAccess = !permissions.includes('admin.manage')
  } else if (user.role === 'Chauffeur') {
    // Chauffeur n'a accès qu'au dashboard et ses propres données
    hasAccess = permissions.includes('analytics.read') || 
                permissions.includes('courses.read') ||
                permissions.includes('clients.read')
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Composant spécialisé pour les admins uniquement
export function AdminOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <ProtectedComponent permissions={['permissions.manage']} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

// Composant spécialisé pour les planners et admins
export function PlannerOrAdmin({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <ProtectedComponent permissions={['users.read']} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}