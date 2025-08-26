import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
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

    // Vérifier que l'utilisateur existe et est un chauffeur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .eq('role', 'Chauffeur')
      .eq('actif', true)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé ou non autorisé' 
      }, { status: 404 })
    }

    // Générer un nouveau token unique
    const token = require('crypto').randomBytes(32).toString('hex')

    // Mettre à jour l'utilisateur avec le nouveau token
    const { error: updateError } = await supabase
      .from('users')
      .update({ calendar_token: token })
      .eq('id', params.id)

    if (updateError) {
      throw new Error('Erreur lors de la mise à jour du token')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Token généré avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la génération du token:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du token' },
      { status: 500 }
    )
  }
}