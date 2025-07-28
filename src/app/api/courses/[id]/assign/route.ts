import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { chauffeurId } = body

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        chauffeurId: chauffeurId || null,
        statut: chauffeurId ? 'ASSIGNEE' : 'EN_ATTENTE',
      },
      include: {
        client: {
          select: { nom: true, prenom: true, telephone: true }
        },
        chauffeur: {
          select: { nom: true, prenom: true, vehicule: true }
        }
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'assignation de la course' }, { status: 500 })
  }
}