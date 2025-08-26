import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

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

    const assignation = await executeWithRetry(async (supabase) => {
      // Vérifier que l'utilisateur existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (userError || !user) {
        throw new Error('Utilisateur non trouvé')
      }

      // Vérifier si le véhicule existe et est actif
      const { data: vehicule, error: vehiculeError } = await supabase
        .from('vehicules')
        .select('*')
        .eq('id', vehiculeId)
        .single()
      
      if (vehiculeError || !vehicule || !vehicule.actif) {
        throw new Error('Véhicule non trouvé ou inactif')
      }

      // Terminer les assignations actives existantes pour cet utilisateur
      const { error: endUserAssignError } = await supabase
        .from('vehicule_assignations')
        .update({
          actif: false,
          date_fin: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('actif', true)
      
      if (endUserAssignError) throw endUserAssignError

      // Terminer les assignations actives existantes pour ce véhicule
      const { error: endVehicleAssignError } = await supabase
        .from('vehicule_assignations')
        .update({
          actif: false,
          date_fin: new Date().toISOString()
        })
        .eq('vehicule_id', vehiculeId)
        .eq('actif', true)
      
      if (endVehicleAssignError) throw endVehicleAssignError

      // Créer la nouvelle assignation
      const { data: newAssignation, error: createError } = await supabase
        .from('vehicule_assignations')
        .insert({
          user_id: userId,
          vehicule_id: vehiculeId,
          date_debut: dateDebut ? new Date(dateDebut).toISOString() : new Date().toISOString(),
          actif: true,
          notes
        })
        .select(`
          *,
          user:users(
            id,
            nom,
            prenom,
            role
          ),
          vehicule:vehicules(
            id,
            marque,
            modele,
            immatriculation
          )
        `)
        .single()
      
      if (createError) throw createError

      // Mettre à jour l'utilisateur avec le véhicule assigné (si c'est un chauffeur)
      if (user.role === 'Chauffeur') {
        const { error: updateUserError } = await supabase
          .from('users')
          .update({
            vehicule_id: vehiculeId
          })
          .eq('id', userId)
        
        if (updateUserError) throw updateUserError
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