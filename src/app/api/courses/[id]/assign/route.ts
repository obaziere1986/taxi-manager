import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    const course = await executeWithRetry(async (supabase) => {
      // Vérifier que la course existe
      const { data: existingCourse, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          throw new Error('Course non trouvée')
        }
        throw courseError
      }

      if (!existingCourse) {
        throw new Error('Course non trouvée')
      }

      // Si on assigne à un utilisateur, vérifier qu'il existe et qu'il est chauffeur
      if (userId) {
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) {
          if (userError.code === 'PGRST116') {
            throw new Error('Utilisateur non trouvé')
          }
          throw userError
        }

        if (!existingUser) {
          throw new Error('Utilisateur non trouvé')
        }
        
        if (existingUser.role !== 'Chauffeur') {
          throw new Error('L\'utilisateur n\'est pas un chauffeur')
        }
      }

      // Mettre à jour la course
      const { data: updatedCourse, error: updateError } = await supabase
        .from('courses')
        .update({
          user_id: userId || null,
          statut: userId ? 'ASSIGNEE' : 'EN_ATTENTE',
        })
        .eq('id', id)
        .select(`
          *,
          clients!courses_client_id_fkey (
            nom,
            prenom,
            telephone
          ),
          users!courses_user_id_fkey (
            nom,
            prenom,
            vehicule,
            role
          )
        `)
        .single()

      if (updateError) {
        throw updateError
      }

      return updatedCourse
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Erreur assignation course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'assignation de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}