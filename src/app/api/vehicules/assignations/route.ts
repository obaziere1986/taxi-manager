import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer toutes les assignations véhicule-user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehiculeId = searchParams.get('vehiculeId')
    
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

    console.log(`📊 Récupéré ${assignations.length} assignations`)
    console.log('🔍 Première assignation:', JSON.stringify(assignations[0], null, 2))
    return NextResponse.json(assignations)
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error)
    console.error('Details:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}