import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ReviewSubmission {
  token: string
  note: number
  commentaire?: string
  client_nom?: string
  client_prenom?: string
  client_email?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ReviewSubmission = await request.json()
    const { token, note, commentaire, client_nom, client_prenom, client_email } = body

    // Validation des paramètres obligatoires
    if (!token || note === undefined || note < 1 || note > 5) {
      return NextResponse.json(
        { error: 'Token et note (1-5) sont requis' },
        { status: 400 }
      )
    }

    // Rechercher l'avis par token
    const { data: existingReview, error: fetchError } = await supabase
      .from('avis_clients')
      .select('*')
      .eq('review_token', token)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 404 }
      )
    }

    // Vérifier que l'avis n'est pas déjà complété
    if (existingReview.completed_at) {
      return NextResponse.json(
        { error: 'Cet avis a déjà été soumis' },
        { status: 400 }
      )
    }

    // Mettre à jour l'avis avec les données soumises
    const updateData: any = {
      note,
      commentaire: commentaire?.trim() || null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Optionnellement mettre à jour les infos client si fournies
    if (client_nom) updateData.client_nom = client_nom.trim()
    if (client_prenom) updateData.client_prenom = client_prenom.trim()
    if (client_email) updateData.client_email = client_email.trim()

    const { data: updatedReview, error: updateError } = await supabase
      .from('avis_clients')
      .update(updateData)
      .eq('review_token', token)
      .select('*')
      .single()

    if (updateError) {
      console.error('Erreur mise à jour avis:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde de l\'avis' },
        { status: 500 }
      )
    }

    // Récupérer les détails de la course pour le retour
    const { data: courseDetails, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        origine,
        destination,
        date_heure,
        clients!inner(nom, prenom),
        users!inner(nom, prenom)
      `)
      .eq('id', existingReview.course_id)
      .single()

    return NextResponse.json({
      message: 'Avis soumis avec succès',
      review: {
        id: updatedReview.id,
        note: updatedReview.note,
        commentaire: updatedReview.commentaire,
        course: courseDetails ? {
          origine: courseDetails.origine,
          destination: courseDetails.destination,
          date: courseDetails.date_heure,
          client: courseDetails.clients,
          chauffeur: courseDetails.users
        } : null
      }
    })

  } catch (error) {
    console.error('Erreur soumission avis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Endpoint GET pour récupérer les détails d'un avis par token (pour pré-remplir le formulaire)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 400 }
      )
    }

    // Rechercher l'avis et les détails de la course
    const { data: review, error: reviewError } = await supabase
      .from('avis_clients')
      .select(`
        *,
        courses!inner(
          id,
          origine,
          destination,
          date_heure,
          prix,
          clients!inner(nom, prenom, email),
          users!inner(nom, prenom)
        )
      `)
      .eq('review_token', token)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 404 }
      )
    }

    // Si l'avis est déjà complété, retourner les détails
    if (review.completed_at) {
      return NextResponse.json({
        completed: true,
        review: {
          note: review.note,
          commentaire: review.commentaire,
          completed_at: review.completed_at
        },
        course: {
          id: review.courses.id,
          origine: review.courses.origine,
          destination: review.courses.destination,
          date: review.courses.date_heure,
          prix: review.courses.prix,
          client: review.courses.clients,
          chauffeur: review.courses.users
        }
      })
    }

    // Sinon, retourner les détails pour le formulaire
    return NextResponse.json({
      completed: false,
      course: {
        id: review.courses.id,
        origine: review.courses.origine,
        destination: review.courses.destination,
        date: review.courses.date_heure,
        prix: review.courses.prix,
        client: review.courses.clients,
        chauffeur: review.courses.users
      }
    })

  } catch (error) {
    console.error('Erreur récupération avis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}