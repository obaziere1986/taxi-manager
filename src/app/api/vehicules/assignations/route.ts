import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer toutes les assignations véhicule-chauffeur
export async function GET() {
  try {
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
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: [
        { actif: 'desc' },  // Assignations actives en premier
        { dateDebut: 'desc' }  // Plus récentes en premier
      ]
    })

    return NextResponse.json(assignations)
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations' },
      { status: 500 }
    )
  }
}