import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id }
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

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: 'Cette adresse email existe déjà' },
          { status: 409 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.nom && { nom: body.nom.toUpperCase() }),
        ...(body.prenom && { prenom: body.prenom }),
        ...(body.email && { email: body.email.toLowerCase() }),
        ...(body.telephone !== undefined && { telephone: body.telephone }),
        ...(body.role && { role: body.role }),
        ...(body.actif !== undefined && { actif: body.actif })
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
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
    
    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        chauffeur: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur n'est pas lié à un chauffeur actif
    if (existingUser.chauffeur) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer un utilisateur lié à un chauffeur actif',
          chauffeur: `${existingUser.chauffeur.prenom} ${existingUser.chauffeur.nom}`
        },
        { status: 409 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Utilisateur supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}