import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await executeWithRetry(async (prisma) => {
      return await prisma.client.findUnique({
        where: { id },
        include: {
          courses: {
            orderBy: { dateHeure: 'desc' },
            include: {
              chauffeur: {
                select: { nom: true, prenom: true, vehicule: true }
              }
            }
          }
        }
      })
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur récupération client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nom, prenom, telephone, email, adresses } = body

    const client = await executeWithRetry(async (prisma) => {
      return await prisma.client.update({
        where: { id },
        data: {
          nom,
          prenom,
          telephone,
          email,
          adresses: adresses || null,
        },
      })
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur mise à jour client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await executeWithRetry(async (prisma) => {
      return await prisma.client.delete({
        where: { id },
      })
    })

    return NextResponse.json({ message: 'Client supprimé avec succès' })
  } catch (error) {
    console.error('Erreur suppression client:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du client',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}