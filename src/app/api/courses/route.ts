import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const courses = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          clients!courses_client_id_fkey (
            id,
            nom,
            prenom,
            telephone
          ),
          users!courses_user_id_fkey (
            id,
            nom,
            prenom,
            vehicule,
            role
          )
        `)
        .order('created_at', { ascending: false })

      // Si un userId est fourni, récupérer ses courses assignées + les courses non assignées
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Mapper les champs snake_case vers camelCase pour compatibilité frontend
      const mappedCourses = (data || []).map(course => ({
        ...course,
        dateHeure: course.date_heure,
        clientId: course.client_id,
        userId: course.user_id,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        // Préserver les relations
        client: course.clients,
        user: course.users,
        // S'assurer que le statut est bien préservé
        statut: course.statut
      }))
      
      return mappedCourses
    })
    return NextResponse.json(courses)
  } catch (error) {
    console.error('Erreur récupération courses:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des courses',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, userId, notes, statut } = body

    // ✅ LOGIQUE RENFORCÉE : Synchronisation automatique statut/chauffeur
    let finalStatut = statut
    if (userId && ['EN_ATTENTE'].includes(statut)) {
      finalStatut = 'ASSIGNEE' // Si on assigne un chauffeur, passer à ASSIGNEE
      console.log(`🔄 Statut auto-corrigé: ${statut} → ${finalStatut} (chauffeur assigné)`)
    } else if (!userId && ['ASSIGNEE', 'EN_COURS'].includes(statut)) {
      finalStatut = 'EN_ATTENTE' // Si on retire le chauffeur, revenir à EN_ATTENTE
      console.log(`🔄 Statut auto-corrigé: ${statut} → ${finalStatut} (chauffeur retiré)`)
    }

    const course = await executeWithRetry(async (supabase) => {
      // Créer la course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          origine,
          destination,
          date_heure: new Date(dateHeure).toISOString(),
          client_id: clientId,
          user_id: userId || null,
          notes: notes || null,
          statut: finalStatut || 'EN_ATTENTE',
        })
        .select(`
          *,
          clients!courses_client_id_fkey (
            id,
            nom,
            prenom,
            telephone
          ),
          users!courses_user_id_fkey (
            id,
            nom,
            prenom,
            vehicule,
            role
          )
        `)
        .single()

      if (courseError) {
        throw courseError
      }

      return courseData
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Erreur création course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}