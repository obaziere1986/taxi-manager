import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le token JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(authToken, secret)
    
    if (!payload.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, email, telephone, role, notifications_email, notifications_sms, notifications_desktop, avatar_url, last_login_at, created_at')
        .eq('id', payload.userId)
        .single()
      
      if (error) throw error
      return data
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour le profil de l'utilisateur connecté
export async function PUT(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le token JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(authToken, secret)
    
    if (!payload.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { nom, prenom, email, telephone, notificationsEmail, notificationsSMS, notificationsDesktop } = body

    // Validation basique
    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: 'Nom, prénom et email sont obligatoires' }, { status: 400 })
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== payload.email) {
      const existingUser = await executeWithRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', payload.userId)
          .single()
        
        if (error && error.code !== 'PGRST116') throw error
        return data
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim().toLowerCase(),
          telephone: telephone?.trim() || null,
          notifications_email: Boolean(notificationsEmail),
          notifications_sms: Boolean(notificationsSMS),
          notifications_desktop: Boolean(notificationsDesktop)
        })
        .eq('id', payload.userId)
        .select('id, nom, prenom, email, telephone, role, notifications_email, notifications_sms, notifications_desktop, avatar_url, last_login_at, created_at')
        .single()
      
      if (error) throw error
      return data
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}