import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RoleUtilisateur } from '@prisma/client'

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
    if (!Object.values(RoleUtilisateur).includes(role as RoleUtilisateur)) {
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
      const permission = await prisma.permission.findUnique({
        where: { nom: permissionName }
      })

      if (!permission) continue

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: role as RoleUtilisateur,
            permissionId: permission.id
          }
        },
        update: { 
          active: Boolean(isActive),
          updatedAt: new Date()
        },
        create: {
          role: role as RoleUtilisateur,
          permissionId: permission.id,
          active: Boolean(isActive)
        }
      })
    }

    // Récupérer les permissions mises à jour
    const updatedRolePermissions = await prisma.rolePermission.findMany({
      where: { role: role as RoleUtilisateur },
      include: { permission: true }
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