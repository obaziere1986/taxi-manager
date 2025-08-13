import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

// GET - Récupérer un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await executeWithRetry(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: { courses: true }
          }
        }
      })
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const user = await executeWithRetry(async (prisma) => {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        throw new Error('USER_NOT_FOUND')
      }

      // Si l'email est modifié, vérifier qu'il n'existe pas déjà
      if (body.email && body.email !== existingUser.email) {
        const duplicateUser = await prisma.user.findFirst({
          where: {
            email: body.email.toLowerCase(),
            id: { not: id }
          }
        })

        if (duplicateUser) {
          throw new Error('EMAIL_EXISTS')
        }
      }

      return await prisma.user.update({
        where: { id },
        data: {
          ...(body.nom && { nom: body.nom.toUpperCase() }),
          ...(body.prenom && { prenom: body.prenom }),
          ...(body.email && { email: body.email.toLowerCase() }),
          ...(body.telephone !== undefined && { telephone: body.telephone }),
          ...(body.role && { role: body.role }),
          ...(body.statut !== undefined && { statut: body.statut }),
          ...(body.vehicule !== undefined && { vehicule: body.vehicule }),
          ...(body.vehiculeId !== undefined && { vehiculeId: body.vehiculeId }),
          ...(body.actif !== undefined && { actif: body.actif })
        },
        include: {
          _count: {
            select: { courses: true }
          }
        }
      })
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }
      
      if (error.message === 'EMAIL_EXISTS') {
        return NextResponse.json(
          { error: 'Cette adresse email existe déjà' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await executeWithRetry(async (prisma) => {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: {
          courses: { where: { statut: 'EN_COURS' } },
          assignations: { where: { actif: true } }
        }
      })

      if (!existingUser) {
        throw new Error('USER_NOT_FOUND')
      }

      // Vérifier que l'utilisateur n'a pas de courses en cours ou d'assignations actives
      if (existingUser.courses.length > 0) {
        throw new Error('USER_HAS_ACTIVE_COURSES')
      }

      if (existingUser.assignations.length > 0) {
        throw new Error('USER_HAS_ACTIVE_ASSIGNMENTS')
      }

      return await prisma.user.delete({
        where: { id }
      })
    })

    return NextResponse.json(
      { message: 'Utilisateur supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }
      
      if (error.message === 'USER_HAS_ACTIVE_COURSES') {
        return NextResponse.json(
          { error: 'Impossible de supprimer un utilisateur avec des courses en cours' },
          { status: 409 }
        )
      }
      
      if (error.message === 'USER_HAS_ACTIVE_ASSIGNMENTS') {
        return NextResponse.json(
          { error: 'Impossible de supprimer un utilisateur avec des assignations actives' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}