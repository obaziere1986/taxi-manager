import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RoleUtilisateur } from '@prisma/client'

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
    if (!Object.values(RoleUtilisateur).includes(session.user.role as RoleUtilisateur)) {
      return NextResponse.json({ 
        permissions: requestedPermissions.reduce((acc, permission) => {
          acc[permission] = false
          return acc
        }, {} as Record<string, boolean>)
      })
    }

    // Récupérer les permissions actives du rôle de l'utilisateur
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: session.user.role as RoleUtilisateur,
        active: true,
        permission: {
          nom: {
            in: requestedPermissions
          }
        }
      },
      include: {
        permission: true
      }
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