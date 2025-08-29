import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Récupérer l'avis avec les détails de la course
    const { data: review, error: fetchError } = await supabase
      .from('avis_clients')
      .select(`
        *,
        courses!inner(
          id,
          origine,
          destination,
          dateHeure,
          clients!inner(nom, prenom, email),
          users!inner(nom, prenom)
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !review) {
      console.error('Avis non trouvé:', fetchError)
      return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
    }

    // Vérifier que l'avis n'est pas déjà complété
    if (review.completed_at) {
      return NextResponse.json({ error: 'Cet avis est déjà complété' }, { status: 400 })
    }

    // Envoyer le rappel par email
    const mailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'client_review_reminder',
        to: review.courses.clients.email,
        variables: {
          client: {
            nom: review.courses.clients.nom,
            prenom: review.courses.clients.prenom
          },
          course: {
            id: review.courses.id,
            origine: review.courses.origine,
            destination: review.courses.destination,
            dateHeure: review.courses.dateHeure
          },
          user: {
            nom: review.courses.users.nom,
            prenom: review.courses.users.prenom
          },
          reviewToken: review.review_token
        }
      })
    })

    if (!mailResponse.ok) {
      const errorData = await mailResponse.json()
      console.error('Erreur envoi email:', errorData)
      return NextResponse.json({ error: 'Échec de l\'envoi du rappel' }, { status: 500 })
    }

    // Mettre à jour la date du rappel
    const { error: updateError } = await supabase
      .from('avis_clients')
      .update({ 
        reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Erreur mise à jour:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Rappel envoyé avec succès' 
    })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}