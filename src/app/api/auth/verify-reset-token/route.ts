import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Vérifier si le token existe et n'est pas expiré
    const { data: users, error } = await supabase
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .eq('actif', true)

    if (error) {
      console.error('Erreur vérification token:', error)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      )
    }

    const user = users[0]

    // Vérifier si le token n'est pas expiré
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json(
        { error: 'Token expiré' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: 'Token valide'
    })

  } catch (error) {
    console.error('Erreur verify-reset-token:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}