import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    const course = await executeWithRetry(async (prisma) => {
      // Vérifier que la course existe
      const existingCourse = await prisma.course.findUnique({
        where: { id }
      })

      if (!existingCourse) {
        throw new Error('Course non trouvée')
      }

      // Si on assigne à un utilisateur, vérifier qu'il existe et qu'il est chauffeur
      if (userId) {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId }
        })

        if (!existingUser) {
          throw new Error('Utilisateur non trouvé')
        }
        
        if (existingUser.role !== 'Chauffeur') {
          throw new Error('L\'utilisateur n\'est pas un chauffeur')
        }
      }

      return await prisma.course.update({
        where: { id },
        data: {
          userId: userId || null,
          statut: userId ? 'ASSIGNEE' : 'EN_ATTENTE',
        },
        include: {
          client: {
            select: { nom: true, prenom: true, telephone: true }
          },
          user: {
            select: { nom: true, prenom: true, vehicule: true, role: true }
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