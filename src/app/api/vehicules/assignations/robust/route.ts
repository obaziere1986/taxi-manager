import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Assignations robuste - début')
    
    const { searchParams } = new URL(request.url)
    const vehiculeId = searchParams.get('vehiculeId')
    
    // Construire la clause WHERE
    const whereClause = vehiculeId ? { vehiculeId: vehiculeId } : {}
    console.log('🎯 Clause WHERE:', whereClause)
    
    // Requête simple d'abord
    const assignationsBasic = await prisma.vehiculeAssignation.findMany({
      where: whereClause,
      select: {
        id: true,
        actif: true,
        dateDebut: true,
        dateFin: true,
        vehiculeId: true,
        userId: true
      },
      orderBy: [
        { actif: 'desc' },
        { dateDebut: 'desc' }
      ]
    })
    
    console.log(`📊 ${assignationsBasic.length} assignations de base trouvées`)

    // Maintenant ajouter les relations
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

    console.log(`✅ ${assignations.length} assignations avec relations récupérées`)
    
    // Vérifier que c'est bien un tableau
    if (!Array.isArray(assignations)) {
      console.error('❌ Le résultat n\'est pas un tableau!')
      return NextResponse.json([], { status: 200 })
    }

    // Transformer les dates en strings pour éviter les problèmes de sérialisation
    const assignationsSerializable = assignations.map(a => ({
      ...a,
      dateDebut: a.dateDebut.toISOString(),
      dateFin: a.dateFin?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString()
    }))

    console.log('🚀 Envoi de la réponse...')
    return NextResponse.json(assignationsSerializable, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur dans l\'API assignations:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack')
    
    // Toujours retourner un tableau vide en cas d'erreur
    return NextResponse.json([], { 
      status: 200,
      headers: { 'X-Error': 'true' }
    })
  }
}