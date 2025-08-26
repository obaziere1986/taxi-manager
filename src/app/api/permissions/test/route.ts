import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

// GET - Test simple pour vérifier les permissions (sans auth)
export async function GET() {
  try {
    console.log('🔍 Test API permissions...')
    
    // Test de connexion Supabase
    const permissionsCount = await executeWithRetry(async (supabase) => {
      const { count, error } = await supabase
        .from('permissions')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return count || 0
    })
    console.log('📊 Nombre de permissions:', permissionsCount)
    
    if (permissionsCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune permission trouvée en base' 
      })
    }
    
    // Test simple de récupération des permissions
    const permissions = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .limit(5)
      
      if (error) throw error
      return data || []
    })
    
    const rolePermissions = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .limit(5)
      
      if (error) throw error
      return data || []
    })
    
    console.log('✅ Permissions trouvées:', permissions.length)
    console.log('✅ RolePermissions trouvées:', rolePermissions.length)
    
    return NextResponse.json({ 
      success: true,
      permissionsCount,
      permissions: permissions,
      rolePermissions: rolePermissions
    })

  } catch (error) {
    console.error('❌ Erreur API permissions test:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 })
  }
}