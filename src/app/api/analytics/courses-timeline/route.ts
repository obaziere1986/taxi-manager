import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET() {
  try {
    const timelineData = await executeWithRetry(async (prisma) => {
      // Obtenir les données des 7 derniers jours
      const today = new Date()

      const data = []

      for (let i = 0; i < 7; i++) {
        const currentDate = subDays(today, 6 - i)
        const dayStart = startOfDay(currentDate)
        const dayEnd = endOfDay(currentDate)

        const coursesForDay = await prisma.course.findMany({
          where: {
            dateHeure: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        })

        const totalCourses = coursesForDay.length
        const coursesTerminees = coursesForDay.filter(c => c.statut === 'TERMINEE').length
        const coursesAnnulees = coursesForDay.filter(c => c.statut === 'ANNULEE').length
        const revenu = coursesForDay
          .filter(c => c.statut === 'TERMINEE' && c.prix)
          .reduce((sum, c) => sum + (c.prix || 0), 0)

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