import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET() {
  try {
    const clients = await executeWithRetry(async (prisma) => {
      return await prisma.client.findMany({
        orderBy: [
          { nom: 'asc' },
          { prenom: 'asc' }
        ],
        include: {
          courses: {
            select: {
              id: true,
              origine: true,
              destination: true,
              dateHeure: true,
              statut: true,
              prix: true,
              notes: true
            },
            orderBy: {
              dateHeure: 'desc'
            }
          },
          _count: {
            select: { courses: true }
          }
        }
      })
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Erreur récupération clients:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des clients',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, email, adresses } = body

    const client = await executeWithRetry(async (prisma) => {
      return await prisma.client.create({
        data: {
          nom,
          prenom,
          telephone,
          email,
          adresses: adresses || null,
        },
      })
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Erreur création client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}