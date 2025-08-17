import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔄 API Véhicules avec assignations - début')
    
    // Récupérer tous les véhicules avec leurs assignations actives
    const vehicules = await executeWithRetry(async (prisma) => {
      return await prisma.vehicule.findMany({
        include: {
          assignations: {
            where: {
              actif: true
            },
            include: {
              user: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: [
          { actif: 'desc' },
          { marque: 'asc' },
          { modele: 'asc' }
        ]
      })
    })

    // Transformer pour organiser par catégories
    const vehiculesWithStatus = vehicules.map(vehicule => {
      const assignationActive = vehicule.assignations[0] || null
      
      return {
        id: vehicule.id,
        marque: vehicule.marque,
        modele: vehicule.modele,
        immatriculation: vehicule.immatriculation,
        couleur: vehicule.couleur,
        annee: vehicule.annee,
        actif: vehicule.actif,
        isAssigned: !!assignationActive,
        assignation: assignationActive ? {
          id: assignationActive.id,
          dateDebut: assignationActive.dateDebut.toISOString(),
          assignedTo: `${assignationActive.user.nom.toUpperCase()}, ${assignationActive.user.prenom}`,
          assignedToRole: assignationActive.user.role,
          assignedToId: assignationActive.user.id
        } : null
      }
    })

    console.log(`✅ ${vehiculesWithStatus.length} véhicules récupérés avec statut d'assignation`)
    
    return NextResponse.json(vehiculesWithStatus, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur dans l\'API véhicules avec assignations:', error)
    return NextResponse.json([], { 
      status: 200,
      headers: { 'X-Error': 'true' }
    })
  }
}