import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { chauffeurId } = body

    const course = await executeWithRetry(async (prisma) => {
      // Vérifier que la course existe
      const existingCourse = await prisma.course.findUnique({
        where: { id }
      })

      if (!existingCourse) {
        throw new Error('Course non trouvée')
      }

      // Si on assigne à un chauffeur, vérifier qu'il existe
      if (chauffeurId) {
        const existingChauffeur = await prisma.chauffeur.findUnique({
          where: { id: chauffeurId }
        })

        if (!existingChauffeur) {
          throw new Error('Chauffeur non trouvé')
        }
      }

      return await prisma.course.update({
        where: { id },
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
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Erreur assignation course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'assignation de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}