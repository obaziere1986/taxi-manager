import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, chauffeurId, prix, notes, statut } = body

    const course = await prisma.course.update({
      where: { id },
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
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        chauffeur: {
          select: { id: true, nom: true, prenom: true, vehicule: true }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.course.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Course supprimée avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la course' }, { status: 500 })
  }
}