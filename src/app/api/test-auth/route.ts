import { NextRequest, NextResponse } from 'next/server'
import bcrypt from "bcryptjs"
import { getSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔍 Test auth pour:', email)
    
    const supabase = getSupabaseClient()
    
    // Test de connexion Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`login.eq.${email},email.eq.${email}`)
      .eq('actif', true)

    console.log('📊 Résultat requête users:', { users, error })

    if (error || !users || users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Utilisateur non trouvé',
        debug: { error, usersCount: users?.length || 0 }
      })
    }

    const user = users[0]
    console.log('👤 Utilisateur trouvé:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password_hash 
    })

    if (!user.password_hash) {
      return NextResponse.json({ 
        success: false, 
        message: 'Pas de mot de passe configuré' 
      })
    }

    // Test bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('🔐 Test mot de passe:', isValidPassword)

    return NextResponse.json({ 
      success: isValidPassword,
      message: isValidPassword ? 'Authentification réussie' : 'Mot de passe incorrect',
      debug: {
        userFound: true,
        hasPassword: true,
        passwordValid: isValidPassword
      }
    })

  } catch (error) {
    console.error('❌ Erreur test auth:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}