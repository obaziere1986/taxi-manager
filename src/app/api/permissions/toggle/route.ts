import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { permission, role, enabled } = await request.json()

    if (!permission || !role) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Récupérer l'ID de la permission
    const { data: permissionData, error: permissionError } = await supabase
      .from('permissions')
      .select('id')
      .eq('nom', permission)
      .single()

    if (permissionError || !permissionData) {
      return NextResponse.json({ error: 'Permission non trouvée' }, { status: 404 })
    }

    if (enabled) {
      // Ajouter la permission
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert({
          role,
          permission_id: permissionData.id
        })
        .select()
        .single()

      if (insertError && !insertError.message.includes('duplicate')) {
        throw insertError
      }
    } else {
      // Supprimer la permission
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('permission_id', permissionData.id)

      if (deleteError) {
        throw deleteError
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors du toggle de permission:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}