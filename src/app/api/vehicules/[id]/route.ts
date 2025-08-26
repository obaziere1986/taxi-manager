import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer un véhicule par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vehicule = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('vehicules')
        .select(`
          *,
          assignations:vehicule_assignations!vehicule_id(
            *,
            user:users(
              id,
              nom,
              prenom,
              role
            )
          )
        `)
        .eq('id', id)
        .eq('assignations.actif', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    })

    if (!vehicule) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    // Mapper les champs pour compatibilité frontend
    const vehiculeFormatted = {
      ...vehicule,
      prochaineVidange: vehicule.prochaine_vidange,
      prochainEntretien: vehicule.prochain_entretien,
      prochainControleTechnique: vehicule.prochain_controle_technique,
      createdAt: vehicule.created_at,
      updatedAt: vehicule.updated_at
    }

    return NextResponse.json(vehiculeFormatted)
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

    const vehicule = await executeWithRetry(async (supabase) => {
      // Vérifier que le véhicule existe
      const { data: existingVehicule, error: findError } = await supabase
        .from('vehicules')
        .select('*')
        .eq('id', id)
        .single()
      
      if (findError || !existingVehicule) {
        throw new Error('VEHICLE_NOT_FOUND')
      }

      // Si l'immatriculation est modifiée, vérifier qu'elle n'existe pas déjà
      if (body.immatriculation && body.immatriculation !== existingVehicule.immatriculation) {
        const { data: duplicateVehicule, error: dupError } = await supabase
          .from('vehicules')
          .select('id')
          .eq('immatriculation', body.immatriculation.toUpperCase())
          .neq('id', id)
          .single()
        
        if (dupError && dupError.code !== 'PGRST116') throw dupError
        if (duplicateVehicule) {
          throw new Error('DUPLICATE_IMMATRICULATION')
        }
      }

      // Préparer les données pour la mise à jour
      const updateData: any = {}
      if (body.marque) updateData.marque = body.marque
      if (body.modele) updateData.modele = body.modele
      if (body.immatriculation) updateData.immatriculation = body.immatriculation.toUpperCase()
      if (body.couleur !== undefined) updateData.couleur = body.couleur
      if (body.annee !== undefined) updateData.annee = body.annee ? parseInt(body.annee) : null
      if (body.actif !== undefined) updateData.actif = body.actif
      if (body.kilometrage !== undefined) updateData.kilometrage = body.kilometrage ? parseInt(body.kilometrage) : 0
      if (body.carburant !== undefined) updateData.carburant = body.carburant
      if (body.prochaineVidange !== undefined) updateData.prochaine_vidange = body.prochaineVidange ? new Date(body.prochaineVidange).toISOString() : null
      if (body.prochainEntretien !== undefined) updateData.prochain_entretien = body.prochainEntretien ? new Date(body.prochainEntretien).toISOString() : null
      if (body.prochainControleTechnique !== undefined) updateData.prochain_controle_technique = body.prochainControleTechnique ? new Date(body.prochainControleTechnique).toISOString() : null
      if (body.notes !== undefined) updateData.notes = body.notes

      const { data: updatedVehicule, error: updateError } = await supabase
        .from('vehicules')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      
      if (updateError) throw updateError
      return updatedVehicule
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

    return NextResponse.json(vehiculeFormatted)
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