import { NextResponse } from 'next/server'
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    console.log('🔍 Debug NextAuth Configuration')
    
    // Vérifier les variables d'environnement
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV
    }

    console.log('📊 Variables d\'environnement:', envCheck)
    
    // Vérifier la configuration NextAuth
    const authConfig = {
      hasProviders: authOptions.providers?.length > 0,
      providerCount: authOptions.providers?.length || 0,
      sessionStrategy: authOptions.session?.strategy,
      hasAdapter: !!authOptions.adapter,
      hasCallbacks: !!authOptions.callbacks,
      loginPage: authOptions.pages?.signIn
    }

    console.log('⚙️ Configuration NextAuth:', authConfig)

    return NextResponse.json({
      success: true,
      environment: envCheck,
      nextAuthConfig: authConfig,
      message: 'Configuration NextAuth analysée'
    })

  } catch (error) {
    console.error('❌ Erreur debug NextAuth:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}