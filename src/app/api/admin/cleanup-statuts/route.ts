import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fix = searchParams.get('fix') === 'true'

    console.log(`🔍 Analyse des incohérences... (fix=${fix})`)

    const result = await executeWithRetry(async (supabase) => {
      // Trouver toutes les courses avec des statuts incohérents
      const { data: coursesInconsistentes, error } = await supabase
        .from('courses')
        .select(`
          id,
          statut,
          user_id,
          date_heure,
          origine,
          destination,
          users!courses_user_id_fkey (
            nom,
            prenom
          ),
          clients!courses_client_id_fkey (
            nom,
            prenom
          )
        `)

      if (error) {
        throw error
      }

      const problems = []
      const toFix = []

      for (const course of coursesInconsistentes || []) {
        // Problème 1: Course avec chauffeur mais statut EN_ATTENTE
        if (course.user_id && course.statut === 'EN_ATTENTE') {
          problems.push({
            type: 'CHAUFFEUR_MAIS_EN_ATTENTE',
            courseId: course.id,
            statut: course.statut,
            chauffeur: course.users ? `${course.users.nom} ${course.users.prenom}` : 'Inconnu',
            client: course.clients ? `${course.clients.nom} ${course.clients.prenom}` : 'Inconnu',
            trajet: `${course.origine} → ${course.destination}`,
            dateHeure: course.date_heure
          })
          
          if (fix) {
            toFix.push({
              id: course.id,
              newStatut: 'ASSIGNEE'
            })
          }
        }

        // Problème 2: Course sans chauffeur mais statut ASSIGNEE/EN_COURS/TERMINEE
        if (!course.user_id && ['ASSIGNEE', 'EN_COURS', 'TERMINEE'].includes(course.statut)) {
          problems.push({
            type: 'PAS_CHAUFFEUR_MAIS_ASSIGNEE',
            courseId: course.id,
            statut: course.statut,
            chauffeur: null,
            client: course.clients ? `${course.clients.nom} ${course.clients.prenom}` : 'Inconnu',
            trajet: `${course.origine} → ${course.destination}`,
            dateHeure: course.date_heure
          })
          
          if (fix) {
            toFix.push({
              id: course.id,
              newStatut: 'EN_ATTENTE'
            })
          }
        }
      }

      let fixResults = []
      if (fix && toFix.length > 0) {
        console.log(`Correction de ${toFix.length} courses...`)
        
        for (const fixItem of toFix) {
          const { error: updateError } = await supabase
            .from('courses')
            .update({ statut: fixItem.newStatut })
            .eq('id', fixItem.id)
          
          if (updateError) {
            fixResults.push({
              courseId: fixItem.id,
              success: false,
              error: updateError.message
            })
          } else {
            fixResults.push({
              courseId: fixItem.id,
              success: true,
              newStatut: fixItem.newStatut
            })
          }
        }
      }

      return {
        problems,
        totalProblems: problems.length,
        fixed: fix,
        fixResults: fix ? fixResults : null,
        summary: {
          chauffeurMaisEnAttente: problems.filter(p => p.type === 'CHAUFFEUR_MAIS_EN_ATTENTE').length,
          pasChauffeurMaisAssignee: problems.filter(p => p.type === 'PAS_CHAUFFEUR_MAIS_ASSIGNEE').length
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur cleanup statuts:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du nettoyage des statuts',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}