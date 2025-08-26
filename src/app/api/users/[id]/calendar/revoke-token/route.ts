import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les permissions
    if (session.user.role !== 'Admin' && session.user.id !== params.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    // Supprimer le token
    const { error: updateError } = await supabase
      .from('users')
      .update({ calendar_token: null })
      .eq('id', params.id)

    if (updateError) {
      throw new Error('Erreur lors de la suppression du token')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Token révoqué avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la révocation du token:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la révocation du token' },
      { status: 500 }
    )
  }
}