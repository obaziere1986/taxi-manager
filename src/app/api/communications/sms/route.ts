import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Envoyer un SMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const requiredFields = ['telephone', 'message']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Validation du numéro de téléphone (format français basique)
    const phoneRegex = /^(\+33|0)[1-9](\d{8})$/
    if (!phoneRegex.test(body.telephone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Format de numéro de téléphone invalide' },
        { status: 400 }
      )
    }

    // TODO: Intégrer avec un service SMS réel (Twilio, SendinBlue, etc.)
    // Pour l'instant, on simule l'envoi
    const smsResult = await simulateSmsSend(body.telephone, body.message)

    if (!smsResult.success) {
      return NextResponse.json(
        { error: 'Échec de l\'envoi du SMS', details: smsResult.error },
        { status: 500 }
      )
    }

    // Enregistrer l'envoi dans les logs (optionnel)
    // await logSmsActivity(body.telephone, body.message, body.type || 'manual')

    return NextResponse.json({
      success: true,
      message: 'SMS envoyé avec succès',
      messageId: smsResult.messageId,
      cost: smsResult.cost
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du SMS' },
      { status: 500 }
    )
  }
}

// GET - Récupérer les templates SMS prédéfinis
export async function GET() {
  try {
    const templates = await getSmsTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des templates' },
      { status: 500 }
    )
  }
}

// Fonction pour simuler l'envoi SMS (à remplacer par une vraie API)
async function simulateSmsSend(telephone: string, message: string) {
  // Simulation d'un délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulation d'un taux de succès de 95%
  const success = Math.random() > 0.05
  
  if (success) {
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cost: 0.05 // Coût simulé en euros
    }
  } else {
    return {
      success: false,
      error: 'Numéro invalide ou service indisponible'
    }
  }
}

// Fonction pour récupérer les templates SMS
async function getSmsTemplates() {
  return [
    {
      id: 'confirmation_course',
      name: 'Confirmation de course',
      template: 'Bonjour {client_nom}, votre course du {date} à {heure} de {origine} vers {destination} est confirmée. Chauffeur: {chauffeur_nom} ({chauffeur_tel})',
      variables: ['client_nom', 'date', 'heure', 'origine', 'destination', 'chauffeur_nom', 'chauffeur_tel']
    },
    {
      id: 'arrivee_chauffeur',
      name: 'Arrivée du chauffeur',
      template: 'Votre chauffeur {chauffeur_nom} est arrivé à {adresse}. Véhicule: {vehicule} ({immatriculation})',
      variables: ['chauffeur_nom', 'adresse', 'vehicule', 'immatriculation']
    },
    {
      id: 'fin_course',
      name: 'Fin de course',
      template: 'Course terminée. Merci d\'avoir choisi nos services ! Montant: {prix}€. Nous espérons vous revoir bientôt.',
      variables: ['prix']
    },
    {
      id: 'rappel_rdv',
      name: 'Rappel de rendez-vous',
      template: 'Rappel: votre course est prévue demain à {heure} de {origine} vers {destination}. Chauffeur: {chauffeur_nom}',
      variables: ['heure', 'origine', 'destination', 'chauffeur_nom']
    }
  ]
}