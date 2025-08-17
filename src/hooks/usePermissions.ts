import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function usePermissions(requiredPermissions?: string[]) {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    // Admin a toujours toutes les permissions
    if (session.user.role === 'Admin') {
      const adminPermissions = requiredPermissions?.reduce((acc, permission) => {
        acc[permission] = true
        return acc
      }, {} as Record<string, boolean>) || {}
      setPermissions(adminPermissions)
      setLoading(false)
      return
    }

    // Vérifier les permissions pour les autres rôles
    if (requiredPermissions && requiredPermissions.length > 0) {
      checkPermissions(requiredPermissions)
    } else {
      setLoading(false)
    }
  }, [session, requiredPermissions])

  const checkPermissions = async (permissionsList: string[]) => {
    try {
      setLoading(true)
      const response = await fetch('/api/permissions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionsList })
      })

      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions)
      } else {
        // En cas d'erreur, toutes les permissions sont refusées
        const deniedPermissions = permissionsList.reduce((acc, permission) => {
          acc[permission] = false
          return acc
        }, {} as Record<string, boolean>)
        setPermissions(deniedPermissions)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error)
      // En cas d'erreur, toutes les permissions sont refusées
      const deniedPermissions = permissionsList.reduce((acc, permission) => {
        acc[permission] = false
        return acc
      }, {} as Record<string, boolean>)
      setPermissions(deniedPermissions)
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!session?.user?.id) return false
    if (session.user.role === 'Admin') return true
    return permissions[permission] || false
  }

  const hasAnyPermission = (permissionsList: string[]): boolean => {
    if (!session?.user?.id) return false
    if (session.user.role === 'Admin') return true
    return permissionsList.some(permission => permissions[permission])
  }

  const hasAllPermissions = (permissionsList: string[]): boolean => {
    if (!session?.user?.id) return false
    if (session.user.role === 'Admin') return true
    return permissionsList.every(permission => permissions[permission])
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: session?.user?.role === 'Admin',
    isAuthenticated: !!session?.user?.id
  }
}