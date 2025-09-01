import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
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
      console.error('Erreur recherche utilisateur:', error)
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

    // Hasher le nouveau mot de passe
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Mettre à jour le mot de passe et supprimer le token de reset
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        failed_logins: 0,
        locked_until: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erreur mise à jour mot de passe:', updateError)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur reset-password:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}