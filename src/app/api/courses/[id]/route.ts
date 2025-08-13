import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, userId, prix, notes, statut } = body

    const course = await executeWithRetry(async (prisma) => {
      return await prisma.course.update({
        where: { id },
        data: {
          origine,
          destination,
          dateHeure: dateHeure ? new Date(dateHeure) : undefined,
          clientId,
          userId: userId || null,
          prix: prix ? parseFloat(prix) : null,
          notes: notes || null,
          statut: statut || undefined,
        },
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