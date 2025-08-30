import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer tous les véhicules
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  try {
    const vehicules = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .order('actif', { ascending: false })
        .order('marque', { ascending: true })
        .order('modele', { ascending: true })

      if (error) throw error
      return data || []
    })

    // Mapper les champs pour compatibilité frontend (snake_case -> camelCase)
    const vehiculesFormatted = vehicules.map(vehicule => ({
      ...vehicule,
      prochaineVidange: vehicule.prochaine_vidange,
      prochainEntretien: vehicule.prochain_entretien,
      prochainControleTechnique: vehicule.prochain_controle_technique,
      createdAt: vehicule.created_at,
      updatedAt: vehicule.updated_at
    }))

    return NextResponse.json(vehiculesFormatted)
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

    const vehicule = await executeWithRetry(async (supabase) => {
      // Vérifier que l'immatriculation n'existe pas déjà
      const { data: existingVehicule, error: checkError } = await supabase
        .from('vehicules')
        .select('id')
        .eq('immatriculation', body.immatriculation)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingVehicule) {
        throw new Error('IMMATRICULATION_EXISTS')
      }

      const { data, error } = await supabase
        .from('vehicules')
        .insert({
          marque: body.marque,
          modele: body.modele,
          immatriculation: body.immatriculation.toUpperCase(),
          couleur: body.couleur || null,
          annee: body.annee ? parseInt(body.annee) : null,
          actif: body.actif !== undefined ? body.actif : true,
          kilometrage: body.kilometrage ? parseInt(body.kilometrage) : 0,
          carburant: body.carburant || null,
          prochaine_vidange: body.prochaineVidange ? new Date(body.prochaineVidange).toISOString() : null,
          prochain_entretien: body.prochainEntretien ? new Date(body.prochainEntretien).toISOString() : null,
          prochain_controle_technique: body.prochainControleTechnique ? new Date(body.prochainControleTechnique).toISOString() : null,
          notes: body.notes || null
        })
        .select('*')
        .single()

      if (error) throw error
      return data
    })

    // Mapper les champs pour compatibilité frontend
    const vehiculeFormatted = {
      ...vehicule,
      prochaineVidange: vehicule.prochaine_vidange,
      prochainEntretien: vehicule.prochain_entretien,
      prochainControleTechnique: vehicule.prochain_controle_technique,
      createdAt: vehicule.created_at,
      updatedAt: vehicule.updated_at
    }

    return NextResponse.json(vehiculeFormatted, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du véhicule:', error)
    
    if (error instanceof Error && error.message === 'IMMATRICULATION_EXISTS') {
      return NextResponse.json(
        { error: 'Cette immatriculation existe déjà' },
        { status: 409 }
      )
    }
    
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