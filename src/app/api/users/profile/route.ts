import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer le profil de l'utilisateur connecté
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        notificationsEmail: true,
        notificationsSMS: true,
        notificationsDesktop: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true
      }
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
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        telephone: telephone?.trim() || null,
        notificationsEmail: Boolean(notificationsEmail),
        notificationsSMS: Boolean(notificationsSMS),
        notificationsDesktop: Boolean(notificationsDesktop)
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        notificationsEmail: true,
        notificationsSMS: true,
        notificationsDesktop: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}