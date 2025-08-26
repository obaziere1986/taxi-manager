import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'
import type { RoleUtilisateur } from '@/lib/supabase'

// PUT - Mettre à jour les permissions d'un rôle
export async function PUT(
  request: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    const { role } = params
    const body = await request.json()
    const { permissions } = body // { permissionName: boolean }

    // Vérifier que le rôle est valide
    const validRoles = ['Admin', 'Planner', 'Chauffeur']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Empêcher l'admin de modifier ses propres permissions
    if (role === 'Admin') {
      return NextResponse.json({ 
        error: 'Impossible de modifier les permissions Admin' 
      }, { status: 400 })
    }

    // Traiter chaque permission
    for (const [permissionName, isActive] of Object.entries(permissions)) {
      const permission = await executeWithRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('permissions')
          .select('id')
          .eq('nom', permissionName)
          .single()
        
        if (error && error.code !== 'PGRST116') throw error
        return data
      })

      if (!permission) continue

      await executeWithRetry(async (supabase) => {
        // Essayer de mettre à jour d'abord
        const { data: existing } = await supabase
          .from('role_permissions')
          .select('id')
          .eq('role', role)
          .eq('permission_id', permission.id)
          .single()

        if (existing) {
          // Mettre à jour
          const { error } = await supabase
            .from('role_permissions')
            .update({ 
              active: Boolean(isActive),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
          
          if (error) throw error
        } else {
          // Créer
          const { error } = await supabase
            .from('role_permissions')
            .insert({
              role: role as RoleUtilisateur,
              permission_id: permission.id,
              active: Boolean(isActive)
            })
          
          if (error) throw error
        }
      })
    }

    // Récupérer les permissions mises à jour
    const updatedRolePermissions = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq('role', role)
      
      if (error) throw error
      return data || []
    })

    const permissionsMap = updatedRolePermissions.reduce((acc, rp) => {
      acc[rp.permission.nom] = rp.active
      return acc
    }, {} as Record<string, boolean>)

    return NextResponse.json({
      success: true,
      role,
      permissions: permissionsMap
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des permissions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}