import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET() {
  try {
    const performance = await executeWithRetry(async (prisma) => {
      // Récupérer tous les chauffeurs (users avec role Chauffeur)
      const chauffeurs = await prisma.user.findMany({
        where: { 
          role: 'Chauffeur',
          actif: true
        },
        include: {
          courses: {
            where: {
              dateHeure: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Début du mois
              }
            }
          }
        }
      })

      // Calculer les métriques pour chaque chauffeur
      const performanceData = chauffeurs.map(chauffeur => {
        const courses = chauffeur.courses
        const coursesTerminees = courses.filter(c => c.statut === 'TERMINEE')
        const coursesEnCours = courses.filter(c => c.statut === 'EN_COURS')
        const coursesAnnulees = courses.filter(c => c.statut === 'ANNULEE')
        
        const revenu = coursesTerminees.reduce((sum, course) => sum + (course.prix || 0), 0)
        const totalCourses = courses.length
        const tauxEfficacite = totalCourses > 0 ? Math.round((coursesTerminees.length / totalCourses) * 100) : 0
        const moyennePrixCourse = coursesTerminees.length > 0 ? revenu / coursesTerminees.length : 0

        return {
          id: chauffeur.id,
          nom: chauffeur.nom,
          prenom: chauffeur.prenom,
          vehicule: chauffeur.vehicule || 'N/A',
          statut: chauffeur.statut || 'DISPONIBLE',
          totalCourses,
          coursesTerminees: coursesTerminees.length,
          coursesEnCours: coursesEnCours.length,
          coursesAnnulees: coursesAnnulees.length,
          revenu: Math.round(revenu),
          tempsConducte: coursesTerminees.length * 1.5, // Estimation 1.5h par course
          tauxEfficacite,
          moyennePrixCourse: Math.round(moyennePrixCourse * 100) / 100
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