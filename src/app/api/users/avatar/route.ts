import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Type de fichier non supporté. Utilisez JPG, PNG ou WebP.' 
      }, { status: 400 })
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Fichier trop volumineux. Taille maximale: 5MB.' 
      }, { status: 400 })
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${session.user.id}-${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // URL publique de l'image
    const avatarUrl = `/uploads/avatars/${filename}`

    // Mettre à jour l'utilisateur en base
    const updatedUser = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', session.user.id)
        .select('id, avatar_url')
        .single()
      
      if (error) throw error
      return data
    })

    return NextResponse.json({ 
      success: true, 
      avatarUrl: updatedUser.avatar_url 
    })

  } catch (error) {
    console.error('Erreur lors de l\'upload d\'avatar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer l'avatar
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Supprimer l'URL d'avatar de la base
    await executeWithRetry(async (supabase) => {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', session.user.id)
      
      if (error) throw error
      return true
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la suppression d\'avatar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}