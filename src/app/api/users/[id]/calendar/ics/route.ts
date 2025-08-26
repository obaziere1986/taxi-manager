import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    // Vérifier que l'utilisateur existe et que le token est valide
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .eq('calendar_token', token)
      .eq('role', 'Chauffeur')
      .eq('actif', true)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Token invalide ou utilisateur non autorisé' }, { status: 403 })
    }

    // Vérifier que l'utilisateur a la permission calendar.export
    const { data: hasPermission, error: permissionError } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions:permission_id (nom)
      `)
      .eq('role', user.role)
      .eq('permissions.nom', 'calendar.export')
      .single()

    if (permissionError || !hasPermission) {
      return NextResponse.json({ 
        error: 'Permission calendar.export non accordée pour ce rôle' 
      }, { status: 403 })
    }

    // Récupérer les courses assignées au chauffeur (futures et récentes)
    const today = new Date()
    const pastLimit = new Date()
    pastLimit.setDate(today.getDate() - 30) // 30 jours dans le passé

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        clients (*)
      `)
      .eq('user_id', params.id)
      .gte('date_heure', pastLimit.toISOString())
      .order('date_heure', { ascending: true })

    if (coursesError) {
      throw new Error('Erreur lors de la récupération des courses')
    }

    // Générer le contenu ICS
    const icsContent = generateICS(courses, user)

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${user.prenom}_${user.nom}_planning.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Erreur lors de la génération du calendrier ICS:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du calendrier' },
      { status: 500 }
    )
  }
}

function generateICS(courses: any[], user: any): string {
  const now = new Date()
  const prodId = `-//TaxiManager//Planning ${user.prenom} ${user.nom}//FR`
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Planning Taxi - ${user.prenom} ${user.nom}`,
    'X-WR-TIMEZONE:Europe/Paris',
    'X-WR-CALDESC:Planning des courses de taxi'
  ]

  for (const course of courses) {
    const startDate = new Date(course.date_heure)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 heure par défaut
    
    // Format de date ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }

    // Titre de l'événement
    const summary = `Course: ${course.origine} → ${course.destination}`
    
    // Description de l'événement
    const description = [
      `Client: ${course.clients?.prenom || ''} ${course.clients?.nom || 'Non défini'}`.trim(),
      course.clients?.telephone ? `Tél: ${course.clients.telephone}` : '',
      `Statut: ${getStatutLabel(course.statut)}`,
      course.notes ? `Notes: ${course.notes}` : ''
    ].filter(Boolean).join('\\n')

    // Location de l'événement
    const location = `Départ: ${course.origine}`

    ics.push(
      'BEGIN:VEVENT',
      `UID:course-${course.id}@taximanager.local`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `SUMMARY:${escapeICSText(summary)}`,
      `DESCRIPTION:${escapeICSText(description)}`,
      `LOCATION:${escapeICSText(location)}`,
      `STATUS:${course.statut === 'TERMINEE' ? 'CONFIRMED' : course.statut === 'ANNULEE' ? 'CANCELLED' : 'TENTATIVE'}`,
      `CATEGORIES:${course.statut}`,
      'END:VEVENT'
    )
  }

  ics.push('END:VCALENDAR')
  
  return ics.join('\r\n')
}

function getStatutLabel(statut: string): string {
  switch (statut) {
    case 'EN_ATTENTE': return 'En attente'
    case 'ASSIGNEE': return 'Assignée'
    case 'EN_COURS': return 'En cours'
    case 'TERMINEE': return 'Terminée'
    case 'ANNULEE': return 'Annulée'
    default: return statut
  }
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}