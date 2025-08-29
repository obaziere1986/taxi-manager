import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      templateType, 
      courseData, 
      clientData, 
      chauffeurData 
    } = body

    // Validation des données
    if (!email || !templateType || !courseData || !clientData || !chauffeurData) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // Déterminer le type d'email à envoyer
    let mailType = ''
    let needsReviewToken = false

    switch (templateType) {
      case 'completed_with_review':
        mailType = 'client_course_completed_with_review'
        needsReviewToken = true
        break
      case 'reminder':
        mailType = 'client_review_reminder'
        needsReviewToken = true
        break
      case 'driver_assigned':
        mailType = 'client_driver_assigned'
        break
      default:
        return NextResponse.json(
          { error: 'Type d\'email non supporté' },
          { status: 400 }
        )
    }

    // Générer un token de test si nécessaire
    const testReviewToken = needsReviewToken ? `test_review_${Date.now()}` : undefined

    // Préparer les variables pour le template
    const variables = {
      client: {
        nom: clientData.nom || 'TEST',
        prenom: clientData.prenom || 'Client'
      },
      course: {
        id: 'test-course-123',
        origine: courseData.origine || 'Adresse de départ',
        destination: courseData.destination || 'Adresse d\'arrivée',
        dateHeure: new Date().toISOString(),
        prix: 25.50
      },
      user: {
        nom: chauffeurData.nom || 'MARTIN',
        prenom: chauffeurData.prenom || 'Jean',
        telephone: chauffeurData.telephone || '06 12 34 56 78'
      }
    }

    // Envoyer l'email de test via l'API mail existante
    const mailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: mailType,
        to: email,
        variables,
        reviewToken: testReviewToken,
        customSubject: `[TEST] ${body.customSubject || ''}`, // Préfixe [TEST]
      })
    })

    if (!mailResponse.ok) {
      const errorData = await mailResponse.json()
      return NextResponse.json(
        { error: 'Échec de l\'envoi du test', details: errorData.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${email}`,
      templateType,
      testData: {
        variables,
        reviewToken: testReviewToken
      }
    })

  } catch (error) {
    console.error('Erreur test email:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}