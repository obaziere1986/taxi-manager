import { NextRequest, NextResponse } from 'next/server'
import bcrypt from "bcryptjs"
import { SignJWT } from 'jose'
import { getSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  console.log('📡 API LOGIN - Tentative connexion')
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    
    // Recherche utilisateur par email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('actif', true)

    if (error || !users || users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Identifiants incorrects' 
      }, { status: 401 })
    }

    const user = users[0]

    if (!user.password_hash) {
      return NextResponse.json({ 
        success: false, 
        message: 'Compte non configuré' 
      }, { status: 401 })
    }

    // Vérification mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        message: 'Identifiants incorrects' 
      }, { status: 401 })
    }

    // Créer un token JWT avec jose
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const token = await new SignJWT({ 
        userId: user.id,
        email: user.email,
        role: user.role,
        name: `${user.prenom} ${user.nom}`
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Mettre à jour dernière connexion
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        failed_logins: 0
      })
      .eq('id', user.id)

    // Créer la réponse avec cookie
    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.prenom} ${user.nom}`,
        role: user.role
      }
    })

    // Définir le cookie d'authentification
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 86400, // 24h
      path: '/'
    }
    
    console.log('🍪 Configuration cookie:', {
      env: process.env.NODE_ENV,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      userEmail: user.email
    })
    
    console.log('🚀 LOGIN RÉUSSI - Cookie défini pour:', user.email)
    
    response.cookies.set('auth-token', token, cookieOptions)

    return response

  } catch (error) {
    console.error('❌ Erreur login simple:', error)
    return NextResponse.json({ 
      success: false, 
      message: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}