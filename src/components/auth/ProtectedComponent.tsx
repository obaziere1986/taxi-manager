import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'

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
  const { data: session } = useSession()
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, isAdmin, isAuthenticated } = usePermissions(permissions)

  // Vérifier l'authentification
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Afficher un loader pendant la vérification des permissions
  if (loading && permissions.length > 0) {
    return null // ou un spinner si souhaité
  }

  // Vérifier le rôle spécifique si demandé
  if (role && session?.user?.role !== role && !isAdmin) {
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

  // Vérifier les permissions
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)

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