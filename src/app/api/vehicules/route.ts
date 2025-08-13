import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les véhicules
export async function GET() {
  try {
    const vehicules = await prisma.vehicule.findMany({
      include: {
        users: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            statut: true,
            role: true
          }
        }
      },
      orderBy: [
        { actif: 'desc' },
        { marque: 'asc' },
        { modele: 'asc' }
      ]
    })

    return NextResponse.json(vehicules)
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des véhicules' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau véhicule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const requiredFields = ['marque', 'modele', 'immatriculation']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Vérifier que l'immatriculation n'existe pas déjà
    const existingVehicule = await prisma.vehicule.findFirst({
      where: {
        immatriculation: body.immatriculation
      }
    })

    if (existingVehicule) {
      return NextResponse.json(
        { error: 'Cette immatriculation existe déjà' },
        { status: 409 }
      )
    }

    const vehicule = await prisma.vehicule.create({
      data: {
        marque: body.marque,
        modele: body.modele,
        immatriculation: body.immatriculation.toUpperCase(),
        couleur: body.couleur || null,
        annee: body.annee ? parseInt(body.annee) : null,
        actif: body.actif !== undefined ? body.actif : true,
        kilometrage: body.kilometrage ? parseInt(body.kilometrage) : 0,
        carburant: body.carburant || null,
        prochaineVidange: body.prochaineVidange ? new Date(body.prochaineVidange) : null,
        prochainEntretien: body.prochainEntretien ? new Date(body.prochainEntretien) : null,
        prochainControleTechnique: body.prochainControleTechnique ? new Date(body.prochainControleTechnique) : null,
        notes: body.notes || null
      },
      include: {
        users: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            statut: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(vehicule, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du véhicule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du véhicule' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour tous les véhicules (non utilisé, préférer l'endpoint individuel)
export async function PUT() {
  return NextResponse.json(
    { error: 'Utilisez l\'endpoint /api/vehicules/[id] pour mettre à jour un véhicule' },
    { status: 405 }
  )
}

// DELETE - Supprimer tous les véhicules (dangereux, non implémenté)
export async function DELETE() {
  return NextResponse.json(
    { error: 'Suppression en masse non autorisée' },
    { status: 405 }
  )
}