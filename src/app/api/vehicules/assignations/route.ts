import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer toutes les assignations véhicule-chauffeur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehiculeId = searchParams.get('vehiculeId')
    
    const whereClause = vehiculeId ? { vehiculeId: vehiculeId } : {}
    
    const assignations = await prisma.vehiculeAssignation.findMany({
      where: whereClause,
      include: {
        vehicule: {
          select: {
            id: true,
            marque: true,
            modele: true,
            immatriculation: true
          }
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true
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
        { actif: 'desc' },  // Assignations actives en premier
        { dateDebut: 'desc' }  // Plus récentes en premier
      ]
    })

    console.log(`📊 Récupéré ${assignations.length} assignations`)
    console.log('🔍 Première assignation:', JSON.stringify(assignations[0], null, 2))
    return NextResponse.json(assignations)
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error)
    console.error('Details:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}