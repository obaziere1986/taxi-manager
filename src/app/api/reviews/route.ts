import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: reviews, error } = await supabase
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json({ error: 'Erreur lors du chargement des avis' }, { status: 500 })
    }

    // Transformer les données pour l'interface
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      course_id: review.course_id,
      client_nom: review.courses.clients.nom,
      client_prenom: review.courses.clients.prenom,
      client_email: review.courses.clients.email,
      chauffeur_nom: review.courses.users.nom,
      chauffeur_prenom: review.courses.users.prenom,
      note: review.note,
      commentaire: review.commentaire,
      email_sent_at: review.email_sent_at,
      reminder_sent_at: review.reminder_sent_at,
      completed_at: review.completed_at,
      review_token: review.review_token,
      course_origine: review.courses.origine,
      course_destination: review.courses.destination,
      course_date: review.courses.dateHeure
    }))

    return NextResponse.json(transformedReviews)

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}