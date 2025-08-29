import { NextRequest, NextResponse } from 'next/server';
import { verifyConnection, sendMail } from '@/lib/mailer';

export async function GET(request: NextRequest) {
  try {
    // Vérifier la connexion SMTP
    const isConnected = await verifyConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Échec de la connexion SMTP',
        details: 'Vérifiez les variables d\'environnement SMTP_HOST, SMTP_USER, SMTP_PASS'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion SMTP vérifiée avec succès',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Non configuré'
      }
    });

  } catch (error) {
    console.error('Erreur lors du test SMTP:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors du test de connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json({
        success: false,
        message: 'Paramètre "to" requis pour l\'envoi de test'
      }, { status: 400 });
    }

    // Envoyer un email de test
    const success = await sendMail({
      to,
      subject: '🧪 Test - Taxi Manager Mail System',
      text: 'Ceci est un email de test du système Taxi Manager.\n\nSi vous recevez ce message, la configuration SMTP fonctionne correctement !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f8fafc;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    color: #f59e0b;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                .success {
                    background: #f0fdf4;
                    border: 2px solid #22c55e;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">🚕 Taxi Manager</div>
                <h2>Test du système de mail</h2>
                <div class="success">
                    <h3>✅ Configuration SMTP fonctionnelle !</h3>
                    <p>Ce message confirme que votre serveur mail Hostinger est correctement configuré.</p>
                </div>
                <p>Détails du test :</p>
                <ul>
                    <li><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</li>
                    <li><strong>Serveur SMTP :</strong> ${process.env.SMTP_HOST}</li>
                    <li><strong>Port :</strong> ${process.env.SMTP_PORT}</li>
                </ul>
                <p>Vous pouvez maintenant utiliser le système de notifications par email.</p>
            </div>
        </body>
        </html>
      `
    });

    if (!success) {
      return NextResponse.json({
        success: false,
        message: 'Échec de l\'envoi de l\'email de test'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      to
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de test:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'envoi de test',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}