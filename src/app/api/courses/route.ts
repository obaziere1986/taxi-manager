import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const courses = await executeWithRetry(async (prisma) => {
      // Si un userId est fourni, récupérer ses courses assignées + les courses non assignées
      const where = userId ? {
        OR: [
          { userId: userId },           // Ses courses assignées
          { userId: null }              // Courses non assignées
        ]
      } : {}

      return await prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(courses)
  } catch (error) {
    console.error('Erreur récupération courses:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des courses',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, userId, notes, statut } = body

    const course = await executeWithRetry(async (prisma) => {
      return await prisma.course.create({
        data: {
          origine,
          destination,
          dateHeure: new Date(dateHeure),
          clientId,
          userId: userId || null,
          notes: notes || null,
          statut: statut || 'EN_ATTENTE',
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

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Erreur création course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}