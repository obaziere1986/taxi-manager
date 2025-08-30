import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry, getSupabaseAdminClient } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/mail-hooks'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Récupérer tous les utilisateurs (remplace l'ancienne API chauffeurs)
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // Filtre optionnel par rôle
    const inactive = searchParams.get('inactive') // Filtre pour récupérer les inactifs
    
    const users = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('users')
        .select('*')
        .order('nom', { ascending: true })
        .order('prenom', { ascending: true })

      // Filtrer selon le statut actif/inactif
      if (inactive === 'true') {
        query = query.eq('actif', false)  // Utilisateurs inactifs uniquement
      } else {
        query = query.eq('actif', true)   // Utilisateurs actifs uniquement (par défaut)
      }
      
      // Appliquer le filtre par rôle si spécifié
      if (role) {
        query = query.eq('role', role)
      }
      
      const { data: usersData, error: usersError } = await query
      
      if (usersError) {
        console.error('Erreur lors de la récupération des utilisateurs:', usersError)
        throw usersError
      }

      // Compter toutes les courses d'un coup puis grouper par utilisateur
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select('user_id')
      
      // Compter les courses par utilisateur
      const courseCounts: Record<string, number> = {}
      if (!coursesError && allCourses) {
        allCourses.forEach(course => {
          if (course.user_id) {
            courseCounts[course.user_id] = (courseCounts[course.user_id] || 0) + 1
          }
        })
      }

      // Ajouter le count à chaque utilisateur
      const usersWithCounts = (usersData || []).map(user => ({
        ...user,
        _count: {
          courses: courseCounts[user.id] || 0
        }
      }))

      return usersWithCounts
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérification des permissions (seuls Admin et Planner peuvent créer des utilisateurs)
    if (!['Admin', 'Planner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    
    const { nom, prenom, email, telephone, role, statut, vehicule, vehiculeId } = body

    // Validation
    if (!nom || !prenom || !email || !telephone || !role) {
      return NextResponse.json(
        { error: 'Les champs nom, prenom, email, telephone et role sont requis' },
        { status: 400 }
      )
    }

    // Utiliser le client admin pour créer des utilisateurs
    const adminSupabase = getSupabaseAdminClient()
    
    const user = await (async () => {
      // Vérifier que l'email n'existe pas
      const { data: existingUser, error: checkError } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = not found, c'est normal
        throw checkError
      }

      if (existingUser) {
        throw new Error('EMAIL_EXISTS')
      }

      // Créer le nouvel utilisateur
      const { data: newUser, error: insertError } = await adminSupabase
        .from('users')
        .insert({
          nom: nom.toUpperCase(),
          prenom,
          email: email.toLowerCase(),
          telephone,
          role,
          statut: statut || 'DISPONIBLE',
          vehicule: vehicule || null,
          vehicule_id: vehiculeId || null,
          actif: true,
          failed_logins: 0,
          notifications_email: true,
          notifications_sms: false,
          notifications_desktop: true
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Ajouter le count des courses (0 pour un nouvel utilisateur)
      return {
        ...newUser,
        _count: {
          courses: 0
        }
      }
    })()

    // Envoyer l'email de bienvenue en arrière-plan
    try {
      await sendWelcomeEmail({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      });
      console.log(`✅ Email de bienvenue envoyé à ${user.prenom} ${user.nom}`);
    } catch (emailError) {
      console.error(`❌ Erreur lors de l'envoi de l'email de bienvenue:`, emailError);
      // On ne fait pas échouer la création utilisateur si l'email échoue
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return NextResponse.json(
        { error: 'Cette adresse email existe déjà' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}