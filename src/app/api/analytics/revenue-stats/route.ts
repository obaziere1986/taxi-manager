import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

export async function GET() {
  try {
    const revenueStats = await executeWithRetry(async (prisma) => {
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

      // Récupérer les courses terminées pour chaque période
      const [
        coursesToday,
        coursesYesterday,
        coursesThisWeek,
        coursesLastWeek,
        coursesThisMonth,
        coursesLastMonth
      ] = await Promise.all([
        prisma.course.findMany({
          where: {
            statut: 'TERMINEE',
            dateHeure: { gte: todayStart, lte: todayEnd }
          }
        }),
        prisma.course.findMany({
          where: {
            statut: 'TERMINEE',
            dateHeure: { gte: yesterdayStart, lte: yesterdayEnd }
          }
        }),
        prisma.course.findMany({
          where: {
            statut: 'TERMINEE',
            dateHeure: { gte: weekStart, lte: weekEnd }
          }
        }),
        prisma.course.findMany({
          where: {
            statut: 'TERMINEE',
            dateHeure: { gte: lastWeekStart, lte: lastWeekEnd }
          }
        }),
        prisma.course.findMany({
          where: {
            statut: 'TERMINEE',
            dateHeure: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.course.findMany({
          where: {
            statut: 'TERMINEE',
            dateHeure: { gte: lastMonthStart, lte: lastMonthEnd }
          }
        })
      ])

      // Calculer les revenus
      const calculateRevenue = (courses: { prix?: number | null }[]) => 
        courses.reduce((sum, course) => sum + (course.prix || 0), 0)

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