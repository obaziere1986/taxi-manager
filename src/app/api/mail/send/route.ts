import { NextRequest, NextResponse } from 'next/server';
import { sendMail, isValidEmail } from '@/lib/mailer';
import { 
  getWelcomeEmailTemplate, 
  getCourseAssignmentTemplate, 
  getCourseReminderTemplate,
  getCourseCompletedTemplate,
  getCourseCancelledTemplate,
  getClientReviewReminderTemplate,
  getClientCourseCompletedWithReviewTemplate,
  getClientDriverAssignedTemplate,
  TemplateVariables 
} from '@/lib/mail-templates';
import { executeWithRetry } from '@/lib/supabase';

// Types pour les différents types de mails
type MailType = 'welcome' | 'course_assignment' | 'course_reminder' | 'course_completed' | 'course_cancelled' | 'client_review_reminder' | 'client_course_completed_with_review' | 'client_driver_assigned' | 'custom';

interface SendMailRequest {
  type: MailType;
  to: string | string[];
  variables?: TemplateVariables;
  reminderTime?: string; // Pour les rappels (ex: "1 heure", "30 minutes")
  reviewToken?: string; // Pour les avis clients
  customSubject?: string;
  customContent?: string;
  customHtml?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMailRequest = await request.json();
    const { type, to, variables, reminderTime, reviewToken, customSubject, customContent, customHtml } = body;

    // Validation des paramètres
    if (!to || !type) {
      return NextResponse.json(
        { error: 'Les paramètres "to" et "type" sont requis' },
        { status: 400 }
      );
    }

    // Validation des emails
    const emailList = Array.isArray(to) ? to : [to];
    const invalidEmails = emailList.filter(email => !isValidEmail(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Emails invalides: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Générer le template selon le type
    let template;
    
    switch (type) {
      case 'welcome':
        if (!variables?.user) {
          return NextResponse.json(
            { error: 'Les données utilisateur sont requises pour le mail de bienvenue' },
            { status: 400 }
          );
        }
        template = getWelcomeEmailTemplate(variables);
        break;
        
      case 'course_assignment':
        if (!variables?.user || !variables?.course) {
          return NextResponse.json(
            { error: 'Les données utilisateur et course sont requises pour l\'assignation' },
            { status: 400 }
          );
        }
        template = getCourseAssignmentTemplate(variables);
        break;
        
      case 'course_reminder':
        if (!variables?.user || !variables?.course || !reminderTime) {
          return NextResponse.json(
            { error: 'Les données utilisateur, course et reminderTime sont requises pour le rappel' },
            { status: 400 }
          );
        }
        template = getCourseReminderTemplate(variables, reminderTime);
        break;
        
      case 'course_completed':
        if (!variables?.user || !variables?.course) {
          return NextResponse.json(
            { error: 'Les données utilisateur et course sont requises pour la confirmation' },
            { status: 400 }
          );
        }
        template = getCourseCompletedTemplate(variables);
        break;
        
      case 'course_cancelled':
        if (!variables?.user || !variables?.course) {
          return NextResponse.json(
            { error: 'Les données utilisateur et course sont requises pour l\'annulation' },
            { status: 400 }
          );
        }
        template = getCourseCancelledTemplate(variables);
        break;
        
      case 'client_review_reminder':
        if (!variables || !reviewToken) {
          return NextResponse.json(
            { error: 'Les variables et le token de review sont requis pour le rappel d\'avis' },
            { status: 400 }
          );
        }
        template = getClientReviewReminderTemplate(variables, reviewToken);
        break;
        
      case 'client_course_completed_with_review':
        if (!variables || !reviewToken) {
          return NextResponse.json(
            { error: 'Les variables et le token de review sont requis pour le mail de fin de course' },
            { status: 400 }
          );
        }
        template = getClientCourseCompletedWithReviewTemplate(variables, reviewToken);
        break;
        
      case 'client_driver_assigned':
        if (!variables) {
          return NextResponse.json(
            { error: 'Les variables sont requises pour l\'assignation de chauffeur' },
            { status: 400 }
          );
        }
        template = getClientDriverAssignedTemplate(variables);
        break;
        
      case 'custom':
        if (!customSubject || (!customContent && !customHtml)) {
          return NextResponse.json(
            { error: 'Subject et contenu (text ou HTML) sont requis pour un mail personnalisé' },
            { status: 400 }
          );
        }
        template = {
          subject: customSubject,
          text: customContent,
          html: customHtml
        };
        break;
        
      default:
        return NextResponse.json(
          { error: `Type de mail non supporté: ${type}` },
          { status: 400 }
        );
    }

    // Envoyer l'email
    const success = await sendMail({
      to: emailList,
      subject: template.subject,
      text: template.text,
      html: template.html
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Échec de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    // Log de l'envoi réussi dans Supabase
    try {
      await fetch(`${process.env.NEXTAUTH_URL || ''}/api/mail/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          to_emails: emailList,
          subject: template.subject,
          status: 'sent',
          user_id: variables?.user?.email || null,
          course_id: variables?.course?.id || null
        })
      });
    } catch (logError) {
      console.error('Erreur lors du log dans Supabase:', logError);
      // On ne fait pas échouer la requête si le log échoue
    }

    return NextResponse.json({ 
      message: 'Email envoyé avec succès',
      to: emailList,
      subject: template.subject
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // Log de l'erreur dans Supabase
    try {
      const body: SendMailRequest = await request.json();
      await fetch(`${process.env.NEXTAUTH_URL || ''}/api/mail/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: body.type,
          to_emails: Array.isArray(body.to) ? body.to : [body.to],
          subject: body.customSubject || 'Erreur d\'envoi',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Erreur inconnue',
          user_id: body.variables?.user?.email || null,
          course_id: body.variables?.course?.id || null
        })
      });
    } catch (logError) {
      console.error('Erreur lors du log d\'erreur dans Supabase:', logError);
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}