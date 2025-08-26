import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'
import { format, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'

// POST - Générer un PDF de planning
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    if (!body.date) {
      return NextResponse.json(
        { error: 'La date est requise' },
        { status: 400 }
      )
    }

    const targetDate = new Date(body.date)
    const chauffeurId = body.chauffeurId // Optionnel: planning pour un chauffeur spécifique
    const type = body.type || 'quotidien' // quotidien, hebdomadaire, mensuel

    // Récupérer les données selon le type de planning
    const planningData = await getPlanningData(targetDate, chauffeurId, type)
    
    // Générer le PDF
    const pdfBuffer = await generatePlanningPdf(planningData, type)

    // Définir le nom du fichier
    const fileName = `planning_${type}_${format(targetDate, 'yyyy-MM-dd')}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

// GET - Récupérer les types de planning disponibles
export async function GET() {
  try {
    const types = [
      {
        id: 'quotidien',
        name: 'Planning quotidien',
        description: 'Planning détaillé pour une journée spécifique'
      },
      {
        id: 'hebdomadaire',
        name: 'Planning hebdomadaire',
        description: 'Vue d\'ensemble de la semaine'
      },
      {
        id: 'chauffeur',
        name: 'Planning chauffeur',
        description: 'Planning personnalisé pour un chauffeur'
      }
    ]

    return NextResponse.json(types)
  } catch (error) {
    console.error('Erreur lors de la récupération des types:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des types' },
      { status: 500 }
    )
  }
}

// Fonction pour récupérer les données de planning
async function getPlanningData(date: Date, chauffeurId?: string, type: string = 'quotidien') {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  try {
    // Récupérer les courses pour la date donnée
    const courses = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          client:clients(
            nom,
            prenom,
            telephone
          ),
          user:users(
            nom,
            prenom,
            telephone,
            vehicule_id
          )
        `)
        .gte('date_heure', dayStart.toISOString())
        .lte('date_heure', dayEnd.toISOString())
        .order('date_heure', { ascending: true })
      
      if (chauffeurId) {
        query = query.eq('user_id', chauffeurId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    })

    // Récupérer tous les utilisateurs/chauffeurs si pas de chauffeur spécifique
    const chauffeurs = chauffeurId ? [] : await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('statut', ['DISPONIBLE', 'OCCUPE'])
        .order('nom', { ascending: true })
      
      if (error) throw error
      return data || []
    })

    return {
      date,
      type,
      courses,
      chauffeurs,
      stats: {
        totalCourses: courses.length,
        coursesAssignees: courses.filter(c => c.chauffeur).length,
        coursesEnAttente: courses.filter(c => !c.chauffeur).length,
        chauffeursActifs: chauffeurs.filter(c => c.statut === 'DISPONIBLE').length
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    throw error
  }
}

// Fonction pour générer le PDF (simulation - nécessiterait une vraie librairie PDF)
async function generatePlanningPdf(data: any, type: string): Promise<Buffer> {
  // TODO: Implémenter avec une vraie librairie PDF comme jsPDF, PDFKit ou Puppeteer
  // Pour l'instant, on simule la génération d'un PDF

  const pdfContent = generatePdfContent(data, type)
  
  // Simulation de la génération PDF
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Retour d'un buffer simulé (en réalité ce serait le vrai PDF)
  return Buffer.from(pdfContent, 'utf-8')
}

// Fonction pour générer le contenu textuel du PDF (simulation)
function generatePdfContent(data: any, type: string): string {
  const dateStr = format(data.date, 'EEEE d MMMM yyyy', { locale: fr })
  
  let content = `TAXI MANAGER - PLANNING ${type.toUpperCase()}\n`
  content += `Date: ${dateStr}\n`
  content += `Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm')}\n\n`
  
  content += `STATISTIQUES:\n`
  content += `- Total courses: ${data.stats.totalCourses}\n`
  content += `- Courses assignées: ${data.stats.coursesAssignees}\n`
  content += `- Courses en attente: ${data.stats.coursesEnAttente}\n`
  content += `- Chauffeurs actifs: ${data.stats.chauffeursActifs}\n\n`
  
  content += `DÉTAIL DES COURSES:\n\n`
  
  data.courses.forEach((course: any, index: number) => {
    const heureStr = format(new Date(course.dateHeure), 'HH:mm')
    content += `${index + 1}. ${heureStr} - ${course.origine} → ${course.destination}\n`
    content += `   Client: ${course.client.prenom} ${course.client.nom} (${course.client.telephone})\n`
    
    if (course.chauffeur) {
      content += `   Chauffeur: ${course.chauffeur.prenom} ${course.chauffeur.nom} - ${course.chauffeur.vehicule}\n`
    } else {
      content += `   Chauffeur: NON ASSIGNÉ\n`
    }
    
    if (course.prix) {
      content += `   Prix: ${course.prix}€\n`
    }
    
    if (course.notes) {
      content += `   Notes: ${course.notes}\n`
    }
    
    content += `   Statut: ${course.statut}\n\n`
  })
  
  return content
}