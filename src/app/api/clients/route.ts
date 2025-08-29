import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET() {
  try {
    const clients = await executeWithRetry(async (supabase) => {
      // Récupérer tous les clients avec un tri, incluant reviews_disabled
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*, reviews_disabled')
        .order('nom', { ascending: true })
        .order('prenom', { ascending: true })

      if (clientsError) {
        throw clientsError
      }

      // Pour chaque client, récupérer ses courses et le count
      const clientsWithCourses = await Promise.all(
        (clientsData || []).map(async (client) => {
          // Récupérer les courses du client avec infos chauffeur
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select(`
              id, origine, destination, date_heure, statut, notes, user_id,
              users!courses_user_id_fkey (
                id, nom, prenom
              )
            `)
            .eq('client_id', client.id)
            .order('date_heure', { ascending: false })

          if (coursesError) {
            console.warn('Erreur récupération courses pour client', client.id, ':', coursesError)
          }

          // Compter les courses
          const { count, error: countError } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)

          if (countError) {
            console.warn('Erreur comptage courses pour client', client.id, ':', countError)
          }

          // Mapper les courses pour compatibilité frontend
          const mappedCourses = (courses || []).map(course => ({
            ...course,
            dateHeure: course.date_heure,
            clientId: course.client_id,
            userId: course.user_id,
            chauffeur: course.users ? {
              id: course.users.id,
              nom: course.users.nom,
              prenom: course.users.prenom
            } : null,
            createdAt: course.created_at,
            updatedAt: course.updated_at
          }))

          return {
            ...client,
            courses: mappedCourses,
            _count: {
              courses: count || 0
            }
          }
        })
      )

      return clientsWithCourses
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Erreur récupération clients:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des clients',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, email, adresses, reviews_disabled } = body

    const client = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          nom,
          prenom,
          telephone,
          email,
          adresses: adresses || null,
          reviews_disabled: reviews_disabled || false,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Erreur création client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}