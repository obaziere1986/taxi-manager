import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Test simple des assignations
export async function GET() {
  try {
    console.log('🔄 Test API assignations...')
    
    const assignations = await prisma.vehiculeAssignation.findMany({
      include: {
        vehicule: {
          select: {
            id: true,
            marque: true,
            modele: true,
            immatriculation: true
          }
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      },
      orderBy: [
        { actif: 'desc' },
        { dateDebut: 'desc' }
      ]
    })

    console.log(`✅ ${assignations.length} assignations récupérées`)
    return NextResponse.json(assignations)
  } catch (error) {
    console.error('❌ Erreur API test:', error)
    return NextResponse.json(
      { error: 'Erreur test', details: error instanceof Error ? error.message : 'Inconnue' },
      { status: 500 }
    )
  }
}