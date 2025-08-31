import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    })

    // Supprimer tous les cookies d'authentification
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0, // Expire immédiatement
      path: '/'
    }

    // Cookies NextAuth
    response.cookies.set('next-auth.session-token', '', cookieOptions)
    response.cookies.set('__Secure-next-auth.session-token', '', {
      ...cookieOptions,
      secure: true
    })
    response.cookies.set('next-auth.callback-url', '', cookieOptions)
    response.cookies.set('next-auth.csrf-token', '', cookieOptions)
    response.cookies.set('__Secure-next-auth.callback-url', '', {
      ...cookieOptions,
      secure: true
    })
    response.cookies.set('__Secure-next-auth.csrf-token', '', {
      ...cookieOptions,
      secure: true
    })
    
    // Plus de cookies legacy - NextAuth seulement

    return response

  } catch (error) {
    console.error('❌ Erreur logout:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 })
  }
}