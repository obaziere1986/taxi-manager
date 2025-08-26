import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

export async function GET() {
  try {
    const revenueStats = await executeWithRetry(async (supabase) => {
      const now = new Date()

      // Aujourd'hui
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      
      // Hier
      const yesterday = subDays(now, 1)
      const yesterdayStart = startOfDay(yesterday)
      const yesterdayEnd = endOfDay(yesterday)

      // Cette semaine
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      
      // Semaine dernière
      const lastWeek = subWeeks(now, 1)
      const lastWeekStart = startOfWeek(lastWeek, { weekStartsOn: 1 })
      const lastWeekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 })

      // Ce mois
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      
      // Mois dernier
      const lastMonth = subMonths(now, 1)
      const lastMonthStart = startOfMonth(lastMonth)
      const lastMonthEnd = endOfMonth(lastMonth)

      // Récupérer les courses terminées pour chaque période avec Supabase
      const [
        coursesTodayResult,
        coursesYesterdayResult,
        coursesThisWeekResult,
        coursesLastWeekResult,
        coursesThisMonthResult,
        coursesLastMonthResult
      ] = await Promise.all([
        supabase
          .from('courses')
          .select('prix')
          .eq('statut', 'TERMINEE')
          .gte('date_heure', todayStart.toISOString())
          .lte('date_heure', todayEnd.toISOString()),
        supabase
          .from('courses')
          .select('prix')
          .eq('statut', 'TERMINEE')
          .gte('date_heure', yesterdayStart.toISOString())
          .lte('date_heure', yesterdayEnd.toISOString()),
        supabase
          .from('courses')
          .select('prix')
          .eq('statut', 'TERMINEE')
          .gte('date_heure', weekStart.toISOString())
          .lte('date_heure', weekEnd.toISOString()),
        supabase
          .from('courses')
          .select('prix')
          .eq('statut', 'TERMINEE')
          .gte('date_heure', lastWeekStart.toISOString())
          .lte('date_heure', lastWeekEnd.toISOString()),
        supabase
          .from('courses')
          .select('prix')
          .eq('statut', 'TERMINEE')
          .gte('date_heure', monthStart.toISOString())
          .lte('date_heure', monthEnd.toISOString()),
        supabase
          .from('courses')
          .select('prix')
          .eq('statut', 'TERMINEE')
          .gte('date_heure', lastMonthStart.toISOString())
          .lte('date_heure', lastMonthEnd.toISOString())
      ])

      // Vérifier les erreurs
      const results = [
        coursesTodayResult,
        coursesYesterdayResult,
        coursesThisWeekResult,
        coursesLastWeekResult,
        coursesThisMonthResult,
        coursesLastMonthResult
      ]

      for (const result of results) {
        if (result.error) {
          console.error('Erreur lors de la récupération des courses:', result.error)
          throw result.error
        }
      }

      // Extraire les données
      const coursesToday = coursesTodayResult.data || []
      const coursesYesterday = coursesYesterdayResult.data || []
      const coursesThisWeek = coursesThisWeekResult.data || []
      const coursesLastWeek = coursesLastWeekResult.data || []
      const coursesThisMonth = coursesThisMonthResult.data || []
      const coursesLastMonth = coursesLastMonthResult.data || []

      // Calculer les revenus
      const calculateRevenue = (courses: { prix?: string | number | null }[]) => 
        courses.reduce((sum, course) => {
          const prix = course.prix ? parseFloat(course.prix.toString()) : 0
          return sum + (prix || 0)
        }, 0)

      const revenueToday = calculateRevenue(coursesToday)
      const revenueYesterday = calculateRevenue(coursesYesterday)
      const revenueThisWeek = calculateRevenue(coursesThisWeek)
      const revenueLastWeek = calculateRevenue(coursesLastWeek)
      const revenueThisMonth = calculateRevenue(coursesThisMonth)
      const revenueLastMonth = calculateRevenue(coursesLastMonth)

      // Calculer les taux de croissance
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      return {
        today: {
          revenue: Math.round(revenueToday * 100) / 100,
          courses: coursesToday.length,
          growth: calculateGrowth(revenueToday, revenueYesterday)
        },
        week: {
          revenue: Math.round(revenueThisWeek * 100) / 100,
          courses: coursesThisWeek.length,
          growth: calculateGrowth(revenueThisWeek, revenueLastWeek)
        },
        month: {
          revenue: Math.round(revenueThisMonth * 100) / 100,
          courses: coursesThisMonth.length,
          growth: calculateGrowth(revenueThisMonth, revenueLastMonth)
        },
        averagePerCourse: {
          today: coursesToday.length > 0 ? Math.round((revenueToday / coursesToday.length) * 100) / 100 : 0,
          week: coursesThisWeek.length > 0 ? Math.round((revenueThisWeek / coursesThisWeek.length) * 100) / 100 : 0,
          month: coursesThisMonth.length > 0 ? Math.round((revenueThisMonth / coursesThisMonth.length) * 100) / 100 : 0
        }
      }
    })

    return NextResponse.json(revenueStats)
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques de revenus:', error)
    return NextResponse.json({
      today: { revenue: 0, courses: 0, growth: 0 },
      week: { revenue: 0, courses: 0, growth: 0 },
      month: { revenue: 0, courses: 0, growth: 0 },
      averagePerCourse: { today: 0, week: 0, month: 0 }
    }, { status: 500 })
  }
}