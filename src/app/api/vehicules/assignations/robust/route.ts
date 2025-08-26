import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Assignations robuste - début')
    
    const { searchParams } = new URL(request.url)
    const vehiculeId = searchParams.get('vehiculeId')
    
    // Requête simple d'abord
    const assignationsBasic = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('vehicule_assignations')
        .select('id, actif, date_debut, date_fin, vehicule_id, user_id')
        .order('actif', { ascending: false })
        .order('date_debut', { ascending: false })
      
      if (vehiculeId) {
        query = query.eq('vehicule_id', vehiculeId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    })
    
    console.log('🎯 Filtre vehiculeId:', vehiculeId)
    
    console.log(`📊 ${assignationsBasic.length} assignations de base trouvées`)

    // Maintenant ajouter les relations
    const assignations = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('vehicule_assignations')
        .select(`
          *,
          vehicule:vehicules(
            id,
            marque,
            modele,
            immatriculation
          ),
          user:users(
            id,
            nom,
            prenom,
            role
          )
        `)
        .order('actif', { ascending: false })
        .order('date_debut', { ascending: false })
      
      if (vehiculeId) {
        query = query.eq('vehicule_id', vehiculeId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
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
      dateDebut: a.date_debut,
      dateFin: a.date_fin || null,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      // Mapping pour compatibilité
      date_debut: a.date_debut,
      date_fin: a.date_fin,
      vehiculeId: a.vehicule_id,
      userId: a.user_id
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