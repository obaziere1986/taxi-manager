import nodemailer from 'nodemailer';

// Configuration du transporteur SMTP pour Hostinger
export const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true pour le port 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Nécessaire pour certains hébergeurs
    },
  });

  return transporter;
};

// Test de la connexion SMTP
export const verifyConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion SMTP:', error);
    return false;
  }
};

// Interface pour les options d'email
export interface MailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: nodemailer.Attachment[];
}

// Fonction principale d'envoi d'email avec retry
export const sendMail = async (options: MailOptions, retryCount = 3): Promise<boolean> => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || 'Taxi Manager'}" <${process.env.SMTP_USER}>`,
    ...options,
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email envoyé avec succès:`, info.messageId);
      
      // Log dans Supabase (TODO: implémenter)
      // await logEmailSent(options, info);
      
      return true;
    } catch (error) {
      console.error(`❌ Tentative ${attempt}/${retryCount} échouée:`, error);
      
      if (attempt === retryCount) {
        console.error('💥 Tous les essais d\'envoi ont échoué');
        // Log de l'erreur dans Supabase (TODO: implémenter)
        // await logEmailError(options, error);
        return false;
      }
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
};

// Fonction utilitaire pour valider l'email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour extraire les emails depuis une chaîne
export const extractEmails = (text: string): string[] => {
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  return text.match(emailRegex) || [];
};