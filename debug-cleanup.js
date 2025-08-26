// Script de nettoyage des statuts incohérents
// Utilisation : node debug-cleanup.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pligynlgfmnequzijtqk.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjc5NTc3NCwiZXhwIjoyMDQ4MzcxNzc0fQ.dDlO6v5CgwRqPAmRYQrU-iiMJOD4ygJpRRd3k-1aS3Y'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function cleanupStatuts() {
  try {
    console.log('🔍 Analyse des incohérences...')

    // 1. Trouver courses avec chauffeur mais statut EN_ATTENTE
    const { data: coursesWithDriverButWaiting, error: error1 } = await supabase
      .from('courses')
      .select(`
        id, statut, user_id,
        users!courses_user_id_fkey (nom, prenom),
        clients!courses_client_id_fkey (nom, prenom)
      `)
      .not('user_id', 'is', null)
      .eq('statut', 'EN_ATTENTE')

    if (error1) throw error1

    console.log(`❌ ${coursesWithDriverButWaiting?.length || 0} courses avec chauffeur mais statut EN_ATTENTE`)

    // 2. Trouver courses sans chauffeur mais statut ASSIGNEE/EN_COURS
    const { data: coursesWithoutDriverButAssigned, error: error2 } = await supabase
      .from('courses')
      .select(`
        id, statut, user_id,
        clients!courses_client_id_fkey (nom, prenom)
      `)
      .is('user_id', null)
      .in('statut', ['ASSIGNEE', 'EN_COURS'])

    if (error2) throw error2

    console.log(`❌ ${coursesWithoutDriverButAssigned?.length || 0} courses sans chauffeur mais statut ASSIGNEE/EN_COURS`)

    // 3. Correction automatique
    if (coursesWithDriverButWaiting?.length > 0) {
      console.log('🔧 Correction: courses avec chauffeur → ASSIGNEE...')
      const { error: fixError1 } = await supabase
        .from('courses')
        .update({ statut: 'ASSIGNEE' })
        .not('user_id', 'is', null)
        .eq('statut', 'EN_ATTENTE')

      if (fixError1) {
        console.error('❌ Erreur correction 1:', fixError1)
      } else {
        console.log('✅ Corrigé: courses avec chauffeur → ASSIGNEE')
      }
    }

    if (coursesWithoutDriverButAssigned?.length > 0) {
      console.log('🔧 Correction: courses sans chauffeur → EN_ATTENTE...')
      const { error: fixError2 } = await supabase
        .from('courses')
        .update({ statut: 'EN_ATTENTE' })
        .is('user_id', null)
        .in('statut', ['ASSIGNEE', 'EN_COURS'])

      if (fixError2) {
        console.error('❌ Erreur correction 2:', fixError2)
      } else {
        console.log('✅ Corrigé: courses sans chauffeur → EN_ATTENTE')
      }
    }

    // 4. Vérification finale
    const { data: remainingIssues1 } = await supabase
      .from('courses')
      .select('id')
      .not('user_id', 'is', null)
      .eq('statut', 'EN_ATTENTE')

    const { data: remainingIssues2 } = await supabase
      .from('courses')
      .select('id')
      .is('user_id', null)
      .in('statut', ['ASSIGNEE', 'EN_COURS'])

    console.log(`\n📊 RÉSULTAT FINAL:`)
    console.log(`   Courses avec chauffeur mais EN_ATTENTE: ${remainingIssues1?.length || 0}`)
    console.log(`   Courses sans chauffeur mais ASSIGNEE/EN_COURS: ${remainingIssues2?.length || 0}`)
    
    if ((remainingIssues1?.length || 0) === 0 && (remainingIssues2?.length || 0) === 0) {
      console.log('🎉 Toutes les incohérences ont été corrigées!')
    }

  } catch (error) {
    console.error('💥 Erreur:', error)
  }
}

cleanupStatuts()