import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { courses: true }
        }
      }
    })
    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, email, adresses } = body

    const client = await prisma.client.create({
      data: {
        nom,
        prenom,
        telephone,
        email,
        adresses: adresses || null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du client' }, { status: 500 })
  }
}