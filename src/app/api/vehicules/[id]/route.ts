import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

// GET - Récupérer un véhicule par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vehicule = await executeWithRetry(async (prisma) => {
      return await prisma.vehicule.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              telephone: true,
              role: true,
              statut: true
            }
          },
          assignations: {
            where: { actif: true },
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
        }
      })
    })

    if (!vehicule) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(vehicule)
  } catch (error) {
    console.error('Erreur lors de la récupération du véhicule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du véhicule' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un véhicule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const vehicule = await executeWithRetry(async (prisma) => {
      // Vérifier que le véhicule existe
      const existingVehicule = await prisma.vehicule.findUnique({
        where: { id }
      })

      if (!existingVehicule) {
        throw new Error('VEHICLE_NOT_FOUND')
      }

      // Si l'immatriculation est modifiée, vérifier qu'elle n'existe pas déjà
      if (body.immatriculation && body.immatriculation !== existingVehicule.immatriculation) {
        const duplicateVehicule = await prisma.vehicule.findFirst({
          where: {
            immatriculation: body.immatriculation.toUpperCase(),
            id: { not: id }
          }
        })

        if (duplicateVehicule) {
          throw new Error('DUPLICATE_IMMATRICULATION')
        }
      }

      return await prisma.vehicule.update({
        where: { id },
        data: {
          ...(body.marque && { marque: body.marque }),
          ...(body.modele && { modele: body.modele }),
          ...(body.immatriculation && { immatriculation: body.immatriculation.toUpperCase() }),
          ...(body.couleur !== undefined && { couleur: body.couleur }),
          ...(body.annee !== undefined && { annee: body.annee ? parseInt(body.annee) : null }),
          ...(body.actif !== undefined && { actif: body.actif }),
          ...(body.kilometrage !== undefined && { kilometrage: body.kilometrage ? parseInt(body.kilometrage) : 0 }),
          ...(body.carburant !== undefined && { carburant: body.carburant }),
          ...(body.prochaineVidange !== undefined && { prochaineVidange: body.prochaineVidange ? new Date(body.prochaineVidange) : null }),
          ...(body.prochainEntretien !== undefined && { prochainEntretien: body.prochainEntretien ? new Date(body.prochainEntretien) : null }),
          ...(body.prochainControleTechnique !== undefined && { prochainControleTechnique: body.prochainControleTechnique ? new Date(body.prochainControleTechnique) : null }),
          ...(body.notes !== undefined && { notes: body.notes })
        },
        include: {
          users: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              telephone: true,
              role: true,
              statut: true
            }
          },
          assignations: {
            where: { actif: true },
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
        }
      })
    })

    return NextResponse.json(vehicule)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du véhicule:', error)
    
    if (error instanceof Error) {
      if (error.message === 'VEHICLE_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Véhicule non trouvé' },
          { status: 404 }
        )
      }
      if (error.message === 'DUPLICATE_IMMATRICULATION') {
        return NextResponse.json(
          { error: 'Cette immatriculation existe déjà' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du véhicule' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un véhicule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await executeWithRetry(async (prisma) => {
      // Vérifier que le véhicule existe
      const existingVehicule = await prisma.vehicule.findUnique({
        where: { id },
        include: {
          assignations: {
            where: { actif: true },
            include: {
              user: {
                select: {
                  nom: true,
                  prenom: true
                }
              }
            }
          }
        }
      })

      if (!existingVehicule) {
        throw new Error('VEHICLE_NOT_FOUND')
      }

      // Vérifier que le véhicule n'est pas assigné
      if (existingVehicule.assignations.length > 0) {
        const assignedUsers = existingVehicule.assignations.map(a => 
          `${a.user.prenom} ${a.user.nom}`
        )
        throw new Error(`VEHICLE_ASSIGNED:${assignedUsers.join(', ')}`)
      }

      await prisma.vehicule.delete({
        where: { id }
      })
      
      return { success: true }
    })

    return NextResponse.json(
      { message: 'Véhicule supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error)
    
    if (error instanceof Error) {
      if (error.message === 'VEHICLE_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Véhicule non trouvé' },
          { status: 404 }
        )
      }
      if (error.message.startsWith('VEHICLE_ASSIGNED:')) {
        const assignedUsers = error.message.split(':')[1]
        return NextResponse.json(
          { 
            error: 'Impossible de supprimer un véhicule assigné',
            details: `Assigné à: ${assignedUsers}`
          },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du véhicule' },
      { status: 500 }
    )
  }
}