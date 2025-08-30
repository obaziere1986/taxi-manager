import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, email, telephone, role, notifications_email, notifications_sms, notifications_desktop, avatar_url, last_login_at, created_at')
        .eq('id', session.user.id)
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { nom, prenom, email, telephone, notificationsEmail, notificationsSMS, notificationsDesktop } = body

    // Validation basique
    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: 'Nom, prénom et email sont obligatoires' }, { status: 400 })
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== session.user.email) {
      const existingUser = await executeWithRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', session.user.id)
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
        .eq('id', session.user.id)
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