import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      )
    }

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
          )
        `)
        .eq('actif', true)
        .eq('user_id', userId)
      
      if (error) throw error
      return data || []
    })

    return NextResponse.json(assignations)
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations par personne:', error)
    return NextResponse.json([], { status: 200 })
  }
}