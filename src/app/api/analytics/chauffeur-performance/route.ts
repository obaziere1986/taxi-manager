import { NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET() {
  try {
    const performance = await executeWithRetry(async (prisma) => {
      // Date d'il y a 30 jours
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      // Récupérer tous les chauffeurs (users avec role Chauffeur)
      const chauffeurs = await prisma.user.findMany({
        where: { 
          role: 'Chauffeur',
          actif: true
        },
        include: {
          courses: {
            where: {
              statut: 'TERMINEE', // Seulement les courses terminées
              dateHeure: {
                gte: thirtyDaysAgo // 30 derniers jours
              }
            }
          }
        }
      })

      // Calculer les métriques pour chaque chauffeur
      const performanceData = chauffeurs.map(chauffeur => {
        const coursesTerminees = chauffeur.courses // Déjà filtrées sur TERMINEE dans la requête

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