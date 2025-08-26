import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'
import type { RoleUtilisateur } from '@/lib/supabase'

// GET - Vérifier une permission spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permission = searchParams.get('permission')
    const role = searchParams.get('role') || 'Chauffeur' // Par défaut Chauffeur

    if (!permission) {
      return NextResponse.json({ error: 'Permission manquante' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier si la permission existe pour ce rôle
    const hasPermission = await executeWithRetry(async (supabase) => {
      // D'abord récupérer l'ID de la permission
      const { data: permissionData, error: permError } = await supabase
        .from('permissions')
        .select('id')
        .eq('nom', permission)
        .single()
      
      if (permError || !permissionData) {
        return false
      }

      // Puis vérifier si cette permission est accordée au rôle
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role)
        .eq('permission_id', permissionData.id)
        .single()
      
      return !error && data
    })

    return NextResponse.json({ hasPermission: !!hasPermission })

  } catch (error) {
    console.error('Erreur lors de la vérification de permission:', error)
    return NextResponse.json({ hasPermission: false })
  }
}

// POST - Vérifier les permissions d'un utilisateur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { permissions: requestedPermissions } = body // Array of permission names

    if (!Array.isArray(requestedPermissions)) {
      return NextResponse.json({ error: 'Permissions invalides' }, { status: 400 })
    }

    // Admin a toujours toutes les permissions
    if (session.user.role === 'Admin') {
      const result = requestedPermissions.reduce((acc, permission) => {
        acc[permission] = true
        return acc
      }, {} as Record<string, boolean>)
      
      return NextResponse.json({ permissions: result })
    }

    // Vérifier que le rôle est valide
    const validRoles = ['Admin', 'Planner', 'Chauffeur']
    if (!validRoles.includes(session.user.role)) {
      return NextResponse.json({ 
        permissions: requestedPermissions.reduce((acc, permission) => {
          acc[permission] = false
          return acc
        }, {} as Record<string, boolean>)
      })
    }

    // Récupérer les permissions actives du rôle de l'utilisateur
    const rolePermissions = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq('role', session.user.role)
        .eq('active', true)
        .in('permission.nom', requestedPermissions)
      
      if (error) throw error
      return data || []
    })

    // Construire la map des permissions
    const permissionsMap = requestedPermissions.reduce((acc, permission) => {
      acc[permission] = rolePermissions.some(rp => rp.permission.nom === permission)
      return acc
    }, {} as Record<string, boolean>)

    return NextResponse.json({ permissions: permissionsMap })

  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}