import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ message: 'Cookies cleared' })
  
  // Supprimer tous les cookies d'authentification
  const cookiesToClear = [
    'auth-token',
    'next-auth.session-token', 
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url'
  ]
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0) // Date dans le passé pour supprimer
    })
  })
  
  return response
}