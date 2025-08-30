import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: string
}

export async function verifyJWT(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      return null
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(authToken, secret)
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string
    }
  } catch (error) {
    return null
  }
}