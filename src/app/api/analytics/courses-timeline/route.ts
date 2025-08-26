import { NextResponse } from 'next/server'
import { executeWithRetry, getSupabaseClient } from '@/lib/supabase'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET() {
  try {
    const timelineData = await executeWithRetry(async (supabase) => {
      // Obtenir les données des 7 derniers jours
      const today = new Date()

      const data = []

      for (let i = 0; i < 7; i++) {
        const currentDate = subDays(today, 6 - i)
        const dayStart = startOfDay(currentDate)
        const dayEnd = endOfDay(currentDate)

        // Récupérer les courses pour ce jour avec Supabase
        const { data: coursesForDay, error } = await supabase
          .from('courses')
          .select('*')
          .gte('date_heure', dayStart.toISOString())
          .lte('date_heure', dayEnd.toISOString())

        if (error) {
          console.error('Erreur Supabase pour', currentDate, ':', error)
          throw error
        }

        const totalCourses = coursesForDay?.length || 0
        const coursesTerminees = coursesForDay?.filter(c => c.statut === 'TERMINEE').length || 0
        const coursesAnnulees = coursesForDay?.filter(c => c.statut === 'ANNULEE').length || 0
        const revenu = coursesForDay
          ?.filter(c => c.statut === 'TERMINEE' && c.prix)
          .reduce((sum, c) => sum + (parseFloat(c.prix?.toString() || '0') || 0), 0) || 0

        data.push({
          date: format(currentDate, 'dd/MM', { locale: fr }),
          fullDate: currentDate.toISOString(),
          totalCourses,
          coursesTerminees,
          coursesAnnulees,
          revenu: Math.round(revenu * 100) / 100
        })
      }

      return data
    })

    return NextResponse.json(timelineData)
  } catch (error) {
    console.error('Erreur lors du calcul de la timeline:', error)
    return NextResponse.json([], { status: 500 })
  }
}