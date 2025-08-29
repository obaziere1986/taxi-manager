import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Compter le total des avis
    const { count: totalReviews, error: countError } = await supabase
      .from('avis_clients')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Erreur count total:', countError)
      return NextResponse.json({ error: 'Erreur lors du calcul des statistiques' }, { status: 500 })
    }

    // Compter les avis complétés
    const { count: completedReviews, error: completedError } = await supabase
      .from('avis_clients')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null)

    if (completedError) {
      console.error('Erreur count complétés:', completedError)
      return NextResponse.json({ error: 'Erreur lors du calcul des avis complétés' }, { status: 500 })
    }

    // Compter les emails envoyés
    const { count: emailsSent, error: emailsError } = await supabase
      .from('avis_clients')
      .select('*', { count: 'exact', head: true })
      .not('email_sent_at', 'is', null)

    if (emailsError) {
      console.error('Erreur count emails:', emailsError)
      return NextResponse.json({ error: 'Erreur lors du calcul des emails' }, { status: 500 })
    }

    // Compter les rappels envoyés
    const { count: remindersSent, error: remindersError } = await supabase
      .from('avis_clients')
      .select('*', { count: 'exact', head: true })
      .not('reminder_sent_at', 'is', null)

    if (remindersError) {
      console.error('Erreur count rappels:', remindersError)
      return NextResponse.json({ error: 'Erreur lors du calcul des rappels' }, { status: 500 })
    }

    // Calculer la note moyenne
    const { data: avgData, error: avgError } = await supabase
      .from('avis_clients')
      .select('note')
      .not('note', 'is', null)

    if (avgError) {
      console.error('Erreur calcul moyenne:', avgError)
      return NextResponse.json({ error: 'Erreur lors du calcul de la moyenne' }, { status: 500 })
    }

    let avgRating = 0
    if (avgData && avgData.length > 0) {
      const sum = avgData.reduce((acc, item) => acc + (item.note || 0), 0)
      avgRating = sum / avgData.length
    }

    const stats = {
      total_reviews: totalReviews || 0,
      completed_reviews: completedReviews || 0,
      pending_reviews: (totalReviews || 0) - (completedReviews || 0),
      avg_rating: avgRating,
      emails_sent: emailsSent || 0,
      reminders_sent: remindersSent || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erreur serveur stats:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}