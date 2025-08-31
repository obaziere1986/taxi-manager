import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ 
      message: 'Nettoyage complet des cookies effectué',
      clearedCookies: []
    })
    
    // Liste complète de tous les cookies possibles
    const allPossibleCookies = [
      // Anciens JWT
      'auth-token',
      'jwt-token',
      'token',
      'authToken',
      
      // NextAuth - dev
      'next-auth.session-token',
      'next-auth.callback-url', 
      'next-auth.csrf-token',
      
      // NextAuth - prod (secure)
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      
      // NextAuth - autres
      'next-auth.pkce.code_verifier',
      'next-auth.state',
      '__next-auth.state',
      
      // Cookies de session génériques
      'session',
      'sessionId',
      'connect.sid'
    ]
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0), // Date dans le passé
      maxAge: 0
    }
    
    // Nettoyer tous les cookies
    allPossibleCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptions)
      
      // Version sécurisée aussi
      if (!cookieName.startsWith('__Secure-')) {
        response.cookies.set(`__Secure-${cookieName}`, '', {
          ...cookieOptions,
          secure: true
        })
      }
      
      // Version avec différents domaines/paths
      response.cookies.set(cookieName, '', {
        ...cookieOptions,
        domain: '.flowcab.fr'
      })
      
      response.cookies.set(cookieName, '', {
        ...cookieOptions,
        domain: 'app.flowcab.fr'
      })
    })
    
    console.log('🧹 Nettoyage complet des cookies effectué')
    
    return response

  } catch (error) {
    console.error('❌ Erreur nettoyage cookies:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 })
  }
}