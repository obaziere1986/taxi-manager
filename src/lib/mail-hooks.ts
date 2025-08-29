// Hooks pour l'envoi automatique de mails
import { TemplateVariables } from './mail-templates';

// URL de base pour les APIs mail
const MAIL_API_URL = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/mail` : '/api/mail';

// Interface pour les réponses API
interface MailApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// Fonction utilitaire pour envoyer un mail via l'API
const sendMailViaApi = async (payload: {
  type: string;
  to: string | string[];
  variables?: TemplateVariables;
  reminderTime?: string;
}): Promise<boolean> => {
  try {
    const response = await fetch(`${MAIL_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur API mail:', errorData);
      return false;
    }

    const result: MailApiResponse = await response.json();
    console.log('✅ Mail envoyé:', result.message);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail:', error);
    return false;
  }
};

// Hook: Email de bienvenue pour nouvel utilisateur
export const sendWelcomeEmail = async (userData: {
  nom: string;
  prenom: string;
  email: string;
  role: string;
}) => {
  console.log(`📧 Envoi du mail de bienvenue à ${userData.prenom} ${userData.nom}`);
  
  return await sendMailViaApi({
    type: 'welcome',
    to: userData.email,
    variables: {
      user: userData,
      companyName: 'Taxi Manager',
      loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }
  });
};

// Hook: Notification d'assignation de course
export const sendCourseAssignmentEmail = async (
  userData: { nom: string; prenom: string; email: string },
  courseData: {
    id: string;
    origine: string;
    destination: string;
    dateHeure: string;
    prix?: number;
    client?: { nom: string; prenom: string; telephone?: string };
  }
) => {
  console.log(`📧 Notification d'assignation à ${userData.prenom} ${userData.nom}`);
  
  return await sendMailViaApi({
    type: 'course_assignment',
    to: userData.email,
    variables: {
      user: userData,
      course: courseData
    }
  });
};

// Hook: Rappel de course (1h avant, 30min avant, etc.)
export const sendCourseReminderEmail = async (
  userData: { nom: string; prenom: string; email: string },
  courseData: {
    id: string;
    origine: string;
    destination: string;
    dateHeure: string;
    client?: { nom: string; prenom: string; telephone?: string };
  },
  reminderTime: string // "1 heure", "30 minutes", etc.
) => {
  console.log(`⏰ Rappel de course à ${userData.prenom} ${userData.nom} (dans ${reminderTime})`);
  
  return await sendMailViaApi({
    type: 'course_reminder',
    to: userData.email,
    reminderTime,
    variables: {
      user: userData,
      course: courseData
    }
  });
};

// Hook: Confirmation de course terminée
export const sendCourseCompletedEmail = async (
  userData: { nom: string; prenom: string; email: string },
  courseData: {
    id: string;
    origine: string;
    destination: string;
    dateHeure: string;
    prix?: number;
  }
) => {
  console.log(`✅ Confirmation de course terminée à ${userData.prenom} ${userData.nom}`);
  
  return await sendMailViaApi({
    type: 'course_completed',
    to: userData.email,
    variables: {
      user: userData,
      course: courseData
    }
  });
};

// Hook: Notification d'annulation de course
export const sendCourseCancelledEmail = async (
  userData: { nom: string; prenom: string; email: string },
  courseData: {
    id: string;
    origine: string;
    destination: string;
    dateHeure: string;
  }
) => {
  console.log(`❌ Notification d'annulation à ${userData.prenom} ${userData.nom}`);
  
  return await sendMailViaApi({
    type: 'course_cancelled',
    to: userData.email,
    variables: {
      user: userData,
      course: courseData
    }
  });
};

// Hook: Email personnalisé (pour usage admin)
export const sendCustomEmail = async (
  to: string | string[],
  subject: string,
  content: string,
  htmlContent?: string
) => {
  console.log(`📧 Envoi d'email personnalisé à ${Array.isArray(to) ? to.join(', ') : to}`);
  
  return await sendMailViaApi({
    type: 'custom',
    to,
    variables: {},
    // @ts-expect-error - Le type sera étendu dans l'API
    customSubject: subject,
    customContent: content,
    customHtml: htmlContent
  });
};

// Fonction utilitaire pour programmer des rappels de course
export const scheduleReminders = async (
  userData: { nom: string; prenom: string; email: string },
  courseData: {
    id: string;
    origine: string;
    destination: string;
    dateHeure: string;
    client?: { nom: string; prenom: string; telephone?: string };
  }
) => {
  const courseDate = new Date(courseData.dateHeure);
  const now = new Date();
  
  // Rappel 1h avant
  const oneHourBefore = new Date(courseDate.getTime() - 60 * 60 * 1000);
  if (oneHourBefore > now) {
    console.log(`⏰ Rappel programmé pour ${oneHourBefore.toLocaleString()} (1h avant)`);
    // TODO: Implémenter un système de cron/queue pour les rappels programmés
    // Pour l'instant, on peut utiliser setTimeout pour les tests
    const timeUntilReminder = oneHourBefore.getTime() - now.getTime();
    if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) { // Max 24h
      setTimeout(async () => {
        await sendCourseReminderEmail(userData, courseData, "1 heure");
      }, timeUntilReminder);
    }
  }
  
  // Rappel 30min avant
  const thirtyMinBefore = new Date(courseDate.getTime() - 30 * 60 * 1000);
  if (thirtyMinBefore > now) {
    console.log(`⏰ Rappel programmé pour ${thirtyMinBefore.toLocaleString()} (30min avant)`);
    const timeUntilReminder = thirtyMinBefore.getTime() - now.getTime();
    if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) { // Max 24h
      setTimeout(async () => {
        await sendCourseReminderEmail(userData, courseData, "30 minutes");
      }, timeUntilReminder);
    }
  }
};

// Export de toutes les fonctions pour faciliter l'import
export const mailHooks = {
  sendWelcomeEmail,
  sendCourseAssignmentEmail,
  sendCourseReminderEmail,
  sendCourseCompletedEmail,
  sendCourseCancelledEmail,
  sendCustomEmail,
  scheduleReminders
};