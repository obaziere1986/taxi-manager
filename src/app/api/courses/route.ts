import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { nom: true, telephone: true }
        },
        chauffeur: {
          select: { nom: true, vehicule: true }
        }
      }
    })
    return NextResponse.json(courses)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, chauffeurId, prix, notes } = body

    const course = await prisma.course.create({
      data: {
        origine,
        destination,
        dateHeure: new Date(dateHeure),
        clientId,
        chauffeurId: chauffeurId || null,
        prix: prix ? parseFloat(prix) : null,
        notes: notes || null,
      },
      include: {
        client: {
          select: { nom: true, telephone: true }
        },
        chauffeur: {
          select: { nom: true, vehicule: true }
        }
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la course' }, { status: 500 })
  }
}