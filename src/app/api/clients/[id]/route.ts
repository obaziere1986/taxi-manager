import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        courses: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du client' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nom, prenom, telephone, email, adresses } = body

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        nom,
        prenom,
        telephone,
        email,
        adresses: adresses || null,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Client supprimé avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression du client' }, { status: 500 })
  }
}