import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await executeWithRetry(async (supabase) => {
      // Récupérer le client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientError) {
        if (clientError.code === 'PGRST116') {
          return null // Not found
        }
        throw clientError
      }

      if (!clientData) {
        return null
      }

      // Récupérer les courses du client avec les informations du chauffeur
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_user_id_fkey (
            nom,
            prenom,
            vehicule
          )
        `)
        .eq('client_id', id)
        .order('date_heure', { ascending: false })

      if (coursesError) {
        console.warn('Erreur récupération courses:', coursesError)
      }

      return {
        ...clientData,
        courses: (coursesData || []).map(course => ({
          ...course,
          dateHeure: course.date_heure,
          chauffeur: course.users
        }))
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur récupération client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nom, prenom, telephone, email, adresses } = body

    const client = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('clients')
        .update({
          nom,
          prenom,
          telephone,
          email,
          adresses: adresses || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur mise à jour client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await executeWithRetry(async (supabase) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return true
    })

    return NextResponse.json({ message: 'Client supprimé avec succès' })
  } catch (error) {
    console.error('Erreur suppression client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}