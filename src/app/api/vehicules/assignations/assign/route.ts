import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vehiculeId, dateDebut, notes } = body

    if (!userId || !vehiculeId) {
      return NextResponse.json(
        { error: 'userId et vehiculeId sont requis' }, 
        { status: 400 }
      )
    }

    const assignation = await executeWithRetry(async (prisma) => {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('Utilisateur non trouvé')
      }

      // Vérifier si le véhicule existe et est actif
      const vehicule = await prisma.vehicule.findUnique({
        where: { id: vehiculeId }
      })

      if (!vehicule || !vehicule.actif) {
        throw new Error('Véhicule non trouvé ou inactif')
      }

      // Terminer les assignations actives existantes pour cet utilisateur
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
      const newAssignation = await prisma.vehiculeAssignation.create({
        data: {
          userId,
          vehiculeId,
          dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
          actif: true,
          notes
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          },
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

      // Mettre à jour l'utilisateur avec le véhicule assigné (si c'est un chauffeur)
      if (user.role === 'Chauffeur') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            vehicule: `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`,
            vehiculeId: vehiculeId
          }
        })
      }

      return newAssignation
    })

    return NextResponse.json(assignation, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de l\'assignation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation du véhicule' }, 
      { status: 500 }
    )
  }
}