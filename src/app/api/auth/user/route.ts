import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'Token non fourni' 
      }, { status: 401 })
    }

    // Vérifier et décoder le JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(authToken, secret)

    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role
      }
    })

  } catch (error) {
    console.error('Erreur décodage JWT:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Token invalide' 
    }, { status: 401 })
  }
}