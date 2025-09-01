import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { identifier, method } = await request.json()

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifiant requis' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Rechercher l'utilisateur par email ou téléphone
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, telephone, nom, prenom')
      .or(`email.eq.${identifier},telephone.eq.${identifier}`)
      .eq('actif', true)

    if (userError) {
      console.error('Erreur recherche utilisateur:', userError)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      // L'utilisateur n'existe pas - on le dit clairement selon tes specs
      return NextResponse.json({
        error: 'Aucun compte trouvé avec cet identifiant'
      }, { status: 404 })
    }

    const user = users[0]

    // Générer un token de reset sécurisé
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    // Sauvegarder le token en base
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erreur sauvegarde token:', updateError)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    // Construire le lien de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

    // Vérifier que l'utilisateur a la méthode demandée
    if (method === 'email' && !user.email) {
      return NextResponse.json({
        error: 'Aucune adresse email associée à ce compte'
      }, { status: 400 })
    }
    
    if (method === 'sms' && !user.telephone) {
      return NextResponse.json({
        error: 'Aucun numéro de téléphone associé à ce compte'
      }, { status: 400 })
    }

    // Envoyer l'email ou SMS
    try {
      if (method === 'email' && user.email) {
        await sendResetEmail(user.email, user.prenom, user.nom, resetLink)
      } else if (method === 'sms' && user.telephone) {
        await sendResetSMS(user.telephone, resetLink)
      }

      return NextResponse.json({
        success: true,
        message: `Lien de réinitialisation envoyé ${method === 'email' ? 'par email' : 'par SMS'}`
      })
    } catch (sendError) {
      console.error('Erreur envoi message:', sendError)
      return NextResponse.json({
        error: 'Erreur lors de l\'envoi du message'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erreur forgot-password:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction pour envoyer l'email (à adapter selon votre service email)
async function sendResetEmail(email: string, prenom: string, nom: string, resetLink: string) {
  // Pour l'instant, on log le lien (à remplacer par un vrai service email)
  console.log(`
=== EMAIL DE RESET PASSWORD ===
À: ${email}
Destinataire: ${prenom} ${nom}
Lien de reset: ${resetLink}
================================
`)

  // TODO: Intégrer avec un service email (SendGrid, Mailgun, etc.)
  // Exemple avec un service fictif :
  /*
  const emailService = {
    to: email,
    subject: 'Réinitialisation de votre mot de passe - Taxi Manager',
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Bonjour ${prenom} ${nom},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
      <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Réinitialiser mon mot de passe
      </a>
      <p><small>Ce lien expire dans 1 heure.</small></p>
      <p>Si vous n'avez pas fait cette demande, ignorez ce message.</p>
    `
  }
  */
}

// Fonction pour envoyer le SMS (à adapter selon votre service SMS)
async function sendResetSMS(telephone: string, resetLink: string) {
  // Pour l'instant, on log le lien (à remplacer par un vrai service SMS)
  console.log(`
=== SMS DE RESET PASSWORD ===
À: ${telephone}
Message: Taxi Manager - Réinitialisez votre mot de passe : ${resetLink} (expire dans 1h)
==============================
`)

  // TODO: Intégrer avec un service SMS (Twilio, etc.)
}