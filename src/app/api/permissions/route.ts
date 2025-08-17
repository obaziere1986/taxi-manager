import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer toutes les permissions et leurs assignations par rôle
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session permissions API:', session?.user)
    
    if (!session?.user?.id) {
      console.log('Pas de session utilisateur')
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    if (session.user.role !== 'Admin') {
      console.log('Rôle utilisateur:', session.user.role, '- Admin requis')
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // Récupérer toutes les permissions
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    })

    // Récupérer les assignations de permissions par rôle
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        permission: true
      }
    })

    // Organiser les données par module et rôle
    const permissionsGrouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push(permission)
      return acc
    }, {} as Record<string, any[]>)

    const rolePermissionsMap = rolePermissions.reduce((acc, rp) => {
      if (!acc[rp.role]) {
        acc[rp.role] = {}
      }
      acc[rp.role][rp.permission.nom] = rp.active
      return acc
    }, {} as Record<string, Record<string, boolean>>)

    return NextResponse.json({
      permissions: permissionsGrouped,
      rolePermissions: rolePermissionsMap
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}