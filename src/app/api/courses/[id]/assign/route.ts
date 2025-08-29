import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'
import { sendCourseAssignmentEmail, scheduleReminders } from '@/lib/mail-hooks'

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

    // Envoyer les notifications par email si la course est assignée à un chauffeur
    if (userId && course.users && course.users.email) {
      try {
        // Notification d'assignation
        await sendCourseAssignmentEmail(
          {
            nom: course.users.nom,
            prenom: course.users.prenom,
            email: course.users.email
          },
          {
            id: course.id,
            origine: course.origine,
            destination: course.destination,
            dateHeure: new Date(course.date_heure).toLocaleString('fr-FR'),
            prix: course.prix,
            client: course.clients ? {
              nom: course.clients.nom,
              prenom: course.clients.prenom,
              telephone: course.clients.telephone
            } : undefined
          }
        );

        // Programmer les rappels automatiques
        await scheduleReminders(
          {
            nom: course.users.nom,
            prenom: course.users.prenom,
            email: course.users.email
          },
          {
            id: course.id,
            origine: course.origine,
            destination: course.destination,
            dateHeure: course.date_heure,
            client: course.clients ? {
              nom: course.clients.nom,
              prenom: course.clients.prenom,
              telephone: course.clients.telephone
            } : undefined
          }
        );

        console.log(`✅ Notifications email programmées pour la course ${course.id}`);
      } catch (emailError) {
        console.error(`❌ Erreur lors de l'envoi des notifications:`, emailError);
        // On ne fait pas échouer l'assignation si l'email échoue
      }
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Erreur assignation course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'assignation de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}