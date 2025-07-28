import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, chauffeurId, prix, notes, statut } = body

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        origine,
        destination,
        dateHeure: dateHeure ? new Date(dateHeure) : undefined,
        clientId,
        chauffeurId: chauffeurId || null,
        prix: prix ? parseFloat(prix) : null,
        notes: notes || null,
        statut: statut || undefined,
      },
      include: {
        client: {
          select: { nom: true, telephone: true }
        },
        chauffeur: {
          select: { nom: true, vehicule: true }
        }
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la course' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.course.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Course supprimée avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la course' }, { status: 500 })
  }
}