import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET() {
  try {
    const performance = await executeWithRetry(async (supabase) => {
      // Date d'il y a 30 jours
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      // Récupérer tous les chauffeurs actifs (users avec role Chauffeur)
      const { data: chauffeurs, error: chauffeursError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'Chauffeur')
        .eq('actif', true)

      if (chauffeursError) {
        console.error('Erreur lors de la récupération des chauffeurs:', chauffeursError)
        throw chauffeursError
      }

      if (!chauffeurs || chauffeurs.length === 0) {
        return []
      }

      // Récupérer les courses terminées des 30 derniers jours pour tous les chauffeurs
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('user_id, id')
        .eq('statut', 'TERMINEE')
        .gte('date_heure', thirtyDaysAgo.toISOString())
        .in('user_id', chauffeurs.map(c => c.id))

      if (coursesError) {
        console.error('Erreur lors de la récupération des courses:', coursesError)
        throw coursesError
      }

      // Calculer les métriques pour chaque chauffeur
      const performanceData = chauffeurs.map(chauffeur => {
        const coursesTerminees = courses?.filter(c => c.user_id === chauffeur.id) || []

        return {
          id: chauffeur.id,
          nom: chauffeur.nom,
          prenom: chauffeur.prenom,
          vehicule: chauffeur.vehicule || 'N/A',
          statut: chauffeur.statut || 'DISPONIBLE',
          coursesTerminees: coursesTerminees.length
        }
      })

      // Trier par nombre de courses terminées (performance)
      return performanceData.sort((a, b) => b.coursesTerminees - a.coursesTerminees)
    })

    return NextResponse.json(performance)
  } catch (error) {
    console.error('Erreur lors du calcul des performances chauffeurs:', error)
    return NextResponse.json([], { status: 500 })
  }
}