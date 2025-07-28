import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, vehicule, statut } = body

    const chauffeur = await prisma.chauffeur.update({
      where: { id: params.id },
      data: {
        nom,
        prenom,
        telephone,
        vehicule,
        statut,
      },
    })

    return NextResponse.json(chauffeur)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du chauffeur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.chauffeur.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Chauffeur supprimé avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression du chauffeur' }, { status: 500 })
  }
}