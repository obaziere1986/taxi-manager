import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chauffeurId, userId, vehiculeId, dateDebut, notes } = body

    if ((!chauffeurId && !userId) || !vehiculeId) {
      return NextResponse.json(
        { error: 'Un chauffeurId ou userId et vehiculeId sont requis' }, 
        { status: 400 }
      )
    }

    let chauffeur = null
    let user = null

    // Vérifier si le chauffeur existe
    if (chauffeurId) {
      chauffeur = await prisma.chauffeur.findUnique({
        where: { id: chauffeurId }
      })

      if (!chauffeur) {
        return NextResponse.json(
          { error: 'Chauffeur non trouvé' }, 
          { status: 404 }
        )
      }
    }

    // Vérifier si l'utilisateur existe
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' }, 
          { status: 404 }
        )
      }
    }

    // Vérifier si le véhicule existe et est actif
    const vehicule = await prisma.vehicule.findUnique({
      where: { id: vehiculeId }
    })

    if (!vehicule || !vehicule.actif) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé ou inactif' }, 
        { status: 404 }
      )
    }

    // Terminer les assignations actives existantes pour cette personne
    if (chauffeurId) {
      await prisma.vehiculeAssignation.updateMany({
        where: {
          chauffeurId: chauffeurId,
          actif: true
        },
        data: {
          actif: false,
          dateFin: new Date()
        }
      })
    }

    if (userId) {
      await prisma.vehiculeAssignation.updateMany({
        where: {
          userId: userId,
          actif: true
        },
        data: {
          actif: false,
          dateFin: new Date()
        }
      })
    }

    // Terminer les assignations actives existantes pour ce véhicule
    await prisma.vehiculeAssignation.updateMany({
      where: {
        vehiculeId: vehiculeId,
        actif: true
      },
      data: {
        actif: false,
        dateFin: new Date()
      }
    })

    // Créer la nouvelle assignation
    const assignation = await prisma.vehiculeAssignation.create({
      data: {
        chauffeurId: chauffeurId || null,
        userId: userId || null,
        vehiculeId,
        dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
        actif: true,
        notes
      },
      include: {
        chauffeur: chauffeurId ? {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        } : false,
        user: userId ? {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        } : false,
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

    // Mettre à jour le chauffeur avec le véhicule assigné (si c'est un chauffeur)
    if (chauffeurId && chauffeur) {
      await prisma.chauffeur.update({
        where: { id: chauffeurId },
        data: {
          vehicule: `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`,
          vehiculeId: vehiculeId
        }
      })
    }

    return NextResponse.json(assignation, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de l\'assignation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation du véhicule' }, 
      { status: 500 }
    )
  }
}