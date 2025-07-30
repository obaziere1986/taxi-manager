import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'
import { startOfMonth, endOfMonth, differenceInHours } from 'date-fns'

export async function GET() {
  try {
    const data = await executeWithRetry(async (prisma) => {
      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      
      const chauffeurs = await prisma.chauffeur.findMany({
        include: {
          courses: {
            where: {
              dateHeure: {
                gte: monthStart,
                lte: monthEnd
              }
            }
          }
        }
      })
      
      const performance = chauffeurs.map(chauffeur => {
        const courses = chauffeur.courses
        const coursesTerminees = courses.filter(c => c.statut === 'TERMINEE')
        const coursesAssignees = courses.filter(c => c.statut !== 'EN_ATTENTE')
        const revenu = coursesTerminees.reduce((sum, c) => sum + (c.prix || 0), 0)
        
        // Estimation temps de conduite (2h par course terminée en moyenne)
        const tempsConducteEstime = coursesTerminees.length * 2
        
        // Calcul du taux d'efficacité
        const tauxEfficacite = coursesAssignees.length > 0 
          ? Math.round((coursesTerminees.length / coursesAssignees.length) * 100)
          : 0
        
        return {
          id: chauffeur.id,
          nom: chauffeur.nom,
          prenom: chauffeur.prenom,
          vehicule: chauffeur.vehicule,
          statut: chauffeur.statut,
          totalCourses: courses.length,
          coursesTerminees: coursesTerminees.length,
          coursesEnCours: courses.filter(c => c.statut === 'EN_COURS').length,
          coursesAnnulees: courses.filter(c => c.statut === 'ANNULEE').length,
          revenu: Math.round(revenu * 100) / 100,
          tempsConducte: tempsConducteEstime,
          tauxEfficacite,
          moyennePrixCourse: coursesTerminees.length > 0 
            ? Math.round((revenu / coursesTerminees.length) * 100) / 100 
            : 0
        }
      })
      
      // Trier par nombre de courses terminées (performance)
      return performance.sort((a, b) => b.coursesTerminees - a.coursesTerminees)
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur analytics chauffeur:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des performances chauffeurs',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}