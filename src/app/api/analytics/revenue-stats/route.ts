import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'
import { startOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns'

export async function GET() {
  try {
    const data = await executeWithRetry(async (prisma) => {
      const now = new Date()
      const today = startOfDay(now)
      const yesterday = startOfDay(subDays(now, 1))
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Lundi
      const monthStart = startOfMonth(now)
      
      // Courses terminées d'aujourd'hui
      const coursesToday = await prisma.course.findMany({
        where: {
          statut: 'TERMINEE',
          dateHeure: {
            gte: today
          }
        }
      })
      
      // Courses terminées d'hier
      const coursesYesterday = await prisma.course.findMany({
        where: {
          statut: 'TERMINEE',
          dateHeure: {
            gte: yesterday,
            lt: today
          }
        }
      })
      
      // Courses de la semaine
      const coursesWeek = await prisma.course.findMany({
        where: {
          statut: 'TERMINEE',
          dateHeure: {
            gte: weekStart
          }
        }
      })
      
      // Courses du mois
      const coursesMonth = await prisma.course.findMany({
        where: {
          statut: 'TERMINEE',
          dateHeure: {
            gte: monthStart
          }
        }
      })
      
      // Toutes les courses terminées pour le prix moyen global
      const allCompletedCourses = await prisma.course.findMany({
        where: {
          statut: 'TERMINEE',
          prix: {
            not: null
          }
        }
      })
      
      const calculateRevenue = (courses: any[]) => 
        courses.reduce((sum, c) => sum + (c.prix || 0), 0)
      
      const revenueToday = calculateRevenue(coursesToday)
      const revenueYesterday = calculateRevenue(coursesYesterday)
      const revenueWeek = calculateRevenue(coursesWeek)
      const revenueMonth = calculateRevenue(coursesMonth)
      
      const avgPriceGlobal = allCompletedCourses.length > 0
        ? calculateRevenue(allCompletedCourses) / allCompletedCourses.length
        : 0
      
      const avgPriceToday = coursesToday.length > 0
        ? revenueToday / coursesToday.length
        : 0
      
      // Croissance par rapport à hier
      const growthRate = revenueYesterday > 0
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
        : revenueToday > 0 ? 100 : 0
      
      return {
        today: {
          revenue: Math.round(revenueToday * 100) / 100,
          courses: coursesToday.length,
          avgPrice: Math.round(avgPriceToday * 100) / 100
        },
        yesterday: {
          revenue: Math.round(revenueYesterday * 100) / 100,
          courses: coursesYesterday.length
        },
        week: {
          revenue: Math.round(revenueWeek * 100) / 100,
          courses: coursesWeek.length
        },
        month: {
          revenue: Math.round(revenueMonth * 100) / 100,
          courses: coursesMonth.length
        },
        global: {
          avgPrice: Math.round(avgPriceGlobal * 100) / 100,
          totalCourses: allCompletedCourses.length
        },
        growthRate: Math.round(growthRate * 100) / 100
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur analytics revenue:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des statistiques de revenus',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}