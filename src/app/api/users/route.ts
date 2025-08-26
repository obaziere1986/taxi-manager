import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer tous les utilisateurs (remplace l'ancienne API chauffeurs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // Filtre optionnel par rôle
    
    const users = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('actif', true)  // Ne récupérer que les utilisateurs actifs
        .order('nom', { ascending: true })
        .order('prenom', { ascending: true })
      
      // Appliquer le filtre par rôle si spécifié
      if (role) {
        query = query.eq('role', role)
      }
      
      const { data: usersData, error: usersError } = await query
      
      if (usersError) {
        console.error('Erreur lors de la récupération des utilisateurs:', usersError)
        throw usersError
      }

      // Pour chaque utilisateur, compter ses courses (simuler le _count de Prisma)
      const usersWithCounts = await Promise.all(
        (usersData || []).map(async (user) => {
          const { count, error: countError } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          if (countError) {
            console.warn('Erreur lors du comptage des courses pour l\'utilisateur', user.id, ':', countError)
          }
          
          return {
            ...user,
            _count: {
              courses: count || 0
            }
          }
        })
      )

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
    const body = await request.json()
    
    const { nom, prenom, email, telephone, role, statut, vehicule, vehiculeId } = body

    // Validation
    if (!nom || !prenom || !email || !telephone || !role) {
      return NextResponse.json(
        { error: 'Les champs nom, prenom, email, telephone et role sont requis' },
        { status: 400 }
      )
    }

    const user = await executeWithRetry(async (supabase) => {
      // Vérifier que l'email n'existe pas
      const { data: existingUser, error: checkError } = await supabase
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
      const { data: newUser, error: insertError } = await supabase
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
    })

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