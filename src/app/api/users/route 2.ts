import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

// GET - Récupérer tous les utilisateurs (remplace l'ancienne API chauffeurs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // Filtre optionnel par rôle
    
    const users = await executeWithRetry(async (prisma) => {
      const whereClause = role ? { role: role as any } : {}
      
      return await prisma.user.findMany({
        where: whereClause,
        orderBy: [
          { actif: 'desc' },
          { nom: 'asc' },
          { prenom: 'asc' }
        ],
        include: {
          _count: {
            select: { courses: true }
          }
        }
      })
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
    
    // Validation des données
    const requiredFields = ['nom', 'prenom', 'email']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        email: body.email
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cette adresse email existe déjà' },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        nom: body.nom.toUpperCase(),
        prenom: body.prenom,
        email: body.email.toLowerCase(),
        telephone: body.telephone || null,
        role: body.role || 'CHAUFFEUR',
        actif: body.actif !== undefined ? body.actif : true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}