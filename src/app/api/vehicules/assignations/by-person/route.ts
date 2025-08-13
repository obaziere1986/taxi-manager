import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      )
    }

    const whereClause = {
      actif: true,
      userId: userId
    }

    const assignations = await executeWithRetry(async (prisma) => {
      return await prisma.vehiculeAssignation.findMany({
        where: whereClause,
        include: {
          vehicule: {
            select: {
              id: true,
              marque: true,
              modele: true,
              immatriculation: true
            }
          }
        }
      })
    })

    return NextResponse.json(assignations)
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations par personne:', error)
    return NextResponse.json([], { status: 200 })
  }
}