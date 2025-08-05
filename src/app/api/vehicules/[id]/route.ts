import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un véhicule par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vehicule = await prisma.vehicule.findUnique({
      where: { id },
      include: {
        chauffeurs: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            statut: true
          }
        }
      }
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

    // Vérifier que le véhicule existe
    const existingVehicule = await prisma.vehicule.findUnique({
      where: { id }
    })

    if (!existingVehicule) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: 'Cette immatriculation existe déjà' },
          { status: 409 }
        )
      }
    }

    const vehicule = await prisma.vehicule.update({
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
        chauffeurs: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            statut: true
          }
        }
      }
    })

    return NextResponse.json(vehicule)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du véhicule:', error)
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
    
    // Vérifier que le véhicule existe
    const existingVehicule = await prisma.vehicule.findUnique({
      where: { id },
      include: {
        chauffeurs: true
      }
    })

    if (!existingVehicule) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le véhicule n'est pas assigné à un chauffeur
    if (existingVehicule.chauffeurs.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer un véhicule assigné à un ou plusieurs chauffeurs',
          chauffeurs: existingVehicule.chauffeurs.map(c => `${c.prenom} ${c.nom}`)
        },
        { status: 409 }
      )
    }

    await prisma.vehicule.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Véhicule supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du véhicule' },
      { status: 500 }
    )
  }
}