import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('reviews_enabled, reviews_auto_send')
      .single()

    if (error) {
      console.error('Erreur récupération paramètres:', error)
      // Retourner valeurs par défaut si pas trouvé
      return NextResponse.json({
        reviews_enabled: true,
        reviews_auto_send: true
      })
    }

    return NextResponse.json({
      reviews_enabled: settings?.reviews_enabled ?? true,
      reviews_auto_send: settings?.reviews_auto_send ?? true
    })

  } catch (error) {
    console.error('Erreur serveur settings:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviews_enabled, reviews_auto_send } = body

    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: any = {}
    if (reviews_enabled !== undefined) updateData.reviews_enabled = reviews_enabled
    if (reviews_auto_send !== undefined) updateData.reviews_auto_send = reviews_auto_send

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucun paramètre à mettre à jour' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    const { data: updatedSettings, error } = await supabase
      .from('company_settings')
      .update(updateData)
      .select('reviews_enabled, reviews_auto_send')
      .single()

    if (error) {
      console.error('Erreur mise à jour paramètres:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      settings: {
        reviews_enabled: updatedSettings.reviews_enabled,
        reviews_auto_send: updatedSettings.reviews_auto_send
      }
    })

  } catch (error) {
    console.error('Erreur serveur PUT settings:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}