import { NextRequest, NextResponse } from 'next/server'
import { 
  getClientCourseCompletedWithReviewTemplate,
  getClientReviewReminderTemplate,
  getClientDriverAssignedTemplate,
  TemplateVariables 
} from '@/lib/mail-templates'

// Templates par défaut - mappés depuis les fonctions existantes
const defaultTemplates = {
  client_course_completed_with_review: {
    name: 'Fin de course avec demande d\'avis',
    subject: '🚕 Merci pour votre confiance - Donnez votre avis',
    description: 'Envoyé quand une course est terminée pour demander un avis',
    variables: ['client.nom', 'client.prenom', 'course.origine', 'course.destination', 'user.nom', 'user.prenom', 'reviewToken']
  },
  client_review_reminder: {
    name: 'Rappel de demande d\'avis',
    subject: '🚕 Votre avis nous intéresse',
    description: 'Rappel envoyé si le client n\'a pas donné d\'avis',
    variables: ['client.nom', 'client.prenom', 'course.origine', 'course.destination', 'user.nom', 'user.prenom', 'reviewToken']
  },
  client_driver_assigned: {
    name: 'Assignation de chauffeur',
    subject: '🚕 Votre chauffeur est assigné',
    description: 'Envoyé quand un chauffeur est assigné à la course',
    variables: ['client.nom', 'client.prenom', 'course.origine', 'course.destination', 'user.nom', 'user.prenom', 'user.telephone']
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type')

    if (templateType && templateType in defaultTemplates) {
      // Générer le HTML du template spécifique avec des variables d'exemple
      const mockVariables: TemplateVariables = {
        client: {
          nom: 'DUPONT',
          prenom: 'Marie'
        },
        course: {
          id: 'mock-course-id',
          origine: '123 Rue de Paris',
          destination: 'Hôpital Saint-Louis',
          dateHeure: new Date().toISOString()
        },
        user: {
          nom: 'MARTIN',
          prenom: 'Jean',
          telephone: '06 12 34 56 78'
        }
      }

      let templateHtml = ''
      const reviewToken = 'mock-review-token-123'

      switch (templateType) {
        case 'client_course_completed_with_review':
          templateHtml = getClientCourseCompletedWithReviewTemplate(mockVariables, reviewToken).html || ''
          break
        case 'client_review_reminder':
          templateHtml = getClientReviewReminderTemplate(mockVariables, reviewToken).html || ''
          break
        case 'client_driver_assigned':
          templateHtml = getClientDriverAssignedTemplate(mockVariables).html || ''
          break
      }

      return NextResponse.json({
        ...defaultTemplates[templateType],
        type: templateType,
        html: templateHtml,
        editable: false // Pour l'instant, les templates ne sont pas éditables
      })
    }

    // Retourner la liste des templates disponibles
    const templates = Object.entries(defaultTemplates).map(([type, template]) => ({
      type,
      ...template
    }))

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Erreur récupération templates:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, subject, html } = body

    // Pour l'instant, nous ne permettons pas la modification des templates
    // Cette fonctionnalité pourrait être ajoutée plus tard avec une table database pour les templates custom
    
    return NextResponse.json({
      error: 'La modification des templates n\'est pas encore implémentée',
      message: 'Cette fonctionnalité sera disponible dans une future version'
    }, { status: 501 })

  } catch (error) {
    console.error('Erreur mise à jour template:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}