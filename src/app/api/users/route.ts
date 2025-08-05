import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les utilisateurs
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { actif: 'desc' },
        { nom: 'asc' },
        { prenom: 'asc' }
      ]
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