import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

// GET - Test simple des assignations
export async function GET() {
  try {
    console.log('🔄 Test API assignations...')
    
    const assignations = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
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
      
      if (error) throw error
      return data || []
    })

    console.log(`✅ ${assignations.length} assignations récupérées`)
    return NextResponse.json(assignations)
  } catch (error) {
    console.error('❌ Erreur API test:', error)
    return NextResponse.json(
      { error: 'Erreur test', details: error instanceof Error ? error.message : 'Inconnue' },
      { status: 500 }
    )
  }
}