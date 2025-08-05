import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const chauffeurs = await prisma.chauffeur.findMany({
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' }
      ],
      include: {
        _count: {
          select: { courses: true }
        }
      }
    })
    return NextResponse.json(chauffeurs)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des chauffeurs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, vehicule, statut } = body

    const chauffeur = await prisma.chauffeur.create({
      data: {
        nom,
        prenom,
        telephone,
        vehicule,
        statut: statut || 'DISPONIBLE',
      },
    })

    return NextResponse.json(chauffeur, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du chauffeur' }, { status: 500 })
  }
}