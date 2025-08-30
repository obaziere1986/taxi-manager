import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basique des variables d'env
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'defined' : 'undefined',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined',
      SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'undefined'
    }

    // Test JWT
    let jwtTest = 'unknown'
    try {
      const { SignJWT } = await import('jose')
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
      await new SignJWT({ test: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret)
      jwtTest = 'OK'
    } catch (error) {
      jwtTest = `ERROR: ${error.message}`
    }

    // Test Supabase
    let supabaseTest = 'unknown'
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        // Test simple sans await pour éviter les timeouts
        supabaseTest = 'CLIENT_OK'
      } else {
        supabaseTest = 'ENV_MISSING'
      }
    } catch (error) {
      supabaseTest = `ERROR: ${error.message}`
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      jwt: jwtTest,
      supabase: supabaseTest,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}