import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, userId, notes, statut } = body

    const course = await executeWithRetry(async (prisma) => {
      // D'abord récupérer la course existante pour la logique automatique
      const existingCourse = await prisma.course.findUnique({
        where: { id }
      })
      
      if (!existingCourse) {
        throw new Error('Course non trouvée')
      }
      
      // Construire l'objet data seulement avec les champs fournis
      const updateData: any = {}
      
      if (origine !== undefined) updateData.origine = origine
      if (destination !== undefined) updateData.destination = destination
      if (dateHeure !== undefined) updateData.dateHeure = new Date(dateHeure)
      if (clientId !== undefined) updateData.clientId = clientId
      if (userId !== undefined) updateData.userId = userId || null
      if (notes !== undefined) updateData.notes = notes || null
      if (statut !== undefined) updateData.statut = statut
      
      // Logique automatique du statut si userId change et que statut n'est pas explicitement fourni
      if (userId !== undefined && statut === undefined) {
        const newUserId = userId || null
        const currentUserId = existingCourse.userId
        
        // Si on assigne un chauffeur à une course EN_ATTENTE, passer à ASSIGNEE
        if (newUserId && !currentUserId && existingCourse.statut === 'EN_ATTENTE') {
          updateData.statut = 'ASSIGNEE'
        }
        // Si on retire le chauffeur d'une course ASSIGNEE, retourner à EN_ATTENTE
        else if (!newUserId && currentUserId && existingCourse.statut === 'ASSIGNEE') {
          updateData.statut = 'EN_ATTENTE'
        }
      }
      
      return await prisma.course.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: { id: true, nom: true, prenom: true, telephone: true }
          },
          user: {
            select: { id: true, nom: true, prenom: true, vehicule: true, role: true }
          }
        }
      })
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Erreur mise à jour course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await executeWithRetry(async (prisma) => {
      return await prisma.course.delete({
        where: { id },
      })
    })

    return NextResponse.json({ message: 'Course supprimée avec succès' })
  } catch (error) {
    console.error('Erreur suppression course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}