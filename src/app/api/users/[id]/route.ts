import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

// GET - Récupérer un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await executeWithRetry(async (supabase) => {
      // Récupérer l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          // Not found
          return null
        }
        throw userError
      }

      // Compter ses courses
      const { count, error: countError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)

      if (countError) {
        console.warn('Erreur lors du comptage des courses:', countError)
      }

      return {
        ...userData,
        _count: {
          courses: count || 0
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const user = await executeWithRetry(async (supabase) => {
      // Vérifier que l'utilisateur existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          throw new Error('USER_NOT_FOUND')
        }
        throw checkError
      }

      if (!existingUser) {
        throw new Error('USER_NOT_FOUND')
      }

      // Si l'email est modifié, vérifier qu'il n'existe pas déjà
      if (body.email && body.email !== existingUser.email) {
        const { data: duplicateUser, error: duplicateError } = await supabase
          .from('users')
          .select('id')
          .eq('email', body.email.toLowerCase())
          .neq('id', id)
          .single()

        if (duplicateError && duplicateError.code !== 'PGRST116') {
          throw duplicateError
        }

        if (duplicateUser) {
          throw new Error('EMAIL_EXISTS')
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = {}
      if (body.nom) updateData.nom = body.nom.toUpperCase()
      if (body.prenom) updateData.prenom = body.prenom
      if (body.email) updateData.email = body.email.toLowerCase()
      if (body.telephone !== undefined) updateData.telephone = body.telephone
      if (body.role) updateData.role = body.role
      if (body.statut !== undefined) updateData.statut = body.statut
      if (body.vehicule !== undefined) updateData.vehicule = body.vehicule
      if (body.vehiculeId !== undefined) updateData.vehicule_id = body.vehiculeId
      if (body.actif !== undefined) updateData.actif = body.actif

      // Mettre à jour l'utilisateur
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Compter ses courses
      const { count, error: countError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)

      if (countError) {
        console.warn('Erreur lors du comptage des courses:', countError)
      }

      return {
        ...updatedUser,
        _count: {
          courses: count || 0
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }
      
      if (error.message === 'EMAIL_EXISTS') {
        return NextResponse.json(
          { error: 'Cette adresse email existe déjà' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await executeWithRetry(async (supabase) => {
      // Vérifier que l'utilisateur existe
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('USER_NOT_FOUND')
        }
        throw userError
      }

      if (!existingUser) {
        throw new Error('USER_NOT_FOUND')
      }

      // Vérifier qu'il n'a pas de courses en cours
      const { data: activeCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', id)
        .eq('statut', 'EN_COURS')

      if (coursesError) {
        throw coursesError
      }

      if (activeCourses && activeCourses.length > 0) {
        throw new Error('USER_HAS_ACTIVE_COURSES')
      }

      // Vérifier qu'il n'a pas d'assignations actives
      const { data: activeAssignments, error: assignmentsError } = await supabase
        .from('vehicule_assignations')
        .select('id')
        .eq('user_id', id)
        .eq('actif', true)

      if (assignmentsError) {
        throw assignmentsError
      }

      if (activeAssignments && activeAssignments.length > 0) {
        throw new Error('USER_HAS_ACTIVE_ASSIGNMENTS')
      }

      // Supprimer l'utilisateur
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      return true
    })

    return NextResponse.json(
      { message: 'Utilisateur supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }
      
      if (error.message === 'USER_HAS_ACTIVE_COURSES') {
        return NextResponse.json(
          { error: 'Impossible de supprimer un utilisateur avec des courses en cours' },
          { status: 409 }
        )
      }
      
      if (error.message === 'USER_HAS_ACTIVE_ASSIGNMENTS') {
        return NextResponse.json(
          { error: 'Impossible de supprimer un utilisateur avec des assignations actives' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}