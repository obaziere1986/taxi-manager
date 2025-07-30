import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'
import { startOfDay, subDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET() {
  try {
    const data = await executeWithRetry(async (prisma) => {
      const days = []
      const today = new Date()
      
      // Récupérer les données des 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const dayStart = startOfDay(date)
        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)
        
        const courses = await prisma.course.findMany({
          where: {
            dateHeure: {
              gte: dayStart,
              lte: dayEnd
            }
          },
          include: {
            chauffeur: true
          }
        })
        
        const coursesTerminees = courses.filter(c => c.statut === 'TERMINEE')
        const revenu = coursesTerminees.reduce((sum, c) => sum + (c.prix || 0), 0)
        
        days.push({
          date: format(date, 'dd/MM', { locale: fr }),
          fullDate: format(date, 'yyyy-MM-dd'),
          courses: courses.length,
          coursesTerminees: coursesTerminees.length,
          coursesEnAttente: courses.filter(c => c.statut === 'EN_ATTENTE').length,
          coursesEnCours: courses.filter(c => c.statut === 'EN_COURS').length,
          coursesAnnulees: courses.filter(c => c.statut === 'ANNULEE').length,
          revenu: Math.round(revenu * 100) / 100,
          chauffeurs: new Set(courses.filter(c => c.chauffeur).map(c => c.chauffeur!.id)).size
        })
      }
      
      return days
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur analytics timeline:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des données timeline',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}