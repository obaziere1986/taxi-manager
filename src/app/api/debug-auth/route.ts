import { NextRequest, NextResponse } from 'next/server'
import bcrypt from "bcryptjs"
import { getSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log('🔍 Test de diagnostic d\'authentification')
    
    const email = 'admin@flowcab.fr'
    const password = 'admin123'
    
    const supabase = getSupabaseClient()
    
    // 1. Test de connexion Supabase
    console.log('📡 Test connexion Supabase...')
    const { data: testConnection } = await supabase.from('users').select('count').limit(1)
    
    // 2. Recherche utilisateur exact
    console.log('🔍 Recherche utilisateur:', email)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('actif', true)

    console.log('📊 Résultat requête:', { 
      error: error?.message || null, 
      usersCount: users?.length || 0,
      firstUser: users?.[0] ? {
        id: users[0].id,
        email: users[0].email,
        hasPassword: !!users[0].password_hash,
        actif: users[0].actif
      } : null
    })

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: false,
        step: 'user_lookup',
        message: 'Aucun utilisateur trouvé',
        debug: { error: error?.message, email, actif: true }
      })
    }

    const user = users[0]

    // 3. Test du mot de passe
    if (!user.password_hash) {
      return NextResponse.json({ 
        success: false,
        step: 'password_check',
        message: 'Aucun mot de passe configuré'
      })
    }

    console.log('🔐 Test bcrypt avec hash:', user.password_hash.substring(0, 20) + '...')
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('✅ Résultat bcrypt:', isValidPassword)

    return NextResponse.json({ 
      success: true,
      step: 'complete',
      results: {
        supabaseConnected: !!testConnection,
        userFound: true,
        userActive: user.actif,
        hasPassword: !!user.password_hash,
        passwordValid: isValidPassword,
        userId: user.id
      },
      message: isValidPassword ? '✅ Authentification complète réussie' : '❌ Mot de passe incorrect'
    })

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error)
    return NextResponse.json({ 
      success: false,
      step: 'error',
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}