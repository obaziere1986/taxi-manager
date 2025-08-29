// Types pour les données des templates
export interface UserData {
  nom: string;
  prenom: string;
  email: string;
  role?: string;
}

export interface CourseData {
  id: string;
  origine: string;
  destination: string;
  dateHeure: string;
  client?: {
    nom: string;
    prenom: string;
    telephone?: string;
    email?: string;
  };
  prix?: number;
  user?: {
    nom: string;
    prenom: string;
    telephone?: string;
  };
}

export interface TemplateVariables {
  user?: UserData;
  course?: CourseData;
  companyName?: string;
  loginUrl?: string;
  supportEmail?: string;
}

// Template de base HTML avec styling
const getBaseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #fbbf24;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 10px;
        }
        .title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: #f59e0b;
            color: white !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
        }
        .info-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .urgent {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚕 Taxi Manager</div>
            <h1 class="title">${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>Ceci est un email automatique, merci de ne pas répondre.</p>
            <p>© 2025 Taxi Manager - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
`;

// Template d'email de bienvenue
export const getWelcomeEmailTemplate = (variables: TemplateVariables) => {
  const { user, companyName = 'Taxi Manager', loginUrl = process.env.NEXTAUTH_URL } = variables;
  
  const content = `
    <p>Bonjour <strong>${user?.prenom} ${user?.nom}</strong>,</p>
    
    <p>Bienvenue dans ${companyName} ! Votre compte a été créé avec succès.</p>
    
    <div class="info-box">
        <h3>Informations de votre compte :</h3>
        <p><strong>Email :</strong> ${user?.email}</p>
        <p><strong>Rôle :</strong> ${user?.role}</p>
        <p><strong>Statut :</strong> Actif</p>
    </div>
    
    <p>Vous pouvez maintenant accéder à l'application en utilisant le lien ci-dessous :</p>
    
    <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Accéder à l'application</a>
    </p>
    
    <p>Utilisez votre adresse email pour vous connecter. Un mot de passe temporaire vous sera communiqué séparément par votre administrateur.</p>
    
    <p>Si vous avez des questions, n'hésitez pas à contacter notre support.</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Bienvenue dans ${companyName} !`,
    html: getBaseTemplate(content, 'Bienvenue !'),
    text: `Bonjour ${user?.prenom} ${user?.nom},\n\nBienvenue dans ${companyName} ! Votre compte a été créé avec succès.\n\nVous pouvez accéder à l'application via : ${loginUrl}\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template de notification d'assignation de course
export const getCourseAssignmentTemplate = (variables: TemplateVariables) => {
  const { user, course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <p>Bonjour <strong>${user?.prenom} ${user?.nom}</strong>,</p>
    
    <p>Une nouvelle course vous a été assignée :</p>
    
    <div class="info-box">
        <h3>📍 Détails de la course</h3>
        <p><strong>Origine :</strong> ${course?.origine}</p>
        <p><strong>Destination :</strong> ${course?.destination}</p>
        <p><strong>Date et heure :</strong> ${course?.dateHeure}</p>
        ${course?.prix ? `<p><strong>Prix :</strong> ${course.prix}€</p>` : ''}
    </div>
    
    ${course?.client ? `
    <div class="info-box">
        <h3>👤 Client</h3>
        <p><strong>Nom :</strong> ${course.client.nom} ${course.client.prenom}</p>
        ${course.client.telephone ? `<p><strong>Téléphone :</strong> ${course.client.telephone}</p>` : ''}
    </div>
    ` : ''}
    
    <p>Merci de vous préparer pour cette course et de respecter l'heure de rendez-vous.</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Nouvelle course assignée - ${course?.origine} → ${course?.destination}`,
    html: getBaseTemplate(content, 'Nouvelle course assignée'),
    text: `Bonjour ${user?.prenom} ${user?.nom},\n\nUne nouvelle course vous a été assignée :\n\nOrigine: ${course?.origine}\nDestination: ${course?.destination}\nDate: ${course?.dateHeure}\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template de rappel de course
export const getCourseReminderTemplate = (variables: TemplateVariables, reminderTime: string) => {
  const { user, course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <div class="urgent">
        <h3>⏰ Rappel urgent - Course dans ${reminderTime}</h3>
    </div>
    
    <p>Bonjour <strong>${user?.prenom} ${user?.nom}</strong>,</p>
    
    <p>Votre course commence dans <strong>${reminderTime}</strong> :</p>
    
    <div class="info-box">
        <h3>📍 Détails de la course</h3>
        <p><strong>Origine :</strong> ${course?.origine}</p>
        <p><strong>Destination :</strong> ${course?.destination}</p>
        <p><strong>Heure de départ :</strong> ${course?.dateHeure}</p>
    </div>
    
    ${course?.client ? `
    <div class="info-box">
        <h3>👤 Client à contacter</h3>
        <p><strong>Nom :</strong> ${course.client.nom} ${course.client.prenom}</p>
        ${course.client.telephone ? `<p><strong>Téléphone :</strong> <a href="tel:${course.client.telephone}">${course.client.telephone}</a></p>` : ''}
    </div>
    ` : ''}
    
    <p><strong>Merci de vous préparer dès maintenant !</strong></p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `🚨 Rappel urgent - Course dans ${reminderTime}`,
    html: getBaseTemplate(content, `Rappel - Course dans ${reminderTime}`),
    text: `RAPPEL URGENT - Course dans ${reminderTime}\n\nBonjour ${user?.prenom} ${user?.nom},\n\nVotre course: ${course?.origine} → ${course?.destination}\nHeure: ${course?.dateHeure}\n\nPréparez-vous dès maintenant !\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template de confirmation de course terminée
export const getCourseCompletedTemplate = (variables: TemplateVariables) => {
  const { user, course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <p>Bonjour <strong>${user?.prenom} ${user?.nom}</strong>,</p>
    
    <p>✅ Votre course a été marquée comme terminée avec succès !</p>
    
    <div class="info-box">
        <h3>📍 Récapitulatif</h3>
        <p><strong>Trajet :</strong> ${course?.origine} → ${course?.destination}</p>
        <p><strong>Date :</strong> ${course?.dateHeure}</p>
        ${course?.prix ? `<p><strong>Montant :</strong> ${course.prix}€</p>` : ''}
    </div>
    
    <p>Merci pour votre professionnalisme !</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Course terminée - ${course?.origine} → ${course?.destination}`,
    html: getBaseTemplate(content, 'Course terminée'),
    text: `Bonjour ${user?.prenom} ${user?.nom},\n\nVotre course ${course?.origine} → ${course?.destination} a été terminée avec succès !\n\nMerci pour votre professionnalisme.\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template d'alerte d'annulation
export const getCourseCancelledTemplate = (variables: TemplateVariables) => {
  const { user, course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <div class="urgent">
        <h3>❌ Course annulée</h3>
    </div>
    
    <p>Bonjour <strong>${user?.prenom} ${user?.nom}</strong>,</p>
    
    <p>La course suivante a été <strong>annulée</strong> :</p>
    
    <div class="info-box">
        <h3>📍 Course annulée</h3>
        <p><strong>Trajet :</strong> ${course?.origine} → ${course?.destination}</p>
        <p><strong>Date prévue :</strong> ${course?.dateHeure}</p>
    </div>
    
    <p>Vous n'avez plus besoin de vous rendre à cette course. Veuillez consulter votre planning pour vos prochaines assignations.</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `❌ Course annulée - ${course?.origine} → ${course?.destination}`,
    html: getBaseTemplate(content, 'Course annulée'),
    text: `COURSE ANNULÉE\n\nBonjour ${user?.prenom} ${user?.nom},\n\nLa course ${course?.origine} → ${course?.destination} prévue le ${course?.dateHeure} a été annulée.\n\nConsultez votre planning pour les prochaines courses.\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// ======================
// TEMPLATES CLIENTS
// ======================

// Template de confirmation de course pour le client
export const getClientCourseConfirmationTemplate = (variables: TemplateVariables) => {
  const { course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <p>Bonjour <strong>${course?.client?.prenom} ${course?.client?.nom}</strong>,</p>
    
    <p>Votre course a été confirmée avec succès !</p>
    
    <div class="info-box">
        <h3>📍 Détails de votre course</h3>
        <p><strong>Départ :</strong> ${course?.origine}</p>
        <p><strong>Arrivée :</strong> ${course?.destination}</p>
        <p><strong>Date et heure :</strong> ${new Date(course?.dateHeure || '').toLocaleString('fr-FR', { 
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })}</p>
        ${course?.prix ? `<p><strong>Prix estimé :</strong> ${course.prix}€</p>` : ''}
    </div>
    
    <p>Un chauffeur vous sera assigné prochainement et vous recevrez ses coordonnées par email.</p>
    
    <p>En cas de besoin, vous pouvez nous contacter.</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Confirmation de votre course - ${course?.origine} → ${course?.destination}`,
    html: getBaseTemplate(content, 'Course confirmée'),
    text: `Bonjour ${course?.client?.prenom} ${course?.client?.nom},\n\nVotre course est confirmée :\n\nDépart: ${course?.origine}\nArrivée: ${course?.destination}\nDate: ${new Date(course?.dateHeure || '').toLocaleString('fr-FR')}\n\nUn chauffeur vous sera assigné prochainement.\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template d'assignation chauffeur pour le client
export const getClientDriverAssignedTemplate = (variables: TemplateVariables) => {
  const { course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <p>Bonjour <strong>${course?.client?.prenom} ${course?.client?.nom}</strong>,</p>
    
    <p>✅ Un chauffeur a été assigné à votre course !</p>
    
    <div class="info-box">
        <h3>🚕 Votre chauffeur</h3>
        <p><strong>Nom :</strong> ${course?.user?.prenom} ${course?.user?.nom}</p>
        ${course?.user?.telephone ? `<p><strong>Téléphone :</strong> <a href="tel:${course.user.telephone}">${course.user.telephone}</a></p>` : ''}
    </div>
    
    <div class="info-box">
        <h3>📍 Rappel de votre course</h3>
        <p><strong>Départ :</strong> ${course?.origine}</p>
        <p><strong>Arrivée :</strong> ${course?.destination}</p>
        <p><strong>Date et heure :</strong> ${new Date(course?.dateHeure || '').toLocaleString('fr-FR', { 
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })}</p>
    </div>
    
    <p>Votre chauffeur vous contactera si nécessaire avant la course.</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Chauffeur assigné - ${course?.user?.prenom} ${course?.user?.nom}`,
    html: getBaseTemplate(content, 'Chauffeur assigné'),
    text: `Bonjour ${course?.client?.prenom} ${course?.client?.nom},\n\nUn chauffeur a été assigné :\n\nChauffeur: ${course?.user?.prenom} ${course?.user?.nom}\n${course?.user?.telephone ? `Téléphone: ${course.user.telephone}\n` : ''}\nCourse: ${course?.origine} → ${course?.destination}\nDate: ${new Date(course?.dateHeure || '').toLocaleString('fr-FR')}\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template de rappel course pour le client
export const getClientCourseReminderTemplate = (variables: TemplateVariables) => {
  const { course, companyName = 'Taxi Manager' } = variables;
  
  const content = `
    <div class="urgent">
        <h3>⏰ Votre course est dans 2 heures</h3>
    </div>
    
    <p>Bonjour <strong>${course?.client?.prenom} ${course?.client?.nom}</strong>,</p>
    
    <p>Nous vous rappelons que votre course aura lieu dans <strong>2 heures</strong> :</p>
    
    <div class="info-box">
        <h3>📍 Détails de votre course</h3>
        <p><strong>Départ :</strong> ${course?.origine}</p>
        <p><strong>Arrivée :</strong> ${course?.destination}</p>
        <p><strong>Heure de départ :</strong> ${new Date(course?.dateHeure || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    
    ${course?.user ? `
    <div class="info-box">
        <h3>🚕 Votre chauffeur</h3>
        <p><strong>Nom :</strong> ${course.user.prenom} ${course.user.nom}</p>
        ${course.user.telephone ? `<p><strong>Téléphone :</strong> <a href="tel:${course.user.telephone}">${course.user.telephone}</a></p>` : ''}
    </div>
    ` : ''}
    
    <p>Merci de vous tenir prêt(e) à l'heure prévue !</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `🚨 Rappel - Votre course dans 2h`,
    html: getBaseTemplate(content, 'Rappel de course'),
    text: `RAPPEL - Course dans 2h\n\nBonjour ${course?.client?.prenom} ${course?.client?.nom},\n\nVotre course: ${course?.origine} → ${course?.destination}\nHeure: ${new Date(course?.dateHeure || '').toLocaleTimeString('fr-FR')}\n${course?.user ? `\nChauffeur: ${course.user.prenom} ${course.user.nom}${course.user.telephone ? ` (${course.user.telephone})` : ''}` : ''}\n\nTenez-vous prêt(e) !\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template de course terminée avec demande d'avis pour le client
export const getClientCourseCompletedWithReviewTemplate = (variables: TemplateVariables, reviewToken: string) => {
  const { course, companyName = 'Taxi Manager' } = variables;
  const reviewUrl = `${process.env.NEXTAUTH_URL}/avis/${reviewToken}`;
  
  const content = `
    <p>Bonjour <strong>${course?.client?.prenom} ${course?.client?.nom}</strong>,</p>
    
    <p>✅ Votre course s'est bien déroulée !</p>
    
    <div class="info-box">
        <h3>📍 Course terminée</h3>
        <p><strong>Trajet :</strong> ${course?.origine} → ${course?.destination}</p>
        <p><strong>Date :</strong> ${new Date(course?.dateHeure || '').toLocaleString('fr-FR')}</p>
        ${course?.user ? `<p><strong>Chauffeur :</strong> ${course.user.prenom} ${course.user.nom}</p>` : ''}
        ${course?.prix ? `<p><strong>Montant :</strong> ${course.prix}€</p>` : ''}
    </div>
    
    <p>Nous espérons que notre service vous a satisfait !</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <h3>⭐ Donnez votre avis</h3>
        <p>Votre opinion nous aide à améliorer notre service.</p>
        <a href="${reviewUrl}" class="button">Laisser un avis (2 min)</a>
    </div>
    
    <p>Merci de nous avoir fait confiance !</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Course terminée - Votre avis nous intéresse ! ⭐`,
    html: getBaseTemplate(content, 'Course terminée'),
    text: `Bonjour ${course?.client?.prenom} ${course?.client?.nom},\n\nVotre course ${course?.origine} → ${course?.destination} s'est bien déroulée !\n\nDonnez votre avis : ${reviewUrl}\n\nMerci de nous avoir fait confiance !\n\nCordialement,\nL'équipe ${companyName}`
  };
};

// Template de relance avis pour le client
export const getClientReviewReminderTemplate = (variables: TemplateVariables, reviewToken: string) => {
  const { course, companyName = 'Taxi Manager' } = variables;
  const reviewUrl = `${process.env.NEXTAUTH_URL}/avis/${reviewToken}`;
  
  const content = `
    <p>Bonjour <strong>${course?.client?.prenom} ${course?.client?.nom}</strong>,</p>
    
    <p>Vous avez récemment utilisé nos services et nous aimerions beaucoup connaître votre opinion !</p>
    
    <div class="info-box">
        <h3>📍 Course concernée</h3>
        <p><strong>Trajet :</strong> ${course?.origine} → ${course?.destination}</p>
        <p><strong>Date :</strong> ${new Date(course?.dateHeure || '').toLocaleDateString('fr-FR')}</p>
        ${course?.user ? `<p><strong>Chauffeur :</strong> ${course.user.prenom} ${course.user.nom}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <h3>⭐ 2 minutes pour nous aider</h3>
        <p>Votre avis nous permet d'améliorer continuellement notre service.</p>
        <a href="${reviewUrl}" class="button">Donner mon avis</a>
    </div>
    
    <p><small>Si vous ne souhaitez plus recevoir ces demandes d'avis, <a href="${reviewUrl}?unsubscribe=true">cliquez ici</a>.</small></p>
    
    <p>Merci pour votre temps !</p>
    
    <p>Cordialement,<br>L'équipe ${companyName}</p>
  `;
  
  return {
    subject: `Votre avis nous intéresse - Course du ${new Date(course?.dateHeure || '').toLocaleDateString('fr-FR')} ⭐`,
    html: getBaseTemplate(content, 'Donnez votre avis'),
    text: `Bonjour ${course?.client?.prenom} ${course?.client?.nom},\n\nVotre avis sur la course ${course?.origine} → ${course?.destination} du ${new Date(course?.dateHeure || '').toLocaleDateString('fr-FR')} nous intéresse !\n\nDonnez votre avis : ${reviewUrl}\n\nMerci !\n\nCordialement,\nL'équipe ${companyName}`
  };
};