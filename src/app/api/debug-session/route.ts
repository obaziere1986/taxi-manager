import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Récupérer les cookies
    const cookies = {
      'auth-token': request.cookies.get('auth-token')?.value || null,
      'next-auth.session-token': request.cookies.get('next-auth.session-token')?.value || null,
      '__Secure-next-auth.session-token': request.cookies.get('__Secure-next-auth.session-token')?.value || null,
      'next-auth.csrf-token': request.cookies.get('next-auth.csrf-token')?.value || null,
      '__Secure-next-auth.csrf-token': request.cookies.get('__Secure-next-auth.csrf-token')?.value || null,
    }

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      nextauthUrl: process.env.NEXTAUTH_URL,
      hasSession: !!session,
      session: session ? {
        id: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        role: session.user?.role
      } : null,
      cookies: cookies,
      cookieCount: Object.values(cookies).filter(v => v !== null).length
    })

  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      nextauthUrl: process.env.NEXTAUTH_URL,
    }, { status: 500 })
  }
}