import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Test simple pour vérifier les permissions (sans auth)
export async function GET() {
  try {
    console.log('🔍 Test API permissions...')
    
    // Test de connexion Prisma
    const permissionsCount = await prisma.permission.count()
    console.log('📊 Nombre de permissions:', permissionsCount)
    
    if (permissionsCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune permission trouvée en base' 
      })
    }
    
    // Test simple de récupération des permissions
    const permissions = await prisma.permission.findMany({
      take: 5,
      orderBy: { module: 'asc' }
    })
    
    const rolePermissions = await prisma.rolePermission.findMany({
      take: 5,
      include: { permission: true }
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